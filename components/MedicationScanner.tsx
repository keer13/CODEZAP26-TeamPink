import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle, Info, Plus, Image as ImageIcon, Upload, Stethoscope, MessageSquare, Loader2, Maximize2, FileText } from 'lucide-react';
import { analyzeHealthImage } from '../services/geminiService';
import { Medication } from '../types';

interface ScannedResult {
  name?: string;
  dosage?: string;
  usage?: string;
  instructions?: string;
  condition?: string;
  severity?: string;
  description?: string;
  nextSteps?: string;
}

interface HealthScannerProps {
  onAddMedication?: (med: Omit<Medication, 'id' | 'profileId'>) => void;
  onConsultAI?: (query: string, image?: string) => void;
  onOpenPrescriptionScanner?: () => void;
}

const HealthScanner: React.FC<HealthScannerProps> = ({ onAddMedication, onConsultAI, onOpenPrescriptionScanner }) => {
  const [scanMode, setScanMode] = useState<'medication' | 'symptom' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (mode: 'medication' | 'symptom') => {
    setScanMode(mode);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied. Please allow permissions or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && scanMode) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        setCapturedImage(dataUrl);
        processImage(base64, scanMode);
        stopCamera();
      }
    }
  }, [scanMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'medication' | 'symptom') => {
    const file = e.target.files?.[0];
    if (file) {
      setScanMode(mode);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        const base64 = dataUrl.split(',')[1];
        processImage(base64, mode);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, mode: 'medication' | 'symptom') => {
    setIsScanning(true);
    setResult(null);
    setError(null);
    try {
      const analysis = await analyzeHealthImage(base64, mode);
      setResult(analysis);
    } catch (err) {
      setError('Analysis failed. Please try a clearer image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToSchedule = () => {
    if (result && result.name && onAddMedication) {
      onAddMedication({
        name: result.name,
        dosage: result.dosage || 'Unknown',
        frequency: 'Once Daily',
        timeOfDay: ['08:00'],
        instructions: result.instructions || result.usage || 'N/A',
        remaining: 30,
        total: 30,
        reminders: [{
          id: Math.random().toString(36).substr(2, 9),
          time: '08:00',
          enabled: true,
          message: `Take your ${result.name}`
        }]
      });
      setIsAdded(true);
    }
  };

  const handleDiscussWithAI = () => {
    if (onConsultAI && capturedImage) {
      const context = scanMode === 'medication' 
        ? `I scanned ${result?.name}. Can you explain its uses and risks?`
        : `I scanned a symptom: ${result?.condition}. What does this mean?`;
      onConsultAI(context, capturedImage);
    }
  };

  const resetScanner = () => {
    stopCamera();
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setIsAdded(false);
    setCameraActive(false);
    setScanMode(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Health Scanner</h2>
        <p className="text-slate-500 text-sm">Real-time medication and symptom analysis</p>
      </div>

      <div className="card aspect-video relative overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200 shadow-xl group">
        {!cameraActive && !capturedImage && (
          <div className="p-6 w-full flex flex-col items-center gap-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
              <button 
                onClick={() => startCamera('medication')}
                className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-center flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Camera size={28} />
                </div>
                <div>
                  <span className="text-sm font-black block text-slate-900 leading-tight">Scan Medication</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-normal block mt-1">Identify pills and labels</span>
                </div>
              </button>
              
              <button 
                onClick={() => startCamera('symptom')}
                className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-center flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Stethoscope size={28} />
                </div>
                <div>
                  <span className="text-sm font-black block text-slate-900 leading-tight">Analyze Symptom</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-normal block mt-1">Evaluate skin & conditions</span>
                </div>
              </button>

              <button 
                onClick={onOpenPrescriptionScanner}
                className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-center flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <div>
                  <span className="text-sm font-black block text-slate-900 leading-tight">Prescription Scan</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-normal block mt-1">Extract meds via OCR</span>
                </div>
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-standard flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg"
              >
                <Upload size={16} /> or upload from gallery
              </button>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supports JPG, PNG</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'medication')} />
          </div>
        )}

        {cameraActive && (
          <div className="absolute inset-0 bg-black animate-in fade-in duration-500">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Viewfinder Overlays */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-72 h-72 relative border-2 border-white/20 rounded-3xl">
                {/* Viewfinder Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                
                {/* Scanning Animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_blue] animate-[scan_3s_ease-in-out_infinite]"></div>
              </div>
              <div className="mt-8 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                  Live {scanMode === 'medication' ? 'Medication' : 'Symptom'} Feed
                </span>
              </div>
            </div>

            <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-8">
              <button onClick={resetScanner} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
                <X size={24} />
              </button>
              
              <button 
                onClick={capturePhoto} 
                className="w-20 h-20 bg-white rounded-full border-4 border-blue-600 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-full"></div>
              </button>

              <button className="p-4 bg-white/10 rounded-full text-white backdrop-blur-md opacity-50 cursor-not-allowed">
                <Maximize2 size={24} />
              </button>
            </div>
          </div>
        )}

        {capturedImage && !isScanning && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center animate-in fade-in duration-300">
            <img src={capturedImage} className="w-full h-full object-contain" />
            <div className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg text-[10px] font-bold uppercase">Captured Frame</div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 z-10 animate-in fade-in duration-300">
            <div className="relative mb-6">
              <Loader2 className="animate-spin text-blue-600" size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-50 rounded-full"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing with Healthcare AI</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Cross-referencing global medical databases to provide accurate insights...</p>
          </div>
        )}
      </div>

      {result && (
        <div className="card p-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">Analysis Result</span>
              <h3 className="text-2xl font-bold text-slate-900">{scanMode === 'medication' ? result.name : result.condition}</h3>
            </div>
            <button 
              onClick={resetScanner} 
              className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              title="New Scan"
            >
              <RefreshCw size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{scanMode === 'medication' ? 'Dosage' : 'Severity'}</span>
              <p className="font-bold text-lg text-slate-900">{scanMode === 'medication' ? result.dosage : result.severity}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{scanMode === 'medication' ? 'Usage Guide' : 'Medical Overview'}</span>
              <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
                {scanMode === 'medication' ? result.usage : result.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {scanMode === 'medication' ? (
              <button 
                onClick={handleAddToSchedule} 
                disabled={isAdded}
                className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isAdded 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-95'
                }`}
              >
                {isAdded ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                {isAdded ? 'Added to Schedule' : 'Add Medication'}
              </button>
            ) : (
              <button 
                onClick={handleDiscussWithAI}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <MessageSquare size={20} strokeWidth={3} /> Discuss Symptoms
              </button>
            )}
            <button 
              onClick={resetScanner} 
              className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700 text-sm font-bold animate-in shake duration-300">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={20} />
          </div>
          {error}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}} />
    </div>
  );
};

export default HealthScanner;