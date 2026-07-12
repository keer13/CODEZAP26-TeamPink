import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Mic, 
  X, 
  Volume2, 
  PhoneOff, 
  BrainCircuit,
  MessageCircle,
  Pill,
  Calendar,
  Stethoscope,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CloudSun
} from 'lucide-react';
import { ChatMessage, UserProfile, DoctorAppointment, MedicalReport, HealthLog } from '../types';
import { analyzeHealthQuery } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Base64 helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AIConsultantProps {
  initialQuery?: string;
  initialImage?: string;
  onResetContext?: () => void;
  userProfile?: UserProfile | null;
  medicalReports?: MedicalReport[];
  healthLogs?: HealthLog[];
  onAddAppointment?: (appointment: Omit<DoctorAppointment, 'id'>) => void;
}

const AVAILABLE_DOCTORS = [
  {
    name: "Dr. Elizabeth Blackwell",
    specialty: "Cardiology & Vascular Medicine",
    availability: "Mon, Wed, Fri • 09:00 AM - 01:00 PM",
    status: "🟢 Available on Call",
    bio: "Pioneer in preventative cardiovascular diagnostics with over 15 years of experience."
  },
  {
    name: "Dr. Alexander Fleming",
    specialty: "Endocrinology & General Practice",
    availability: "Tue, Thu • 10:00 AM - 04:00 PM",
    status: "🟡 In Consultation",
    bio: "Specialist in metabolic wellness, diabetic therapy optimization, and clinical immunology."
  },
  {
    name: "Dr. Jonas Salk",
    specialty: "Immunology & Infectious Diseases",
    availability: "Mon, Thu • 08:00 AM - 12:00 PM",
    status: "🟢 Available",
    bio: "Dedicated researcher focused on immunization scheduling and respiratory defense mechanisms."
  },
  {
    name: "Dr. Virginia Apgar",
    specialty: "Pediatrics & Family Medicine",
    availability: "Wed, Fri • 01:00 PM - 05:00 PM",
    status: "🟢 Available",
    bio: "Expert in newborn assessment metrics, clinical pediatrics, and adolescent development."
  }
];

const COMMON_MEDS_LIST = [
  "Metformin", "Lisinopril", "Ibuprofen", "Warfarin", "Atorvastatin", 
  "Amlodipine", "Aspirin", "Albuterol", "Amoxicillin", "Gabapentin"
];

