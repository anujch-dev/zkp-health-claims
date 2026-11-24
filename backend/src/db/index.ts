import pg from 'pg';
import { CONFIG } from '../config/index.js';
import {
  ClaimRecord,
  EncryptedMedicalRecord,
  AccessPermission,
  BreakGlassLog,
  AuditEvent,
  UserRole
} from '../types/index.js';

const { Pool } = pg;

export interface PatientEntity {
  patient_id: string;
  name: string;
  phone: string;
  hospital: string;
  wallet_address?: string;
  primary_diagnosis?: string;
  primary_diagnosis_code?: string;
  primary_procedure?: string;
  primary_procedure_code?: string;
  avatar_initial?: string;
  created_at?: string;
}

export interface PolicyEntity {
  id: string;
  policy_number: string;
  patient_address: string;
  patient_name: string;
  insurer_name: string;
  max_coverage_limit: number;
  remaining_coverage: number;
  valid_from: string;
  valid_until: string;
  policy_commitment_hash: string;
  policy_secret_salt?: string;
  covered_procedures: any[];
}

export class DatabaseService {
  private pool: pg.Pool | null = null;
  public isConnected: boolean = false;

  // In-memory fallback stores
  private memPatients = new Map<string, PatientEntity>();
  private memPolicies = new Map<string, PolicyEntity>();
  private memRecords = new Map<string, EncryptedMedicalRecord>();
  private memPermissions = new Map<string, AccessPermission[]>();
  private memClaims = new Map<string, ClaimRecord>();
  private memAudit = new Map<string, any>();
  private memBreakGlass: BreakGlassLog[] = [];

  constructor() {
    this.seedMemoryStore();
    this.setupPool();
  }

  private setupPool() {
    if (!CONFIG.DATABASE_URL || CONFIG.DATABASE_URL.trim() === '') {
      console.log('ℹ️  [DB] No DATABASE_URL provided. Running with resilient in-memory data store.');
      return;
    }

    try {
      const isLocal =
        CONFIG.DATABASE_URL.includes('localhost') || CONFIG.DATABASE_URL.includes('127.0.0.1');

      this.pool = new Pool({
        connectionString: CONFIG.DATABASE_URL,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err: Error) => {
        console.error('⚠️  [DB] Unexpected Postgres pool error:', err.message);
      });
    } catch (err: any) {
      console.error('⚠️  [DB] Failed to initialize Postgres pool:', err.message);
      this.pool = null;
    }
  }

