import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../ChatContext';
import { format, isSameDay } from 'date-fns';
import { FiSend, FiUser, FiSearch, FiCheck, FiCheckCircle } from 'react-icons/fi';

const AdminChat = () => {
    const { conversations, messages, activeChat, joinChat, sendMessage, fetchAdminConversations } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('recent'); // 'recent' or 'all'
    const messagesEndRef = useRef(null);

    const filteredConversations = conversations.filter(c => {
        const name = c.farmerId?.name?.toLowerCase() || '';
        const email = c.farmerId?.email?.toLowerCase() || '';
        const district = c.farmerId?.district?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        return name.includes(search) || email.includes(search) || district.includes(search);
    });

    const displayList = viewMode === 'recent'
        ? filteredConversations.filter(c => !c.isVirtual || c.unreadCountAdmin > 0)
        : [...filteredConversations].sort((a, b) => (a.farmerId?.name || '').localeCompare(b.farmerId?.name || ''));

    useEffect(() => {
        fetchAdminConversations();
    }, [fetchAdminConversations]);

    // Auto-select first farmer on initial load or viewMode switch if nothing active
    const hasAutoSelected = useRef(false);
    useEffect(() => {
        if (!activeChat && displayList.length > 0 && !hasAutoSelected.current) {
            joinChat(displayList[0]._id);
            hasAutoSelected.current = true;
        }
    }, [displayList, activeChat, joinChat]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && activeChat) {
            sendMessage(activeChat, newMessage);
            setNewMessage('');
        }
    };

    const currentChat = conversations.find(c => c._id === activeChat);

    const formatMessageTime = (date) => {
        if (!date || new Date(date).getTime() === 0) return '';
        const d = new Date(date);
        if (isSameDay(d, new Date())) {
            return format(d, 'HH:mm');
        }
        return format(d, 'MMM d');
    };

    return (
        <div className="flex bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Sidebar Chat List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-slate-50/50">
                <div className="p-6 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chat</h2>
                        <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {conversations.filter(c => c.unreadCountAdmin > 0).length} New
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('recent')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'recent' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Recent
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'all' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Farmers
                        </button>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={viewMode === 'recent' ? "Search messages..." : "Search all farmers..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {displayList.length === 0 ? (
                        <div className="py-12 text-center">
                            <FiUser className="mx-auto text-4xl text-gray-200 mb-2" />
                            <p className="text-gray-400 font-bold text-sm">
                                {viewMode === 'recent' ? 'No recent conversations' : 'No approved farmers found'}
                            </p>
                        </div>
                    ) : (
                        displayList.map((chat) => (
                            <div
                                key={chat._id}
                                onClick={() => joinChat(chat._id)}
                                className={`p-4 rounded-3xl cursor-pointer transition-all duration-300 group relative ${activeChat === chat._id
                                    ? 'bg-white shadow-lg border border-emerald-100 ring-1 ring-emerald-500/5'
                                    : 'hover:bg-white hover:shadow-md border border-transparent'
                                    }`}
                            >
                                <div className="flex gap-4 items-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${activeChat === chat._id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {chat.farmerId?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-black truncate ${activeChat === chat._id ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {chat.farmerId?.name || 'Unknown Farmer'}
                                            </h3>
                                            <span className="text-[10px] font-black uppercase text-gray-400">
                                                {formatMessageTime(chat.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {chat.farmerId?.district && (
                                                <span className="text-[9px] font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-md uppercase">
                                                    {chat.farmerId.district}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate italic ${chat.unreadCountAdmin > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                                                {chat.isVirtual ? 'Start new chat' : (chat.lastMessage?.text || 'No messages yet')}
                                            </p>
                                            {chat.unreadCountAdmin > 0 && (
                                                <div className="bg-emerald-500 text-white text-[10px] font-black rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    {chat.unreadCountAdmin}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {chat.isVirtual && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Start</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">
                                    {currentChat?.farmerId?.name?.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-gray-900 text-lg">{currentChat?.farmerId?.name}</h3>
                                        {currentChat?.farmerId?.district && (
                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                                {currentChat.farmerId.district}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Connected</p>
                                        </div>
                                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <p className="text-xs font-semibold text-gray-400 lowercase">{currentChat?.farmerId?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 bg-slate-50/30">
                            {messages.length === 0 ? (
                                <div className="m-auto text-center space-y-2 opacity-30">
                                    <FiCheckCircle className="mx-auto text-6xl" />
                                    <p className="font-black uppercase tracking-widest text-xs">Start the conversation</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.senderRole === 'admin';
                                    return (
                                        <div
                                            key={msg._id || index}
                                            className={`max-w-[80%] flex flex-col ${isMe ? 'items-end ml-auto' : 'items-start mr-auto'}`}
                                        >
                                            <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium shadow-sm transition-all ${isMe
                                                ? 'bg-emerald-500 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5 px-2">
                                                <span className="text-[9px] font-black uppercase text-gray-400">
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                                {isMe && <FiCheck className="text-emerald-500 text-[10px]" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full pl-6 pr-16 py-4 bg-gray-100 border-none rounded-[2rem] focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <FiSend />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-6">
                            <FiSend className="text-5xl text-emerald-500 opacity-20" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 italic">Farmer Communication Portal</h2>
                        <p className="text-gray-400 font-medium text-sm max-w-xs">Select a farmer from the list on the left to view message history or start a new conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