const AIConsultant: React.FC<AIConsultantProps> = ({ 
  initialQuery, 
  initialImage, 
  onResetContext,
  userProfile,
  medicalReports,
  healthLogs,
  onAddAppointment
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'dosage' | 'scheduling'>('chat');
  
  // Messages and core chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm your **Healthcare & Weather AI** assistant. How can I help you with your symptoms, medications, dosage levels, or local weather concerns today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Voice & Language states
  const [isVoiceActive, setIsVoiceActive] = useState(false); // Used for Web Speech API listening
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dosageImageInputRef = useRef<HTMLInputElement>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Dual Medication states
  const [med1Name, setMed1Name] = useState('Metformin');
  const [med1Level, setMed1Level] = useState<'low' | 'normal' | 'high'>('high');
  const [med2Name, setMed2Name] = useState('Ibuprofen');
  const [med2Level, setMed2Level] = useState<'low' | 'normal' | 'high'>('normal');
  const [dosageReportImage, setDosageReportImage] = useState<string | null>(null);

  // Scheduling states
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingReason, setBookingReason] = useState('');
  const [schedulingSuccess, setSchedulingSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery || initialImage) {
      if (initialImage) setAttachedImage(initialImage);
      if (initialQuery) setInput(initialQuery);
      if (initialQuery && !isLoading) {
        setActiveSubTab('chat');
        handleSendMessage(initialQuery, initialImage);
      }
      if (onResetContext) onResetContext();
    }
  }, [initialQuery, initialImage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeSubTab]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const targetLang = language === 'ta' ? 'ta-IN' : 'en-US';
    const preferredVoice = voices.find(v => v.lang.includes(targetLang) && v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscription(currentTranscript);
          if (event.results[event.results.length - 1].isFinal) {
            setInput(prev => prev ? `${prev} ${currentTranscript}` : currentTranscript);
            setIsVoiceActive(false);
            setVoiceTranscription('');
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsVoiceActive(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsVoiceActive(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    }
  }, [language]);

  const toggleListening = () => {
    if (isVoiceActive) {
      recognitionRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      if (recognitionRef.current) {
        setVoiceTranscription('');
        recognitionRef.current.start();
        setIsVoiceActive(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const handleSendMessage = async (overrideInput?: string, overrideImage?: string) => {
    const finalInput = overrideInput !== undefined ? overrideInput : input;
    const finalImage = overrideImage !== undefined ? overrideImage : attachedImage;
    if ((!finalInput.trim() && !finalImage) || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: finalInput || "Analyze this image." };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const imageBase64 = finalImage ? finalImage.split(',')[1] : undefined;
      
      // Pass raw query directly
      let queryWithLang = finalInput;
      
      const aiResponse = await analyzeHealthQuery(queryWithLang, history, imageBase64);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse || "Error generating response." }]);
      
      if (voiceEnabled && aiResponse) {
        // Strip basic markdown for speech
        const speechText = aiResponse.replace(/[*_#`]/g, '');
        speakText(speechText);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Failed to connect to AI server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger automated dual medication dosage analysis
  const handleAnalyzeDualDosage = async () => {
    const descriptiveQuery = `🔬 **[AUTOMATED SCANNED DOSAGE MONITOR]**\n\nPlease perform a detailed safety monitoring assessment comparing these two medications:\n1. **${med1Name}** at a **${med1Level.toUpperCase()}-LEVEL** dosage.\n2. **${med2Name}** at a **${med2Level.toUpperCase()}-LEVEL** dosage.\n\nTell the detailed descriptions, clinical therapeutic indices, danger alerts for high/low levels, potential adverse interactions, and active monitoring advice. Use medical knowledge parameters.`;
    
    setActiveSubTab('chat');
    setIsLoading(true);

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: `Please monitor dosage levels and compatibility for:\n- **${med1Name}** (${med1Level.toUpperCase()} level)\n- **${med2Name}** (${med2Level.toUpperCase()} level).` 
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const imageBase64 = dosageReportImage ? dosageReportImage.split(',')[1] : undefined;
      const aiResponse = await analyzeHealthQuery(descriptiveQuery, history, imageBase64);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Failed to analyze dosage safety profile. Please try again." }]);
    } finally {
      setIsLoading(false);
      setDosageReportImage(null);
    }
  };

  // Handle scheduling request
  const handleScheduleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) return;

    const selectedDoc = AVAILABLE_DOCTORS[selectedDocIndex];
    
    // Add to real scheduling model if callback is available
    if (onAddAppointment && userProfile) {
      onAddAppointment({
        patientId: userProfile.id,
        patientName: userProfile.name,
        patientEmail: userProfile.email,
        doctorName: selectedDoc.name,
        doctorSpecialty: selectedDoc.specialty,
        date: bookingDate,
        time: bookingTime,
        reason: bookingReason || "General consultation request via clinical monitor",
        status: 'scheduled'
      });
    }

    const bookingDetailsMsg = `📅 **[APPOINTMENT SCHEDULING REQUEST]**\n\n**Practitioner Selected:** ${selectedDoc.name} (${selectedDoc.specialty})\n**Patient Profile:** ${userProfile?.name || 'Self'} (${userProfile?.email || 'Registered User'})\n**Requested Slot:** ${bookingDate} at ${bookingTime}\n**Reason for Consultation:** ${bookingReason || 'General health evaluation'}\n\n*Clinic Response:* Your scheduling request has been registered in the system queue! Check your Appointment scheduling tab to review.`;

    // Push into chat messages for chatbot dashboard log view
    setMessages(prev => [
      ...prev,
      { role: 'user', content: `Book appointment with ${selectedDoc.name} for ${bookingDate} at ${bookingTime}` },
      { role: 'model', content: bookingDetailsMsg }
    ]);

    setSchedulingSuccess(`Your request has been filed with ${selectedDoc.name} for ${bookingDate} at ${bookingTime}. Details have been sent to the chatbot dashboard.`);
    setBookingReason('');
    
    // Auto clear success notice
    setTimeout(() => {
      setSchedulingSuccess(null);
    }, 6000);
  };

  const startVoiceAssistant = async () => {
    setIsVoiceActive(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputAudioCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) setVoiceTranscription(message.serverContent.outputTranscription.text);
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioCtxRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a warm, professional medical and weather assistant. Keep voice responses short.',
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto card overflow-hidden">
      {/* Upper Main Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-none flex items-center gap-2">
              Clinical & Weather Assistant
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">MediShield Intelligence Node</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            onClick={() => setLanguage(l => l === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all border border-slate-200"
            title="Switch Language"
          >
            <span className="text-[10px] uppercase tracking-wider">{language === 'en' ? 'EN' : 'தமிழ்'}</span>
          </button>

          {/* Voice Output Toggle */}
          <button 
            onClick={() => {
              setVoiceEnabled(v => !v);
              if (voiceEnabled) window.speechSynthesis?.cancel();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              voiceEnabled 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Voice Output"
          >
            {voiceEnabled ? <Volume2 size={14} /> : <Volume2 size={14} className="opacity-50" />}
          </button>

          <button 
            onClick={() => setMessages([messages[0]])}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-standard ml-2 mr-2"
          >
            Reset Session
          </button>
        </div>
      </div>

      {/* Interactive Sub-tab Selector */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'chat' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <MessageCircle size={14} />
          Clinical Chat & Weather
        </button>
        <button
          onClick={() => setActiveSubTab('dosage')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'dosage' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Pill size={14} />
          Dual Dosage Monitor
        </button>
        <button
          onClick={() => setActiveSubTab('scheduling')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'scheduling' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Calendar size={14} />
          Doctor Availability
        </button>
      </div>

      {/* Content Rendering based on Sub-tab */}
      {activeSubTab === 'chat' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}>
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <Bot size={12} className="text-blue-600" />
                      MediShield AI Consultant
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500 font-bold">MediShield Engine processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Standard Chat Input Bar */}
          <div className="p-4 bg-white border-t border-slate-100">
            {attachedImage && (
              <div className="mb-4 flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                 <img src={attachedImage} className="w-12 h-12 rounded-lg object-cover" />
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-700">Clinical Image Attached</p>
                   <button onClick={() => setAttachedImage(null)} className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider">Remove</button>
                 </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about medications, high/low dosages, symptoms, or the weather..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-sm"
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Attach report/label image"
              >
                <ImageIcon size={20} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const r = new FileReader();
                    r.onload = () => setAttachedImage(r.result as string);
                    r.readAsDataURL(f);
                  }
                }} />
              </button>
              <button 
                onClick={toggleListening} 
                className={`p-3 rounded-lg transition-all relative ${
                  isVoiceActive 
                    ? 'text-red-500 bg-red-50 shadow-inner' 
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
                title="Start voice session"
              >
                {isVoiceActive && (
                  <span className="absolute inset-0 rounded-lg border-2 border-red-500 animate-ping opacity-20"></span>
                )}
                <Mic size={20} className={isVoiceActive ? 'animate-pulse' : ''} />
              </button>
              <button 
                onClick={() => handleSendMessage()}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md"
                disabled={(!input.trim() && !attachedImage) || isLoading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dual Medication Dosage level monitor tab */}
      {activeSubTab === 'dosage' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex gap-4">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl h-fit">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Dual Medication Dosage Monitor</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Compare and monitor the clinical safety of two different medicines simultaneously. Select high or low dosage levels to evaluate therapeutic bounds, potential toxicity alerts, or allergen interactions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medication 1 Choice */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Primary Medication</h5>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Medicine Name</label>
                <select 
                  value={med1Name} 
                  onChange={(e) => setMed1Name(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-sm font-semibold text-slate-700"
                >
                  {COMMON_MEDS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Dosage Severity / Monitor Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setMed1Level(lvl)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all capitalize ${
                        med1Level === lvl 
                          ? lvl === 'high' 
                            ? 'bg-red-50 border-red-200 text-red-600 font-extrabold' 
                            : lvl === 'low' 
                              ? 'bg-amber-50 border-amber-200 text-amber-600 font-extrabold'
                              : 'bg-green-50 border-green-200 text-green-600 font-extrabold'
                          : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {lvl} Level
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Medication 2 Choice */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Secondary Medication</h5>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Medicine Name</label>
                <select 
                  value={med2Name} 
                  onChange={(e) => setMed2Name(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-sm font-semibold text-slate-700"
                >
                  {COMMON_MEDS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Dosage Severity / Monitor Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setMed2Level(lvl)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all capitalize ${
                        med2Level === lvl 
                          ? lvl === 'high' 
                            ? 'bg-red-50 border-red-200 text-red-600 font-extrabold' 
                            : lvl === 'low' 
                              ? 'bg-amber-50 border-amber-200 text-amber-600 font-extrabold'
                              : 'bg-green-50 border-green-200 text-green-600 font-extrabold'
                          : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {lvl} Level
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Label / Report image upload */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} className="text-blue-600" />
              Upload Medication Labels or Dosage Logs
            </h5>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => dosageImageInputRef.current?.click()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-200"
              >
                Choose Image File
              </button>
              <input 
                type="file" 
                ref={dosageImageInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const r = new FileReader();
                    r.onload = () => setDosageReportImage(r.result as string);
                    r.readAsDataURL(f);
                  }
                }} 
              />
              {dosageReportImage ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 py-1.5 px-3 rounded-lg text-xs font-bold">
                  <CheckCircle2 size={14} /> Image Attached Successfully!
                  <button onClick={() => setDosageReportImage(null)} className="text-red-500 ml-2 font-extrabold uppercase">Remove</button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">No image attached (Optional)</span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAnalyzeDualDosage}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto"
            >
              <Sparkles size={16} /> Scan & Analyze Compatibility
            </button>
          </div>

          {/* Dosage Warning Level clinical guide */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 text-amber-600">
              <AlertTriangle size={14} /> Critical Dosage Alert Reference
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-red-100 bg-red-50/20 p-3.5 rounded-xl">
                <span className="font-extrabold text-red-600 uppercase tracking-wider block mb-1">High Level Toxicity Hazards</span>
                <p className="text-slate-500 leading-relaxed">
                  Excessive serum concentration of medicines can exceed hepatic or renal clearances. For example, high levels of **Metformin** can lead to lactic acidosis, while high **NSAIDs** run a severe risk of gastrointestinal bleeding or peptic ulceration.
                </p>
              </div>
              <div className="border border-amber-100 bg-amber-50/20 p-3.5 rounded-xl">
                <span className="font-extrabold text-amber-600 uppercase tracking-wider block mb-1">Low Level Sub-Therapeutic Risks</span>
                <p className="text-slate-500 leading-relaxed">
                  Failure to reach minimum effective concentration (MEC). Taking **Lisinopril** at low levels fails to regulate vascular load, increasing cardiovascular strain, while low **antibiotics** can foster drug-resistant clinical pathogens.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor availability schedule and booking request */}
      {activeSubTab === 'scheduling' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex gap-4">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl h-fit">
              <Stethoscope size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Certified Clinic Practitioners</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review available clinic schedules and submit booking requests. Requests will be automatically logged to the patient dashboard and shared with the medical clinic's secure database.
              </p>
            </div>
          </div>

          {schedulingSuccess && (
            <div className="bg-emerald-600 text-white p-4 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{schedulingSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Doctor List */}
            <div className="lg:col-span-7 space-y-4">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Select Practitioner</h5>
              {AVAILABLE_DOCTORS.map((doc, idx) => (
                <div
                  key={doc.name}
                  onClick={() => {
                    setSelectedDocIndex(idx);
                    if (!bookingDate) {
                      // Set tomorrow's date by default
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setBookingDate(tomorrow.toISOString().split('T')[0]);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedDocIndex === idx 
                      ? 'border-blue-600 bg-blue-50/20 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h6 className="font-bold text-slate-900 text-sm">{doc.name}</h6>
                      <p className="text-xs font-bold text-blue-600">{doc.specialty}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-xs text-slate-600">
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{doc.bio}</p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                    <Clock size={12} className="text-blue-500" />
                    Hours: {doc.availability}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Booking Form */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-0">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-blue-600" />
                  Appointment Details
                </h5>

                <form onSubmit={handleScheduleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Selected Doctor</label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-black text-slate-800">{AVAILABLE_DOCTORS[selectedDocIndex].name}</p>
                      <p className="text-[10px] font-bold text-blue-600">{AVAILABLE_DOCTORS[selectedDocIndex].specialty}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Time</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-xs font-semibold text-slate-700"
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason for Visit</label>
                    <textarea
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      placeholder="Describe your symptoms, treatment requests, or consult objectives..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-xs text-slate-700 leading-relaxed"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 hover:shadow-md transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    Send Scheduling Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Overlay */}
      {isVoiceActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Mic size={48} className="text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold text-white">Voice Assistant Active</h4>
              <p className="text-blue-200 text-sm max-w-xs">{voiceTranscription || 'Listening to you...'}</p>
            </div>
            <button 
              onClick={toggleListening}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"
            >
              <PhoneOff size={20} /> End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConsultant;
