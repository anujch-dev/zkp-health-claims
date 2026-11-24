/**
 * ZKP Health Claims - Unified Backend API Client
 * Connects frontend UI to Node.js / Express backend service (port 5001)
 * with automatic fallback to client-side cryptographic proving.
 */

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const DEFAULT_URL = isLocalhost 
  ? 'http://localhost:5001/api' 
  : 'https://zkp-health-claims.onrender.com/api';

const RAW_URL: string = (import.meta as any).env?.VITE_API_URL || DEFAULT_URL;
let CLEAN_URL = RAW_URL.trim().replace(/\/+$/, '');

// Upgrade non-localhost http to https to prevent mixed content and 308 redirects on Vercel/Render
if (CLEAN_URL.startsWith('http://') && !CLEAN_URL.includes('localhost') && !CLEAN_URL.includes('127.0.0.1')) {
  CLEAN_URL = CLEAN_URL.replace('http://', 'https://');
}
const API_BASE = CLEAN_URL.endsWith('/api') ? CLEAN_URL : `${CLEAN_URL}/api`;

export interface BackendHealth {
  status: string;
  version: string;
  service: string;
  port: number;
  database?: string;
  modules: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  /**
   * Health and service connectivity
   */
  async getHealth(): Promise<BackendHealth | null> {
    try {
      return await request<BackendHealth>('/health');
    } catch {
      return null;
    }
  },

  /**
   * Module 1: Cryptographic Authentication
   */
  async getAuthChallenge(address: string, role: string = 'patient') {
    return request<{ success: boolean; address: string; role: string; challenge: string; expiresAt: number }>(
      `/auth/challenge?address=${address}&role=${role}`
    );
  },

  async verifyAuthSignature(address: string, signature: string, challenge: string) {
    return request<{ success: boolean; token: string; session: any }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ address, signature, challenge })
    });
  },

  async demoLogin(role: string) {
    return request<{ success: boolean; token: string; session: any; isDemo: boolean }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  async getRoles() {
    return request<{ roles: Array<{ id: string; title: string; address: string; name: string; description: string }> }>('/auth/roles');
  },

  /**
   * Module 2: IPFS Record Storage & Encryption
   */
  async uploadRecord(payload: {
    patientAddress: string;
    title: string;
    category: string;
    content?: string;
    hospitalName?: string;
    doctorName?: string;
    procedureCode?: string;
    diagnosisCode?: string;
  }) {
    return request<any>('/records/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getPatientRecords(patientAddress: string) {
    return request<{ success: boolean; patientAddress: string; count: number; records: any[] }>(
      `/records/patient/${patientAddress}`
    );
  },

  async viewRecord(recordId: string, viewerAddress?: string) {
    const query = viewerAddress ? `?viewerAddress=${viewerAddress}` : '';
    return request<{ success: boolean; record: any; viewLoggedOnChain: boolean; auditTxHash: string }>(
      `/records/${recordId}${query}`
    );
  },

  async grantAccess(payload: {
    patientAddress: string;
    doctorAddress: string;
    recordId: string;
    role?: string;
    durationSeconds?: number;
  }) {
    return request<{ success: boolean; permission: any; txHash: string }>('/records/grant', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async revokeAccess(payload: {
    patientAddress: string;
    doctorAddress: string;
    recordId: string;
  }) {
    return request<{ success: boolean; revoked: boolean; txHash: string }>('/records/revoke', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async breakGlassEmergency(payload: {
    patientAddress: string;
    recordId: string;
    responderAddress: string;
    reason: string;
  }) {
    return request<any>('/records/break-glass', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async generatePharmacyPass(payload: {
    patientAddress: string;
    recordId: string;
    medicationCode?: string;
    medicationName?: string;
  }) {
    return request<any>('/records/pharmacy-pass', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Module 3: Zero-Knowledge Proving (Circom BN254)
   */
  async getMerkleTree() {
    return request<any>('/zkp/merkle-tree');
  },

  async getHospitalMerkleProof(hospitalId: string) {
    return request<any>(`/zkp/hospital-proof/${hospitalId}`);
  },

  async generateProof(privateInputs: any) {
    return request<{
      success: boolean;
      proof: any;
      publicInputs: any;
      generationTimeMs: number;
    }>('/zkp/generate-proof', {
      method: 'POST',
      body: JSON.stringify({ privateInputs })
    });
  },

  async verifyProof(proof: any, publicSignals: string[]) {
    return request<{
      isValid: boolean;
      verificationEngine: string;
      verifiedAt: number;
    }>('/zkp/verify-proof', {
      method: 'POST',
      body: JSON.stringify({ proof, publicSignals })
    });
  },

  /**
   * Module 4: Claims & Relayer Settlement
   */
  async submitClaim(claimPayload: {
    proof: any;
    publicInputs: any;
    hospitalAddress?: string;
    hospitalName?: string;
    procedureCode?: string;
    procedureName?: string;
    claimAmount?: number;
  }) {
    return request<any>('/claims/submit', {
      method: 'POST',
      body: JSON.stringify(claimPayload)
    });
  },

  async checkNullifier(nullifier: string) {
    return request<{ nullifier: string; isSpent: boolean; status: string }>(
      `/claims/nullifier/${nullifier}`
    );
  },

  async getClaims() {
    return request<{ success: boolean; count: number; claims: any[] }>('/claims');
  },

  async getEscrowStatus() {
    return request<{
      success: boolean;
      escrowContract: string;
      balance: string;
      settledCount: number;
      totalPayout: number;
    }>('/claims/escrow-status');
  },

  /**
   * Module 5: Dashboards & Live Audit Trail
   */
  async getPatientDashboard(address: string) {
    return request<any>(`/dashboard/patient/${address}`);
  },

  async getHospitalDashboard(address: string) {
    return request<any>(`/dashboard/hospital/${address}`);
  },

  async getInsurerDashboard() {
    return request<any>('/dashboard/insurer');
  },

  async getAuditEvents(limit: number = 50) {
    return request<{ success: boolean; totalCount: number; events: any[]; databaseEvents?: any[] }>(
      `/audit/events?limit=${limit}`
    );
  },

  async getSystemStatus() {
    return request<any>('/audit/system-status');
  },

  /**
   * Module 6: PostgreSQL Sovereign Patient Identity
   */
  async patientLogin(payload: { phone?: string; patientId?: string }) {
    return request<{ success: boolean; patient: any }>('/auth/patient-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getRegisteredPatients() {
    return request<{ success: boolean; count: number; patients: any[] }>('/auth/patients');
  },

  async registerPatient(patientData: any) {
    return request<{ success: boolean; patient: any }>('/auth/register-patient', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
  }
};
