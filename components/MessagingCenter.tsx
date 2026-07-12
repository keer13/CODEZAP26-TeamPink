import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Send, Search, UserPlus, Check, X,
  Clock, Stethoscope, ChevronRight, User, Sparkles,
  AlertCircle, CheckCircle, XCircle, Shield, History
} from 'lucide-react';
import { Conversation, DirectMessage, ConnectionRequest, Doctor, UserProfile } from '../types';
import { dbService } from '../services/dbService';
import MedicalHistoryModal from './MedicalHistoryModal';

interface MessagingCenterProps {
  currentPatient: UserProfile;
  verifiedDoctors: Doctor[];
  conversations: Conversation[];
  connectionRequests: ConnectionRequest[];
  onSendConnectionRequest: (doctor: Doctor, message: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  onConversationsChange: (convs: Conversation[]) => void;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  currentPatient,
  verifiedDoctors,
  conversations,
  connectionRequests,
  onSendConnectionRequest,
  onSendMessage,
  onConversationsChange,
}) => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests' | 'doctors'>('inbox');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [connectModal, setConnectModal] = useState<Doctor | null>(null);
  const [connectMsg, setConnectMsg] = useState('');
  const [showMedHistory, setShowMedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;
  const myRequests = connectionRequests.filter(r => r.patientEmail === currentPatient.email);
  const acceptedConvs = conversations.filter(c => c.connectionStatus === 'accepted' && c.patientId === currentPatient.id);

  useEffect(() => {
    if (activeConvId) {
      const msgs = dbService.getMessages(activeConvId);
      setMessages(msgs);
      // Mark as read
      const updated = conversations.map(c =>
        c.id === activeConvId ? { ...c, unreadByPatient: 0 } : c
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
      const msgs = dbService.getMessages(activeConvId);
      setMessages(msgs);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  const handleSend = () => {
    if (!messageInput.trim() || !activeConvId) return;
    onSendMessage(activeConvId, messageInput.trim());
    // Refresh immediately
    setTimeout(() => {
      setMessages(dbService.getMessages(activeConvId));
    }, 50);
    setMessageInput('');
  };

  const handleConnect = () => {
    if (!connectModal) return;
    onSendConnectionRequest(connectModal, connectMsg.trim());
    setConnectModal(null);
    setConnectMsg('');
    setActiveTab('requests');
  };

  const filteredDoctors = verifiedDoctors.filter(d =>
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const totalUnread = conversations.filter(c => c.patientId === currentPatient.id).reduce((sum, c) => sum + c.unreadByPatient, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] max-h-[800px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base">Messages</h2>
              {totalUnread > 0 && (
                <p className="text-xs text-blue-600 font-bold">{totalUnread} unread</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['inbox', 'requests', 'doctors'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'requests' && myRequests.length > 0 ? (
                  <span className="flex items-center justify-center gap-1">
                    {tab} <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{myRequests.length}</span>
                  </span>
                ) : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="flex-1 overflow-y-auto">
            {acceptedConvs.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Connect to a doctor to start chatting</p>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
                >
                  Browse Doctors
                </button>
              </div>
            ) : (
              acceptedConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-white transition-all flex items-center gap-3 ${
                    activeConvId === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {conv.doctorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-slate-800 truncate">{conv.doctorName}</p>
                      {conv.unreadByPatient > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 ml-1 flex-shrink-0">
                          {conv.unreadByPatient}
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
            {myRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No requests sent</p>
              </div>
            ) : (
              myRequests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs">
                      {req.doctorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{req.doctorName}</p>
                      <p className="text-xs text-slate-400">{req.requestDate}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit ${
                    req.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {req.status === 'pending' && <Clock size={11} />}
                    {req.status === 'accepted' && <CheckCircle size={11} />}
                    {req.status === 'declined' && <XCircle size={11} />}
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </div>
                  {req.message && (
                    <p className="text-xs text-slate-500 mt-2 italic">"{req.message}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Browse Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={doctorSearch}
                  onChange={e => setDoctorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2 px-4 pb-4">
              {filteredDoctors.map(doc => {
                const alreadyConnected = myRequests.some(r => r.doctorEmail === doc.email);
                return (
                  <div key={doc.id} className="bg-white rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.specialty}</p>
                    </div>
                    <button
                      onClick={() => !alreadyConnected && setConnectModal(doc)}
                      disabled={alreadyConnected}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all flex-shrink-0 ${
                        alreadyConnected
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {alreadyConnected ? 'Requested' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-black">
                  {activeConv.doctorName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{activeConv.doctorName}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-600 font-semibold">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMedHistory(true)}
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
                  <p className="text-xs mt-1">Send a message to your doctor</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderRole === 'patient';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
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
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-5">
              <MessageSquare size={36} className="text-blue-300" />
            </div>
            <h3 className="text-xl font-black text-slate-600 mb-2">Select a conversation</h3>
            <p className="text-sm text-center max-w-xs leading-relaxed">
              Choose a conversation from the inbox, or connect to a new doctor to start chatting securely.
            </p>
            <button
              onClick={() => setActiveTab('doctors')}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <UserPlus size={16} />
              Connect to a Doctor
            </button>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectModal && (
          <div className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900">Send Connection Request</h3>
                <button onClick={() => setConnectModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
                  {connectModal.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900">{connectModal.name}</p>
                  <p className="text-sm text-slate-500">{connectModal.specialty}</p>
                  <p className="text-xs text-teal-600 font-semibold">{connectModal.hospital}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-600 mb-2">Optional Introduction Message</label>
                <textarea
                  rows={3}
                  value={connectMsg}
                  onChange={e => setConnectMsg(e.target.value)}
                  placeholder="Hi Dr., I'd like to connect regarding my health condition..."
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
                <Shield size={12} />
                <span>Your request will be reviewed by the doctor. HIPAA secure.</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConnect}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                >
                  Send Request
                </button>
                <button
                  onClick={() => setConnectModal(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Medical History Modal */}
      {showMedHistory && (
        <MedicalHistoryModal
          patient={currentPatient}
          isDoctor={false}
          onClose={() => setShowMedHistory(false)}
        />
      )}
    </div>
  );
};

export default MessagingCenter;
