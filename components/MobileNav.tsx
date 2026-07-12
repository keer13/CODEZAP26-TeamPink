import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Camera, 
  MessageSquare, 
  Calendar,
  Inbox
} from 'lucide-react';
import { NavigationTab } from '../types';

interface MobileNavProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  unreadMessages?: number;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, unreadMessages = 0 }) => {
  const tabs = [
    { id: NavigationTab.DASHBOARD, label: 'Home', icon: LayoutDashboard, badge: 0 },
    { id: NavigationTab.MEDICATIONS, label: 'Meds', icon: Pill, badge: 0 },
    { id: NavigationTab.MESSAGES, label: 'Chat', icon: Inbox, badge: unreadMessages },
    { id: NavigationTab.APPOINTMENTS, label: 'Appts', icon: Calendar, badge: 0 },
    { id: NavigationTab.AI_CONSULT, label: 'AI', icon: MessageSquare, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-standard relative ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;