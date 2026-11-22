/**
 * Web Crypto API AES-256-GCM & SHA-256 Cryptographic Primitives
 * Ensures off-chain sensitive medical records are strictly encrypted with AES-256-GCM
 * with only content hashes and commitments anchored on-chain.
 */

export interface EncryptedPayload {
  ciphertext: string; // Hex-encoded ciphertext
  iv: string;         // Hex-encoded 12-byte initialization vector
  salt: string;       // Hex-encoded 16-byte PBKDF2 salt
  commitmentHash: string; // 0x-prefixed 32-byte SHA-256 on-chain commitment
  encryptedAt: number;
}

// Convert ArrayBuffer to Hex string
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2
 */
async function deriveAESKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes the 32-byte SHA-256 commitment hash anchored on-chain
 */
export async function computeOnChainCommitment(content: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${saltHex}::${content}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return '0x' + bufToHex(hashBuffer);
}

/**
 * Encrypts arbitrary medical record plaintext with AES-256-GCM
 */
export async function encryptRecordWithAES(
  plaintext: string,
  passphraseSecret: string = "patient-sovereign-master-secret-key-88129"
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);

  // Generate random 16-byte salt and 12-byte IV for GCM mode
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAESKey(passphraseSecret, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: (iv.buffer as ArrayBuffer)
    },
    key,
    data
  );

  const saltHex = bufToHex(salt);
  const commitmentHash = await computeOnChainCommitment(plaintext, saltHex);

  return {
    ciphertext: bufToHex(encryptedBuffer),
    iv: bufToHex(iv),
    salt: saltHex,
    commitmentHash,
    encryptedAt: Date.now()
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies integrity
 */
export async function decryptRecordWithAES(
  ciphertextHex: string,
  ivHex: string,
  saltHex: string,
  passphraseSecret: string = "patient-sovereign-master-secret-key-88129"
): Promise<string> {
  const ciphertextBuf = hexToBuf(ciphertextHex);
  const iv = hexToBuf(ivHex);
  const salt = hexToBuf(saltHex);

  const key = await deriveAESKey(passphraseSecret, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: (iv.buffer as ArrayBuffer)
    },
    key,
    (ciphertextBuf.buffer as ArrayBuffer)
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
