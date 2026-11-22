import React, { useState } from 'react';
import { Shield, Lock, Key, UserPlus, Trash2, CheckCircle2, Calendar, Hash, Plus, Eye, FileText, Sparkles, X } from 'lucide-react';
import { HealthRecord, InsurancePolicy, AuditEvent } from '../types';
import { computeHash } from '../lib/zkp';

interface PatientViewProps {
  records: HealthRecord[];
  policy: InsurancePolicy;
  auditLogs: AuditEvent[];
  onGrantAccess: (recordId: string, doctorAddress: string, doctorName: string, specialty: string) => void;
  onRevokeAccess: (recordId: string, doctorAddress: string) => void;
  onAddRecord?: (newRecord: HealthRecord) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  records,
  policy,
  auditLogs,
  onGrantAccess,
  onRevokeAccess,
  onAddRecord,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [newDoctorAddress, setNewDoctorAddress] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Add Record Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Diagnostic' | 'Surgical' | 'Prescription' | 'Lab Result'>('Diagnostic');
  const [newHospital, setNewHospital] = useState('Apex University Health Care');
  const [newDoctor, setNewDoctor] = useState('Dr. Sarah Lin, MD');
  const [newDoctorAddr, setNewDoctorAddr] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Decrypt Record Modal State
  const [decryptingRecord, setDecryptingRecord] = useState<HealthRecord | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleOpenGrantModal = (recordId: string) => {
    setSelectedRecordId(recordId);
    setNewDoctorAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    setNewDoctorName('Dr. Sarah Lin, MD');
    setNewSpecialty('Neurology');
    setShowGrantModal(true);
  };

