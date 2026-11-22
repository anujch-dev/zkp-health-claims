# ZKP Health Claims: Privacy-Preserving Health Records & Decentralized Insurance Settlement

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Track](https://img.shields.io/badge/Track-WEB3%20%C2%B7%20W3--01-indigo.svg)](#)
[![Zero-Knowledge](https://img.shields.io/badge/ZKP-Groth16%20%2F%20Circom-purple.svg)](#)
[![Smart Contracts](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](#)

A working end-to-end decentralized hackathon prototype demonstrating **Privacy-Preserving Health Records & ZKP Insurance Claims**.

---

## 🌟 The Core Problem & Solution

Traditional health insurance claims force patients and hospitals to expose sensitive, unredacted clinical data (diagnoses, procedure codes, prescriptions, and full medical histories) to insurance underwriters. This leads to data breaches, profiling, and systemic HIPAA privacy violations.

**ZK-HealthClaims** re-architects the workflow:
1. **Patient Sovereignty**: Encrypted records stored off-chain (IPFS) with cryptographic hash commitments anchored on-chain. Patients grant and revoke doctor access keys.
2. **Hospital ZK Prover**: Hospitals generate a client-side Zero-Knowledge Proof (Groth16) proving:
   - The hospital is an accredited provider (Merkle tree membership).
   - The claim is tied to an active, unexpired policy.
   - The procedure is covered and within policy limits.
   - *Without ever disclosing the diagnosis code, procedure notes, or prescriptions to the insurer.*
3. **Smart Contract Settlement**: `ZKPInsuranceSettlement.sol` verifies the proof on-chain, enforces a deterministic **claim nullifier** to block replay attacks, and automatically disburses escrow funds.

---

## 📁 Repository Structure

```
zkp-health-claims/
├── contracts/                   # Solidity Smart Contracts (Slice 2)
│   ├── src/
│   │   ├── HealthAccessRegistry.sol    # Patient encrypted record commitments & doctor delegation
│   │   ├── ZKPInsuranceSettlement.sol  # On-chain Groth16 verification, replay protection & payout
│   │   ├── IVerifier.sol               # Snark pairing interface
│   │   └── MockGroth16Verifier.sol     # Mock Groth16 verifier for test suites
│   ├── test/
│   │   └── contracts.test.js           # 11 unit tests covering permissions, ZK proofs & replay attacks
│   ├── scripts/
│   │   └── deploy.cjs                  # Hardhat deployment script
│   ├── hardhat.config.cjs
│   └── package.json
├── circuits/                    # Circom / Cryptographic circuits (Slice 3)
│   ├── claim_verification.circom       # R1CS constraints: Merkle root, policy expiry, limits, nullifier
│   └── scripts/                        # Proof generation & verification helpers
├── frontend/                    # Web Application (Slice 1)
│   ├── src/
│   │   ├── components/          # UI Shell, Navbar, RoleSwitcher, GuidedDemoBanner, ArchitectureCard
│   │   ├── views/               # PatientView, HospitalView, InsurerView, GuidedDemoView
│   │   ├── types/               # Domain interfaces (Records, Policies, Claims, Proofs, Nullifiers)
│   │   ├── fixtures/            # Mock data (Accredited Merkle tree, demo policies, historical claims)
│   │   └── lib/                 # Client-side cryptographic prover & hash utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/                        # Architecture diagrams & threat models
│   ├── architecture.md
│   └── threat-model.md
├── .env.example                 # Environment variables template
└── README.md
```

---

## 🚀 Incremental Milestone Roadmap

- [x] **Slice 1 (Scaffolding & UI Shell)**:
  - Repository structure, TypeScript configuration, Tailwind dark-theme Web3 shell.
  - Interactive **Patient → Hospital → Insurer** Role Switcher.
  - Comprehensive fixtures: 4-leaf Accredited Hospital Merkle Tree, active health policies, encrypted records.
  - Client-side cryptographic hash & Groth16 constraint evaluation engine.
  - Interactive Judge Demo sandbox with one-click test buttons (Valid claim, Replay attack guard, Expired policy).
- [x] **Slice 2 (Smart Contracts & Replay Guard)**:
  - `HealthAccessRegistry.sol`: On-chain patient commitments & doctor access delegation.
  - `ZKPInsuranceSettlement.sol`: Nullifier registry, Groth16 proof verification, accredited hospital Merkle root enforcement, and automated escrow payout.
  - `MockGroth16Verifier.sol` & `IVerifier.sol`: Groth16 Snark interface and toggleable mock verifier.
  - Automated deployment script exporting deployed addresses.
  - **11/11 unit tests passing** with Hardhat covering happy path, replay attack prevention, and fraud checks.
- [ ] **Slice 3 (ZKP Circuit & Cryptographic Wiring)**:
  - Circom R1CS circuit (`claim_verification.circom`).
  - Merkle inclusion, policy expiration, and limit boundary constraints.
  - Verifier contract compilation & witness generation.
- [ ] **Slice 4 (End-to-End Integration & Threat Model)**:
  - Connect ethers.js frontend with contracts and circuit verifier.
  - Visual proof inspector, failure state handling, and final submission walkthrough.

---

## 🧪 Smart Contract Test Results (Slice 2)

```text
  Slice 2: Decentralized Health Records & ZKP Insurance Claims
    1. HealthAccessRegistry (Patient Privacy & Doctor Delegation)
      ✔ should allow a patient to register an encrypted record commitment
      ✔ should reject registering duplicate record ID
      ✔ should reject unauthorized doctor from reading patient record metadata
      ✔ should allow patient to grant doctor access and permit reading
      ✔ should allow patient to revoke doctor access
    2. ZKPInsuranceSettlement (Proof Verification, Replay Guard & Payout)
      ✔ should settle a valid claim and disburse payout to hospital
      ✔ REPLAY ATTACK GUARD: should revert when the same claim nullifier is re-submitted
      ✔ HOSPITAL ACCREDITATION GUARD: should revert if submitted Merkle root does not match approved root
      ✔ INVALID ZK PROOF GUARD: should revert if the Snark verifier rejects the proof
      ✔ INSUFFICIENT ESCROW GUARD: should revert if claim amount exceeds contract liquidity
      ✔ ESCROW MANAGEMENT: insurer can fund and withdraw liquidity

  11 passing (1s)
```

### Running Contract Tests
```bash
cd contracts
npm install
npm test
```

### Deploying Contracts Locally
```bash
cd contracts
npx hardhat run scripts/deploy.cjs
```

---

## 💻 Frontend Quickstart Guide (Slice 1)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive prototype.

### 3. Build for Production
```bash
npm run build
```
The production bundle builds cleanly into `frontend/dist/`.
