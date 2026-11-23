# ZKP Health Claims & Privacy Records — Backend Service

A high-performance Node.js / Express backend service powering **Hackasol 5.0 (Track 4: Web3 · W3-01): Privacy-Preserving Health Records & ZKP Insurance Claims**.

---

## 🏛️ Architecture & Module Map

| Module | Core Functionality | Primary Endpoints | Blockchain / Cryptographic Layer |
| :--- | :--- | :--- | :--- |
| **Module 1 – Authentication & Roles** | Sovereign Wallet Sign-In, Role Attestations | `GET /api/auth/challenge`<br>`POST /api/auth/verify`<br>`POST /api/auth/demo-login` | ECDSA Signature Verification (`ethers.verifyMessage`), Session Tokens |
| **Module 2 – Medical Records & IPFS** | Encrypted Records, HL7 FHIR Bundles, Access Delegation, Break-Glass | `POST /api/records/upload`<br>`GET /api/records/patient/:addr`<br>`POST /api/records/grant`<br>`POST /api/records/break-glass`<br>`POST /api/records/pharmacy-pass` | Off-Chain AES-256-GCM, Deterministic IPFS CIDv0 (`Qm...`), On-Chain Hash Commitments on `HealthAccessRegistry.sol` |
| **Module 3 – Zero-Knowledge Proofs** | Hospital Accreditation Merkle Proofs, Circom Groth16 Proving & Verification | `GET /api/zkp/merkle-tree`<br>`GET /api/zkp/merkle-proof/:id`<br>`POST /api/zkp/prove`<br>`POST /api/zkp/verify` | Poseidon Hash (`circomlibjs`), 16-Leaf Depth-4 Merkle Tree, SnarkJS Groth16 (`health_claim.wasm` & `circuit_final.zkey`, 1,960 constraints) |
| **Module 4 – Blockchain Settlement** | On-Chain Groth16 Claim Verification, Replay Attack Protection, Escrow Payout | `POST /api/claims/submit`<br>`GET /api/claims/nullifier/:nullifier`<br>`GET /api/claims/escrow-status` | `ZKPInsuranceSettlement.sol` & `Groth16Verifier.sol`, Replay Nullifier Guard, Automated Stablecoin Escrow Disbursal |
| **Module 5 – Dashboards & Audit Trail** | Live Event Streaming, Sovereign Dashboard Aggregators, System Health | `GET /api/dashboard/patient/:addr`<br>`GET /api/dashboard/hospital/:addr`<br>`GET /api/dashboard/insurer`<br>`GET /api/audit/events`<br>`GET /api/audit/system-status` | Tamper-Evident Chronological Audit Ledger (`RecordViewed`, `AccessGranted`, `ClaimSettled`, `BreakGlass`) |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Test Suite
```bash
npm test
```
*Executes all 9 unit and integration tests across Modules 1 to 5.*

### 3. Build & Start Service
```bash
# Build TypeScript
npm run build

# Start production server (Port 5001)
npm start

# Or development mode with auto-reload
npm run dev
```

---

## 📡 API Specification

### Module 1: Authentication
- `GET /api/auth/challenge?address=0x...&role=patient`: Generates cryptographic sign-in challenge.
- `POST /api/auth/verify`: Validates ECDSA signature against challenge and returns session.
- `POST /api/auth/demo-login`: Instant 1-click evaluator authentication for `patient`, `hospital`, or `insurer`.
- `GET /api/auth/session`: Validates current session token.

### Module 2: Medical Records
- `POST /api/records/upload`: Receives report or HL7 FHIR bundle, encrypts with AES-256-GCM, pins to IPFS, and anchors SHA-256 commitment on `HealthAccessRegistry.sol`.
- `GET /api/records/patient/:address`: Returns all sovereign record commitments for a patient.
- `GET /api/records/:recordId`: Checks doctor authorization, emits on-chain `RecordViewed` audit event, and returns record payload.
- `POST /api/records/grant`: Grants time-bound, role-based doctor access (emits `AccessGranted`).
- `POST /api/records/revoke`: Revokes doctor access (emits `AccessRevoked`).
- `POST /api/records/break-glass`: Emergency responder override for incapacitated patients; permanently logs `RecordBreakGlassAccessed` to audit trail.
- `POST /api/records/pharmacy-pass`: Generates a Secret-Free Pharmacy QR Pass proving valid prescription without revealing patient diagnosis.

### Module 3: Zero-Knowledge Proofs
- `GET /api/zkp/merkle-tree`: Returns accredited hospital Merkle tree root and provider leaves.
- `GET /api/zkp/merkle-proof/:hospitalId`: Computes Poseidon inclusion proof for hospital accreditation.
- `POST /api/zkp/prove`: Generates full Groth16 zero-knowledge proof via SnarkJS and Circom WASM.
- `POST /api/zkp/verify`: Verifies Groth16 proof against `verification_key.json`.

### Module 4: Claims & Blockchain Settlement
- `POST /api/claims/submit`: Validates Groth16 proof, checks nullifier replay guard, and calls `submitAndSettleClaim` on `ZKPInsuranceSettlement.sol`.
- `GET /api/claims/nullifier/:nullifier`: Checks if a claim nullifier has already been spent.
- `GET /api/claims/escrow-status`: Returns escrow liquidity reserves and total settled payout volume.

### Module 5: Dashboards & Audit Trail
- `GET /api/dashboard/patient/:address`: Consolidated patient metrics, records count, and privacy score.
- `GET /api/dashboard/hospital/:address`: Hospital accreditation proof and settlement volume.
- `GET /api/dashboard/insurer`: Escrow liquidity, claim verification rate, and blocked replay attempts.
- `GET /api/audit/events`: Live tamper-evident audit event stream.
- `GET /api/audit/system-status`: Health and readiness across contracts, circuits, and storage.
