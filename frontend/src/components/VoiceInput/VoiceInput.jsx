// frontend/src/components/VoiceInput/VoiceInput.jsx
import React, { useState, useCallback, useEffect, useId } from 'react';
import { FiMic, FiMicOff, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';
import './VoiceInput.css';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  VoiceInput — Reusable Voice-to-Text Component              │
 * │                                                              │
 * │  Renders a microphone button alongside an input/textarea.   │
 * │  Supports Tamil (ta-IN) and English (en-IN) with            │
 * │  automatic language detection and mixed speech.             │
 * │                                                              │
 * │  Props:                                                      │
 * │  ─────                                                       │
 * │  value        : string   — current input value               │
 * │  onChange     : fn       — (newValue) => void                │
 * │  fieldName    : string   — for accessibility labels          │
 * │  placeholder  : string   — input placeholder                 │
 * │  multiline    : boolean  — render textarea instead           │
 * │  rows         : number   — textarea rows (default 4)         │
 * │  inputType    : string   — input type (default 'text')       │
 * │  className    : string   — extra class for the input         │
 * │  error        : string   — error message to display          │
 * │  disabled     : boolean  — disable the field                 │
 * │  showLangPicker: boolean — show language selector            │
 * │  defaultLang  : string   — 'auto' | 'tamil' | 'english'    │
 * │  appendMode   : boolean  — append to existing value          │
 * │  inputProps   : object   — extra props for input/textarea    │
 * └──────────────────────────────────────────────────────────────┘
 */
const VoiceInput = ({
    value = '',
    onChange,
    fieldName = 'field',
    placeholder = '',
    multiline = false,
    rows = 4,
    inputType = 'text',
    className = '',
    error = '',
    disabled = false,
    showLangPicker = true,
    defaultLang = 'auto',
    appendMode = false,
    inputProps = {},
}) => {
    const uniqueId = useId();
    const [selectedLang, setSelectedLang] = useState(defaultLang);

    // Voice recognition hook
    const {
        isListening,
        interimTranscript,
        error: voiceError,
        isSupported,
        detectedLanguage,
        confidence,
        toggleListening,
        stopListening,
    } = useVoiceRecognition({
        language: selectedLang,
        continuous: false,
        interimResults: true,
        onResult: (transcript) => {
            if (onChange) {
                if (appendMode && value) {
                    onChange(value + ' ' + transcript);
                } else {
                    onChange(transcript);
                }
            }
        },
        onError: (err) => {
            console.warn(`Voice error on ${fieldName}:`, err.message);
        },
    });

    // Stop listening if component unmounts
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    const handleMicClick = useCallback(() => {
        if (disabled) return;
        toggleListening();
    }, [disabled, toggleListening]);

    const handleInputChange = useCallback(
        (e) => {
            if (onChange) {
                onChange(e.target.value);
            }
        },
        [onChange]
    );

    const handleLangChange = useCallback((e) => {
        setSelectedLang(e.target.value);
    }, []);

    // Build combined class for wrapper
    const wrapperClass = [
        'voice-input-wrapper',
        multiline ? 'textarea-mode' : '',
    ]
        .filter(Boolean)
        .join(' ');

    // Build input class
    const inputClass = [
        'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500',
        error ? 'border-red-500' : 'border-gray-300',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="voice-input-container">
            <div className={wrapperClass}>
                <div className="voice-input-field-wrap">
                    {/* === Input / Textarea === */}
                    {multiline ? (
                        <textarea
                            id={`voice-${uniqueId}`}
                            value={value}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            rows={rows}
                            className={inputClass}
                            disabled={disabled}
                            aria-label={fieldName}
                            {...inputProps}
                        />
                    ) : (
                        <input
                            id={`voice-${uniqueId}`}
                            type={inputType}
                            value={value}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className={inputClass}
                            disabled={disabled}
                            aria-label={fieldName}
                            {...inputProps}
                        />
                    )}

                    {/* === Language Selector (compact) === */}
                    {showLangPicker && isSupported && (
                        <select
                            className="voice-lang-select"
                            value={selectedLang}
                            onChange={handleLangChange}
                            aria-label={`Language for ${fieldName}`}
                            title="Select language"
                        >
                            <option value="auto">🌐 Auto</option>
                            <option value="tamil">தமிழ்</option>
                            <option value="english">EN</option>
                        </select>
                    )}

                    {/* === Microphone Button === */}
                    {isSupported && (
                        <button
                            type="button"
                            className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                            onClick={handleMicClick}
                            disabled={disabled}
                            aria-label={
                                isListening
                                    ? `Stop voice input for ${fieldName}`
                                    : `Start voice input for ${fieldName}`
                            }
                            title={isListening ? 'Tap to stop' : 'Tap to speak'}
                        >
                            {isListening ? (
                                <FiMicOff className="mic-icon" />
                            ) : (
                                <FiMic className="mic-icon" />
                            )}

                            {/* Tooltip */}
                            <span className="voice-tooltip">
                                {isListening ? '🔴 Tap to stop' : '🎙️ Tap to speak'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* === Listening Indicator === */}
            {isListening && (
                <div className="voice-listening-indicator">
                    <div className="voice-wave">
                        <span className="voice-wave-bar" />
                        <span className="voice-wave-bar" />
                        <span className="voice-wave-bar" />
                        <span className="voice-wave-bar" />
                    </div>
                    <span>Listening...</span>
                </div>
            )}

            {/* === Interim Transcript === */}
            {interimTranscript && (
                <div className="voice-interim-text">
                    {interimTranscript}
                </div>
            )}

            {/* === Language & Confidence Badges === */}
            {detectedLanguage && !isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className="voice-language-badge">
                        <span className="lang-dot" />
                        {detectedLanguage}
                    </span>
                    {confidence > 0 && (
                        <span className="voice-confidence">
                            {confidence}%
                            <span className="voice-confidence-bar">
                                <span
                                    className="voice-confidence-fill"
                                    style={{ width: `${confidence}%` }}
                                />
                            </span>
                        </span>
                    )}
                </div>
            )}

            {/* === Voice Error === */}
            {voiceError && (
                <div className="voice-error-msg">
                    <FiAlertCircle className="error-icon" />
                    <span>{voiceError.message}</span>
                </div>
            )}

            {/* === Browser Not Supported === */}
            {!isSupported && (
                <div className="voice-not-supported">
                    <FiAlertTriangle style={{ flexShrink: 0, width: 16, height: 16 }} />
                    <span>Voice input is not supported in this browser. Please use Chrome or Edge.</span>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
