-- ====================================================================
-- ZKP Health Claims Platform - PostgreSQL Database Schema
-- Compatible with Neon Serverless Postgres & Supabase
-- ====================================================================

-- 1. Patients Table (EHR Profile, Sovereign Identity)
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

-- Index for phone & name lookups
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_wallet ON patients(wallet_address);

-- 2. Insurance Policies Table
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

CREATE INDEX IF NOT EXISTS idx_policies_patient ON insurance_policies(patient_address);
CREATE INDEX IF NOT EXISTS idx_policies_number ON insurance_policies(policy_number);

-- 3. Medical Records Table (Encrypted IPFS Metadata & Hash Commitments)
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

CREATE INDEX IF NOT EXISTS idx_records_patient_addr ON medical_records(patient_address);
CREATE INDEX IF NOT EXISTS idx_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_cid ON medical_records(ipfs_cid);

-- 4. Doctor Access Permissions Table (Granular Care Team Grants)
CREATE TABLE IF NOT EXISTS access_permissions (
  id SERIAL PRIMARY KEY,
  record_id VARCHAR(128) NOT NULL,
  patient_address VARCHAR(64) NOT NULL,
  grantee_address VARCHAR(64) NOT NULL,
  grantee_name VARCHAR(255),
  role VARCHAR(64) DEFAULT 'Doctor',
  granted_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tx_hash VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_access_record FOREIGN KEY(record_id) REFERENCES medical_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_access_record ON access_permissions(record_id);
CREATE INDEX IF NOT EXISTS idx_access_grantee ON access_permissions(grantee_address);
CREATE INDEX IF NOT EXISTS idx_access_active ON access_permissions(is_active);

-- 5. Claims Table (ZK Nullifiers & Settled Submissions)
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

CREATE INDEX IF NOT EXISTS idx_claims_nullifier ON claims(claim_nullifier);
CREATE INDEX IF NOT EXISTS idx_claims_hospital ON claims(hospital_address);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- 6. Audit Events Table (Tamper-Evident Ledger)
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

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_address);

-- 7. Break-Glass Emergency Access Logs Table
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

CREATE INDEX IF NOT EXISTS idx_break_glass_patient ON break_glass_logs(patient_address);
