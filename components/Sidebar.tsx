import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Camera, 
  MessageSquare, 
  LineChart, 
  HeartPulse,
  User, 
  HelpCircle, 
  ChevronRight, 
  ShieldCheck,
  ShieldAlert,
  X,
  LogOut,
  Users,
  Check,
  Calendar,
  Inbox
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onLogout: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onAddProfile: () => void;
  isOpen: boolean;
  onClose: () => void;
  unreadMessages?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  onLogout,
  profiles = [],
  activeProfileId,
  onSwitchProfile,
  onAddProfile,
  isOpen,
  onClose,
  unreadMessages = 0,
}) => {
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const menuItems = [
    { id: NavigationTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: NavigationTab.MEDICATIONS, label: 'Medications', icon: Pill, badge: 0 },
    { id: NavigationTab.MESSAGES, label: 'Messages', icon: Inbox, badge: unreadMessages },
    { id: NavigationTab.HEALTH_SCANNER, label: 'Health Scanner', icon: Camera, badge: 0 },
    { id: NavigationTab.AI_CONSULT, label: 'AI Assistant', icon: MessageSquare, badge: 0 },
    { id: NavigationTab.INSIGHTS, label: 'Health Insights', icon: LineChart, badge: 0 },
    { id: NavigationTab.APPOINTMENTS, label: 'Appointments', icon: Calendar, badge: 0 },
    { id: NavigationTab.DRUG_INTERACTION, label: 'Drug Interaction', icon: ShieldAlert, badge: 0 },
    { id: NavigationTab.PROFILE, label: 'Profile & Settings', icon: User, badge: 0 },
    { id: NavigationTab.HELP_CENTER, label: 'Help Center', icon: HelpCircle, badge: 0 },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onClose(); // Close drawer on mobile after selection
  };

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <HeartPulse className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              Healthcare AI
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Navigation</p>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-standard ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="opacity-50" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Profile Switcher & Logout Section */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {activeProfile && (
            <div className="relative">
              <button 
                onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 transition-all text-left text-white"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(activeProfile.name)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold truncate leading-snug">{activeProfile.name}</h4>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Patient Account</p>
                  </div>
                </div>
                {profiles.length > 1 && (
                  <Users size={14} className="text-slate-400 shrink-0" />
                )}
              </button>

              {/* Profile switcher menu */}
              {showProfileSwitcher && profiles.length > 1 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-750 rounded-xl shadow-xl overflow-hidden z-25 py-1">
                  <p className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-500 tracking-wider">Switch Profile</p>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitchProfile(p.id);
                        setShowProfileSwitcher(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors text-left font-medium"
                    >
                      <span className={p.id === activeProfileId ? 'text-white font-bold' : ''}>{p.name}</span>
                      {p.id === activeProfileId && <Check size={12} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Elegant Sign Out / Switch Users Option */}
          {!confirmSignOut ? (
            <button 
              onClick={() => {
                setConfirmSignOut(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-left font-bold text-xs group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Sign Out / Switch Users</span>
            </button>
          ) : (
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-2.5 space-y-2 animate-fadeIn">
              <p className="text-[10px] font-bold text-red-300 text-center">Confirm Medical Sign Out?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                    setConfirmSignOut(false);
                  }}
                  className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-[10px] font-black text-center transition-all"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setConfirmSignOut(false)}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold text-center transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* HIPAA secure branding info */}
          <div className="bg-slate-800/50 p-3.5 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase">
              <ShieldCheck size={12} /> HIPAA SECURE
            </div>
            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
              Personal health data is fully encrypted, sandboxed, and private.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
