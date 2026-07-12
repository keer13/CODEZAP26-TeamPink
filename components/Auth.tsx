import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  User, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Database,
  WifiOff,
  Wifi,
  CheckCircle2,
  Stethoscope,
  Key,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { UserRole, Doctor } from '../types';

interface AuthProps {
  role: UserRole;
  onAuthSuccess: (user: { name: string; email: string }, role: UserRole) => void;
  onCancel: () => void;
  doctors: Doctor[];
  onRegisterDoctor: (newDoc: Doctor) => void;
}

const Auth: React.FC<AuthProps> = ({ role, onAuthSuccess, onCancel, doctors, onRegisterDoctor }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; type?: string } | null>(null);
  const [registrationPending, setRegistrationPending] = useState(false);
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(59);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    licenseNumber: '',
    specialty: 'Internal Medicine',
    hospital: ''
  });

  // Ticking timer for simulated OTP
  useEffect(() => {
    if (!show2FA) return;
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [show2FA, timer]);

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMsg(null);
  };

  const handleResendOtp = () => {
    setTimer(59);
    setSuccessMsg("A fresh clinical verification code has been dispatched to your trusted authenticator.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // If role is admin and trying to login
    if (role === 'admin' && formData.email !== 'admin@healthcare.ai') {
      setIsLoading(false);
      setError({ message: "Access Denied. Only registered security administrator emails are allowed." });
      return;
    }

    try {
      if (isLogin) {
        if (role === 'doctor') {
          const matchedDoc = doctors.find(d => d.email.toLowerCase() === formData.email.toLowerCase());
          if (!matchedDoc) {
            throw new Error("Doctor credentials not found. Please enroll first.");
          }
          if (matchedDoc.status === 'pending') {
            throw new Error("Login Blocked. Your registration is pending administrative review.");
          }
          if (matchedDoc.status === 'rejected') {
            throw new Error(`Login Blocked. Your registration was rejected. Reason: ${matchedDoc.rejectionReason || 'Invalid licensing credentials.'}`);
          }
          // Verify password (allow 123456 as fallback)
          const expectedPassword = matchedDoc.password || '123456';
          if (formData.password !== expectedPassword) {
            throw new Error("Invalid email or password combination.");
          }
        }

        // Run simple check
        if (formData.email && formData.password) {
          // Trigger 2FA step first (high-fidelity medical simulation!)
          setShow2FA(true);
          setIsLoading(false);
        }
      } else {
        if (!formData.name.trim()) throw new Error("Please enter your full name");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");
        if (role === 'doctor') {
          if (!formData.licenseNumber.trim()) throw new Error("Medical License Number is required for practitioner enrollment");
          // Check if email already registered to prevent duplicates
          const exists = doctors.some(d => d.email.toLowerCase() === formData.email.toLowerCase());
          if (exists) {
            throw new Error("This email is already registered in our medical practitioner database.");
          }
        }
        
        // Trigger 2FA for signup
        setShow2FA(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError({ message: err.message || "Validation failed. Verify input and retry." });
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (otpCode.length !== 6) {
      setError({ message: "Invalid 2FA challenge code. Please input exactly 6 digits." });
      setIsLoading(false);
      return;
    }

    // Process final authentication success
    try {
      let displayName = formData.name || formData.email.split('@')[0];
      if (role === 'doctor' && !displayName.toLowerCase().startsWith('dr.')) {
        displayName = `Dr. ${displayName}`;
      }
      
      if (!isLogin && role === 'doctor') {
        onRegisterDoctor({
          id: 'doc-' + Math.random().toString(36).substr(2, 9),
          name: displayName,
          email: formData.email.toLowerCase(),
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          hospital: formData.hospital || 'Johns Hopkins Hospital',
          isVerified: false,
          status: 'pending',
          password: formData.password
        });
        setRegistrationPending(true);
      } else {
        onAuthSuccess({ name: displayName, email: formData.email }, role);
      }
    } catch (err: any) {
      setError({ message: "OTP handshaking failed. Try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup styling details based on role
  const roleTitle = role === 'patient' ? 'Patient Companion Hub' : role === 'doctor' ? 'Provider Console' : 'System Administration';
  const themeBg = role === 'patient' ? 'from-blue-600 to-indigo-700' : role === 'doctor' ? 'from-indigo-900 to-indigo-850' : 'from-slate-900 to-slate-800';
  const accentText = role === 'patient' ? 'text-blue-600' : role === 'doctor' ? 'text-indigo-600' : 'text-slate-900';

  if (registrationPending) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">
        {/* Left Side Info */}
        <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${themeBg} text-white flex-col justify-center p-20 relative overflow-hidden`}>
          <div className="max-w-md space-y-6">
            <span className="bg-white/10 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck size={14} /> Verification Pending
            </span>
            <h2 className="text-4xl font-black tracking-tight leading-tight">Registration Under Clinical Review</h2>
            <p className="text-slate-200/90 text-sm font-medium leading-relaxed">
              We verify the medical registry status of all applying practitioners to ensure the integrity and safety of patient consultation files.
            </p>
          </div>
        </div>

        {/* Right Side Info */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white">
          <div className="max-w-sm w-full mx-auto space-y-8 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 border border-amber-100 rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <Clock size={32} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Application Submitted</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Thank you, {formData.name || 'Doctor'}. Your registration details have been securely logged.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-100/60 rounded-2xl text-xs text-amber-800 font-bold leading-relaxed text-left">
                Account Status: <span className="uppercase font-black text-amber-600">PENDING REVIEW</span>
                <p className="mt-1 font-semibold text-[11px] text-slate-500">Your licensing registration number ({formData.licenseNumber}) is currently being cross-referenced with medical databases.</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setRegistrationPending(false);
                  setShow2FA(false);
                  setIsLogin(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95 animate-pulse"
              >
                Back to credentials sign-in
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all"
              >
                Return to Public Site
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">
        {/* Left Side Info */}
        <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${themeBg} text-white flex-col justify-center p-20 relative overflow-hidden`}>
          <div className="max-w-md space-y-6">
            <span className="bg-white/10 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Key size={14} /> Multi-Factor Authentication
            </span>
            <h2 className="text-4xl font-black tracking-tight leading-tight">Securing Your Health Credentials</h2>
            <p className="text-slate-200/90 text-sm font-medium leading-relaxed">
              In accordance with HIPAA medical privacy rules and SOC2 protocol, we require two-factor identity proofing to secure patient files from unauthorized access.
            </p>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <button 
              onClick={() => setShow2FA(false)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
            >
              <ChevronLeft size={16} /> Back to Credentials
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security Code Verification</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                A secure 2FA transaction code has been generated and dispatched. Check your device and input the code to confirm entry.
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-6">
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="space-y-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-center py-4 rounded-2xl font-black tracking-[0.6em] text-xl outline-none focus:bg-white focus:border-indigo-500 text-slate-900 transition-all placeholder:text-slate-200"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
                {error && <p className="text-xs text-red-600 font-bold text-center mt-1.5">{error.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl text-xs font-black text-white hover:opacity-95 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  role === 'patient' ? 'bg-blue-600' : role === 'doctor' ? 'bg-indigo-600' : 'bg-slate-900'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <>Authorize Access Session <ArrowRight size={14} /></>}
              </button>
            </form>

            <div className="text-center space-y-3.5">
              <p className="text-[11px] text-slate-400 font-bold">
                {timer > 0 ? (
                  <span>Code valid for <span className="font-mono text-slate-600">{timer}s</span></span>
                ) : (
                  <span>Code expired.</span>
                )}
              </p>
              <button 
                onClick={handleResendOtp}
                className={`text-xs font-black hover:underline ${accentText}`}
              >
                Resend OTP Security Code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Decoration */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${themeBg} text-white flex-col justify-center p-20 relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-white rounded-full blur-[100px]" />
        </div>
        <div className="max-w-md relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 text-white rounded-xl border border-white/20">
              <HeartPulse size={28} />
            </div>
            <span className="text-2xl font-black tracking-tight">Healthcare AI</span>
          </div>
          <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
            Protected. <br/>
            Compliant. <br/>
            <span className="text-white/80">Clinically Mapped.</span>
          </h2>
          <p className="text-sm text-white/80 font-medium leading-relaxed">
            Enterprise-grade shielding layer cross-referencing prescriptions against active databases to protect patients from drug interaction conflicts.
          </p>
          <div className="space-y-6 pt-4 border-t border-white/10">
            {[
              { icon: ShieldCheck, title: "HIPAA Compliant Data Rooms", desc: "Patient directories and log indexes remain encrypted." },
              { icon: Sparkles, title: "RAG Vector Grounding", desc: "AI warnings linked to FDA DailyMed and RxNorm catalogs." },
              { icon: Database, title: "Permanent Local Backups", desc: "Failsafe rules engine runs offline in browser." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-white">
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-xs text-white/70 font-semibold mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Form Area */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white relative">
        <button 
          onClick={onCancel}
          className="absolute top-8 left-8 flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
        >
          <ChevronLeft size={16} /> Public Site
        </button>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{roleTitle}</span>
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              {isLogin ? 'Credentials Sign In' : 'Enroll Provider'}
            </h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              {isLogin ? 'Access your private and secure clinical workspace.' : 'Register your medical licensing details to join.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                {successMsg}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Full Practitioner Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Dr. Elizabeth Blackwell" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Doctor specific registration fields */}
            {!isLogin && role === 'doctor' && (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Medical License Number</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. MD-92401" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                      value={formData.licenseNumber}
                      onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Clinical Specialty</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                    >
                      <option>Internal Medicine</option>
                      <option>Cardiology</option>
                      <option>Pediatrics</option>
                      <option>Diagnostic Medicine</option>
                      <option>Geriatrics</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Affiliated Hospital / Clinic</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Mayo Clinic" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                    value={formData.hospital}
                    onChange={e => setFormData({...formData, hospital: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Secure Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder={role === 'admin' ? "admin@healthcare.ai" : "name@example.com"} 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Access Key/Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600 flex items-center gap-2 animate-in shake">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 text-white rounded-xl font-black text-xs hover:opacity-95 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 ${
                role === 'patient' ? 'bg-blue-600' : role === 'doctor' ? 'bg-indigo-600' : 'bg-slate-900'
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isLogin ? 'Verify Credentials' : 'Submit Enrollment'} 
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {role !== 'admin' && (
            <div className="mt-8 text-center space-y-4">
              <p className="text-xs font-bold text-slate-500">
                {isLogin ? "No account?" : "Enrolled already?"}{' '}
                <button 
                  type="button"
                  onClick={handleToggleMode}
                  className={`font-black hover:underline ${accentText}`}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          )}

          {/* Quick Sandbox Login hints for tester */}
          <div className="mt-8 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5 text-[10px] text-slate-500 font-bold leading-relaxed">
            <div className="uppercase tracking-wider font-black text-slate-400">Quick Testing Accounts</div>
            {role === 'patient' && <div>Email: <span className="font-extrabold text-slate-700">patient@healthcare.ai</span> / Password: <span className="font-extrabold text-slate-700">123456</span></div>}
            {role === 'doctor' && <div>Email: <span className="font-extrabold text-slate-700">blackwell@healthcare.ai</span> / Password: <span className="font-extrabold text-slate-700">123456</span></div>}
            {role === 'admin' && <div>Email: <span className="font-extrabold text-slate-700">admin@healthcare.ai</span> / Password: <span className="font-extrabold text-slate-700">123456</span></div>}
            <div>OTP 2FA Screen: Enter any <span className="underline font-black text-slate-700">6 digits</span> to login instantly.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
