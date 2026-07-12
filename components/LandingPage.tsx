import React, { useState } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Stethoscope, 
  ShieldAlert, 
  Check, 
  Star, 
  HelpCircle,
  Clock,
  Database,
  Search,
  BookOpen,
  UserCheck,
  Zap,
  Lock
} from 'lucide-react';
import { checkMedicationSafety } from '../services/geminiService';
import { UserRole } from '../types';

interface LandingPageProps {
  onAccessPortal: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAccessPortal }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/70 via-transparent to-transparent pointer-events-none z-0">
        <div className="absolute top-12 left-[15%] w-96 h-96 bg-blue-200/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-24 right-[20%] w-80 h-80 bg-indigo-200/30 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-200 text-white">
              <HeartPulse size={24} />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">Healthcare <span className="text-blue-600 font-black text-sm uppercase px-1.5 py-0.5 bg-blue-50 rounded-md border border-blue-100 ml-1">AI</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#portals" className="hover:text-blue-600 transition-colors">Portals</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onAccessPortal('patient')}
              className="px-4 py-2 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('portals');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4.5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
            >
              Access Portals
            </button>
          </div>
        </div>
      </header>

      {/* Portals Access Area */}
      <section id="portals" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Your Portal Dashboard</h2>
          <p className="text-slate-500 font-medium">Choose your workspace entry point below. Authentication is fully secured and HIPAA audited.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              role: 'patient' as UserRole,
              title: "Patient Companion Hub",
              desc: "Manage your personalized treatment plans, reminders, health diaries, and OCR-scanned prescriptions with live safety scores.",
              icon: HeartPulse,
              badge: "Family & Caregivers",
              color: "bg-blue-600",
              lightColor: "bg-blue-50 text-blue-600"
            },
            {
              role: 'doctor' as UserRole,
              title: "Provider Console",
              desc: "Verify patient records via OTP consent, upload smart prescriptions with safety warnings, and manage multiple health timelines.",
              icon: Stethoscope,
              badge: "Doctors & Clinicians",
              color: "bg-indigo-600",
              lightColor: "bg-indigo-50 text-indigo-600"
            },
            {
              role: 'admin' as UserRole,
              title: "System Administration",
              desc: "Oversee doctor credentials, monitor detailed system audits, inspect RAG vector synchronization, and track system security metrics.",
              icon: ShieldCheck,
              badge: "Compliance & Auditing",
              color: "bg-slate-900",
              lightColor: "bg-slate-100 text-slate-800"
            }
          ].map((portal, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${portal.lightColor}`}>
                    <portal.icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">{portal.badge}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900">{portal.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{portal.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => onAccessPortal(portal.role)}
                className={`w-full mt-8 py-3.5 rounded-2xl text-xs font-black text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 ${portal.color}`}
              >
                Access Portal <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>




      {/* FAQ Section */}
      <section id="faq" className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 font-medium">Got questions? We have clinically backed explanations.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is RAG and how does Healthcare AI use it?",
                a: "RAG (Retrieval-Augmented Generation) is an advanced AI pattern where the LLM (Gemini) is securely ground using authoritative external medical database indexes. When checking medications, the safety engine extracts corresponding clinical snippets from DailyMed, RxNorm, and PubMed to guarantee factuality and cite accurate RxNorm IDs or Study IDs in the report."
              },
              {
                q: "Is my personal healthcare data secure?",
                a: "Yes, absolutely. Healthcare AI operates on a HIPAA-ready framework. User profiles and medical histories are isolated. Doctors can only view patient logs once authorized via a real-time, 6-digit OTP code requested directly from the patient, ensuring strict medical consent."
              },
              {
                q: "Does the safety checker work without internet connectivity?",
                a: "Yes. In case of network drops, Healthcare AI deploys a robust, clinical-rules fail-safe backup engine loaded locally in the browser bundle. It instantly runs evaluations for severe drug interactions (like Ibuprofen and Warfarin) and organ contraindications seamlessly."
              },
              {
                q: "How does the low-stock alarm engine alert caregivers?",
                a: "Every medication has a low-stock threshold. When a dose is taken, the system decrements remaining stocks. If it hits the threshold, real-time toast alerts are broadcasted and emergency notifications are generated."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 bg-slate-50/50 hover:bg-slate-50 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center transition-all"
                >
                  {faq.q}
                  <span className="text-slate-400">{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 py-5 bg-white border-t border-slate-100 text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <HeartPulse size={18} />
              </div>
              <span className="text-md font-extrabold tracking-tight">Healthcare AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              The privacy-first medication safety assistant protecting caregivers, families, and doctors worldwide.
            </p>
          </div>
          <div>
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-4">Portals</h5>
            <div className="space-y-2 text-xs font-semibold">
              <button onClick={() => onAccessPortal('patient')} className="block hover:text-white transition-colors">Patient Hub</button>
              <button onClick={() => onAccessPortal('doctor')} className="block hover:text-white transition-colors">Provider Console</button>
              <button onClick={() => onAccessPortal('admin')} className="block hover:text-white transition-colors">System Admin</button>
            </div>
          </div>
          <div>
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-4">Medical Standards</h5>
            <div className="space-y-2 text-xs font-semibold">
              <span className="block">HIPAA Compliant</span>
              <span className="block">RxNorm Mapped</span>
              <span className="block">DailyMed Checked</span>
              <span className="block">FDA Regulation Audited</span>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-2">Platform Disclaimer</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Healthcare AI is an advisory information system powered by generative models. It is not a substitute for clinical diagnostics, therapeutic decisions, or medical advice. Always consult a physician for prescription adjustments.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold text-slate-500">
          <span>&copy; {new Date().getFullYear()} Healthcare AI Inc. All rights reserved.</span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">HIPAA Disclosures</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
