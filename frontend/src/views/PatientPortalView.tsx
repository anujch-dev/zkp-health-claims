import React, { useState } from 'react';
import {
  LayoutDashboard,
  Shield,
  UserCheck,
  ClipboardList,
  Settings,
  LogOut,
  User,
  Lock,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  UserPlus
} from 'lucide-react';
import {
  HealthRecord,
  InsurancePolicy,
  AuditEvent,
  TerminologyMode,
  UserRole,
  PatientProfile
} from '../types';
import { PatientView } from './PatientView';
import {
  PRESET_PATIENTS,
  PresetPatientProfile,
  CLINICIAN_DIRECTORY
} from '../fixtures/mockData';

export type PatientTab =
  | 'dashboard'
  | 'records'
  | 'access'
  | 'policy'
  | 'audit'
  | 'settings';

interface PatientPortalViewProps {
  records: HealthRecord[];
  policy: InsurancePolicy;
  patientProfile?: PatientProfile;
  onUpdatePatientProfile?: (profile: PatientProfile) => void;
  auditLogs?: AuditEvent[];
  onGrantAccess: (recordId: string, doctorAddress: string, doctorName: string, specialty: string, role?: string) => void;
  onRevokeAccess: (recordId: string, doctorAddress: string) => void;
  onAddRecord?: (newRecord: HealthRecord) => void;
  onLogRecordView?: (recordId: string, viewer: string) => void;
  onBreakGlassAccess?: (recordId: string, reason: string, responderName: string, responderAddress: string) => void;
  terminologyMode?: TerminologyMode;
  onSelectRole?: (role: UserRole) => void;
  onExitPortal: () => void;
  activeTab?: PatientTab;
  onTabChange?: (tab: PatientTab) => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  records,
  policy,
  patientProfile,
  onUpdatePatientProfile,
  auditLogs = [],
  onGrantAccess,
  onRevokeAccess,
  onAddRecord,
  onLogRecordView,
  onBreakGlassAccess,
  terminologyMode = 'plain',
  onSelectRole,
  onExitPortal,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<PatientTab>('dashboard');
  const currentTab = controlledTab || internalTab;

