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
  FileText
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
  auditLogs,
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

  const patientName = patientProfile?.name || policy.patientName;
  const activeDoctorsCount = records.reduce((acc, r) => acc + r.authorizedDoctors.filter(d => d.isActive).length, 0);

  const sidebarItems: { id: PatientTab; label: string; icon: React.ElementType; badge?: number }[] = [
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
              EHR Record #{patientProfile?.patientId || "PT-880129"} · Policy #{policy.policyNumber}
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

      {/* Main Grid: Sidebar + Preserved Patient View */}
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
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
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

        {/* Right Content Area: Preserves the entire existing Patient View */}
        <div className="lg:col-span-3 space-y-6">
          <PatientView
            records={records}
            policy={policy}
            patientProfile={patientProfile}
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
      </div>
    </div>
  );
};
