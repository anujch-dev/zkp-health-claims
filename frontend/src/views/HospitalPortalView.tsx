import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Cpu,
  History,
  Settings,
  Building2,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronRight,
  Search,
  Phone,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  InsurancePolicy,
  ClaimSubmission,
  TerminologyMode,
  UserRole,
  PatientProfile,
  HealthRecord
} from '../types';
import { HospitalView } from './HospitalView';
import { ACCREDITED_HOSPITALS, PRESET_PATIENTS } from '../fixtures/mockData';

export type HospitalTab =
  | 'dashboard'
  | 'patients'
  | 'records'
  | 'claims'
  | 'zkp'
  | 'history'
  | 'settings';

interface HospitalPortalViewProps {
  policy: InsurancePolicy;
  patientProfile?: PatientProfile;
  onClaimSubmitted: (submission: ClaimSubmission) => void;
  onTestReplayAttack?: () => void;
  onTestUnaccreditedHospital?: () => void;
  onTestLimitExceeded?: () => void;
  isProcessing: boolean;
  terminologyMode?: TerminologyMode;
  onSelectRole?: (role: UserRole) => void;
  claims: ClaimSubmission[];
  records: HealthRecord[];
  onExitPortal: () => void;
  activeTab?: HospitalTab;
  onTabChange?: (tab: HospitalTab) => void;
}

