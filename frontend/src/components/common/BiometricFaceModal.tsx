import React, { useState, useRef, useEffect } from 'react';
import { biometricsApi } from '../../services/api';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, X, UserCheck, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BiometricFaceModalProps {
  isOpen?: boolean;
  onClose: () => void;
  mode: 'ENROLL' | 'VERIFY';
  farmerId: string;
  farmerName?: string;
  onSuccess: (result: any) => void;
  lang?: 'en' | 'kn';
}

export const BiometricFaceModal: React.FC<BiometricFaceModalProps> = ({
  isOpen = true,
  onClose,
  mode,
  farmerId,
  farmerName,
  onSuccess,
  lang = 'en',
}) => {
  if (!isOpen) return null;
  const [consentGiven, setConsentGiven] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [manualOverride, setManualOverride] = useState(false);
  const [manualReason, setManualReason] = useState('Physical Aadhaar and land record inspected and verified by operator');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Camera
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setErrorMsg('Camera access denied or unavailable. You may enable manual verification fallback below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setErrorMsg('');
      setStatusMsg('');
      if (mode === 'VERIFY' || consentGiven) {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, consentGiven]);

  // Capture frame to canvas
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setErrorMsg('');
    startCamera();
  };

  const handleEnrollSubmit = async () => {
    if (!capturedImage) return;
    if (!consentGiven) {
      setErrorMsg('Explicit informed biometric consent is mandatory before enrollment.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biometricsApi.enrollFace({
        farmerId,
        imageBase64: capturedImage,
        consentGiven: true,
        consentLanguage: lang,
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        setStatusMsg('Biometric face template enrolled successfully and cryptographically secured.');
        setTimeout(() => {
          onSuccess(res);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Biometric enrollment failed. Ensure face is well-lit.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await biometricsApi.verifyFace({
        farmerId,
        probeImageBase64: capturedImage || undefined,
        allowManualFallback: manualOverride,
        manualReason: manualOverride ? manualReason : undefined,
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 60 });
        setStatusMsg(`Identity Verified! (${res.verificationStatus} - ${res.verificationMethod})`);
        setTimeout(() => {
          onSuccess(res);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Biometric verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {mode === 'ENROLL' ? 'Farmer Consented Face Enrollment' : 'Panchayat Biometric Verification'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {farmerName ? `Farmer: ${farmerName}` : `Farmer ID: ${farmerId}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode ENROLL: Informed Biometric Consent Notice */}
        {mode === 'ENROLL' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Informed Biometric Consent Notice (ಬಯೋಮೆಟ್ರಿಕ್ ಸಮ್ಮತಿ ಸೂಚನೆ)
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {lang === 'kn'
                ? 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಗಳಲ್ಲಿ ತ್ವರಿತ ಗುರುತಿನ ಪರಿಶೀಲನೆಗಾಗಿ ನನ್ನ ಮುಖದ ಬಯೋಮೆಟ್ರಿಕ್ ಚಿತ್ರವನ್ನು ತೆಗೆಯಲು ನಾನು ಸಮ್ಮತಿಸುತ್ತೇನೆ. ಈ ವಿವರಗಳು ಗೂಢಲಿಪೀಕರಣದಿಂದ ರಕ್ಷಿಸಲ್ಪಟ್ಟಿವೆ. ಇದು ಐಚ್ಛಿಕವಾಗಿದ್ದು, ಬಯಸಿದಾಗ ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆಯನ್ನು ಆರಿಸಿಕೊಳ್ಳಬಹುದು.'
                : 'I hereby provide informed consent to AgroMaya for capturing and processing my facial biometric image for identity verification at Gram Panchayat collection centers. I understand this template is cryptographically protected and I can opt for manual identity verification at any time.'}
            </p>
            <label className="flex items-center gap-2 pt-1 font-bold text-emerald-900 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>I give my informed consent (ನಾನು ಸಮ್ಮತಿಸುತ್ತೇನೆ)</span>
            </label>
          </div>
        )}

        {/* Camera / Probe View */}
        {(!mode || mode === 'VERIFY' || consentGiven) && !manualOverride && (
          <div className="space-y-3">
            <div className="relative w-full h-64 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover mirror" />
              )}

              {/* Face Guide Oval */}
              {!capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 border-2 border-dashed border-emerald-400 rounded-[50%] opacity-80 animate-pulse" />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Actions */}
            <div className="flex justify-center gap-2">
              {!capturedImage ? (
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraActive}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual Fallback Option (for Panchayat Operator) */}
        {mode === 'VERIFY' && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Use Alternative Manual Identity Verification (Operator Override)</span>
            </label>

            {manualOverride && (
              <div className="mt-2 space-y-1">
                <label className="text-[10px] text-slate-500 block">Operator Verification Remarks</label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Physical Voter ID verified by GP secretary..."
                  className="w-full px-3 py-1.5 border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{statusMsg}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>

          {mode === 'ENROLL' ? (
            <button
              type="button"
              disabled={loading || !capturedImage || !consentGiven}
              onClick={handleEnrollSubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {loading ? 'Encrypting & Enrolling...' : 'Confirm Biometric Enrollment'}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || (!capturedImage && !manualOverride)}
              onClick={handleVerifySubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              {loading ? 'Matching Face Template...' : manualOverride ? 'Approve Manual Verification' : 'Verify Farmer Face'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
