// frontend/src/components/CameraCapture/CameraCapture.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCamera, FiX, FiRepeat, FiCheck } from 'react-icons/fi';
import './CameraCapture.css';

const CameraCapture = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const [isLoading, setIsLoading] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setIsLoading(true);
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsLoading(false);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsLoading(false);

      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Unable to access camera. Please try uploading an image instead.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    // Camera will restart via useEffect
  };

  const usePhoto = () => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `camera-photo-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          onCapture(file);
          handleClose();
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setCapturedImage(null);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError('');
    setIsLoading(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-overlay" onClick={handleClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="camera-header">
          <h3 className="camera-title">
            <FiCamera className="camera-title-icon" />
            Take Photo
          </h3>
          <button className="camera-close-btn" onClick={handleClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="camera-viewfinder">
          {error ? (
            <div className="camera-error">
              <div className="camera-error-icon">📷</div>
              <p className="camera-error-text">{error}</p>
              <button className="camera-retry-btn" onClick={startCamera}>
                Try Again
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="camera-captured-img"
            />
          ) : (
            <>
              {isLoading && (
                <div className="camera-loading">
                  <div className="camera-spinner"></div>
                  <p>Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`camera-video ${isLoading ? 'camera-video-hidden' : ''}`}
              />
              {/* Viewfinder corners */}
              <div className="viewfinder-corners">
                <span className="corner corner-tl"></span>
                <span className="corner corner-tr"></span>
                <span className="corner corner-bl"></span>
                <span className="corner corner-br"></span>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="camera-controls">
          {capturedImage ? (
            <>
              <button className="camera-btn camera-btn-retake" onClick={retakePhoto}>
                <FiRepeat size={18} />
                Retake
              </button>
              <button className="camera-btn camera-btn-use" onClick={usePhoto}>
                <FiCheck size={18} />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                className="camera-btn camera-btn-flip"
                onClick={toggleFacingMode}
                title="Switch camera"
                disabled={!!error}
              >
                <FiRepeat size={18} />
              </button>
              <button
                className="camera-btn camera-btn-capture"
                onClick={takePhoto}
                disabled={isLoading || !!error}
                title="Capture photo"
              >
                <div className="capture-ring">
                  <div className="capture-dot"></div>
                </div>
              </button>
              <div style={{ width: 44 }}></div> {/* spacer for centering */}
            </>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraCapture;
