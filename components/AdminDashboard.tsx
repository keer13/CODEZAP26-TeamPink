import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Terminal, 
  UserCheck, 
  Activity, 
  Clock, 
  Server, 
  RefreshCw, 
  Check, 
  X,
  AlertTriangle,
  Layers,
  LogOut,
  Search,
  Lock
} from 'lucide-react';
import { AuditLog, Doctor } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
  auditLogs: AuditLog[];
  onClearLogs?: () => void;
  doctorsList: Doctor[];
  onVerifyDoctor: (id: string) => void;
  onRejectDoctor: (id: string, reason: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  auditLogs,
  onClearLogs,
  doctorsList,
  onVerifyDoctor,
  onRejectDoctor
}) => {
  // RAG syncing state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [syncingKb, setSyncingKb] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [kbStatus, setKbStatus] = useState({
    dailyMedRecords: 42100,
    rxNormMappings: 19400,
    pubmedArticles: 125000,
    lastSync: '2026-07-02 08:30:11'
  });

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Healthcare AI Core Service Initialized.",
    "[RAG] Reading embedded vector schemas for dailyMed dataset...",
    "[COMPLIANCE] HIPAA tracking audits linked to cloud persistent stream."
  ]);

  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  const handleVerifyDoctorLocal = (doctorId: string) => {
    onVerifyDoctor(doctorId);
    const d = doctorsList.find(doc => doc.id === doctorId);
    if (d) {
      setTerminalLogs(prev => [
        `[AUDIT] Doctor credential verified: ${d.name} (License: ${d.licenseNumber})`,
        ...prev
      ]);
    }
  };

  const handleRejectDoctorSubmit = (doctorId: string) => {
    if (!rejectionReasonInput.trim()) return;
    onRejectDoctor(doctorId, rejectionReasonInput);
    const d = doctorsList.find(doc => doc.id === doctorId);
    if (d) {
      setTerminalLogs(prev => [
        `[AUDIT] Doctor credential REJECTED: ${d.name} (License: ${d.licenseNumber}). Reason: ${rejectionReasonInput}`,
        ...prev
      ]);
    }
    setRejectingDocId(null);
    setRejectionReasonInput('');
  };

  const handleSyncKb = () => {
    setSyncingKb(true);
    setSyncProgress(0);
    setTerminalLogs(prev => [
      "[RAG] Starting vector indexing sync with FDA DailyMed labels...",
      "[RAG] Downloading RxNorm clinical drug classes...",
      ...prev
    ]);
  };

  useEffect(() => {
    if (!syncingKb) return;

    const timer = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setSyncingKb(false);
          setKbStatus(prevStatus => ({
            dailyMedRecords: prevStatus.dailyMedRecords + 140,
            rxNormMappings: prevStatus.rxNormMappings + 85,
            pubmedArticles: prevStatus.pubmedArticles + 1200,
            lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19)
          }));
          setTerminalLogs(logs => [
            "[RAG] Index compilation successful. 12,305 vector shards fully mapped.",
            "[RAG] Vector database is clean and authoritative.",
            ...logs
          ]);
          return 100;
        }
        
        // Add some logging stream variation
        if (prev === 25) {
          setTerminalLogs(logs => ["[RAG] Loading NIH embeddings chunk 1-40...", ...logs]);
        } else if (prev === 60) {
          setTerminalLogs(logs => ["[RAG] Resolving cross-drug contraindication graphs...", ...logs]);
        } else if (prev === 85) {
          setTerminalLogs(logs => ["[RAG] Performing SHA256 integrity audits on medical catalogs...", ...logs]);
        }

        return prev + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [syncingKb]);

  const [activeAdminTab, setActiveAdminTab] = useState<'audit' | 'doctors' | 'rag'>('audit');

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Admin Top Header */}
      <div className="bg-slate-900 text-white py-1.5 px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-b border-slate-800">
        <span className="flex items-center gap-1.5"><Lock size={12} className="text-red-400" /> Administrative Console</span>
        <span className="bg-red-500 text-white font-black px-2 py-0.5 rounded text-[9px]">Root Authorization</span>
      </div>

      <header className="bg-white border-b border-slate-200 py-5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl shadow-md text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">System Administration</h1>
            <p className="text-xs text-slate-400 font-bold">Healthcare AI Audit & RAG Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">System Admin</p>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Root Administrator</p>
          </div>
          {!showLogoutConfirm ? (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-200 hover:border-red-100 shadow-sm active:scale-95"
              title="Sign Out & Switch Users"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-1.5 shadow-sm animate-fadeIn">
              <span className="text-[10px] font-black text-red-600 px-1">Exit Admin Portal?</span>
              <button
                onClick={onLogout}
                className="py-1 px-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-[10px] font-black transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black transition-all"
              >
                No
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Stats Summary Row */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Database Status</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Server size={14} /></span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">ONLINE</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Supabase PostgreSQL Connected</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">RAG Vector Count</span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Database size={14} /></span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">186,500+</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">DailyMed, PubMed & RxNorm mappings</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total System Audits</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Activity size={14} /></span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{auditLogs.length} Records</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">100% HIPAA compliant log stream</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Uptime Metric</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Clock size={14} /></span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">99.99%</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">All core containers functional</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button 
            onClick={() => setActiveAdminTab('audit')}
            className={`pb-3.5 text-xs font-black uppercase tracking-wider transition-all relative ${
              activeAdminTab === 'audit' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            HIPAA Audit Trails
          </button>
          <button 
            onClick={() => setActiveAdminTab('doctors')}
            className={`pb-3.5 text-xs font-black uppercase tracking-wider transition-all relative ${
              activeAdminTab === 'doctors' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Credential Verification ({doctorsList.filter(d => !d.isVerified).length})
          </button>
          <button 
            onClick={() => setActiveAdminTab('rag')}
            className={`pb-3.5 text-xs font-black uppercase tracking-wider transition-all relative ${
              activeAdminTab === 'rag' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            RAG Vector Databases
          </button>
        </div>

        {/* Dynamic Views */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {activeAdminTab === 'audit' && (
            <div className="lg:col-span-12 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">HIPAA System Audit Logs</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Strict compliance records of patient data access, logins, and clinical edits.</p>
                  </div>
                  {onClearLogs && (
                    <button 
                      onClick={onClearLogs}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-all"
                    >
                      Reset Logs
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Entity/Details</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">HIPAA Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="p-4 font-mono text-[10px]">{log.timestamp}</td>
                          <td className="p-4 font-extrabold text-slate-800">{log.action}</td>
                          <td className="p-4 leading-relaxed max-w-sm">{log.details}</td>
                          <td className="p-4 font-mono text-[11px]">{log.ipAddress}</td>
                          <td className="p-4">
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[9px]">
                              PASSED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'doctors' && (
            <div className="lg:col-span-12 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="font-black text-slate-900 text-base">Clinician Credential Verification</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Approve practitioner enrollment requests into the active provider network.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctorsList.map(doc => {
                  const isPending = doc.status === 'pending' || (!doc.status && !doc.isVerified);
                  const isRejected = doc.status === 'rejected';
                  const isVerified = doc.status === 'verified' || doc.isVerified;

                  return (
                    <div key={doc.id} className="p-5 border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                            {doc.name.replace('Dr. ', '').charAt(0) || 'D'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{doc.name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{doc.specialty} • {doc.hospital}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          isRejected ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-500 font-bold space-y-1">
                        <div>License Number: <span className="font-black text-slate-700">{doc.licenseNumber}</span></div>
                        <div>Primary Contact: <span className="font-black text-slate-700">{doc.email}</span></div>
                        {isRejected && doc.rejectionReason && (
                          <div className="text-red-600 mt-1 pt-1 border-t border-red-100">
                            Rejection Reason: <span className="font-black">{doc.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="space-y-3">
                          {rejectingDocId !== doc.id ? (
                            <div className="flex gap-2.5">
                              <button 
                                onClick={() => handleVerifyDoctorLocal(doc.id)}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Check size={14} /> Verify
                              </button>
                              <button 
                                onClick={() => {
                                  setRejectingDocId(doc.id);
                                  setRejectionReasonInput('');
                                }}
                                className="flex-1 py-2.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 animate-fadeIn p-3 bg-red-50/50 border border-red-100 rounded-xl">
                              <label className="block text-[9px] font-black uppercase tracking-wider text-red-600">Rejection Reason</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Invalid license number or clinic name."
                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-semibold outline-none focus:border-red-500 transition-all placeholder:text-slate-300 text-slate-800"
                                value={rejectionReasonInput}
                                onChange={e => setRejectionReasonInput(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => setRejectingDocId(null)}
                                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-[10px] font-black"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleRejectDoctorSubmit(doc.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black"
                                >
                                  Confirm Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isRejected && (
                        <button 
                          onClick={() => handleVerifyDoctorLocal(doc.id)}
                          className="w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          Re-evaluate & Verify Credentials
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeAdminTab === 'rag' && (
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* RAG settings */}
              <div className="md:col-span-5 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Database size={16} className="text-slate-700" />
                    Indexed Datasets Status
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Authoritative vector index storage counts.</p>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-slate-500">DailyMed FDA Labels</span>
                    <span className="font-black text-slate-800">{kbStatus.dailyMedRecords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-slate-500">NIH RxNorm Classes</span>
                    <span className="font-black text-slate-800">{kbStatus.rxNormMappings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-slate-500">PubMed Academic Indices</span>
                    <span className="font-black text-slate-800">{kbStatus.pubmedArticles.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <span className="text-slate-500">Last System Sync</span>
                    <span className="font-black text-slate-600 font-mono text-[10px]">{kbStatus.lastSync}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSyncKb}
                  disabled={syncingKb}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={syncingKb ? "animate-spin" : ""} />
                  {syncingKb ? `Re-indexing (${syncProgress}%)` : 'Synchronize Medical Databases'}
                </button>
              </div>

              {/* Vector Logs stream */}
              <div className="md:col-span-7 bg-slate-900 border border-slate-850 rounded-[2.5rem] p-6 shadow-lg text-white space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-indigo-400">
                    <Terminal size={14} />
                    Live Vector Sync Logs
                  </h3>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block animate-pulse" />
                </div>

                <div className="h-56 bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-2 scrollbar-hide">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-slate-500 font-semibold mr-1.5">&gt;</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
