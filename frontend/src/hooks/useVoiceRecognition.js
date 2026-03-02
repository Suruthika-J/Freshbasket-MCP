// frontend/src/hooks/useVoiceRecognition.js
import { useState, useRef, useCallback, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Supported language codes for speech recognition.
 * - 'auto' attempts to detect the language automatically
 *   by running recognition sessions with multiple languages.
 * - Tamil and English (India) are the primary targets.
 */
const SUPPORTED_LANGUAGES = {
    auto: ['ta-IN', 'en-IN'],
    tamil: 'ta-IN',
    english: 'en-IN',
    hindi: 'hi-IN',
    malayalam: 'ml-IN',
    telugu: 'te-IN',
    kannada: 'kn-IN',
};

/**
 * Check if the browser supports the Web Speech API.
 */
const isSpeechRecognitionSupported = () => {
    return !!(
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
    );
};

/**
 * Create a SpeechRecognition instance.
 */
const createRecognition = () => {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    return new SpeechRecognition();
};

/**
 * useVoiceRecognition — custom hook
 *
 * @param {Object} options
 * @param {string} options.language - 'auto' | 'tamil' | 'english' (default: 'auto')
 * @param {boolean} options.continuous - keep listening until manually stopped (default: false)
 * @param {boolean} options.interimResults - show partial results (default: true)
 * @param {Function} options.onResult - callback with final transcript
 * @param {Function} options.onInterim - callback with interim transcript
 * @param {Function} options.onError - callback on error
 * @param {Function} options.onEnd - callback when recognition ends
 */
const useVoiceRecognition = (options = {}) => {
    const {
        language = 'auto',
        continuous = false,
        interimResults = true,
        onResult,
        onInterim,
        onError,
        onEnd,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [detectedLanguage, setDetectedLanguage] = useState(null);
    const [confidence, setConfidence] = useState(0);

    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const accumulatedTranscript = useRef('');

    // Check browser support on mount
    useEffect(() => {
        setIsSupported(isSpeechRecognitionSupported());
    }, []);

    /**
     * Clean up recognition on unmount
     */
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }
        };
    }, []);

    /**
     * Get the language code(s) to pass to SpeechRecognition.
     * For 'auto', we default to Tamil since Web Speech API
     * only accepts a single lang value; we rely on Google's
     * mixed-language handling which works well with ta-IN
     * for Tamil + English code-switching.
     */
    const getLanguageCode = useCallback(() => {
        if (language === 'auto') {
            // ta-IN handles Tamil + some English code-switching well
            // For pure English, user can explicitly set 'english'
            return 'ta-IN';
        }
        return SUPPORTED_LANGUAGES[language] || 'en-IN';
    }, [language]);

    /**
     * Fallback: Send audio to server for transcription
     * (used when browser Speech API is unavailable)
     */
    const fallbackTranscribe = useCallback(
        async (audioBlob) => {
            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('language', language);

                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Transcription failed');
                }

                const data = await response.json();
                return data.transcript || '';
            } catch (err) {
                console.error('Fallback transcription error:', err);
                throw err;
            }
        },
        [language]
    );

    /**
     * Start listening
     */
    const startListening = useCallback(() => {
        setError(null);
        setInterimTranscript('');
        accumulatedTranscript.current = '';

        if (!isSpeechRecognitionSupported()) {
            setIsSupported(false);
            setError({
                type: 'not-supported',
                message: 'Voice input is not supported in this browser. Please use Chrome or Edge.',
            });
            onError?.({
                type: 'not-supported',
                message: 'Voice input is not supported in this browser.',
            });
            return;
        }

        // Abort any existing instance
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // ignore
            }
        }

        const recognition = createRecognition();
        if (!recognition) {
            setError({
                type: 'not-supported',
                message: 'Could not create speech recognition instance.',
            });
            return;
        }

        recognition.lang = getLanguageCode();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
            setIsListening(true);
            isListeningRef.current = true;
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    final += text;
                    setConfidence(Math.round(result[0].confidence * 100));

                    // Try to detect language from the result
                    if (result[0].confidence > 0) {
                        const hasTamil = /[\u0B80-\u0BFF]/.test(text);
                        setDetectedLanguage(hasTamil ? 'Tamil' : 'English');
                    }
                } else {
                    interim += text;
                }
            }

            if (interim) {
                setInterimTranscript(interim);
                onInterim?.(interim);
            }

            if (final) {
                accumulatedTranscript.current += final;
                setTranscript(accumulatedTranscript.current);
                setInterimTranscript('');
                onResult?.(accumulatedTranscript.current);
            }
        };

        recognition.onerror = (event) => {
            let errorInfo;

            switch (event.error) {
                case 'no-speech':
                    errorInfo = {
                        type: 'no-speech',
                        message: 'No speech detected. Please try again.',
                    };
                    break;
                case 'audio-capture':
                    errorInfo = {
                        type: 'audio-capture',
                        message: 'Microphone not found. Please check your device.',
                    };
                    break;
                case 'not-allowed':
                    errorInfo = {
                        type: 'not-allowed',
                        message: 'Microphone access denied. Please allow microphone permission.',
                    };
                    break;
                case 'network':
                    errorInfo = {
                        type: 'network',
                        message: 'Network error. Please check your internet connection.',
                    };
                    break;
                case 'aborted':
                    // User aborted — not an error
                    return;
                default:
                    errorInfo = {
                        type: event.error,
                        message: `Speech recognition error: ${event.error}`,
                    };
            }

            setError(errorInfo);
            onError?.(errorInfo);
            setIsListening(false);
            isListeningRef.current = false;
        };

        recognition.onend = () => {
            setIsListening(false);
            isListeningRef.current = false;
            setInterimTranscript('');
            onEnd?.(accumulatedTranscript.current);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setError({
                type: 'start-failed',
                message: 'Failed to start voice input. Please try again.',
            });
        }
    }, [getLanguageCode, continuous, interimResults, onResult, onInterim, onError, onEnd]);

    /**
     * Stop listening
     */
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // ignore
            }
        }
        setIsListening(false);
        isListeningRef.current = false;
    }, []);

    /**
     * Toggle listening on/off
     */
    const toggleListening = useCallback(() => {
        if (isListeningRef.current) {
            stopListening();
        } else {
            startListening();
        }
    }, [startListening, stopListening]);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        stopListening();
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        setDetectedLanguage(null);
        setConfidence(0);
        accumulatedTranscript.current = '';
    }, [stopListening]);

    return {
        // State
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        detectedLanguage,
        confidence,

        // Actions
        startListening,
        stopListening,
        toggleListening,
        reset,

        // Fallback
        fallbackTranscribe,
    };
};

export default useVoiceRecognition;
export { SUPPORTED_LANGUAGES, isSpeechRecognitionSupported };
