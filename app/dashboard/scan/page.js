'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Camera, ScanLine, AlertCircle, CheckCircle2,
  Loader2, ImageIcon, X, Video, VideoOff,
} from 'lucide-react';
import VoiceScanner from '@/components/VoiceScanner';
import { useApp } from '@/context/AppContext';
import { uploadLeafImage } from '@/services/aiService';

// ─── Bilingual strings ───────────────────────────────────────────────────────────────
const T = {
  am: {
    tabUpload:        'ፈቶ ምርምር',
    tabCamera:        'ካሜራ ስካን',
    uploadHeader:     'ፈቶ ምርምር',
    uploadSub:        'የቅጠሉን ፈቶ ይጨኑ ወይም ይጎትቱ',
    cameraHeader:     'ካሜራ ስካን',
    cameraSub:        'ካሜራ ይክፈቱ፣ ቅጠሉን ያነሳ',
    dropZone:         'ምስል ይምረጡ ወይም ይጎትቱ',
    dropZoneSub:      'JPEG, PNG, WebP — ከ 10MB በታች',
    openCamera:       'ካሜራ ክፈት',
    captureBtn:       'ፈቶ አንሳና መርምር',
    analyseBtn:       'AI ምርምር ጀምር',
    processing:       'እየተቀናበረ ነው...',
    wakingUp:         'የ AI ሰርቨር እየነቃ ነው። እባክዎ ይጠብቁ። (1-2 ደቂቃ ሊፈጅ ይችላል)',
    cameraOff:        'ካሜራ አልተከፈተም',
    emptyTitle:       'ምርመራ ገና አልተደረገም',
    emptySub:         'ከላይ ያለውን ቅጠል ፈቶ ይጨኑ፣ ካሜራ ይጠቀምጉ ወይም ድምፅዎን ተጠቀምጁ',
    selectImage:      'ምስል ይምረጡ።',
    treatmentLabel:   'መፍተሕ / መከላከያ መንገድ',
    confidenceLabel:  'የእርግጠኛነት ደረጃ',
    // Result card localized labels
    riskHigh:         '🔴 ከፍተኛ',
    riskMedium:       '🟡 መካከለኛ',
    riskLow:          '🟢 ዝቅተኛ',
    gosaLabel:        'የበሽታው ዓይነት',
    wallaansaLabel:   'የሕክምና ዘዴ',
    certaintyLabel:   'ዕርግጠኝነት',
  },
  or: {
    tabUpload:        'Suuraa Fe\'i',
    tabCamera:        'Kaameraa Fayyadami',
    uploadHeader:     'Suuraa Fe\'i',
    uploadSub:        'Suuraa baala fe\'i ykn harkisi',
    cameraHeader:     'Kaameraa Fayyadami',
    cameraSub:        'Kaameraa bani, baala funaani',
    dropZone:         'Suuraa filadhu ykn harkisi',
    dropZoneSub:      'JPEG, PNG, WebP — 10MB gadii',
    openCamera:       'Kaameraa Bani',
    captureBtn:       'Suuraa Ka\'i Qori',
    analyseBtn:       'AI Qorannoo Jalqabi',
    processing:       'Hojjechaa jira...',
    wakingUp:         'Sarvarii AI maqaa hidhaa jira. Obsaan eeggadhu. (Daqiiqaa 1-2 fudhachuu danda\'a)',
    cameraOff:        'Kaameraan hin banamu',
    emptyTitle:       'Qorannoo Hin Jiru',
    emptySub:         'Suuraa baala ol fe\'i, kaameraa fayyadami ykn sagalee itti fayyadami',
    selectImage:      'Suuraa filadhu.',
    treatmentLabel:   'Furmaata / Mala Ittisuu',
    confidenceLabel:  'Sadarkaa Amantaa',
    // Result card localized labels
    riskHigh:         '🔴 Olka\'aa',
    riskMedium:       '🟡 Giddugaleessa',
    riskLow:          '🟢 Gadi\'oo',
    gosaLabel:        'Gosa Dhukkubaa',
    wallaansaLabel:   'Wallaansa / Furmaata',
    certaintyLabel:   'Sadarkaa Amantaa',
  },
};

