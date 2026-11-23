import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Cpu,
  FileSpreadsheet,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  ClaimSubmission,
  InsurancePolicy,
  TerminologyMode,
  UserRole,
  AuditEvent
} from '../types';
import { InsurerView } from './InsurerView';

export type InsurerTab =
  | 'dashboard'
  | 'claims'
  | 'verification'
  | 'policies'
  | 'fraud-detection'
  | 'audit-logs'
  | 'analytics'
  | 'settings';

interface InsurerPortalViewProps {
  claims: ClaimSubmission[];
  policy: InsurancePolicy;
  onSettleClaim: (claimId: string) => void;
  onBatchSettleClaims?: () => void;
  onTestReplayAttack?: () => void;
  isProcessing: boolean;
  terminologyMode?: TerminologyMode;
  onSelectRole?: (role: UserRole) => void;
  auditLogs?: AuditEvent[];
  onExitPortal: () => void;
  activeTab?: InsurerTab;
  onTabChange?: (tab: InsurerTab) => void;
}

export const InsurerPortalView: React.FC<InsurerPortalViewProps> = ({
  claims,
  policy,
  onSettleClaim,
  onBatchSettleClaims,
  onTestReplayAttack,
  isProcessing,
  terminologyMode = 'plain',
  onSelectRole,
  auditLogs = [],
  onExitPortal,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<InsurerTab>('dashboard');
  const currentTab = controlledTab || internalTab;

  const handleTabClick = (tab: InsurerTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Metrics
  const totalClaimsReceived = claims.length;
  const verifiedClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;
  const settledClaimsCount = claims.filter(c => c.status === 'PAYOUT_SETTLED').length;
  const rejectedClaimsCount = claims.filter(c => c.status === 'REJECTED_REPLAY' || c.status === 'REJECTED_INVALID_PROOF').length;
  const totalSettledUsdc = claims
    .filter(c => c.status === 'PAYOUT_SETTLED')
    .reduce((sum, c) => sum + c.payoutAmount, 0);

  const sidebarItems: { id: InsurerTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'claims', label: 'All Claims', icon: FileCheck2, badge: claims.length },
    { id: 'verification', label: 'Proof Verification', icon: Cpu, badge: verifiedClaimsCount },
    { id: 'policies', label: 'Policy Management', icon: FileSpreadsheet },
    { id: 'fraud-detection', label: 'Fraud Detection', icon: ShieldAlert, badge: rejectedClaimsCount > 0 ? rejectedClaimsCount : undefined },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardList, badge: auditLogs.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Portal Banner with Subtle Purple Accent */}
      <div className="bg-white border border-purple-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>

        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Insurance Portal
              </span>
              <span className="text-xs font-medium text-clinical-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                Underwriting & Settlement Escrow Active
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-clinical-text">
              {policy.insurerName}
            </h2>
            <p className="text-[11px] text-clinical-muted font-mono">
              Policy Pool: ${policy.remainingCoverage.toLocaleString()} / ${policy.maxCoverageLimit.toLocaleString()} USDC · EVM Contract: ZKPInsuranceSettlement.sol
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
        {/* Left Insurer Sidebar Navigation */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-3 shadow-sm lg:sticky lg:top-24 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-clinical-muted">
            Insurer Navigation
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
                    ? 'bg-purple-700 text-white font-semibold shadow-xs'
                    : 'text-clinical-text hover:bg-purple-50/70 hover:text-purple-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-purple-700'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Batch Settle Action */}
          {verifiedClaimsCount > 0 && onBatchSettleClaims && (
            <div className="pt-3 border-t border-alabaster-200 mt-2">
              <button
                onClick={onBatchSettleClaims}
                disabled={isProcessing}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-purple-700 fill-purple-700" />
                <span>Batch Settle ({verifiedClaimsCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Content Area for Selected Tab */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. DASHBOARD TAB */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Total Claims</span>
                    <FileCheck2 className="h-4 w-4 text-purple-700" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-clinical-text">
                    {totalClaimsReceived}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Received from providers</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Pending Claims</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700">
                    {verifiedClaimsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Awaiting payout release</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Settled Claims</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    {settledClaimsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">${totalSettledUsdc.toLocaleString()} USDC paid</p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Replays Blocked</span>
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-700">
                    {rejectedClaimsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">Prevented double-spends</p>
                </div>
              </div>

              {/* Zero-Knowledge Privacy Standard Highlight */}
              <div className="bg-gradient-to-r from-purple-50/80 to-fuchsia-50/80 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-purple-950 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-700" />
                    HIPAA Tier 4 Zero-Knowledge Claim Settlement
                  </h3>
                  <p className="text-xs text-purple-900/80">
                    As an insurer, you verify the BN254 elliptic curve pairing and hospital Merkle accreditation on-chain. Sensitive diagnosis codes, clinical notes, and prescriptions remain strictly blinded.
                  </p>
                </div>
                <button
                  onClick={() => handleTabClick('verification')}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Inspect ZK Proofs</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Embedded All Claims Ledger */}
              <InsurerView
                claims={claims}
                policy={policy}
                onSettleClaim={onSettleClaim}
                onBatchSettleClaims={onBatchSettleClaims}
                onTestReplayAttack={onTestReplayAttack}
                isProcessing={isProcessing}
                terminologyMode={terminologyMode}
                onSelectRole={onSelectRole}
              />
            </div>
          )}

          {/* 2. ALL CLAIMS TAB */}
          {currentTab === 'claims' && (
            <div className="space-y-4">
              <InsurerView
                claims={claims}
                policy={policy}
                onSettleClaim={onSettleClaim}
                onBatchSettleClaims={onBatchSettleClaims}
                onTestReplayAttack={onTestReplayAttack}
                isProcessing={isProcessing}
                terminologyMode={terminologyMode}
                onSelectRole={onSelectRole}
              />
            </div>
          )}

          {/* 3. PROOF VERIFICATION TAB */}
          {currentTab === 'verification' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-700" />
                  Groth16 SNARK Pairing Verification Engine
                </h3>
                <p className="text-clinical-muted">
                  Cryptographic verification parameters on the BN254 (alt_bn128) pairing curve
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1.5">
                  <span className="font-semibold text-clinical-text block font-sans">Curve & Constraints</span>
                  <div className="font-mono text-purple-800 font-bold text-sm">BN254 (alt_bn128)</div>
                  <p className="text-[11px] text-clinical-muted">21,490 R1CS non-linear constraints</p>
                </div>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1.5">
                  <span className="font-semibold text-clinical-text block font-sans">EVM Gas Cost</span>
                  <div className="font-mono text-emerald-700 font-bold text-sm">~198,000 Gas</div>
                  <p className="text-[11px] text-clinical-muted">Native pairing precompile (0x08)</p>
                </div>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1.5">
                  <span className="font-semibold text-clinical-text block font-sans">Data Leakage Rating</span>
                  <div className="font-mono text-purple-800 font-bold text-sm">0.00% (Zero Leakage)</div>
                  <p className="text-[11px] text-clinical-muted">HIPAA Tier 4 Zero-Exposure Guarantee</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-serif font-bold text-sm text-clinical-text">
                  Verified Public Signal Map
                </h4>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[0] approvedHospitalRoot:</span>
                    <span className="text-purple-800 font-bold">Poseidon Merkle Root (Accredited Providers)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[1] policyCommitment:</span>
                    <span className="text-clinical-text font-bold">Active Policy Hash Commitment</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[2] claimAmount:</span>
                    <span className="text-emerald-700 font-bold">Requested Reimbursement (USDC)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[3] claimDate:</span>
                    <span className="text-clinical-text font-bold">Treatment Date Unix Timestamp</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-clinical-muted">[4] claimNullifier:</span>
                    <span className="text-purple-800 font-bold">Single-Use Replay Protection Hash</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. POLICY MANAGEMENT TAB */}
          {currentTab === 'policies' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Underwritten Policy Portfolio
                </h3>
                <p className="text-clinical-muted">
                  Active policy commitments, remaining reserves, and covered procedure schedules
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-purple-900 font-bold">Active Policy Master Record</div>
                    <div className="font-serif font-bold text-base text-clinical-text">{policy.policyNumber}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active & Funded
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-purple-200/60 font-mono">
                  <div>
                    <span className="text-clinical-muted block font-sans text-[11px]">Beneficiary</span>
                    <strong className="text-clinical-text">{policy.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-clinical-muted block font-sans text-[11px]">Max Limit</span>
                    <strong className="text-clinical-text">${policy.maxCoverageLimit.toLocaleString()} USDC</strong>
                  </div>
                  <div>
                    <span className="text-clinical-muted block font-sans text-[11px]">Remaining</span>
                    <strong className="text-purple-800">${policy.remainingCoverage.toLocaleString()} USDC</strong>
                  </div>
                  <div>
                    <span className="text-clinical-muted block font-sans text-[11px]">Valid Until</span>
                    <strong className="text-clinical-text">{policy.validUntil}</strong>
                  </div>
                </div>
              </div>

              {/* Covered CPT Procedures Table */}
              <div className="space-y-2 pt-2">
                <h4 className="font-serif font-bold text-sm text-clinical-text">
                  Covered Procedure Fee Schedule (Circom Allowed Array)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-alabaster-200 text-clinical-muted uppercase font-semibold">
                        <th className="py-2 px-3">CPT Code</th>
                        <th className="py-2 px-3">Procedure Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Max Payout Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-alabaster-200 font-mono">
                      {policy.coveredProcedures.map((proc) => (
                        <tr key={proc.code} className="hover:bg-alabaster-50">
                          <td className="py-2 px-3 font-bold text-purple-900">{proc.code}</td>
                          <td className="py-2 px-3 font-sans text-clinical-text">{proc.name}</td>
                          <td className="py-2 px-3 font-sans text-clinical-muted">{proc.category}</td>
                          <td className="py-2 px-3 text-right font-bold text-clinical-text">
                            ${proc.maxCoveredAmount.toLocaleString()} USDC
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. FRAUD DETECTION TAB */}
          {currentTab === 'fraud-detection' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Anti-Fraud & Replay Protection Engine
                </h3>
                <p className="text-clinical-muted">
                  Cryptographic nullifiers preventing double-spending and tampered proofs
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 font-sans block text-sm">
                    Replay Attack Protection
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    When a claim settles, its unique Poseidon nullifier is stored permanently on <code>ZKPInsuranceSettlement.sol</code>. Any re-submission automatically reverts with <code>ClaimAlreadyNullified()</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <span className="font-bold text-rose-900 font-sans block text-sm">
                    Tampered Proof Forgery Prevention
                  </span>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    If an attacker alters curve point <code>pi_a</code> or changes the dollar payout, the BN254 bilinear pairing equality check evaluates to false and EVM reverts with <code>InvalidProof()</code>.
                  </p>
                </div>
              </div>

              {/* Registered Nullifiers */}
              <div className="space-y-2 pt-2">
                <h4 className="font-serif font-bold text-sm text-clinical-text">
                  Spent Claim Nullifier Registry (On-Chain State)
                </h4>
                <div className="p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 font-mono text-[11px] space-y-1.5">
                  {claims.map((c) => (
                    <div key={c.id} className="flex justify-between py-1 border-b border-alabaster-200 last:border-0">
                      <span className="text-clinical-muted">Claim #{c.id}</span>
                      <span className="text-purple-900 font-bold truncate max-w-[280px]">
                        {c.publicInputs.claimNullifier}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                        SPENT
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. AUDIT LOGS TAB */}
          {currentTab === 'audit-logs' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Smart Contract Audit Trail ({auditLogs.length})
                </h3>
                <p className="text-clinical-muted">
                  Immutable ledger of on-chain verification and escrow disbursements
                </p>
              </div>

              <div className="space-y-2 font-mono">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-clinical-text font-sans">{log.action}</span>
                        <span className="text-[10px] text-clinical-muted">{log.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-clinical-muted font-sans mt-0.5">{log.details}</div>
                    </div>
                    {log.txHash && (
                      <span className="text-[10px] text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
                        {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. ANALYTICS TAB */}
          {currentTab === 'analytics' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Claims Settlement Performance & Analytics
                </h3>
                <p className="text-clinical-muted">
                  Operational throughput and zero-knowledge latency benchmarks
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1">
                  <span className="text-clinical-muted text-[11px]">Avg ZK Proving Time</span>
                  <div className="text-xl font-bold font-mono text-clinical-text">418 ms</div>
                  <p className="text-[10px] text-clinical-muted">Client-side SnarkJS</p>
                </div>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1">
                  <span className="text-clinical-muted text-[11px]">Settlement Latency</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">&lt; 1 Second</div>
                  <p className="text-[10px] text-clinical-muted">vs 30 days traditional</p>
                </div>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1">
                  <span className="text-clinical-muted text-[11px]">Fraud Detection Rate</span>
                  <div className="text-xl font-bold font-mono text-purple-800">100.0%</div>
                  <p className="text-[11px] text-clinical-muted">Deterministic nullifiers</p>
                </div>
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-1">
                  <span className="text-clinical-muted text-[11px]">Diagnosis Leaks</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">0 Leaks</div>
                  <p className="text-[10px] text-clinical-muted">Zero-knowledge proof</p>
                </div>
              </div>
            </div>
          )}

          {/* 8. SETTINGS TAB */}
          {currentTab === 'settings' && (
            <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm text-xs">
              <div className="border-b border-alabaster-200 pb-3">
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  Insurer Escrow & Contract Parameters
                </h3>
                <p className="text-clinical-muted">
                  Smart contract deployment addresses and automated disbursement thresholds
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                  <span className="font-semibold text-clinical-text block font-sans">Underwriting Entity</span>
                  <div>
                    <span className="text-clinical-muted">Institution:</span>
                    <p className="font-bold text-clinical-text">{policy.insurerName}</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">Settlement Contract:</span>
                    <p className="font-mono text-clinical-text">ZKPInsuranceSettlement.sol</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                  <span className="font-semibold text-clinical-text block font-sans">Autonomous Engine Rule</span>
                  <div>
                    <span className="text-clinical-muted">Auto-Approval Ceiling:</span>
                    <p className="font-bold text-purple-900 font-mono">$3,000 USDC per claim</p>
                  </div>
                  <div>
                    <span className="text-clinical-muted">Multi-Claim Batching:</span>
                    <p className="font-medium text-clinical-text">Enabled (Single on-chain TX batch)</p>
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
