import React, { useState } from 'react';
import { Shield, Lock, UserPlus, Trash2, CheckCircle2, Calendar, Hash, Plus, Sparkles, X, ArrowRight } from 'lucide-react';
import { HealthRecord, InsurancePolicy, AuditEvent, GranularRole, TerminologyMode, UserRole } from '../types';
import { encryptRecordWithAES } from '../lib/crypto';

interface PatientViewProps {
  records: HealthRecord[];
  policy: InsurancePolicy;
  auditLogs?: AuditEvent[];
  onGrantAccess: (recordId: string, doctorAddress: string, doctorName: string, specialty: string, role?: string) => void;
  onRevokeAccess: (recordId: string, doctorAddress: string) => void;
  onAddRecord?: (newRecord: HealthRecord) => void;
  onLogRecordView?: (recordId: string, viewer: string) => void;
  onBreakGlassAccess?: (recordId: string, reason: string, responderName: string, responderAddress: string) => void;
  terminologyMode?: TerminologyMode;
  onSelectRole?: (role: UserRole) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  records,
  policy,
  onGrantAccess,
  onRevokeAccess,
  onAddRecord,
  terminologyMode = 'plain',
  onSelectRole,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [newDoctorAddress, setNewDoctorAddress] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newRole, setNewRole] = useState<GranularRole>('Specialist');
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Add Record Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Diagnostic' | 'Surgical' | 'Prescription' | 'Lab Result'>('Diagnostic');
  const [newHospital, setNewHospital] = useState('Apex University Health Care');
  const [newDoctor, setNewDoctor] = useState('Dr. Sarah Lin, MD');
  const [newDoctorAddr, setNewDoctorAddr] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  const [diagnosisCode, setDiagnosisCode] = useState('G43.909');
  const [diagnosisDesc, setDiagnosisDesc] = useState('Intractable migraine with aura');
  const [clinicalNotes, setClinicalNotes] = useState('Intractable migraine with aura, non-responsive to NSAIDs. Scheduled contrast MRI.');
  const [prescriptions, setPrescriptions] = useState('Sumatriptan 100mg, Ondansetron 4mg');

  const handleOpenGrantModal = (recordId: string) => {
    setSelectedRecordId(recordId);
    setNewDoctorAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    setNewDoctorName('Dr. Sarah Lin, MD');
    setNewSpecialty('Neurology');
    setNewRole('Specialist');
    setShowGrantModal(true);
  };

  const handleSubmitGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordId && newDoctorAddress && newDoctorName) {
      onGrantAccess(selectedRecordId, newDoctorAddress, newDoctorName, newSpecialty || 'General Practitioner', newRole);
      setShowGrantModal(false);
      setNewDoctorAddress('');
      setNewDoctorName('');
      setNewSpecialty('');
    }
  };

  const handleCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fakeIpfsCid = "bafybei" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const plaintextPayload = `PATIENT: ${policy.patientName} (${policy.patientAddress})
RECORD: ${newTitle}
CATEGORY: ${newCategory}
HOSPITAL: ${newHospital}
PHYSICIAN: ${newDoctor} (${newDoctorAddr})
DIAGNOSIS: [ICD-10: ${diagnosisCode}] ${diagnosisDesc}
PRESCRIPTIONS: ${prescriptions}
CLINICAL NOTES: ${clinicalNotes}`;

    const encrypted = await encryptRecordWithAES(plaintextPayload);

    const newRecord: HealthRecord = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      hospitalName: newHospital,
      doctorName: newDoctor,
      doctorAddress: newDoctorAddr,
      ipfsCid: fakeIpfsCid,
      recordCommitmentHash: encrypted.commitmentHash,
      isEncrypted: true,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      clinicalNotes,
      diagnosisCode,
      diagnosisDesc,
      prescriptions: prescriptions.split(',').map(s => s.trim()),
      authorizedDoctors: [
        {
          doctorAddress: newDoctorAddr,
          doctorName: newDoctor,
          specialty: "Attending Physician",
          role: "Specialist",
          grantedAt: new Date().toISOString().split('T')[0],
          expiresAt: "2027-12-31",
          isActive: true
        }
      ]
    };

    if (onAddRecord) {
      onAddRecord(newRecord);
    }
    setShowAddModal(false);
    setNewTitle('');
    setClinicalNotes('');
  };

  return (
    <div className="space-y-8">
      {/* Header and Policy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-clinical-text">
                  Patient Record Vault & Access Control
                </h2>
                <p className="text-xs text-clinical-muted">
                  Client-side Web Crypto <code>AES-256-GCM</code> · On-chain SHA-256 commitments · Tamper-evident view logging
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-sage-100 text-sage-800 border border-sage-200">
              HIPAA Tier 4
            </span>
          </div>

          <p className="text-xs text-clinical-muted leading-relaxed">
            Your medical diagnostic files, lab reports, and imaging are AES-256-GCM encrypted and stored off-chain (IPFS). Only cryptographic hash commitments are anchored on <code className="text-sage-800 font-semibold">HealthAccessRegistry.sol</code>. All doctor views emit tamper-evident <code className="text-sage-800 font-semibold">RecordViewed</code> events on-chain. Emergency responders can trigger audit-logged break-glass access.
          </p>
        </div>

        {/* Insurance Policy Card */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-clinical-muted uppercase tracking-wider">
              Active Policy
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-mono font-medium border border-sage-200">
              VERIFIED ACTIVE
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-clinical-text">{policy.policyNumber}</h3>
            <p className="text-xs text-clinical-muted">{policy.insurerName}</p>

            <div className="pt-3 border-t border-alabaster-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-clinical-muted">Remaining Coverage:</span>
                <span className="font-mono font-bold text-sage-700">
                  ${policy.remainingCoverage.toLocaleString()} / ${policy.maxCoverageLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-clinical-muted">Valid Until:</span>
                <span className="font-mono text-clinical-text">{policy.validUntil}</span>
              </div>
              <div className="text-[10px] text-clinical-muted font-mono truncate" title={policy.policyCommitmentHash}>
                Commitment: {policy.policyCommitmentHash.slice(0, 16)}...{policy.policyCommitmentHash.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Step Journey Prompt */}
      {onSelectRole && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-sage-200 text-sage-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-sage-950">
                {terminologyMode === 'plain' ? 'Step 1 Complete: Health Records Encrypted' : 'Step 1 Complete: AES-256-GCM Records & Commitments Anchored'}
              </h4>
              <p className="text-xs text-sage-800">
                {terminologyMode === 'plain'
                  ? 'Your medical files are protected with bank-grade encryption off-chain. Ready to generate an insurance claim? Go to Hospital Prover.'
                  : 'SHA-256 commitments anchored on HealthAccessRegistry.sol. Ready to generate a Circom Groth16 claim proof at Hospital Prover.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectRole('hospital')}
            className="w-full sm:w-auto px-4 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm shrink-0"
          >
            <span>Next: Hospital Prover</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Encrypted Health Records List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
              <Lock className="h-5 w-5 text-sage-700" />
              Sovereign Encrypted Health Records ({records.length})
            </h3>
            <p className="text-xs text-clinical-muted">
              Anchored in <code className="text-sage-800">HealthAccessRegistry.sol</code> · Doctor decryption keys strictly delegated
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-medium text-xs shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Encrypted Record</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-alabaster-300 hover:border-sage-300 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-alabaster-100 text-clinical-text border border-alabaster-300">
                    {record.category}
                  </span>
                  <div className="flex items-center space-x-1 text-sage-700 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>AES-256-GCM</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-serif font-bold text-clinical-text">{record.title}</h4>
                  <p className="text-xs text-clinical-muted">{record.hospitalName}</p>
                </div>

                <div className="space-y-1.5 text-xs text-clinical-muted font-mono bg-alabaster-50 p-3 rounded-xl border border-alabaster-200">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-sans">
                      <Calendar className="h-3 w-3" /> Date:
                    </span>
                    <span className="text-clinical-text">{record.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-sans">
                      <Hash className="h-3 w-3" /> IPFS CID:
                    </span>
                    <span className="text-sage-700 truncate max-w-[140px]" title={record.ipfsCid}>
                      {record.ipfsCid.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans">Commitment:</span>
                    <span className="text-clinical-text truncate max-w-[140px]" title={record.recordCommitmentHash}>
                      {record.recordCommitmentHash.slice(0, 8)}...{record.recordCommitmentHash.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Authorized Doctors */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-clinical-text block">
                    Authorized Care Team ({record.authorizedDoctors.filter(d => d.isActive).length}):
                  </span>
                  {record.authorizedDoctors.length === 0 ? (
                    <p className="text-xs text-clinical-muted italic">No doctor permissions currently granted.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {record.authorizedDoctors.map((doc, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                            doc.isActive
                              ? 'bg-sage-50/70 border border-sage-200 text-clinical-text'
                              : 'bg-alabaster-100 text-clinical-muted border border-alabaster-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              <span>{doc.doctorName}</span>
                              {doc.role && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sage-100 text-sage-800 border border-sage-200 font-mono">
                                  {doc.role}
                                </span>
                              )}
                              {doc.isActive ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              ) : (
                                <span className="text-[10px] text-rose-600 font-medium">(Revoked)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-clinical-muted font-mono">
                              {doc.doctorAddress.slice(0, 6)}...{doc.doctorAddress.slice(-4)}
                            </span>
                          </div>

                          {doc.isActive && (
                            <button
                              onClick={() => onRevokeAccess(record.id, doc.doctorAddress)}
                              className="p-1 rounded text-clinical-muted hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Revoke Permission"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action: Manage Access */}
              <div className="pt-3 border-t border-alabaster-200">
                <button
                  onClick={() => handleOpenGrantModal(record.id)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 text-xs font-semibold transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Authorize Doctor Access</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-alabaster-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-alabaster-300 pb-3">
              <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sage-700" />
                Anchor New Encrypted Record (Web Crypto AES-256-GCM)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-clinical-muted hover:text-clinical-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-clinical-text mb-1">
                  Record / Study Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Abdominal Contrast CT & Ultrasound"
                  className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-clinical-text mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  >
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Result">Lab Result</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-clinical-text mb-1">
                    Issuing Hospital
                  </label>
                  <select
                    value={newHospital}
                    onChange={(e) => setNewHospital(e.target.value)}
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  >
                    <option value="Apex University Health Care">Apex University Health Care</option>
                    <option value="St. Jude Metropolitan Hospital">St. Jude Metropolitan Hospital</option>
                    <option value="Mayo Memorial Research Clinic">Mayo Memorial Research Clinic</option>
                    <option value="Stanford Biomedical Pavilion">Stanford Biomedical Pavilion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-clinical-text mb-1">
                  Physician Name & Address
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={newDoctorAddr}
                    onChange={(e) => setNewDoctorAddr(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs font-mono text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-clinical-text mb-1">
                    ICD-10 Code
                  </label>
                  <input
                    type="text"
                    value={diagnosisCode}
                    onChange={(e) => setDiagnosisCode(e.target.value)}
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-1.5 text-xs font-mono text-clinical-text focus:border-sage-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-clinical-text mb-1">
                    Diagnosis Name
                  </label>
                  <input
                    type="text"
                    value={diagnosisDesc}
                    onChange={(e) => setDiagnosisDesc(e.target.value)}
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-1.5 text-xs text-clinical-text focus:border-sage-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-clinical-text mb-1">
                  Prescriptions
                </label>
                <input
                  type="text"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-1.5 text-xs text-clinical-text focus:border-sage-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-clinical-text mb-1">
                  Clinical Examination & Findings
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Notes are encrypted client-side with AES-256-GCM before upload..."
                  className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-sage-50 border border-sage-200 rounded-xl text-[11px] text-clinical-muted space-y-1">
                <span className="font-semibold text-sage-800 block flex items-center gap-1 font-sans">
                  <Lock className="h-3 w-3" /> Client-Side Cryptographic Guarantee:
                </span>
                <p>
                  1. Encrypted using native Web Crypto <code>AES-256-GCM</code> with unique random IV.
                </p>
                <p>
                  2. Only the resulting SHA-256 hash commitment is anchored to <code className="text-sage-800 font-bold">HealthAccessRegistry.sol</code>.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-clinical-muted hover:text-clinical-text hover:bg-alabaster-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sage-700 hover:bg-sage-600 text-white shadow-sm transition"
                >
                  Encrypt & Anchor On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-alabaster-300 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-alabaster-300 pb-3">
              <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-sage-700" />
                Delegate Care Team Access (Role-Based On-Chain)
              </h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-clinical-muted hover:text-clinical-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Doctor / Clinician Name
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Lin, MD"
                  className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Clinician Ethereum Address
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorAddress}
                  onChange={(e) => setNewDoctorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs font-mono text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-clinical-text mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="e.g. Neurology"
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-clinical-text mb-1">
                    Granular Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as GranularRole)}
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
                  >
                    <option value="Doctor">Doctor (Attending)</option>
                    <option value="Specialist">Specialist / Consultant</option>
                    <option value="EmergencyResponder">Emergency Responder</option>
                    <option value="Auditor">Compliance Auditor</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-sage-50 border border-sage-200 rounded-xl text-[11px] text-clinical-muted flex items-start gap-2">
                <Lock className="h-4 w-4 text-sage-700 shrink-0 mt-0.5" />
                <span>
                  This writes a cryptographically signed permission record to <code className="text-sage-800 font-bold">grantAccessWithRole()</code> in <code className="text-sage-800 font-bold">HealthAccessRegistry.sol</code> with role <strong>{newRole}</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-clinical-muted hover:text-clinical-text hover:bg-alabaster-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sage-700 hover:bg-sage-600 text-white shadow-sm transition"
                >
                  Confirm & Sign On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};