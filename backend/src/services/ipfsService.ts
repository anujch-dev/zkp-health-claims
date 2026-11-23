import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../config/index.js';

export interface IPFSPinResult {
  cid: string;
  size: number;
  sha256Commitment: string;
  storagePath: string;
  timestamp: number;
}

export class IPFSService {
  private ipfsDir: string;

  constructor() {
    this.ipfsDir = path.join(CONFIG.PATHS.storageDir, 'ipfs');
    if (!fs.existsSync(this.ipfsDir)) {
      fs.mkdirSync(this.ipfsDir, { recursive: true });
    }
  }

  /**
   * Generates a deterministic IPFS CIDv0 (Base58 Qm...) from payload buffer
   * Standard IPFS CIDv0 format: 0x12 (sha2-256) + 0x20 (32 bytes) + 32-byte digest
   */
  public generateCID(buffer: Buffer): { cid: string; sha256Hex: string } {
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest();
    const sha256Hex = '0x' + sha256Hash.toString('hex');

    // Create standard IPFS multihash prefix: 0x12 (sha2-256) + 0x20 (32-byte length)
    const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), sha256Hash]);
    
    // Base58 encoder for IPFS CIDv0
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let digits = [0];
    for (let i = 0; i < multihash.length; i++) {
      let carry = multihash[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }

    let b58 = '';
    // Deal with leading zeros
    for (let i = 0; i < multihash.length && multihash[i] === 0; i++) {
      b58 += '1';
    }
    for (let i = digits.length - 1; i >= 0; i--) {
      b58 += ALPHABET[digits[i]];
    }

    return { cid: b58, sha256Hex };
  }

  /**
   * Pins an encrypted buffer to decentralized storage cache
   */
  public pin(buffer: Buffer, originalFilename?: string): IPFSPinResult {
    const { cid, sha256Hex } = this.generateCID(buffer);
    const filePath = path.join(this.ipfsDir, `${cid}.enc`);

    fs.writeFileSync(filePath, buffer);

    const metaPath = path.join(this.ipfsDir, `${cid}.meta.json`);
    const metadata = {
      cid,
      size: buffer.length,
      sha256Commitment: sha256Hex,
      originalFilename: originalFilename || 'record.enc',
      pinnedAt: Date.now()
    };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    return {
      cid,
      size: buffer.length,
      sha256Commitment: sha256Hex,
      storagePath: filePath,
      timestamp: Date.now()
    };
  }

  /**
   * Reads pinned payload by CID
   */
  public get(cid: string): { data: Buffer; metadata: any } | null {
    const filePath = path.join(this.ipfsDir, `${cid}.enc`);
    const metaPath = path.join(this.ipfsDir, `${cid}.meta.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath);
    let metadata = {};
    if (fs.existsSync(metaPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {
        // Fallback
      }
    }

    return { data, metadata };
  }

  /**
   * Encrypts plaintext JSON / buffer using AES-256-GCM
   */
  public encryptAESGCM(data: Buffer | string, secretKeyHex: string): { ciphertext: string; iv: string; tag: string } {
    const key = Buffer.from(secretKeyHex.replace(/^0x/, '').padStart(64, '0'), 'hex');
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  /**
   * Decrypts AES-256-GCM package
   */
  public decryptAESGCM(ciphertextBase64: string, ivBase64: string, tagBase64: string, secretKeyHex: string): Buffer {
    const key = Buffer.from(secretKeyHex.replace(/^0x/, '').padStart(64, '0'), 'hex');
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const encryptedBuffer = Buffer.from(ciphertextBase64, 'base64');
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }
}

export const ipfsService = new IPFSService();
