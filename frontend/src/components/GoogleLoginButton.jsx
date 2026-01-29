// frontend/src/components/GoogleLoginButton.jsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        console.log('🟢 Google credential received');
        setIsLoading(true);
        setError('');
        
        try {
            console.log('📤 Sending credential to backend...');
            
            const response = await axios.post(
                `${API_BASE_URL}/api/user/auth/google/success`,
                {
                    credential: credentialResponse.credential
                },
                {
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true,
                    timeout: 10000 // 10 second timeout
                }
            );

            console.log('✅ Backend response:', response.data);

            if (response.data.success) {
                const { token, user } = response.data;
                
                // Store authentication data
                localStorage.setItem('authToken', token);
                localStorage.setItem('userData', JSON.stringify(user));
                
                console.log('💾 Auth data saved to localStorage');
                
                // Dispatch auth state change event
                window.dispatchEvent(new Event('authStateChanged'));
                
                console.log('🎉 Login successful! Redirecting to home...');
                
                // Small delay to ensure state updates
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 100);
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Google login error:', err);
            
            let errorMessage = 'Google login failed. Please try again.';
            
            if (err.code === 'ECONNREFUSED') {
                errorMessage = 'Cannot connect to server. Is the backend running on port 4000?';
            } else if (err.response) {
                console.error('Response error:', err.response.data);
                errorMessage = err.response.data?.message || 
                             `Server error: ${err.response.status}`;
            } else if (err.request) {
                errorMessage = 'No response from server. Check your connection.';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        console.error('❌ Google Login Failed');
        setError('Google login was unsuccessful. Please try again.');
    };

    return (
        <div className="w-full">
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}
            
            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="300"
                    disabled={isLoading}
                />
            </div>
            
            {isLoading && (
                <div className="mt-3 text-center text-sm text-gray-600">
                    Signing in with Google...
                </div>
            )}
        </div>
    );
};

export default GoogleLoginButton;