  const handleSubmitGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordId && newDoctorAddress && newDoctorName) {
      onGrantAccess(selectedRecordId, newDoctorAddress, newDoctorName, newSpecialty || 'General Practitioner');
      setShowGrantModal(false);
      setNewDoctorAddress('');
      setNewDoctorName('');
      setNewSpecialty('');
    }
  };

  const handleOpenDecryptModal = (record: HealthRecord) => {
    setDecryptingRecord(record);
    setIsDecrypting(true);
    setDecryptedContent(null);

    // Simulate client-side AES-256 decryption with user private key
    setTimeout(() => {
      setIsDecrypting(false);
      if (record.id === 'rec-101') {
        setDecryptedContent(`PATIENT: Alice Vance (ID: #PAT-88129)
STUDY: Cranial Magnetic Resonance Imaging (MRI) with & without IV Gadolinium Contrast
FINDINGS:
- Ventricles and sulci are within normal limits for age.
- No acute intracranial hemorrhage, mass effect, or midline shift.
- Scattered focal areas of hyperintensity in the periventricular white matter on T2/FLAIR sequences, consistent with chronic microvascular ischemic changes or migraine etiology.
- No abnormal parenchymal or meningeal enhancement following contrast administration.
IMPRESSION: No acute intracranial abnormality. Stable white matter changes correlate with history of intractable migraine.`);
      } else if (record.id === 'rec-102') {
        setDecryptedContent(`PATIENT: Alice Vance (ID: #PAT-88129)
STUDY: 24-Hour Ambulatory Holter & Stress Telemetry
FINDINGS:
- Predominant sinus rhythm throughout with average heart rate 72 bpm (range 54 - 128 bpm).
- Rare isolated premature atrial contractions (PACs < 0.1%).
- No sustained supraventricular tachycardia or ventricular arrhythmias.
- No ischemic ST-T wave depressions exceeding 1.0 mm during peak exercise.
IMPRESSION: Normal 24-hour ambulatory cardiac rhythm profile. No evidence of malignant dysrhythmia.`);
      } else {
        setDecryptedContent(`PATIENT: Alice Vance (ID: #PAT-88129)
STUDY: ${record.title}
FACILITY: ${record.hospitalName}
DATE OF ENCOUNTER: ${record.date}
CLINICAL RECORD:
- Document AES-256 decrypted successfully with patient's sovereign private key.
- Verified off-chain IPFS payload against on-chain SHA-256 commitment: ${record.recordCommitmentHash}
- Doctor Authorized: ${record.doctorName} (${record.authorizedDoctors.filter(d => d.isActive).length > 0 ? 'Active Access' : 'Sovereign Read-Only'}`);
      }
    }, 600);
  };

  const handleCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fakeIpfsCid = "bafybei" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const commitmentHash = await computeHash([newTitle, newCategory, fakeIpfsCid, Date.now().toString()]);

    const newRecord: HealthRecord = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      hospitalName: newHospital,
      doctorName: newDoctor,
      doctorAddress: newDoctorAddr,
      ipfsCid: fakeIpfsCid,
      recordCommitmentHash: commitmentHash,
      isEncrypted: true,
      authorizedDoctors: [
        {
          doctorAddress: newDoctorAddr,
          doctorName: newDoctor,
          specialty: "Attending Physician",
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
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Patient Record Vault & Access Control</h2>
                <p className="text-xs text-slate-400">
                  Off-Chain Encrypted Records with On-Chain SHA-256 Commitments & Granular Doctor Delegations
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HIPAA Compliant Web3
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your medical diagnostic files, lab reports, and imaging are AES-256 encrypted and stored on decentralized storage (IPFS). Only cryptographic hash commitments are anchored on <code className="text-emerald-400">HealthAccessRegistry.sol</code>. You hold sovereign control to grant and revoke re-encryption keys to licensed physicians at any time.
          </p>
        </div>

        {/* Insurance Policy Card */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Active Policy</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              VERIFIED ACTIVE
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{policy.policyNumber}</h3>
            <p className="text-xs text-slate-400">{policy.insurerName}</p>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Remaining Coverage:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${policy.remainingCoverage.toLocaleString()} / ${policy.maxCoverageLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Valid Until:</span>
                <span className="font-mono text-slate-300">{policy.validUntil}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate" title={policy.policyCommitmentHash}>
                Commitment: {policy.policyCommitmentHash.slice(0, 16)}...{policy.policyCommitmentHash.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Encrypted Health Records List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" />
              Your Sovereign Encrypted Health Records ({records.length})
            </h3>
            <p className="text-xs text-slate-400">
              Anchored in <code className="text-indigo-300">HealthAccessRegistry.sol</code> · Doctor decryption keys strictly delegated
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Encrypted Record</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20">
                    {record.category}
                  </span>
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>AES-256 Encrypted</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{record.title}</h4>
                  <p className="text-xs text-slate-400">{record.hospitalName}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date:
                    </span>
                    <span className="text-slate-300">{record.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Hash className="h-3 w-3" /> IPFS CID:
                    </span>
                    <span className="text-indigo-400 truncate max-w-[140px]" title={record.ipfsCid}>
                      {record.ipfsCid.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">On-Chain Commitment:</span>
                    <span className="text-slate-400 truncate max-w-[140px]" title={record.recordCommitmentHash}>
                      {record.recordCommitmentHash.slice(0, 8)}...{record.recordCommitmentHash.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Authorized Doctors */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Authorized Doctors ({record.authorizedDoctors.filter(d => d.isActive).length}):
                  </span>
                  {record.authorizedDoctors.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No doctor permissions currently granted.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {record.authorizedDoctors.map((doc, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                            doc.isActive
                              ? 'bg-emerald-950/20 border border-emerald-500/20 text-slate-200'
                              : 'bg-slate-800/30 text-slate-500 border border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              <span>{doc.doctorName}</span>
                              {doc.isActive ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              ) : (
                                <span className="text-[10px] text-rose-400">(Revoked)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.doctorAddress.slice(0, 6)}...{doc.doctorAddress.slice(-4)}
                            </span>
                          </div>

                          {doc.isActive && (
                            <button
                              onClick={() => onRevokeAccess(record.id, doc.doctorAddress)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenDecryptModal(record)}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  title="Decrypt with Sovereign Private Key"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Decrypt File</span>
                </button>

                <button
                  onClick={() => handleOpenGrantModal(record.id)}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Delegate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Audit Logs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-emerald-400" />
          On-Chain Access Audit Trail (HealthAccessRegistry.sol)
        </h3>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-slate-400">{log.details}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {log.actorAddress.slice(0, 6)}...{log.actorAddress.slice(-4)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decrypt & View Modal */}
      {decryptingRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Decrypted Medical File: {decryptingRecord.title}
                </h3>
              </div>
              <button
                onClick={() => setDecryptingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isDecrypting ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-8 w-8 mx-auto border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-300">Decrypting AES-256 payload with sovereign patient key...</p>
                <p className="text-[11px] text-slate-500 font-mono">Fetching IPFS CID: {decryptingRecord.ipfsCid}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Integrity Verified against on-chain SHA-256 commitment
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">AES-GCM-256</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Clinical Findings & Impression:</span>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {decryptedContent}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div>IPFS Storage CID: <span className="text-indigo-400">{decryptingRecord.ipfsCid}</span></div>
                  <div>On-Chain Registry Hash: <span className="text-slate-300">{decryptingRecord.recordCommitmentHash}</span></div>
                  <div>Issuing Provider: <span className="text-slate-200">{decryptingRecord.hospitalName} ({decryptingRecord.doctorName})</span></div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDecryptingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Close Decrypted File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Anchor New Encrypted Record
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecord} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Record / Study Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Abdominal Contrast CT & Ultrasound"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Result">Lab Result</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Issuing Hospital
                  </label>
                  <select
                    value={newHospital}
                    onChange={(e) => setNewHospital(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Apex University Health Care">Apex University Health Care</option>
                    <option value="St. Jude Metropolitan Hospital">St. Jude Metropolitan Hospital</option>
                    <option value="Mayo Memorial Research Clinic">Mayo Memorial Research Clinic</option>
                    <option value="Stanford Biomedical Pavilion">Stanford Biomedical Pavilion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Physician Name & Address
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    value={newDoctorAddr}
                    onChange={(e) => setNewDoctorAddr(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Clinical Examination & Findings
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Notes are encrypted client-side before upload..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-emerald-400 block flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Client-Side Cryptographic Guarantee:
                </span>
                <p>
                  1. Content is AES-256 encrypted using your sovereign private key.
                </p>
                <p>
                  2. Encrypted blob uploaded to IPFS. Only the resulting SHA-256 hash is committed to <code className="text-emerald-300">HealthAccessRegistry.sol</code>.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                Delegate Doctor Access (On-Chain)
              </h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Doctor Name / Clinic
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Lin, MD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Doctor Ethereum Address
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorAddress}
                  onChange={(e) => setNewDoctorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="e.g. Neurology, Cardiology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                <Lock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  This writes a cryptographically signed permission record to <code className="text-indigo-300">grantDoctorAccess()</code> in the smart contract. The doctor can decrypt the patient's record for consultation.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
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
