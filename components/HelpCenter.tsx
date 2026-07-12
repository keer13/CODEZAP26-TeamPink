import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  MessageSquare, 
  ShieldCheck, 
  Camera, 
  Pill,
  HelpCircle,
  ExternalLink,
  MessageCircleQuestion,
  LifeBuoy
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    category: 'Medications',
    question: 'How do I add a new medication?',
    answer: 'You can add a medication in two ways: Manually by clicking "Add New" in the Medications tab, or by scanning a label/prescription in the Scan Meds or Medications Bulk Import section. Healthcare AI will automatically extract details for you.'
  },
  {
    id: '2',
    category: 'Medications',
    question: 'How do I set up medication reminders?',
    answer: 'When adding or editing a medication, you can specify multiple reminder times. Healthcare AI will trigger browser notifications and in-app alarms at those exact times.'
  },
  {
    id: '3',
    category: 'AI Assistant',
    question: 'Is the AI advice medical-grade?',
    answer: 'While Healthcare AI is trained on medical data, it is not a doctor. It provides information based on medical literature and your history, but you should always consult a healthcare professional for diagnosis or treatment changes.'
  },
  {
    id: '4',
    category: 'Scanning',
    question: 'The scanner isn\'t identifying my pills correctly. What should I do?',
    answer: 'Ensure you have good lighting and the label is clearly visible. If it still fails, you can use the Manual Entry form to ensure all information is 100% accurate.'
  },
  {
    id: '5',
    category: 'Data & Privacy',
    question: 'Is my health data secure?',
    answer: 'Yes. Healthcare AI uses industry-standard encryption for data storage and transmission. Your personal health information is synchronized securely and is only accessible through your account.'
  },
  {
    id: '6',
    category: 'Insights',
    question: 'How is adherence calculated?',
    answer: 'Adherence is calculated based on the ratio of "Mark Taken" actions versus the total number of scheduled doses for a given period. We provide a weekly compliance percentage in the Insights tab.'
  }
];

const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const guides = [
    { title: 'Getting Started', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Scanning Tips', icon: Camera, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'AI Best Practices', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Data Security', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
          <LifeBuoy size={16} /> Healthcare AI Support Center
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">How can we help you?</h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Search our knowledge base or browse frequently asked questions to get the most out of your health companion.
        </p>

        <div className="relative max-w-2xl mx-auto mt-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            type="text" 
            placeholder="Search for articles, guides, or questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-6 bg-white border-2 border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/50 focus:outline-none focus:border-blue-500 transition-all text-lg font-medium"
          />
        </div>
      </header>

      {/* Quick Guides */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
        {guides.map((guide, idx) => (
          <button key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className={`w-14 h-14 ${guide.bg} ${guide.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <guide.icon size={28} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{guide.title}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">User Guide</p>
          </button>
        ))}
      </section>

      {/* FAQs Section */}
      <section className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <MessageCircleQuestion size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Frequently Asked Questions</h3>
          </div>
          <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            View All <ExternalLink size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`rounded-3xl border transition-all ${openFaq === faq.id ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <button 
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{faq.category}</span>
                    <span className="font-bold text-slate-800">{faq.question}</span>
                  </div>
                  {openFaq === faq.id ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
              <HelpCircle size={48} className="mb-4 opacity-20" />
              <p className="font-bold">No results found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Try different keywords or browse the categories.</p>
            </div>
          )}
        </div>
      </section>

      {/* Support Contact */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-black">Still have questions?</h3>
            <p className="text-indigo-200 font-medium max-w-md">
              Our support team is available 24/7 to help you with technical issues or complex medical questions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition-all">
              Live Chat Now
            </button>
            <button className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all">
              Email Support
            </button>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      </section>
    </div>
  );
};

export default HelpCenter;