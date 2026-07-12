import React, { useState, useRef } from 'react';
import { 
  Pill, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Activity, 
  FileText, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  Search,
  ArrowRight,
  Info,
  BookOpen,
  X
} from 'lucide-react';
import { Medication, UserProfile } from '../types';
import { checkMedicationSafety, analyzePrescriptionImage } from '../services/geminiService';

interface DrugInteractionAnalysisProps {
  currentMeds: Medication[];
  userProfile: UserProfile | null;
}

interface NewMedCompare {
  id: string;
  name: string;
  dosage?: string;
  source: 'manual' | 'ocr';
}

const COMMON_DRUGS_AUTOCOMPLETE = [
  'Lisinopril', 'Levothyroxine', 'Atorvastatin', 'Metformin', 'Amlodipine',
  'Metoprolol', 'Albuterol', 'Omeprazole', 'Simvastatin', 'Losartan',
  'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Montelukast', 'Fluticasone',
  'Amoxicillin', 'Furosemide', 'Pantoprazole', 'Acetaminophen', 'Ibuprofen',
  'Aspirin', 'Warfarin', 'Clopidogrel', 'Prednisone', 'Azithromycin',
  'Ciprofloxacin', 'Duloxetine', 'Escitalopram', 'Fluoxetine',
  'Alprazolam', 'Zolpidem', 'Clonazepam', 'Lorazepam', 'Tramadol',
  'Meloxicam', 'Trazodone', 'Carvedilol', 'Tamsulosin', 'Potassium Chloride'
];

