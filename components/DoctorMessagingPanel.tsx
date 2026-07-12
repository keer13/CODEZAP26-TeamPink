import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Send, Check, X, Clock, Sparkles,
  History, UserCheck, UserX, Bell, ChevronRight, Shield,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Conversation, DirectMessage, ConnectionRequest, UserProfile } from '../types';
import { dbService } from '../services/dbService';
import MedicalHistoryModal from './MedicalHistoryModal';

interface DoctorMessagingPanelProps {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  allPatients: UserProfile[];
  conversations: Conversation[];
  connectionRequests: ConnectionRequest[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  onConversationsChange: (convs: Conversation[]) => void;
}

const DoctorMessagingPanel: React.FC<DoctorMessagingPanelProps> = ({
  doctorId,
  doctorName,
  doctorEmail,
  allPatients,
  conversations,
  connectionRequests,
  onAcceptRequest,
  onDeclineRequest,
  onSendMessage,
  onConversationsChange,
}) => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
  const [historyPatient, setHistoryPatient] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myConversations = conversations.filter(
    c => c.doctorEmail === doctorEmail && c.connectionStatus === 'accepted'
  );
  const pendingRequests = connectionRequests.filter(
    r => r.doctorEmail === doctorEmail && r.status === 'pending'
  );
  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  useEffect(() => {
    if (activeConvId) {
      const msgs = dbService.getMessages(activeConvId);
      setMessages(msgs);
      // Mark as read by doctor
      const updated = conversations.map(c =>
        c.id === activeConvId ? { ...c, unreadByDoctor: 0 } : c
      );
      onConversationsChange(updated);
      dbService.saveConversations(updated);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!activeConvId) return;
    const interval = setInterval(() => {
      setMessages(dbService.getMessages(activeConvId));
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  const handleSend = () => {
    if (!messageInput.trim() || !activeConvId) return;
    onSendMessage(activeConvId, messageInput.trim());
    setTimeout(() => {
      setMessages(dbService.getMessages(activeConvId));
    }, 50);
    setMessageInput('');
  };

  const getPatientForConv = (conv: Conversation) =>
    allPatients.find(p => p.id === conv.patientId) || {
      id: conv.patientId,
      name: conv.patientName,
      email: conv.patientEmail,
      phone: '',
      age: '',
      weight: '',
      bloodType: '',
      notifications: { enabled: false },
    } as UserProfile;

  const totalUnread = myConversations.reduce((sum, c) => sum + c.unreadByDoctor, 0);

  return (
    <div className="flex h-[calc(100vh-12rem)] max-h-[750px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base">Patient Messages</h2>
              {totalUnread > 0 && <p className="text-xs text-teal-600 font-bold">{totalUnread} unread</p>}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'inbox' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Inbox {totalUnread > 0 && <span className="ml-1 bg-teal-500 text-white rounded-full px-1 text-[9px]">{totalUnread}</span>}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
                activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white rounded-full px-1 text-[9px]">{pendingRequests.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Inbox */}
        {activeTab === 'inbox' && (
          <div className="flex-1 overflow-y-auto">
            {myConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No active conversations</p>
                <p className="text-xs text-slate-400 mt-1">Accept patient requests to start chatting</p>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-all"
                >
                  View Requests
                </button>
              </div>
            ) : (
              myConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-white transition-all flex items-center gap-3 ${
                    activeConvId === conv.id ? 'bg-teal-50 border-l-2 border-l-teal-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {conv.patientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-slate-800 truncate">{conv.patientName}</p>
                      {conv.unreadByDoctor > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 ml-1 flex-shrink-0">
                          {conv.unreadByDoctor}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
                      {req.patientName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800">{req.patientName}</p>
                      <p className="text-xs text-slate-400">{req.patientEmail}</p>
                    </div>
                    <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Clock size={9} /> Pending
                    </span>
                  </div>
                  {req.message && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl p-2.5 mb-3">
                      "{req.message}"
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRequest(req.id)}
                      className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-100"
                    >
                      <UserCheck size={12} /> Accept
                    </button>
                    <button
                      onClick={() => onDeclineRequest(req.id)}
                      className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 border border-red-100"
                    >
                      <UserX size={12} /> Decline
                    </button>
                  </div>
                </motion.div>
              ))
            )}

            {/* Historical requests */}
            {connectionRequests.filter(r => r.doctorEmail === doctorEmail && r.status !== 'pending').length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 mt-4">Past Requests</p>
                {connectionRequests.filter(r => r.doctorEmail === doctorEmail && r.status !== 'pending').map(req => (
                  <div key={req.id} className="flex items-center gap-2 py-2">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                      {req.patientName.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-600 font-semibold flex-1">{req.patientName}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black">
                  {activeConv.patientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{activeConv.patientName}</h3>
                  <p className="text-xs text-slate-400 font-medium">{activeConv.patientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryPatient(getPatientForConv(activeConv))}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <History size={14} />
                Medical History
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50 to-white">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Sparkles size={40} className="mb-3 opacity-30" />
                  <p className="font-semibold text-sm">Start the conversation</p>
                  <p className="text-xs mt-1">Send a message to your patient</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderRole === 'doctor';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!isMe && (
                          <span className="text-[10px] text-slate-400 font-bold px-1 ml-1">{msg.senderName}</span>
                        )}
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-md'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Reply to patient..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-emerald-100 rounded-3xl flex items-center justify-center mb-5">
              <MessageSquare size={36} className="text-teal-300" />
            </div>
            <h3 className="text-xl font-black text-slate-600 mb-2">Select a conversation</h3>
            <p className="text-sm text-center max-w-xs leading-relaxed">
              Select a patient conversation from your inbox, or review pending connection requests.
            </p>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
              >
                <Bell size={16} />
                {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Medical History Drawer */}
      {historyPatient && (
        <MedicalHistoryModal
          patient={historyPatient}
          isDoctor={true}
          doctorName={doctorName}
          onClose={() => setHistoryPatient(null)}
        />
      )}
    </div>
  );
};

export default DoctorMessagingPanel;