// ─── Risk level styles ────────────────────────────────────────────────────────
const riskStyles = {
  High:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
  Medium:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  Low:     { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  Unknown: { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-700' },
};

// ─── Scan mode tabs ───────────────────────────────────────────────────────────
const TABS = { UPLOAD: 'upload', CAMERA: 'camera' };

export default function ScanPage() {
  const { addScan, setLoading, setError, isLoading, error, currentScan, clearError, language } = useApp();
  const t = language === 'or' ? T.or : T.am;

  // ── Upload state ─────────────────────────────────────────────────────────────
  const [preview, setPreview]       = useState(null);
  const [selectedFile, setFile]     = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileInputRef                = useRef(null);

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState(TABS.UPLOAD);

  // ── Camera state ─────────────────────────────────────────────────────────────
  const [cameraOn, setCameraOn]     = useState(false);
  const [camError, setCamError]     = useState('');
  const [capturing, setCapturing]   = useState(false);
  const videoRef                    = useRef(null);
  const streamRef                   = useRef(null);
  const canvasRef                   = useRef(null);

  // ── Waking-up state (Render cold start can take 30–90 s) ─────────────────
  // Set to true after 10 s of waiting; cleared when the request completes.
  const [isWakingUp, setIsWakingUp] = useState(false);

  // ── Stop camera tracks helper ─────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Switch tabs ───────────────────────────────────────────────────────────
  const switchTab = useCallback((tab) => {
    if (tab === TABS.UPLOAD) stopCamera();
    setCamError('');
    setActiveTab(tab);
  }, [stopCamera]);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'ካሜራ ፈቃድ ተከልክሏል። ፈቃዱን ፍቀዱ።' :
        err.name === 'NotFoundError'    ? 'ካሜራ አልተገኘም። መሳሪያዎ ካሜራ አለው?' :
        err.name === 'NotReadableError' ? 'ካሜራ በሌላ መተግበሪያ ጥቅም ላይ ነው።' :
        'ካሜራ መከፈት አልተቻለም።';
      setCamError(msg);
    }
  }, []);

  // ── Capture frame → Blob → analyse ──────────────────────────────────────
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) { setCapturing(false); return; }
      const file = new File([blob], `camera-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturing(false);
      setIsWakingUp(false);
      setLoading(true);
      clearError();
      try {
        const result = await uploadLeafImage(file, () => setIsWakingUp(true));
        addScan(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsWakingUp(false);
        setLoading(false);
      }
    }, 'image/jpeg', 0.92);
  }, [addScan, setLoading, setError, clearError]);

  // ── File upload helpers ───────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('እባክዎ ትክክለኛ ምስል ይምረጡ። (JPEG, PNG, WebP)');
      return;
    }
    setFile(file);
    clearError();
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, [setError, clearError]);

  const onInputChange = (e) => handleFile(e.target.files?.[0]);
  const onDrop        = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };
  const onDragOver    = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave   = ()  => setDragOver(false);
  const clearImage    = ()  => { setPreview(null); setFile(null); clearError(); };

  const handleAnalyse = async () => {
    if (!selectedFile) { setError(t.selectImage); return; }
    setIsWakingUp(false);
    setLoading(true);
    clearError();
    try {
      const result = await uploadLeafImage(selectedFile, () => setIsWakingUp(true));
      addScan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsWakingUp(false);
      setLoading(false);
    }
  };

  const risk = currentScan ? (riskStyles[currentScan.riskLevel] ?? riskStyles.Unknown) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Two-column grid: Scan card | Voice ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Scan card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tab selector */}
          <div className="flex border-b border-gray-100">
            <button
              id="tab-upload"
              onClick={() => switchTab(TABS.UPLOAD)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                activeTab === TABS.UPLOAD
                  ? 'text-green-700 border-b-2 border-green-500 bg-green-50/60'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              <Upload className="w-3.5 h-3.5" />
              {t.tabUpload}
            </button>
            <button
              id="tab-camera"
              onClick={() => switchTab(TABS.CAMERA)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                activeTab === TABS.CAMERA
                  ? 'text-green-700 border-b-2 border-green-500 bg-green-50/60'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              <Camera className="w-3.5 h-3.5" />
              {t.tabCamera}
            </button>
          </div>

          {/* Tab header strip */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)' }}
            >
              {activeTab === TABS.UPLOAD
                ? <Camera className="w-3.5 h-3.5 text-white" />
                : <Video  className="w-3.5 h-3.5 text-white" />
              }
            </div>
            <div>
              <p className="text-gray-800 font-bold text-xs">
                {activeTab === TABS.UPLOAD ? t.uploadHeader : t.cameraHeader}
              </p>
              <p className="text-gray-500 text-[10px]">
                {activeTab === TABS.UPLOAD ? t.uploadSub : t.cameraSub}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">

            {/* ─── UPLOAD TAB ─────────────────────────────────────────────── */}
            {activeTab === TABS.UPLOAD && (
              <>
                {!preview ? (
                  <div
                    id="drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                      dragOver
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/40'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
                    >
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-semibold text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                        {t.dropZone}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">{t.dropZoneSub}</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="leaf-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={onInputChange}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                    <img src={preview} alt="Leaf preview" className="w-full h-full object-cover" />
                    <button
                      id="clear-image-btn"
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                      <ImageIcon className="w-3 h-3 text-white" />
                      <span className="text-white text-[10px] font-medium">{selectedFile?.name}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{error}</p>
                  </div>
                )}

                {/* Waking-up warm notice — shown after 10 s of waiting */}
                {isWakingUp && (
                  <div
                    className="flex items-start gap-2 rounded-xl p-3 border"
                    style={{ background: '#fffbeb', borderColor: '#fcd34d' }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
                    <p className="text-xs leading-snug" style={{ color: '#92400e', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                      {t.wakingUp}
                    </p>
                  </div>
                )}

                <button
                  id="analyse-btn"
                  onClick={handleAnalyse}
                  disabled={!selectedFile || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: (!selectedFile || isLoading) ? '#9ca3af' : 'linear-gradient(135deg, #16a34a, #65a30d)',
                    boxShadow: (!selectedFile || isLoading) ? 'none' : '0 4px 16px rgba(22,163,74,0.35)',
                    fontFamily: "'Noto Sans Ethiopic', sans-serif",
                  }}
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {isWakingUp ? (language === 'or' ? 'AI kaafamaa jira...' : 'AI እያነሳ ነው...') : t.processing}</>
                    : <><ScanLine className="w-4 h-4" /> {t.analyseBtn}</>
                  }
                </button>
              </>
            )}

            {/* ─── CAMERA TAB ─────────────────────────────────────────────── */}
            {activeTab === TABS.CAMERA && (
              <>
                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera error */}
                {camError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{camError}</p>
                  </div>
                )}

                {/* Video feed or placeholder */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover rounded-xl ${cameraOn ? '' : 'hidden'}`}
                  />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #1f2937, #374151)' }}
                      >
                        <VideoOff className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                        {t.cameraOff}
                      </p>
                    </div>
                  )}

                  {/* Live indicator */}
                  {cameraOn && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-[10px] font-bold">LIVE</span>
                    </div>
                  )}

                  {/* Stop camera button */}
                  {cameraOn && (
                    <button
                      onClick={stopCamera}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>

                {/* Camera action error from main */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{error}</p>
                  </div>
                )}

                {/* Buttons */}
                {!cameraOn ? (
                  <button
                    id="open-camera-btn"
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #65a30d)',
                      boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
                      fontFamily: "'Noto Sans Ethiopic', sans-serif",
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    {t.openCamera}
                  </button>
                ) : (
                  <button
                    id="capture-scan-btn"
                    onClick={captureAndScan}
                    disabled={isLoading || capturing}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: (isLoading || capturing) ? '#9ca3af' : 'linear-gradient(135deg, #16a34a, #65a30d)',
                      boxShadow: (isLoading || capturing) ? 'none' : '0 4px 16px rgba(22,163,74,0.35)',
                      fontFamily: "'Noto Sans Ethiopic', sans-serif",
                    }}
                  >
                    {(isLoading || capturing)
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {isWakingUp ? (language === 'or' ? 'AI kaafamaa jira...' : 'AI እያነሳ ነው...') : t.processing}</>
                      : <><ScanLine className="w-4 h-4" /> {t.captureBtn}</>
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Voice scanner */}
        <VoiceScanner />
      </div>

      {/* ── Result card ─────────────────────────────────────────────────────── */}
      {currentScan && (
        <div
          id="scan-result"
          className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${risk.border}`}
        >
          {/* Result header */}
          <div className={`px-5 py-4 border-b ${risk.border} ${risk.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentScan.status === 'healthy'
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <AlertCircle  className="w-6 h-6 text-amber-500" />
                }
                <div>
                  {/* Disease name: Oromo if language='or', else Amharic from API */}
                  <p className="font-bold text-gray-800 text-base" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                    {language === 'or'
                      ? (currentScan.nameOr || currentScan.diseaseName)
                      : (currentScan.amharic || currentScan.diseaseName)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {language === 'or' ? currentScan.plantNameOr : currentScan.plantName} — {currentScan.diseaseName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${risk.badge}`}>
                  {currentScan.riskLevel === 'High'
                    ? t.riskHigh
                    : currentScan.riskLevel === 'Medium'
                      ? t.riskMedium
                      : t.riskLow}
                </span>
                <p className="text-gray-400 text-[10px] mt-1 text-right">
                  {currentScan.confidence.toFixed(1)}% {t.certaintyLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{t.confidenceLabel}</span>
              <span className="text-xs font-bold text-gray-700">{currentScan.confidence.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${currentScan.confidence}%`,
                  background: currentScan.confidence > 80
                    ? 'linear-gradient(90deg,#16a34a,#65a30d)'
                    : currentScan.confidence > 50
                      ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                      : 'linear-gradient(90deg,#ef4444,#dc2626)',
                }}
              />
            </div>
          </div>

          {/* Treatment info — language-aware */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.treatmentLabel}
            </p>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-gray-800 text-sm leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {language === 'or'
                  ? (currentScan.treatmentOr || currentScan.treatmentAm || '—')
                  : (currentScan.treatmentAm || '—')}
              </p>
            </div>
          </div>

          {/* Inference time badge */}
          {currentScan.inferenceMs > 0 && (
            <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/50">
              <p className="text-gray-400 text-[10px]">
                ⚡ AI inference: {currentScan.inferenceMs}ms • ID: {currentScan.id?.slice(0, 8)}…
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!currentScan && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
          >
            <ScanLine className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-gray-600 font-semibold text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {t.emptyTitle}
          </p>
          <p className="text-gray-400 text-xs max-w-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {t.emptySub}
          </p>
        </div>
      )}
    </div>
  );
}
