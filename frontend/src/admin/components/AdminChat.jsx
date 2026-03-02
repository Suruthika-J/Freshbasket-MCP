import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../ChatContext';
import { format } from 'date-fns';

const AdminChat = () => {
    const { conversations, messages, activeChat, joinChat, sendMessage, fetchAdminConversations } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchAdminConversations();
    }, [fetchAdminConversations]);

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

    return (
        <div className="flex bg-white shadow-xl rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
            {/* Sidebar Chat List */}
            <div className="w-1/3 border-r fb-bg-secondary flex flex-col">
                <div className="p-4 border-b bg-white">
                    <h2 className="text-xl font-bold fb-text">Farmer Chats</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center fb-text-secondary">No active chats</div>
                    ) : (
                        conversations.map((chat) => (
                            <div
                                key={chat._id}
                                onClick={() => joinChat(chat._id)}
                                className={`p-4 border-b cursor-pointer hover:fb-surface transition-colors ${activeChat === chat._id ? 'bg-[#e7f3ff] border-l-4 border-fb-primary' : 'bg-white'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold fb-text">{chat.farmerId?.name || 'Unknown Farmer'}</h3>
                                        <p className="text-xs fb-text-secondary truncate w-40">
                                            {chat.lastMessage?.text || 'No messages yet'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] fb-text-secondary">
                                            {chat.updatedAt ? format(new Date(chat.updatedAt), 'HH:mm') : ''}
                                        </span>
                                        {chat.unreadCountAdmin > 0 && (
                                            <div className="bg-[#25D366] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center mt-1 ml-auto">
                                                {chat.unreadCountAdmin}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-[#f0f2f5]">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b flex items-center shadow-sm">
                            <div className="ml-3">
                                <h3 className="font-bold fb-text">{currentChat?.farmerId?.name}</h3>
                                <p className="text-xs text-green-500">Connected</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2">
                            {messages.map((msg, index) => {
                                const isMe = msg.senderRole === 'admin';
                                return (
                                    <div
                                        key={msg._id || index}
                                        className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                ? 'bg-[#dcf8c6] self-end rounded-tr-none'
                                                : 'bg-white self-start rounded-tl-none shadow-sm'
                                            }`}
                                    >
                                        <p className="text-sm fb-text leading-tight">{msg.text}</p>
                                        <span className="text-[10px] text-gray-500 block text-right mt-1">
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] flex items-center space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 p-2 rounded-full border-none focus:ring-2 focus:ring-fb-primary outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-fb-primary text-white p-2 rounded-full hover:opacity-90 transition-opacity"
                            >
                                <i className="fas fa-paper-plane px-1"></i>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center fb-text-secondary">
                        <i className="fas fa-comments text-6xl mb-4 opacity-20"></i>
                        <p>Select a farmer to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