  public async init(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const res = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log(`✅ [DB] Connected to PostgreSQL successfully at ${res.rows[0].current_time}`);
      this.isConnected = true;

      await this.runMigrations();
      await this.seedDatabaseIfEmpty();
      return true;
    } catch (err: any) {
      console.warn('⚠️  [DB] Postgres connection failed. Falling back to in-memory store:', err.message);
      this.isConnected = false;
      return false;
    }
  }

  private async runMigrations() {
    if (!this.pool) return;

    const migrationSql = `
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        hospital VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(64),
        primary_diagnosis TEXT,
        primary_diagnosis_code VARCHAR(64),
        primary_procedure TEXT,
        primary_procedure_code VARCHAR(64),
        avatar_initial VARCHAR(8),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS insurance_policies (
        id VARCHAR(64) PRIMARY KEY,
        policy_number VARCHAR(64) NOT NULL UNIQUE,
        patient_address VARCHAR(64) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        insurer_name VARCHAR(255) NOT NULL,
        max_coverage_limit NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
        remaining_coverage NUMERIC(12, 2) NOT NULL DEFAULT 44200.00,
        valid_from VARCHAR(64) NOT NULL,
        valid_until VARCHAR(64) NOT NULL,
        policy_commitment_hash VARCHAR(128) NOT NULL,
        policy_secret_salt VARCHAR(128),
        covered_procedures JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS medical_records (
        id VARCHAR(128) PRIMARY KEY,
        patient_address VARCHAR(64) NOT NULL,
        patient_id VARCHAR(64),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        ipfs_cid VARCHAR(128) NOT NULL,
        commitment_hash VARCHAR(128) NOT NULL,
        encrypted_payload TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        fhir_bundle JSONB,
        anchored_on_chain BOOLEAN DEFAULT false,
        on_chain_tx_hash VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS access_permissions (
        id SERIAL PRIMARY KEY,
        record_id VARCHAR(128) NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
        patient_address VARCHAR(64) NOT NULL,
        grantee_address VARCHAR(64) NOT NULL,
        grantee_name VARCHAR(255),
        role VARCHAR(64) DEFAULT 'Doctor',
        granted_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        tx_hash VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS claims (
        id VARCHAR(128) PRIMARY KEY,
        claim_nullifier VARCHAR(128) UNIQUE NOT NULL,
        policy_commitment VARCHAR(128) NOT NULL,
        hospital_address VARCHAR(64) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        patient_address VARCHAR(64),
        claim_amount NUMERIC(12, 2) NOT NULL,
        claim_date BIGINT NOT NULL,
        procedure_code VARCHAR(64) NOT NULL,
        procedure_name VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        public_inputs JSONB NOT NULL,
        proof JSONB NOT NULL,
        tx_hash VARCHAR(128),
        settled_at BIGINT,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id VARCHAR(128) PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        event_name VARCHAR(128) NOT NULL,
        actor_role VARCHAR(64) NOT NULL,
        actor_address VARCHAR(64) NOT NULL,
        details TEXT NOT NULL,
        tx_hash VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS break_glass_logs (
        id VARCHAR(128) PRIMARY KEY,
        record_id VARCHAR(128) NOT NULL,
        patient_address VARCHAR(64) NOT NULL,
        responder_address VARCHAR(64) NOT NULL,
        reason TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        tx_hash VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await this.pool.query(migrationSql);
    console.log('✅ [DB] Database tables verified & migrated.');
  }

  private async seedDatabaseIfEmpty() {
    if (!this.pool) return;

    try {
      const patientCheck = await this.pool.query('SELECT COUNT(*) FROM patients');
      if (parseInt(patientCheck.rows[0].count, 10) === 0) {
        console.log('🌱 [DB] Seeding default patients into PostgreSQL...');
        for (const p of this.memPatients.values()) {
          await this.pool.query(
            `INSERT INTO patients (patient_id, name, phone, hospital, wallet_address, primary_diagnosis, primary_diagnosis_code, primary_procedure, primary_procedure_code, avatar_initial)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (patient_id) DO NOTHING`,
            [
              p.patient_id,
              p.name,
              p.phone,
              p.hospital,
              p.wallet_address || CONFIG.DEMO_ROLES.PATIENT,
              p.primary_diagnosis || '',
              p.primary_diagnosis_code || '',
              p.primary_procedure || '',
              p.primary_procedure_code || '',
              p.avatar_initial || 'PT',
            ]
          );
        }
      }

      const policyCheck = await this.pool.query('SELECT COUNT(*) FROM insurance_policies');
      if (parseInt(policyCheck.rows[0].count, 10) === 0) {
        console.log('🌱 [DB] Seeding default insurance policies into PostgreSQL...');
        for (const pol of this.memPolicies.values()) {
          await this.pool.query(
            `INSERT INTO insurance_policies (id, policy_number, patient_address, patient_name, insurer_name, max_coverage_limit, remaining_coverage, valid_from, valid_until, policy_commitment_hash, policy_secret_salt, covered_procedures)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [
              pol.id,
              pol.policy_number,
              pol.patient_address,
              pol.patient_name,
              pol.insurer_name,
              pol.max_coverage_limit,
              pol.remaining_coverage,
              pol.valid_from,
              pol.valid_until,
              pol.policy_commitment_hash,
              pol.policy_secret_salt || '',
              JSON.stringify(pol.covered_procedures || []),
            ]
          );
        }
      }

      const recordCheck = await this.pool.query('SELECT COUNT(*) FROM medical_records');
      if (parseInt(recordCheck.rows[0].count, 10) === 0) {
        console.log('🌱 [DB] Seeding default medical records into PostgreSQL...');
        for (const rec of this.memRecords.values()) {
          await this.pool.query(
            `INSERT INTO medical_records (id, patient_address, patient_id, title, category, ipfs_cid, commitment_hash, encrypted_payload, metadata, fhir_bundle, anchored_on_chain, on_chain_tx_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [
              rec.id,
              rec.patientAddress,
              'PT-766110',
              rec.title,
              rec.category,
              rec.ipfsCid,
              rec.commitmentHash,
              rec.encryptedPayload,
              JSON.stringify(rec.metadata || {}),
              JSON.stringify(rec.fhirBundle || {}),
              rec.anchoredOnChain,
              rec.onChainTxHash || null,
            ]
          );
        }
      }

      const claimCheck = await this.pool.query('SELECT COUNT(*) FROM claims');
      if (parseInt(claimCheck.rows[0].count, 10) === 0) {
        console.log('🌱 [DB] Seeding initial settled claim into PostgreSQL...');
        for (const clm of this.memClaims.values()) {
          await this.pool.query(
            `INSERT INTO claims (id, claim_nullifier, policy_commitment, hospital_address, hospital_name, claim_amount, claim_date, procedure_code, procedure_name, status, public_inputs, proof, tx_hash, settled_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            [
              clm.id,
              clm.claimNullifier,
              clm.policyCommitment,
              clm.hospitalAddress,
              clm.hospitalName,
              clm.claimAmount,
              clm.claimDate,
              clm.procedureCode,
              clm.procedureName,
              clm.status,
              JSON.stringify(clm.publicInputs),
              JSON.stringify(clm.proof),
              clm.txHash || null,
              clm.settledAt || null,
            ]
          );
        }
      }
    } catch (err: any) {
      console.warn('⚠️  [DB] Error during initial seed check:', err.message);
    }
  }

  private seedMemoryStore() {
    // Seed initial patients
    const patients: PatientEntity[] = [
      {
        patient_id: 'PT-766110',
        name: 'atat',
        phone: '+91 8798798798',
        hospital: 'Mayo Clinic Healthcare System',
        wallet_address: CONFIG.DEMO_ROLES.PATIENT,
        primary_diagnosis: 'Intractable migraine with aura',
        primary_diagnosis_code: 'G43.909',
        primary_procedure: 'Brain MRI with & without contrast',
        primary_procedure_code: 'CPT-70553',
        avatar_initial: 'AT',
      },
      {
        patient_id: 'PT-880129',
        name: 'Sarah Chen',
        phone: '+1 (555) 234-5678',
        hospital: 'Mayo Clinic Healthcare System',
        wallet_address: CONFIG.DEMO_ROLES.PATIENT,
        primary_diagnosis: 'Acute appendicitis with localized peritonitis',
        primary_diagnosis_code: 'K35.80',
        primary_procedure: 'Laparoscopic Appendectomy',
        primary_procedure_code: 'CPT-44970',
        avatar_initial: 'SC',
      },
      {
        patient_id: 'PT-440218',
        name: 'Marcus Brody',
        phone: '+1 (555) 987-6543',
        hospital: 'Johns Hopkins Medicine',
        wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        primary_diagnosis: 'Type 2 diabetes with severe peripheral neuropathy',
        primary_diagnosis_code: 'E11.40',
        primary_procedure: 'Comprehensive Neuromuscular EMG Study',
        primary_procedure_code: 'CPT-95886',
        avatar_initial: 'MB',
      },
      {
        patient_id: 'PT-993812',
        name: 'Elena Rostova',
        phone: '+1 (555) 456-7890',
        hospital: 'Stanford Health Care',
        wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        primary_diagnosis: 'Lumbar disc herniation with acute radiculopathy',
        primary_diagnosis_code: 'M51.26',
        primary_procedure: 'Lumbar Microdiscectomy',
        primary_procedure_code: 'CPT-63030',
        avatar_initial: 'ER',
      },
    ];

    patients.forEach((p) => this.memPatients.set(p.patient_id, p));

    // Seed initial policy
    const policy: PolicyEntity = {
      id: 'POL-8801',
      policy_number: 'APX-2026-8801',
      patient_address: CONFIG.DEMO_ROLES.PATIENT,
      patient_name: 'atat',
      insurer_name: 'Apex Health Insurance Corp',
      max_coverage_limit: 50000,
      remaining_coverage: 44200,
      valid_from: '2026-01-01',
      valid_until: '2030-12-31',
      policy_commitment_hash: '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
      policy_secret_salt: '0x94f8a123b7e',
      covered_procedures: [
        { code: 'CPT-70553', name: 'Brain MRI with & without contrast', maxCoveredAmount: 2400 },
        { code: 'CPT-71250', name: 'Chest CT without contrast', maxCoveredAmount: 1200 },
        { code: 'CPT-99214', name: 'Level 4 Established Patient Office Visit', maxCoveredAmount: 185 },
        { code: 'CPT-44970', name: 'Laparoscopic Appendectomy', maxCoveredAmount: 5800 },
        { code: 'CPT-99285', name: 'Emergency Department Visit (High Severity)', maxCoveredAmount: 650 },
      ],
    };
    this.memPolicies.set(policy.id, policy);

    // Seed sample record
    const sampleRec: EncryptedMedicalRecord = {
      id: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      patientAddress: CONFIG.DEMO_ROLES.PATIENT.toLowerCase(),
      title: 'Brain MRI with & without Contrast (Neuro Imaging)',
      category: 'Diagnostic',
      ipfsCid: 'QmYJK6gvh7BkPuBaoYCxMr94D9fuCaw8Jsp5CZdWzVcnrQ',
      commitmentHash: '0x5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      encryptedPayload: 'AES_GCM_ENCRYPTED_BASE64_PAYLOAD_CIPHERTEXT',
      metadata: {
        hospitalName: 'Mayo Clinic Healthcare System',
        doctorName: 'Dr. Sarah Lin, MD',
        procedureCode: 'CPT-70553',
        diagnosisCode: 'G43.909',
        timestamp: Date.now() - 3 * 86400000,
        fileSize: 42100,
        mimeType: 'application/dicom',
      },
      anchoredOnChain: true,
      onChainTxHash: '0x4f12ab78cd90ef345678901234567890abcdef1234567890abcdef1234567890',
      createdAt: Date.now() - 3 * 86400000,
    };
    this.memRecords.set(sampleRec.id, sampleRec);

    // Seed sample claim
    const sampleClaim: ClaimRecord = {
      id: 'CLM-8801-5501',
      claimNullifier: '0x0b0b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1122',
      policyCommitment: '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
      hospitalAddress: CONFIG.DEMO_ROLES.HOSPITAL,
      hospitalName: 'Mayo Clinic Healthcare System',
      claimAmount: 2400,
      claimDate: 1732320000,
      procedureCode: 'CPT-70553',
      procedureName: 'Brain MRI with & without contrast',
      status: 'settled',
      publicInputs: {
        approvedHospitalRoot: CONFIG.CONTRACTS.ApprovedHospitalMerkleRootDecimal,
        policyCommitment:
          '18235321658131723648847967345698509104713943756027922529868321960257868673173',
        claimAmount: '2400',
        claimDate: '1732320000',
        claimNullifier:
          '3141592653589793238462643383279502884197169399375105820974944592307816406286',
      },
      proof: {
        pi_a: [
          '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
          '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        ],
        pi_b: [
          [
            '0x1111111111111111111111111111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222222222222222222222222222',
          ],
          [
            '0x3333333333333333333333333333333333333333333333333333333333333333',
            '0x4444444444444444444444444444444444444444444444444444444444444444',
          ],
        ],
        pi_c: [
          '0x5555555555555555555555555555555555555555555555555555555555555555',
          '0x6666666666666666666666666666666666666666666666666666666666666666',
        ],
        protocol: 'groth16',
        curve: 'bn128',
      },
      txHash: '0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff',
      settledAt: 1732320120,
    };
    this.memClaims.set(sampleClaim.id, sampleClaim);
  }

  // ==========================================
  // PATIENT OPERATIONS
  // ==========================================
  public async getPatientById(patientId: string): Promise<PatientEntity | null> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM patients WHERE patient_id = $1', [
          patientId,
        ]);
        return res.rows[0] || null;
      } catch (err: any) {
        console.error('Error fetching patient by id:', err.message);
      }
    }
    return this.memPatients.get(patientId) || null;
  }

  public async getPatientByPhone(phone: string): Promise<PatientEntity | null> {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT * FROM patients WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = $1`,
          [cleanPhone]
        );
        return res.rows[0] || null;
      } catch (err: any) {
        console.error('Error fetching patient by phone:', err.message);
      }
    }
    for (const p of this.memPatients.values()) {
      const pClean = p.phone.replace(/[\s\-\(\)]/g, '');
      if (pClean === cleanPhone) return p;
    }
    return null;
  }

  public async getAllPatients(): Promise<PatientEntity[]> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM patients ORDER BY name ASC');
        return res.rows;
      } catch (err: any) {
        console.error('Error fetching all patients:', err.message);
      }
    }
    return Array.from(this.memPatients.values());
  }

  public async upsertPatient(patient: PatientEntity): Promise<PatientEntity> {
    if (this.isConnected && this.pool) {
      try {
        const query = `
          INSERT INTO patients (patient_id, name, phone, hospital, wallet_address, primary_diagnosis, primary_diagnosis_code, primary_procedure, primary_procedure_code, avatar_initial)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (patient_id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            hospital = EXCLUDED.hospital,
            primary_diagnosis = EXCLUDED.primary_diagnosis,
            primary_diagnosis_code = EXCLUDED.primary_diagnosis_code,
            primary_procedure = EXCLUDED.primary_procedure,
            primary_procedure_code = EXCLUDED.primary_procedure_code,
            avatar_initial = EXCLUDED.avatar_initial
          RETURNING *;
        `;
        const res = await this.pool.query(query, [
          patient.patient_id,
          patient.name,
          patient.phone,
          patient.hospital,
          patient.wallet_address || CONFIG.DEMO_ROLES.PATIENT,
          patient.primary_diagnosis || '',
          patient.primary_diagnosis_code || '',
          patient.primary_procedure || '',
          patient.primary_procedure_code || '',
          patient.avatar_initial || 'PT',
        ]);
        return res.rows[0];
      } catch (err: any) {
        console.error('Error upserting patient:', err.message);
      }
    }
    this.memPatients.set(patient.patient_id, patient);
    return patient;
  }

  // ==========================================
  // RECORD OPERATIONS
  // ==========================================
  public async createRecord(rec: EncryptedMedicalRecord): Promise<EncryptedMedicalRecord> {
    if (this.isConnected && this.pool) {
      try {
        const query = `
          INSERT INTO medical_records (id, patient_address, patient_id, title, category, ipfs_cid, commitment_hash, encrypted_payload, metadata, fhir_bundle, anchored_on_chain, on_chain_tx_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            anchored_on_chain = EXCLUDED.anchored_on_chain,
            on_chain_tx_hash = EXCLUDED.on_chain_tx_hash
          RETURNING *;
        `;
        await this.pool.query(query, [
          rec.id,
          rec.patientAddress.toLowerCase(),
          'PT-766110',
          rec.title,
          rec.category,
          rec.ipfsCid,
          rec.commitmentHash,
          rec.encryptedPayload,
          JSON.stringify(rec.metadata || {}),
          JSON.stringify(rec.fhirBundle || {}),
          rec.anchoredOnChain,
          rec.onChainTxHash || null,
        ]);
      } catch (err: any) {
        console.error('Error inserting medical record:', err.message);
      }
    }
    this.memRecords.set(rec.id, rec);
    return rec;
  }

  public async getRecordById(id: string): Promise<EncryptedMedicalRecord | null> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM medical_records WHERE id = $1', [id]);
        if (res.rows[0]) {
          const r = res.rows[0];
          return {
            id: r.id,
            patientAddress: r.patient_address,
            title: r.title,
            category: r.category,
            ipfsCid: r.ipfs_cid,
            commitmentHash: r.commitment_hash,
            encryptedPayload: r.encrypted_payload,
            metadata: r.metadata,
            fhirBundle: r.fhir_bundle,
            anchoredOnChain: r.anchored_on_chain,
            onChainTxHash: r.on_chain_tx_hash,
            createdAt: new Date(r.created_at).getTime(),
          };
        }
      } catch (err: any) {
        console.error('Error fetching record by id:', err.message);
      }
    }
    return this.memRecords.get(id) || null;
  }

  public async getRecordsByPatient(patientAddress: string): Promise<EncryptedMedicalRecord[]> {
    const norm = patientAddress.toLowerCase();
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT * FROM medical_records WHERE LOWER(patient_address) = $1 ORDER BY created_at DESC',
          [norm]
        );
        return res.rows.map((r: any) => ({
          id: r.id,
          patientAddress: r.patient_address,
          title: r.title,
          category: r.category,
          ipfsCid: r.ipfs_cid,
          commitmentHash: r.commitment_hash,
          encryptedPayload: r.encrypted_payload,
          metadata: r.metadata,
          fhirBundle: r.fhir_bundle,
          anchoredOnChain: r.anchored_on_chain,
          onChainTxHash: r.on_chain_tx_hash,
          createdAt: new Date(r.created_at).getTime(),
        }));
      } catch (err: any) {
        console.error('Error fetching records by patient:', err.message);
      }
    }
    return Array.from(this.memRecords.values()).filter(
      (r) => r.patientAddress.toLowerCase() === norm
    );
  }

  // ==========================================
  // ACCESS PERMISSIONS OPERATIONS
  // ==========================================
  public async grantPermission(perm: AccessPermission, patientAddress: string): Promise<void> {
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO access_permissions (record_id, patient_address, grantee_address, grantee_name, role, granted_at, expires_at, is_active, tx_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            perm.recordId,
            patientAddress.toLowerCase(),
            perm.granteeAddress.toLowerCase(),
            perm.granteeName || 'Physician',
            perm.role || 'Doctor',
            perm.grantedAt,
            perm.expiresAt,
            perm.isActive,
            perm.txHash || null,
          ]
        );
      } catch (err: any) {
        console.error('Error granting permission in DB:', err.message);
      }
    }
    const key = `${patientAddress.toLowerCase()}_${perm.recordId}`;
    const list = this.memPermissions.get(key) || [];
    list.push(perm);
    this.memPermissions.set(key, list);
  }

  public async revokePermission(recordId: string, granteeAddress: string): Promise<void> {
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `UPDATE access_permissions SET is_active = false
           WHERE record_id = $1 AND LOWER(grantee_address) = $2`,
          [recordId, granteeAddress.toLowerCase()]
        );
      } catch (err: any) {
        console.error('Error revoking permission in DB:', err.message);
      }
    }
    for (const [key, perms] of this.memPermissions.entries()) {
      if (key.includes(recordId)) {
        perms.forEach((p) => {
          if (p.granteeAddress.toLowerCase() === granteeAddress.toLowerCase()) {
            p.isActive = false;
          }
        });
      }
    }
  }

  public async getPermissionsForPatient(patientAddress: string): Promise<AccessPermission[]> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT * FROM access_permissions WHERE LOWER(patient_address) = $1 AND is_active = true`,
          [patientAddress.toLowerCase()]
        );
        return res.rows.map((r: any) => ({
          recordId: r.record_id,
          granteeAddress: r.grantee_address,
          granteeName: r.grantee_name,
          role: r.role,
          grantedAt: Number(r.granted_at),
          expiresAt: Number(r.expires_at),
          isActive: r.is_active,
          txHash: r.tx_hash,
        }));
      } catch (err: any) {
        console.error('Error fetching permissions for patient:', err.message);
      }
    }
    const results: AccessPermission[] = [];
    for (const [key, perms] of this.memPermissions.entries()) {
      if (key.startsWith(patientAddress.toLowerCase())) {
        results.push(...perms.filter((p) => p.isActive));
      }
    }
    return results;
  }

  // ==========================================
  // CLAIMS OPERATIONS
  // ==========================================
  public async createClaim(claim: ClaimRecord): Promise<ClaimRecord> {
    if (this.isConnected && this.pool) {
      try {
        const query = `
          INSERT INTO claims (id, claim_nullifier, policy_commitment, hospital_address, hospital_name, claim_amount, claim_date, procedure_code, procedure_name, status, public_inputs, proof, tx_hash, settled_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            tx_hash = EXCLUDED.tx_hash,
            settled_at = EXCLUDED.settled_at
          RETURNING *;
        `;
        await this.pool.query(query, [
          claim.id,
          claim.claimNullifier,
          claim.policyCommitment,
          claim.hospitalAddress,
          claim.hospitalName,
          claim.claimAmount,
          claim.claimDate,
          claim.procedureCode,
          claim.procedureName,
          claim.status,
          JSON.stringify(claim.publicInputs),
          JSON.stringify(claim.proof),
          claim.txHash || null,
          claim.settledAt || null,
        ]);
      } catch (err: any) {
        console.error('Error inserting claim in DB:', err.message);
      }
    }
    this.memClaims.set(claim.id, claim);
    return claim;
  }

  public async getClaimById(id: string): Promise<ClaimRecord | null> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM claims WHERE id = $1', [id]);
        if (res.rows[0]) {
          const r = res.rows[0];
          return {
            id: r.id,
            claimNullifier: r.claim_nullifier,
            policyCommitment: r.policy_commitment,
            hospitalAddress: r.hospital_address,
            hospitalName: r.hospital_name,
            claimAmount: Number(r.claim_amount),
            claimDate: Number(r.claim_date),
            procedureCode: r.procedure_code,
            procedureName: r.procedure_name,
            status: r.status,
            publicInputs: r.public_inputs,
            proof: r.proof,
            txHash: r.tx_hash,
            settledAt: r.settled_at ? Number(r.settled_at) : undefined,
          };
        }
      } catch (err: any) {
        console.error('Error fetching claim by id:', err.message);
      }
    }
    return this.memClaims.get(id) || null;
  }

  public async getClaimByNullifier(nullifier: string): Promise<ClaimRecord | null> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM claims WHERE claim_nullifier = $1', [
          nullifier,
        ]);
        if (res.rows[0]) {
          const r = res.rows[0];
          return {
            id: r.id,
            claimNullifier: r.claim_nullifier,
            policyCommitment: r.policy_commitment,
            hospitalAddress: r.hospital_address,
            hospitalName: r.hospital_name,
            claimAmount: Number(r.claim_amount),
            claimDate: Number(r.claim_date),
            procedureCode: r.procedure_code,
            procedureName: r.procedure_name,
            status: r.status,
            publicInputs: r.public_inputs,
            proof: r.proof,
            txHash: r.tx_hash,
            settledAt: r.settled_at ? Number(r.settled_at) : undefined,
          };
        }
      } catch (err: any) {
        console.error('Error fetching claim by nullifier:', err.message);
      }
    }
    for (const c of this.memClaims.values()) {
      if (c.claimNullifier === nullifier) return c;
    }
    return null;
  }

  public async getAllClaims(): Promise<ClaimRecord[]> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM claims ORDER BY claim_date DESC');
        return res.rows.map((r: any) => ({
          id: r.id,
          claimNullifier: r.claim_nullifier,
          policyCommitment: r.policy_commitment,
          hospitalAddress: r.hospital_address,
          hospitalName: r.hospital_name,
          claimAmount: Number(r.claim_amount),
          claimDate: Number(r.claim_date),
          procedureCode: r.procedure_code,
          procedureName: r.procedure_name,
          status: r.status,
          publicInputs: r.public_inputs,
          proof: r.proof,
          txHash: r.tx_hash,
          settledAt: r.settled_at ? Number(r.settled_at) : undefined,
        }));
      } catch (err: any) {
        console.error('Error fetching all claims:', err.message);
      }
    }
    return Array.from(this.memClaims.values());
  }

  // ==========================================
  // AUDIT & BREAK-GLASS OPERATIONS
  // ==========================================
  public async logAuditEvent(event: {
    id: string;
    timestamp: number;
    eventName: string;
    actorRole: UserRole | string;
    actorAddress: string;
    details: string;
    txHash?: string;
  }): Promise<void> {
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO audit_events (id, timestamp, event_name, actor_role, actor_address, details, tx_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            event.id,
            event.timestamp,
            event.eventName,
            event.actorRole,
            event.actorAddress,
            event.details,
            event.txHash || null,
          ]
        );
      } catch (err: any) {
        console.error('Error logging audit event:', err.message);
      }
    }
    this.memAudit.set(event.id, event);
  }

  public async getRecentAuditEvents(limit: number = 50): Promise<any[]> {
    if (this.isConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT $1`,
          [limit]
        );
        return res.rows;
      } catch (err: any) {
        console.error('Error fetching audit events:', err.message);
      }
    }
    return Array.from(this.memAudit.values()).slice(0, limit);
  }

  public async logBreakGlass(log: BreakGlassLog): Promise<void> {
    if (this.isConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO break_glass_logs (id, record_id, patient_address, responder_address, reason, timestamp, tx_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            log.id,
            log.recordId,
            log.patientAddress,
            log.responderAddress,
            log.reason,
            log.timestamp,
            log.txHash || null,
          ]
        );
      } catch (err: any) {
        console.error('Error logging break-glass event:', err.message);
      }
    }
    this.memBreakGlass.push(log);
  }
}

export const db = new DatabaseService();
