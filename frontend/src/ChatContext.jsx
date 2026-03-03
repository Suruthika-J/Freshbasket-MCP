import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]); // For Admin
    const [messages, setMessages] = useState([]); // For current active chat
    const [activeChat, setActiveChat] = useState(null);
    const [unreadTotal, setUnreadTotal] = useState(0);

    // Get token from all possible storage locations
    const getToken = useCallback(() => {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            try {
                return JSON.parse(adminSession).token;
            } catch (e) {
                return null;
            }
        }
        return localStorage.getItem('authToken');
    }, []);

    const [token, setToken] = useState(getToken());
    const [userRole, setUserRole] = useState(() => {
        if (localStorage.getItem('adminSession')) return 'admin';
        return localStorage.getItem('userRole') || null;
    });

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    // Sync auth state on mount and when storage changes
    useEffect(() => {
        const syncAuth = () => {
            const t = getToken();
            const r = localStorage.getItem('adminSession') ? 'admin' : (localStorage.getItem('userRole') || null);
            setToken(t);
            setUserRole(r);
        };

        window.addEventListener('storage', syncAuth);
        window.addEventListener('authStateChanged', syncAuth);

        syncAuth();

        return () => {
            window.removeEventListener('storage', syncAuth);
            window.removeEventListener('authStateChanged', syncAuth);
        };
    }, [getToken]);

    const fetchAdminConversations = useCallback(async () => {
        if (userRole !== 'admin' || !token) return;
        try {
            const res = await axios.get(`${backendUrl}/api/direct-chat/admin/conversations`, {
                headers: {
                    'token': token,
                    'Authorization': `Bearer ${token}`
                }
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
        if (!chatId || chatId.startsWith('virtual-') || !token) return;
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
                // Update specific conversation unread count locally for immediate UI response
                setConversations(prev => prev.map(c =>
                    c._id === chatId ? { ...c, unreadCountAdmin: 0, unreadCountFarmer: 0 } : c
                ));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [backendUrl, token]);

    const currentUser = useMemo(() => {
        if (!token) return null;
        try {
            return jwtDecode(token);
        } catch (e) {
            // Check if it's a mock admin token
            if (token && typeof token === 'string' && token.startsWith('admin-session-token-')) {
                return { id: 'admin-001', role: 'admin' };
            }
            return null;
        }
    }, [token]);

    // Automatically fetch when admin auth is ready
    useEffect(() => {
        if (userRole === 'admin' && token) {
            fetchAdminConversations();
        }
    }, [userRole, token, fetchAdminConversations]);

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
            // Update the conversations matching this chatId to update lastMessage and counts
            setConversations((prev) => {
                const index = prev.findIndex(c => c._id === message.chatId);
                if (index !== -1) {
                    const updated = [...prev];
                    const isForMe = message.senderId !== currentUser?.id;
                    const incrementAdmin = isForMe && userRole === 'admin';
                    const incrementFarmer = isForMe && userRole === 'farmer';

                    updated[index] = {
                        ...updated[index],
                        lastMessage: message,
                        unreadCountAdmin: incrementAdmin ? (updated[index].unreadCountAdmin || 0) + 1 : updated[index].unreadCountAdmin,
                        unreadCountFarmer: incrementFarmer ? (updated[index].unreadCountFarmer || 0) + 1 : updated[index].unreadCountFarmer,
                        updatedAt: new Date().toISOString()
                    };
                    return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                }
                return prev;
            });

            // If the message is for the current active chat, add it to messages
            if (activeChat === message.chatId) {
                setMessages((prev) => {
                    if (prev.find(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });

                // Mark as seen in real-time if we're not the sender
                if (message.senderId !== currentUser?.id) {
                    axios.post(`${backendUrl}/api/direct-chat/seen/${message.chatId}`, {}, {
                        headers: { token, Authorization: `Bearer ${token}` }
                    });
                }
            }
        });

        newSocket.on('chatListUpdate', (data) => {
            if (userRole === 'admin') {
                fetchAdminConversations();
            }
        });

        return () => {
            newSocket.disconnect();
            console.log('🔌 Disconnected from chat socket');
        };
    }, [token, backendUrl, userRole, activeChat, currentUser?.id, fetchAdminConversations]);





    const joinChat = useCallback(async (chatId) => {
        if (!socket || !token) return;

        let realChatId = chatId;

        // Handle virtual conversation (Admin starting chat with a farmer for the first time)
        if (chatId.startsWith('virtual-')) {
            const farmerId = chatId.replace('virtual-', '');
            try {
                const res = await axios.post(`${backendUrl}/api/direct-chat/admin/create`, { farmerId }, {
                    headers: { token }
                });
                if (res.data.success) {
                    realChatId = res.data.conversation._id;
                    // Update current list to include the newly created conversation instead of the virtual one
                    setConversations(prev => prev.map(c => c._id === chatId ? res.data.conversation : c));
                }
            } catch (error) {
                console.error('Error creating real conversation from virtual:', error);
                return;
            }
        }

        socket.emit('joinChat', realChatId);
        setActiveChat(realChatId);
        fetchMessages(realChatId);
    }, [socket, fetchMessages, backendUrl, token]);

    const sendMessage = useCallback((chatId, text) => {
        if (socket && text.trim()) {
            socket.emit('sendMessage', { chatId, text });
        }
    }, [socket]);

    const getOrCreateFarmerChat = useCallback(async () => {
        if (!token) return;
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