export const HospitalPortalView: React.FC<HospitalPortalViewProps> = ({
  policy,
  patientProfile,
  onClaimSubmitted,
  onTestReplayAttack,
  onTestUnaccreditedHospital,
  onTestLimitExceeded,
  isProcessing,
  terminologyMode = 'plain',
  onSelectRole,
  claims,
  records,
  onExitPortal,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<HospitalTab>('dashboard');
  const currentTab = controlledTab || internalTab;

  const handleTabClick = (tab: HospitalTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const hospital = ACCREDITED_HOSPITALS[0]; // Apex University Health Care

  // Metric Computations
  const totalHospitalPatients = PRESET_PATIENTS.length + (patientProfile && !PRESET_PATIENTS.some(p => p.name === patientProfile.name) ? 1 : 0);
  const totalClaimsSubmitted = claims.length;
  const verifiedClaimsCount = claims.filter(c => c.status === 'VERIFIED' || c.status === 'PAYOUT_SETTLED').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;

  const sidebarItems: { id: HospitalTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users, badge: totalHospitalPatients },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'claims', label: 'Submit Claims', icon: Send },
    { id: 'zkp', label: 'ZKP Generator', icon: Cpu },
    { id: 'history', label: 'Claim History', icon: History, badge: claims.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Portal Banner with Subtle Blue Accent */}
      <div className="bg-white border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Hospital Portal
              </span>
              <span className="text-xs font-medium text-clinical-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                Accredited Merkle Leaf #{hospital.leafIndex}
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-clinical-text">
              {hospital.name}
            </h2>
            <p className="text-[11px] text-clinical-muted font-mono">
              License: {hospital.licenseNumber} · Wallet: {hospital.walletAddress.slice(0, 10)}...{hospital.walletAddress.slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={onExitPortal}
            className="px-3.5 py-2 rounded-xl bg-alabaster-100 hover:bg-alabaster-200 text-clinical-text border border-alabaster-300 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
            title="Return to Common Portal Selection Landing Page"
          >
            <LogOut className="h-3.5 w-3.5 text-clinical-muted" />
            <span>Exit to Portals</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Sub-View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Hospital Sidebar Navigation */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-3 shadow-sm lg:sticky lg:top-24 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-clinical-muted">
            Hospital Navigation
          </div>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-clinical-text hover:bg-blue-50/70 hover:text-blue-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-alabaster-200 mt-2">
            <button
              onClick={() => handleTabClick('claims')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-blue-700" />
              <span>New Claim Submission</span>
            </button>
          </div>
        </div>

        {/* Right Content Area for Selected Hospital Tab */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. DASHBOARD TAB */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Total Patients</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-clinical-text">
                    {totalHospitalPatients}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Active EHR accounts</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Claims Submitted</span>
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-clinical-text">
                    {totalClaimsSubmitted}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Gross total claims</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Claims Verified</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    {verifiedClaimsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Groth16 ZK verified</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Pending Claims</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700">
                    {pendingClaimsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Awaiting payout release</p>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-blue-950 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-700" />
                    Zero-Knowledge Claim Generation Engine Ready
                  </h3>
                  <p className="text-xs text-blue-900/80">
                    Compute client-side Groth16 cryptographic proofs certifying policy compliance without transmitting patient diagnoses.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTabClick('claims')}
                    className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit New Claim</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Recent Claim Activity Table */}
              <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
                  <div>
                    <h3 className="text-base font-serif font-bold text-clinical-text">
                      Recent Claim Activity
                    </h3>
                    <p className="text-xs text-clinical-muted">
                      Audit trail of claims broadcast from this medical provider
                    </p>
                  </div>
                  <button
                    onClick={() => handleTabClick('history')}
                    className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All History</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-alabaster-200 text-clinical-muted uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Claim ID</th>
                        <th className="py-2.5 px-3">Procedure</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Nullifier</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-alabaster-200 font-mono">
                      {claims.slice(0, 4).map((claim) => (
                        <tr key={claim.id} className="hover:bg-alabaster-50 transition">
                          <td className="py-3 px-3 font-bold text-clinical-text">{claim.id}</td>
                          <td className="py-3 px-3 font-sans text-clinical-text">
                            {claim.privateInputsSummary?.hiddenProcedure || "Brain Contrast Neuro-MRI"}
                          </td>
                          <td className="py-3 px-3 font-bold text-blue-800">
                            ${claim.payoutAmount.toLocaleString()} USDC
                          </td>
                          <td className="py-3 px-3 text-clinical-muted truncate max-w-[120px]">
                            {claim.publicInputs.claimNullifier.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-3 font-sans">
                            {claim.status === 'PAYOUT_SETTLED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Settled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                                <Cpu className="h-3 w-3" /> Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. PATIENTS TAB */}
          {currentTab === 'patients' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-alabaster-200 pb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-clinical-text">
                    Hospital Patient Registry
                  </h3>
                  <p className="text-xs text-clinical-muted">
                    Accredited patients registered at {hospital.name} with active EHR commitments
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-clinical-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, or ID..."
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-clinical-text focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_PATIENTS.filter(p =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.phone.includes(searchTerm) ||
                  p.patientId.includes(searchTerm)
                ).map((patient) => (
                  <div
                    key={patient.patientId}
                    className="p-4 rounded-xl border border-alabaster-200 bg-alabaster-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                          {patient.avatarInitial}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-sm text-clinical-text">{patient.name}</div>
                          <div className="text-[11px] font-mono text-clinical-muted">#{patient.patientId}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        EHR Active
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-clinical-muted pt-2 border-t border-alabaster-200">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-blue-600" /> {patient.phone}
                        </span>
                        <span className="font-medium text-clinical-text">{patient.primaryProcedureCode}</span>
                      </div>
                      <div className="text-[11px] text-clinical-text">
                        Condition: <strong>{patient.primaryDiagnosis}</strong>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleTabClick('claims')}
                        className="w-full py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-800 border border-alabaster-300 text-xs font-medium transition cursor-pointer"
                      >
                        Prepare Claim for {patient.name.split(' ')[0]}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MEDICAL RECORDS TAB */}
          {currentTab === 'records' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Authorized Patient Medical Studies
                </h3>
                <p className="text-xs text-clinical-muted">
                  Diagnostic studies and reports anchored to hospital patients with active physician consent
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-alabaster-200 bg-alabaster-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {rec.category}
                      </span>
                      <span className="text-[11px] font-mono text-clinical-muted">{rec.date}</span>
                    </div>
                    <div>
                      <div className="font-serif font-bold text-sm text-clinical-text">{rec.title}</div>
                      <div className="text-xs text-clinical-muted">{rec.patientName || "Sarah Chen"} · {rec.hospitalName}</div>
                    </div>
                    <div className="text-[11px] font-mono text-clinical-muted truncate">
                      Commitment: {rec.recordCommitmentHash.slice(0, 16)}...
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-alabaster-200 text-xs text-clinical-text">
                      {rec.clinicalNotes || "Diagnostic imaging scan stored in sovereign IPFS vault."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SUBMIT CLAIMS & 5. ZKP GENERATOR (Uses Preserved Live HospitalView) */}
          {(currentTab === 'claims' || currentTab === 'zkp') && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-700 shrink-0" />
                  <span>
                    <strong>Circom Groth16 Prover:</strong> Computes 21,490 R1CS constraints in client browser to prove valid claim amount without leaking diagnosis.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-200 px-2 py-0.5 rounded text-blue-950">
                  BN254 CURVE
                </span>
              </div>

              <HospitalView
                policy={policy}
                patientProfile={patientProfile}
                onClaimSubmitted={onClaimSubmitted}
                onTestReplayAttack={onTestReplayAttack}
                onTestUnaccreditedHospital={onTestUnaccreditedHospital}
                onTestLimitExceeded={onTestLimitExceeded}
                isProcessing={isProcessing}
                terminologyMode={terminologyMode}
                onSelectRole={onSelectRole}
              />
            </div>
          )}

          {/* 6. CLAIM HISTORY TAB */}
          {currentTab === 'history' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Complete Hospital Claims Ledger ({claims.length})
                </h3>
                <p className="text-xs text-clinical-muted">
                  Historical record of all zero-knowledge reimbursement submissions and smart contract transactions
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-alabaster-200 text-clinical-muted uppercase tracking-wider font-semibold font-sans">
                      <th className="py-2.5 px-3">Claim ID / Date</th>
                      <th className="py-2.5 px-3">Procedure</th>
                      <th className="py-2.5 px-3">Claim Amount</th>
                      <th className="py-2.5 px-3">Nullifier</th>
                      <th className="py-2.5 px-3">ZK Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-alabaster-200 font-mono">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-alabaster-50 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-clinical-text">{claim.id}</div>
                          <div className="text-[10px] text-clinical-muted">{claim.createdAt}</div>
                        </td>
                        <td className="py-3 px-3 font-sans text-clinical-text">
                          {claim.privateInputsSummary?.hiddenProcedure || "Brain Contrast Neuro-MRI"}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-800">
                          ${claim.payoutAmount.toLocaleString()} USDC
                        </td>
                        <td className="py-3 px-3 text-clinical-muted truncate max-w-[140px]">
                          {claim.publicInputs.claimNullifier.slice(0, 10)}...{claim.publicInputs.claimNullifier.slice(-4)}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {claim.status === 'PAYOUT_SETTLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Paid on-chain
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                              <Cpu className="h-3 w-3" /> Groth16 Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. SETTINGS TAB */}
          {currentTab === 'settings' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Hospital Provider Configuration
                </h3>
                <p className="text-clinical-muted">
                  Cryptographic parameters and smart contract network registry
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                  <span className="font-semibold text-clinical-text block font-sans">Provider Credentials</span>
                  <div>
                    <span className="text-clinical-muted">Facility:</span>
                    <p className="font-bold text-clinical-text">{hospital.name}</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">State Medical License:</span>
                    <p className="font-mono text-clinical-text">{hospital.licenseNumber}</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">Provider Wallet Address:</span>
                    <p className="font-mono text-clinical-text break-all">{hospital.walletAddress}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                  <span className="font-semibold text-clinical-text block font-sans">Merkle Tree Accreditation</span>
                  <div>
                    <span className="text-clinical-muted">Poseidon Leaf Index:</span>
                    <p className="font-bold text-blue-800 font-mono">Leaf #{hospital.leafIndex}</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">Leaf Hash:</span>
                    <p className="font-mono text-clinical-text truncate">{hospital.leafHash}</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">Merkle Siblings (Proof Path):</span>
                    <p className="font-mono text-[10px] text-clinical-muted truncate">{hospital.merkleProof.join(' · ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