  const handleTabClick = (tab: PatientTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const currentProfile: PatientProfile = patientProfile || PRESET_PATIENTS[0];
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [accessSearch, setAccessSearch] = useState('');

  const patientName = currentProfile.name || policy.patientName;
  const activeDoctorsCount = records.reduce(
    (acc, r) => acc + r.authorizedDoctors.filter((d) => d.isActive).length,
    0
  );
  const coveragePercent = Math.round(
    (policy.remainingCoverage / policy.maxCoverageLimit) * 100
  );

  const sidebarItems: {
    id: PatientTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'My Health Vault', icon: LayoutDashboard },
    { id: 'records', label: 'Encrypted Records', icon: FileText, badge: records.length },
    { id: 'access', label: 'Care Team Access', icon: UserCheck, badge: activeDoctorsCount },
    { id: 'policy', label: 'Insurance Policy', icon: Shield },
    { id: 'audit', label: 'Audit Trail', icon: ClipboardList, badge: auditLogs?.length },
    { id: 'settings', label: 'Security & Keys', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Portal Banner with Subtle Green Accent */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-500"></div>

        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Patient Portal
              </span>
              <span className="text-xs font-medium text-clinical-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Sovereign Health Vault Active
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-clinical-text">
              {patientName}
            </h2>
            <p className="text-[11px] text-clinical-muted font-mono">
              EHR Record #{currentProfile.patientId} · Policy #{policy.policyNumber}
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

      {/* Main Grid: Sidebar + Dynamic Role Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Patient Sidebar Navigation */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-3 shadow-sm lg:sticky lg:top-24 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-clinical-muted">
            Patient Navigation
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
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-clinical-text hover:bg-emerald-50/70 hover:text-emerald-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-emerald-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-emerald-900 text-emerald-100'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="p-3 mt-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 space-y-1">
            <span className="font-semibold block flex items-center gap-1 font-sans text-xs">
              <Lock className="h-3.5 w-3.5 text-emerald-700" /> Client-Side Encryption
            </span>
            <p className="text-[10px] text-emerald-800 leading-relaxed">
              Files are AES-256-GCM encrypted in your browser. Raw medical notes are never stored in plaintext on-chain.
            </p>
          </div>
        </div>

        {/* Right Content Area for Selected Patient Tab */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. DASHBOARD TAB (My Health Vault Overview) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Active Patient</span>
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold font-serif text-clinical-text truncate">
                    {patientName}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-mono">
                    #{currentProfile.patientId}
                  </p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Encrypted Records</span>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-clinical-text">
                    {records.length}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">
                    AES-256-GCM protected
                  </p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Care Team Access</span>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    {activeDoctorsCount}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">
                    Authorized doctors
                  </p>
                </div>

                <div className="bg-white border border-alabaster-300 rounded-2xl p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-clinical-muted text-xs">
                    <span>Policy Remaining</span>
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    ${policy.remainingCoverage.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-clinical-muted font-sans">
                    {coveragePercent}% reserve remaining
                  </p>
                </div>
              </div>

              {/* Quick Actions Navigation Strip */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-2 text-xs text-emerald-950">
                  <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Sovereign Patient Custody:</strong> Only you control which doctors can decrypt your records.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTabClick('records')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                  >
                    <span>View Records Vault</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleTabClick('access')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-alabaster-100 text-emerald-900 border border-emerald-300 text-xs font-medium transition cursor-pointer"
                  >
                    Manage Care Team
                  </button>
                </div>
              </div>

              {/* Patient Identity Switcher Card */}
              <div className="bg-white border border-alabaster-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-sm font-serif font-bold text-clinical-text">
                      Active Sovereign Identity Profile
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsProfileDrawerOpen(!isProfileDrawerOpen)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isProfileDrawerOpen ? 'Hide Switcher' : 'Switch Patient'}</span>
                    {isProfileDrawerOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-alabaster-50 p-3 rounded-xl border border-alabaster-200">
                  <div>
                    <span className="text-clinical-muted block text-[10px] uppercase tracking-wider">
                      Full Name
                    </span>
                    <span className="font-semibold text-clinical-text">{currentProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-clinical-muted block text-[10px] uppercase tracking-wider">
                      Verified Phone
                    </span>
                    <span className="font-mono text-clinical-text">{currentProfile.phone}</span>
                  </div>
                  <div>
                    <span className="text-clinical-muted block text-[10px] uppercase tracking-wider">
                      EHR Record ID
                    </span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      #{currentProfile.patientId}
                    </span>
                  </div>
                </div>

                {isProfileDrawerOpen && (
                  <div className="pt-2 border-t border-alabaster-200 space-y-2">
                    <p className="text-[11px] text-clinical-muted">
                      Select a preset patient to simulate multi-identity EHR sync:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PRESET_PATIENTS.map((preset: PresetPatientProfile) => {
                        const isSelected = preset.patientId === currentProfile.patientId;
                        return (
                          <button
                            key={preset.patientId}
                            onClick={() => {
                              if (onUpdatePatientProfile) {
                                onUpdatePatientProfile(preset);
                              }
                              setIsProfileDrawerOpen(false);
                            }}
                            className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                                : 'bg-white hover:bg-alabaster-50 border-alabaster-300 text-clinical-text'
                            }`}
                          >
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-[10px] text-clinical-muted font-mono">
                              #{preset.patientId} · {preset.phone}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Coverage Reserve Progress Card */}
              <div className="bg-white border border-alabaster-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-sm font-serif font-bold text-clinical-text">
                      Cryptographic Coverage Commitment
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Policy #{policy.policyNumber}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-clinical-muted">Available Coverage Reserve</span>
                    <span className="font-mono font-bold text-clinical-text">
                      ${policy.remainingCoverage.toLocaleString()} / ${policy.maxCoverageLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-alabaster-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${coveragePercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-clinical-muted">
                    <span>Deductible: $500</span>
                    <span>Co-Pay: 10%</span>
                  </div>
                </div>
              </div>

              {/* Recent Encrypted Records Preview */}
              <div className="bg-white border border-alabaster-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-clinical-text">
                    Encrypted Diagnostic Records ({records.length})
                  </h3>
                  <button
                    onClick={() => handleTabClick('records')}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Open Records Vault</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="divide-y divide-alabaster-200">
                  {records.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-xs text-clinical-text">
                            {r.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            AES-256-GCM
                          </span>
                        </div>
                        <p className="text-[11px] text-clinical-muted">
                          Commitment: <span className="font-mono">{r.recordCommitmentHash.substring(0, 18)}...</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[11px] text-clinical-muted">
                          {r.authorizedDoctors.filter((d) => d.isActive).length} doctor(s) authorized
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ENCRYPTED RECORDS TAB (Full Interactive Sovereign Records Vault) */}
          {currentTab === 'records' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Client-Side Encrypted Storage:</strong> Records are encrypted with AES-256-GCM in your browser before uploading to IPFS. Only SHA-256 commitments reside on-chain.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 px-2 py-0.5 rounded text-emerald-950">
                  IPFS + SHA-256
                </span>
              </div>

              {/* Renders preserved complete live Records Vault with Add Record Modal */}
              <PatientView
                records={records}
                policy={policy}
                patientProfile={currentProfile}
                onUpdatePatientProfile={onUpdatePatientProfile}
                auditLogs={auditLogs}
                onGrantAccess={onGrantAccess}
                onRevokeAccess={onRevokeAccess}
                onAddRecord={onAddRecord}
                onLogRecordView={onLogRecordView}
                onBreakGlassAccess={onBreakGlassAccess}
                terminologyMode={terminologyMode}
                onSelectRole={onSelectRole}
              />
            </div>
          )}

          {/* 3. CARE TEAM ACCESS TAB */}
          {currentTab === 'access' && (
            <div className="space-y-6">
              <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-alabaster-200 pb-4">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-700" />
                      <span>Care Team Permissions & Access Grants</span>
                    </h3>
                    <p className="text-xs text-clinical-muted">
                      Manage which physicians hold decryption keys for your health records. Revoke access instantly on-chain.
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-clinical-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search clinicians..."
                      value={accessSearch}
                      onChange={(e) => setAccessSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-alabaster-300 bg-alabaster-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-full sm:w-56"
                    />
                  </div>
                </div>

                {/* Active Authorized Doctors Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
                    Active Authorized Clinicians ({activeDoctorsCount})
                  </h4>

                  <div className="divide-y divide-alabaster-200 border border-alabaster-200 rounded-xl overflow-hidden bg-white">
                    {records.flatMap((r) =>
                      r.authorizedDoctors
                        .filter((d) => d.isActive)
                        .filter(
                          (d) =>
                            d.doctorName.toLowerCase().includes(accessSearch.toLowerCase()) ||
                            d.specialty.toLowerCase().includes(accessSearch.toLowerCase()) ||
                            r.title.toLowerCase().includes(accessSearch.toLowerCase())
                        )
                        .map((d) => (
                          <div
                            key={`${r.id}-${d.doctorAddress}`}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-alabaster-50 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-xs text-clinical-text">
                                  {d.doctorName}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {d.specialty}
                                </span>
                              </div>
                              <p className="text-[11px] text-clinical-muted">
                                Authorized Record: <span className="font-medium text-clinical-text">{r.title}</span> ({r.date})
                              </p>
                              <p className="text-[10px] font-mono text-clinical-muted">
                                Address: {d.doctorAddress}
                              </p>
                            </div>
                            <button
                              onClick={() => onRevokeAccess(r.id, d.doctorAddress)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium flex items-center space-x-1 transition self-start sm:self-auto cursor-pointer"
                              title="Revoke physician access commitment on-chain"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span>Revoke Access</span>
                            </button>
                          </div>
                        ))
                    )}

                    {activeDoctorsCount === 0 && (
                      <div className="p-8 text-center text-clinical-muted text-xs">
                        No physicians currently hold active decryption keys.
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinician Directory to Authorize New Doctors */}
                <div className="space-y-3 pt-4 border-t border-alabaster-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
                        Accredited Healthcare Directory
                      </h4>
                      <p className="text-[11px] text-clinical-muted">
                        Authorize accredited physicians to view your encrypted medical vault.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CLINICIAN_DIRECTORY.map((clinician) => (
                      <div
                        key={clinician.walletAddress}
                        className="p-3.5 rounded-xl border border-alabaster-300 bg-white space-y-2 hover:border-emerald-300 transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {clinician.name.split(' ')[1]?.[0] || 'D'}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-clinical-text">
                              {clinician.name}
                            </div>
                            <div className="text-[10px] text-clinical-muted">
                              {clinician.specialty}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-clinical-muted">
                          {clinician.hospital}
                        </p>
                        <button
                          onClick={() => {
                            if (records.length > 0) {
                              onGrantAccess(
                                records[0].id,
                                clinician.walletAddress,
                                clinician.name,
                                clinician.specialty,
                                clinician.title
                              );
                            }
                          }}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3 text-emerald-700" />
                          <span>Authorize for {records[0]?.title || 'Records'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. INSURANCE POLICY TAB */}
          {currentTab === 'policy' && (
            <div className="space-y-6">
              <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="border-b border-alabaster-200 pb-3">
                  <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-700" />
                    <span>Insurance Coverage & Verified Policy</span>
                  </h3>
                  <p className="text-xs text-clinical-muted">
                    Cryptographic commitment of your insurance policy parameters stored on-chain.
                  </p>
                </div>

                {/* Master Policy Card */}
                <div className="bg-alabaster-50 border border-alabaster-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-alabaster-200 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {policy.insurerName}
                      </span>
                      <h4 className="text-base font-bold text-clinical-text mt-1">
                        Policy #{policy.policyNumber}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                      VERIFIED ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-clinical-muted block text-[10px] uppercase">Annual Limit</span>
                      <span className="font-mono font-bold text-clinical-text text-sm">
                        ${policy.maxCoverageLimit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-clinical-muted block text-[10px] uppercase">Remaining</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        ${policy.remainingCoverage.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-clinical-muted block text-[10px] uppercase">Deductible</span>
                      <span className="font-mono font-bold text-clinical-text text-sm">
                        $500
                      </span>
                    </div>
                    <div>
                      <span className="text-clinical-muted block text-[10px] uppercase">Co-Pay</span>
                      <span className="font-mono font-bold text-clinical-text text-sm">
                        10%
                      </span>
                    </div>
                  </div>

                  {/* Visual Meter */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-clinical-muted">Coverage Utilization</span>
                      <span className="font-mono font-medium text-clinical-text">
                        ${(policy.maxCoverageLimit - policy.remainingCoverage).toLocaleString()} used ({100 - coveragePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-alabaster-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${coveragePercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Covered Procedures Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
                    Covered Procedures & Fee Schedule
                  </h4>
                  <div className="border border-alabaster-200 rounded-xl overflow-hidden divide-y divide-alabaster-200 text-xs">
                    <div className="bg-alabaster-100/70 p-3 font-semibold grid grid-cols-3 text-clinical-muted">
                      <span>CPT Code</span>
                      <span>Procedure Description</span>
                      <span className="text-right">Approved Rate</span>
                    </div>
                    {policy.coveredProcedures && policy.coveredProcedures.length > 0 ? (
                      policy.coveredProcedures.map((proc) => (
                        <div key={proc.code} className="p-3 grid grid-cols-3 hover:bg-alabaster-50">
                          <span className="font-mono font-semibold text-emerald-800">{proc.code}</span>
                          <span>{proc.name}</span>
                          <span className="font-mono font-bold text-right">${proc.maxCoveredAmount.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-3 grid grid-cols-3 hover:bg-alabaster-50">
                          <span className="font-mono font-semibold text-emerald-800">CPT-70553</span>
                          <span>Brain MRI with & without contrast</span>
                          <span className="font-mono font-bold text-right">$2,400</span>
                        </div>
                        <div className="p-3 grid grid-cols-3 hover:bg-alabaster-50">
                          <span className="font-mono font-semibold text-emerald-800">CPT-71250</span>
                          <span>Chest CT without contrast</span>
                          <span className="font-mono font-bold text-right">$1,200</span>
                        </div>
                        <div className="p-3 grid grid-cols-3 hover:bg-alabaster-50">
                          <span className="font-mono font-semibold text-emerald-800">CPT-99214</span>
                          <span>Level 4 Established Patient Office Visit</span>
                          <span className="font-mono font-bold text-right">$185</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. AUDIT TRAIL TAB */}
          {currentTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-alabaster-200 pb-3">
                  <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-emerald-700" />
                    <span>On-Chain Cryptographic Audit Trail ({auditLogs.length})</span>
                  </h3>
                  <p className="text-xs text-clinical-muted">
                    Tamper-evident logs of every access grant, revocation, record view, and emergency break-glass event.
                  </p>
                </div>

                <div className="divide-y divide-alabaster-200 border border-alabaster-200 rounded-xl overflow-hidden">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-alabaster-50 transition text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            log.action === 'DoctorAccessRevoked'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : log.action === 'DoctorAccessGranted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.action.includes('BreakGlass')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-mono text-clinical-muted text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-clinical-text font-medium">{log.details}</p>
                        <p className="text-[10px] font-mono text-clinical-muted">
                          Actor: {log.actorAddress} · Tx: {log.txHash ? `${log.txHash.substring(0, 20)}...` : '0x7f4a...e12b'}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
                        SEPOLIA VERIFIED
                      </span>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="p-8 text-center text-clinical-muted text-xs">
                      No audit events recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. SECURITY & KEYS TAB */}
          {currentTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
                <div className="border-b border-alabaster-200 pb-3">
                  <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
                    <Settings className="h-5 w-5 text-emerald-700" />
                    <span>Cryptographic Security & Smart Contracts</span>
                  </h3>
                  <p className="text-clinical-muted">
                    Technical parameters powering your zero-knowledge health record vault.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-alabaster-200 bg-alabaster-50 space-y-2">
                    <h4 className="font-bold text-clinical-text flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-700" />
                      Client-Side Web Crypto
                    </h4>
                    <ul className="space-y-1 text-clinical-muted text-[11px]">
                      <li>Cipher: <strong className="text-clinical-text">AES-256-GCM</strong></li>
                      <li>Key Derivation: <strong className="text-clinical-text">PBKDF2 / SHA-256 (100,000 iterations)</strong></li>
                      <li>Tag Length: <strong className="text-clinical-text">128-bit authentication tag</strong></li>
                      <li>IV: <strong className="text-clinical-text">96-bit cryptographically random</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-alabaster-200 bg-alabaster-50 space-y-2">
                    <h4 className="font-bold text-clinical-text flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                      Zero-Knowledge Circuit Specs
                    </h4>
                    <ul className="space-y-1 text-clinical-muted text-[11px]">
                      <li>Proving System: <strong className="text-clinical-text">Groth16 (BN254 curve)</strong></li>
                      <li>Constraint System: <strong className="text-clinical-text">Circom 2.1.6 (21,490 R1CS)</strong></li>
                      <li>Witness Generation: <strong className="text-clinical-text">Wasm (client browser execution)</strong></li>
                      <li>Gas on Verification: <strong className="text-clinical-text">~210,000 gas</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-alabaster-200 bg-white space-y-2">
                  <h4 className="font-bold text-clinical-text">Deployed Smart Contracts (Sepolia Testnet)</h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-alabaster-50 border border-alabaster-200">
                      <span className="text-clinical-muted">HealthAccessRegistry.sol</span>
                      <span className="text-emerald-800 font-bold">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-alabaster-50 border border-alabaster-200">
                      <span className="text-clinical-muted">ZkClaimSettlement.sol</span>
                      <span className="text-emerald-800 font-bold">0x1234567890123456789012345678901234567890</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-alabaster-50 border border-alabaster-200">
                      <span className="text-clinical-muted">Groth16Verifier.sol</span>
                      <span className="text-emerald-800 font-bold">0x0987654321098765432109876543210987654321</span>
                    </div>
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
