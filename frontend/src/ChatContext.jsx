import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]); // For Admin
    const [messages, setMessages] = useState([]); // For current active chat
    const [activeChat, setActiveChat] = useState(null);
    const [unreadTotal, setUnreadTotal] = useState(0);

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    // Get token from all possible storage locations
    const getToken = () => {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            try {
                return JSON.parse(adminSession).token;
            } catch (e) {
                return null;
            }
        }
        return localStorage.getItem('authToken');
    };

    const token = getToken();
    const userRole = localStorage.getItem('userRole') || (localStorage.getItem('adminSession') ? 'admin' : null);

    // Initialize Socket
    useEffect(() => {
        if (!token) return;

        const newSocket = io(backendUrl, {
            auth: { token },
            transports: ['websocket']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('🔌 Connected to chat socket');
        });

        newSocket.on('receiveMessage', (message) => {
            // If the message is for the current active chat, add it to messages
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.find(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        });

        newSocket.on('chatListUpdate', (data) => {
            // Update the conversations list for admin
            setConversations((prev) => {
                const index = prev.findIndex(c => c._id === data.chatId);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        lastMessage: data.lastMessage,
                        unreadCountAdmin: data.unreadCountAdmin || updated[index].unreadCountAdmin,
                        unreadCountFarmer: data.unreadCountFarmer || updated[index].unreadCountFarmer,
                        updatedAt: new Date().toISOString()
                    };
                    return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                }
                return prev;
            });

            // Re-fetch list if it's a new conversation or for better accuracy
            if (userRole === 'admin') {
                fetchAdminConversations();
            }
        });

        return () => {
            newSocket.disconnect();
            console.log('🔌 Disconnected from chat socket');
        };
    }, [token, backendUrl, userRole]);

    const fetchAdminConversations = useCallback(async () => {
        if (userRole !== 'admin') return;
        try {
            const res = await axios.get(`${backendUrl}/api/direct-chat/admin/conversations`, {
                headers: { token }
            });
            if (res.data.success) {
                setConversations(res.data.conversations);
                const total = res.data.conversations.reduce((acc, conv) => acc + (conv.unreadCountAdmin || 0), 0);
                setUnreadTotal(total);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [backendUrl, token, userRole]);

    const fetchMessages = useCallback(async (chatId) => {
        try {
            const res = await axios.get(`${backendUrl}/api/direct-chat/messages/${chatId}`, {
                headers: { token }
            });
            if (res.data.success) {
                setMessages(res.data.messages);
                // Mark as seen
                await axios.post(`${backendUrl}/api/direct-chat/seen/${chatId}`, {}, {
                    headers: { token }
                });
                // Update local counts
                if (userRole === 'admin') fetchAdminConversations();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [backendUrl, token, userRole, fetchAdminConversations]);

    const joinChat = useCallback((chatId) => {
        if (socket) {
            socket.emit('joinChat', chatId);
            setActiveChat(chatId);
            fetchMessages(chatId);
        }
    }, [socket, fetchMessages]);

    const sendMessage = useCallback((chatId, text) => {
        if (socket && text.trim()) {
            socket.emit('sendMessage', { chatId, text });
        }
    }, [socket]);

    const getOrCreateFarmerChat = useCallback(async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/direct-chat/farmer/conversation`, {
                headers: { token }
            });
            if (res.data.success) {
                const chatId = res.data.conversation._id;
                joinChat(chatId);
                return res.data.conversation;
            }
        } catch (error) {
            console.error('Error getting farmer chat:', error);
        }
    }, [backendUrl, token, joinChat]);

    return (
        <ChatContext.Provider value={{
            socket,
            conversations,
            messages,
            activeChat,
            joinChat,
            sendMessage,
            fetchAdminConversations,
            getOrCreateFarmerChat,
            unreadTotal
        }}>
            {children}
        </ChatContext.Provider>
    );
};