const DrugInteractionAnalysis: React.FC<DrugInteractionAnalysisProps> = ({ 
  currentMeds = [], 
  userProfile 
}) => {
  const [newMeds, setNewMeds] = useState<NewMedCompare[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestions for drugs
  const filteredSuggestions = COMMON_DRUGS_AUTOCOMPLETE.filter(drug => 
    drug.toLowerCase().includes(manualInput.toLowerCase()) &&
    !newMeds.some(m => m.name.toLowerCase() === drug.toLowerCase())
  );

  const handleAddManualMed = (nameToUse?: string) => {
    const finalName = (nameToUse || manualInput).trim();
    if (!finalName) return;

    // Check if already in analysis list
    if (newMeds.some(m => m.name.toLowerCase() === finalName.toLowerCase())) {
      setError(`"${finalName}" is already in your comparison list.`);
      return;
    }

    const newMed: NewMedCompare = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalName.charAt(0).toUpperCase() + finalName.slice(1),
      source: 'manual'
    };

    setNewMeds(prev => [...prev, newMed]);
    setManualInput('');
    setShowSuggestions(false);
    setError(null);
  };

  const handleRemoveMed = (id: string) => {
    setNewMeds(prev => prev.filter(m => m.id !== id));
    setError(null);
  };

  // OCR Processing for Uploaded Prescription
  const processPrescriptionFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file of a prescription.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await analyzePrescriptionImage(base64);
        
        if (extracted && extracted.length > 0) {
          const addedMeds: NewMedCompare[] = [];
          extracted.forEach((m: any) => {
            if (!newMeds.some(existing => existing.name.toLowerCase() === m.name.toLowerCase())) {
              addedMeds.push({
                id: Math.random().toString(36).substr(2, 9),
                name: m.name,
                dosage: m.dosage,
                source: 'ocr'
              });
            }
          });

          if (addedMeds.length > 0) {
            setNewMeds(prev => [...prev, ...addedMeds]);
          } else {
            setError('All medications found in the scanned prescription are already in your comparison list.');
          }
        } else {
          setError('No new medication names could be identified from the uploaded image. Try entering manually.');
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Failed to scan and analyze prescription image.');
      setIsScanning(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPrescriptionFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPrescriptionFile(file);
    }
  };

  // Interaction Analysis trigger
  const handleRunAnalysis = async () => {
    if (newMeds.length === 0) {
      setError('Please add at least one new medication or upload a prescription to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Compile full list of medicines to evaluate
      // Format current meds to be passed
      const currentFormatted = currentMeds.map(m => ({ name: m.name }));
      
      // We will check one by one or batch check
      // Our checkMedicationSafety handles checking active medications + a new medication
      // But we can check multiple by combining them.
      // Let's analyze the safety of all of them combined:
      const combinedMedsList = [...currentMeds];
      newMeds.forEach(m => {
        combinedMedsList.push({
          id: m.id,
          profileId: userProfile?.id || 'guest',
          name: m.name,
          dosage: m.dosage || 'Standard Dose',
          frequency: '',
          timeOfDay: [],
          remaining: 1,
          total: 1,
          reminders: []
        });
      });

      const result = await checkMedicationSafety(currentMeds, newMeds.map(m => m.name).join(', '), userProfile);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError('Clinical interaction check failed. Please check network and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setNewMeds([]);
    setAnalysisResult(null);
    setError(null);
  };

  // Risk styling helpers
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-700 font-extrabold';
      case 'moderate':
        return 'bg-amber-50 border-amber-200 text-amber-700 font-bold';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700 font-medium';
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium';
    }
  };

  const getSeverityBannerClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'moderate':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-rose-600';
      case 'high':
        return 'text-orange-600';
      case 'moderate':
        return 'text-amber-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-emerald-600';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-wider">
            <ShieldAlert size={14} />
            <span>Preventative Clinical Safety</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Drug Interaction Analysis</h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Compare new medications or scanned prescriptions against the patient's existing regimen. 
            Powered by the MediShield Clinical AI Engine for real-time drug-drug conflicts, duplication, and allergen alerts.
          </p>
        </div>
        {newMeds.length > 0 && (
          <button 
            onClick={clearAll}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all"
          >
            Clear Analysis Workspace
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800 leading-relaxed animate-in slide-in-from-top">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="font-bold">Safety Check Blocked</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold uppercase text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: INPUT WORKSPACE (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Current Regimen Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Pill size={14} className="text-blue-600" />
              Patient's Current Regimen ({currentMeds.length})
            </h3>
            
            {currentMeds.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                No active medications listed in current profile.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {currentMeds.map(med => (
                  <div 
                    key={med.id} 
                    className="flex items-center gap-2 py-1.5 px-3 bg-blue-50/60 hover:bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{med.name}</span>
                    <span className="text-[10px] text-blue-500 font-normal">({med.dosage})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Medication Addition Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Add New Medicines to Analyze</h4>
              <p className="text-xs text-slate-400 mt-0.5">Type medication names manually or drop in a prescription label image.</p>
            </div>

            {/* Manual input */}
            <div className="relative space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Manual Search & Entry</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Enter medicine name (e.g. Ibuprofen, Warfarin...)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white text-xs font-medium text-slate-700"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualMed();
                      }
                    }}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && manualInput.trim() && filteredSuggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-150">
                      {filteredSuggestions.map(drug => (
                        <button
                          key={drug}
                          type="button"
                          onClick={() => handleAddManualMed(drug)}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <span>{drug}</span>
                          <span className="text-[9px] font-bold text-blue-500 uppercase">Common</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddManualMed()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} /> Add Drug
                </button>
              </div>
            </div>

            {/* Splitter */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-150"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-150"></div>
            </div>

            {/* Drag & Drop File Upload */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/20' 
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center gap-3">
                <div className={`p-3 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600 animate-bounce' : 'bg-slate-100 text-slate-500'}`}>
                  {isScanning ? (
                    <Loader2 size={24} className="animate-spin text-blue-600" />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                {isScanning ? (
                  <div>
                    <h5 className="font-bold text-slate-700 text-xs">Scanning Prescription...</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tesseract OCR processing pixel data structure.</p>
                  </div>
                ) : (
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Upload Prescription Image</h5>
                    <p className="text-[10px] text-slate-400 mt-1">Drag and drop, or click to browse. Supports PNG, JPG, JPEG labels.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Compare list table */}
          {newMeds.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in slide-in-from-bottom">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Comparison Queue ({newMeds.length})</span>
                <span className="text-[9px] font-medium text-slate-400">Ready to compare against Current Regimen</span>
              </h4>
              
              <div className="divide-y divide-slate-100">
                {newMeds.map(med => (
                  <div key={med.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                        <Pill size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{med.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Source: {med.source === 'ocr' ? 'Scanned Prescription Label' : 'Manually Entered'}
                          {med.dosage && ` • Suggested Dose: ${med.dosage}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveMed(med.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove drug"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || isScanning}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Comparing Safety Vectors...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Scan & Analyze Interactions
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: SAFETY ANALYSIS OUTPUT (5 cols) */}
        <div className="lg:col-span-5">
          {isAnalyzing ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full flex flex-col items-center justify-center text-center gap-4 min-h-[350px]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <Activity size={24} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="font-extrabold text-slate-800 text-sm">Evaluating Cross-Interactions</h4>
                <p className="text-[10px] text-slate-400">
                  MediShield AI Engine is evaluating RxNorm clinical mappings, organ warnings, and patient allergy databases...
                </p>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6 animate-in slide-in-from-right">
              
              {/* Overall Risk Banner */}
              <div className={`border rounded-2xl p-5 shadow-sm space-y-3 ${getSeverityBannerClass(analysisResult.overallSeverity)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider">Overall Safety Metric</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getSeverityBadgeClass(analysisResult.overallSeverity)}`}>
                    {analysisResult.overallSeverity || 'Safe'} Risk
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                    <ShieldAlert size={16} className={getSeverityIconColor(analysisResult.overallSeverity)} />
                    {analysisResult.overallSeverity === 'safe' 
                      ? 'No Acute Interactions Flagged' 
                      : `${analysisResult.overallSeverity.toUpperCase()} Hazard Conflict Warned`}
                  </h4>
                  <p className="text-xs mt-1.5 leading-relaxed font-medium">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>

              {/* Specific Findings Loop */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest px-1">Detailed Clinical Mappings</h4>
                
                {analysisResult.findings && analysisResult.findings.length > 0 ? (
                  analysisResult.findings.map((finding: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border capitalize ${getSeverityBadgeClass(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs mt-2">{finding.title}</h5>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {finding.explanation}
                      </p>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} /> Actionable Clinical Advice
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          {finding.recommendation}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <BookOpen size={10} className="text-slate-300" />
                        Ref: {finding.reference}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm space-y-2">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Perfect Clinical Alignment</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">No drug-drug, organ, or patient allergy conflicts found in active records.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Referenced Sources */}
              {analysisResult.referencedSources && (
                <div className="bg-white/50 border border-slate-200/60 rounded-xl p-3 text-[9px] text-slate-400 font-semibold space-y-1.5">
                  <p className="uppercase tracking-widest text-[8px] font-black">Clinical Catalogs Verified:</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
                    {analysisResult.referencedSources.map((source: string) => (
                      <span key={source} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full flex flex-col items-center justify-center text-center gap-4 min-h-[350px] border-dashed">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <Info size={28} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="font-extrabold text-slate-800 text-sm">Interaction Analysis Output</h4>
                <p className="text-[10px] text-slate-400">
                  Add new medications or drop a scanned prescription label, then click "Scan & Analyze Interactions" to verify safety boundaries.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DrugInteractionAnalysis;
