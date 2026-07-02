'use client';

/**
 * VoiceScanner.jsx
 * Amharic voice-input component using the Web Speech API.
 *
 * States
 * ──────
 *  idle       → shows mic button, ready to start
 *  listening  → mic is active, animated pulse ring, user is speaking
 *  processing → browser is finalising STT result
 *  result     → shows the transcribed Amharic text + action buttons
 *  error      → shows an inline error with retry option
 *
 * Integrates with AppContext:
 *  - setVoiceTranscription(text) → stores result globally
 *  - setListening(bool)          → toggles global mic flag
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, RotateCcw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// ─── Web Speech API availability check ───────────────────────────────────────
function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ─── UI state machine ─────────────────────────────────────────────────────────
const STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESULT: 'result',
  ERROR: 'error',
  UNSUPPORTED: 'unsupported',
};

// ─── Bilingual UI strings ─────────────────────────────────────────────────────
const STRINGS_MAP = {
  am: {
    title:          'የድምፅ ምርመራ',
    subtitle:       'ስለ ዕፅዋቱ በአማርኛ ይናገሩ',
    startBtn:       'ድምፅ ጀምር',
    retryBtn:       'እንደገና ሞክር',
    useResultBtn:   'ውጤቱን ተጠቀም',
    listeningLabel: 'እያዳመጥኩ ነው...',
    processingLabel:'እየሰራሁ ነው...',
    resultLabel:    'የተሰማው ጽሑፍ',
    errorLabel:     'ስህተት ተፈጠረ',
    unsupported:    'ይህ አሳሽ የድምፅ ምርመራ አይደግፍም።',
    noSpeech:       'ምንም ድምፅ አልተሰማም። ድጋሚ ይሞክሩ።',
    networkError:   'የኔትወርክ ስህተት። ኢንተርኔት ያረጋግጡ።',
    notAllowed:     'ማይክሮፎን ፈቃድ ተከልክሏል። ፈቃዱን ፍቀዱ።',
    placeholder:    'ምሳሌ: "የ በቆሎ ቅጠሌ ዝገታማ ነጠብጣቦች አሉት"',
    sttLang:        'am-ET',
  },
  or: {
    title:          'Qorannoo Sagalee',
    subtitle:       'Waa\'ee biqiltuu Afaan Oromootti dubbadhu',
    startBtn:       'Sagalee Jalqabi',
    retryBtn:       'Deebi\'i Yaali',
    useResultBtn:   'Bu\'aata Fayyadami',
    listeningLabel: 'Dhaggeeffachaa jira...',
    processingLabel:'Hojjechaa jira...',
    resultLabel:    'Barreeffama Dhagahame',
    errorLabel:     'Dogoggora uumame',
    unsupported:    'Braauzarri kun sagalee hin deggeru.',
    noSpeech:       'Sagalee hin dhagahamu. Deebi\'i yaali.',
    networkError:   'Dogoggora network. Interneetii mirkaneessi.',
    notAllowed:     'Hayyama maayikroofoonii dhorkami. Hayyama kenni.',
    placeholder:    'Fakkeenyaaf: "Baalli boqqolloo koo dhibeeffatee jira"',
    sttLang:        'om-ET',
  },
};

export default function VoiceScanner({ onTranscript }) {
  const { setVoiceTranscription, setListening, voiceTranscription, language } = useApp();
  const STRINGS = STRINGS_MAP[language] ?? STRINGS_MAP.am;

  const [status, setStatus] = useState(STATUS.IDLE);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSupported, setIsSupported] = useState(false); // always false on server
  const [mounted, setMounted] = useState(false);  // false on server
  const recognitionRef = useRef(null);

  // ── Run ONLY on client after hydration is complete ──────────────────────────
  useEffect(() => {
    setMounted(true);
    const supported = !!getSpeechRecognition();
    setIsSupported(supported);
    if (!supported) setStatus(STATUS.UNSUPPORTED);
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    // Reset state
    setTranscript('');
    setInterim('');
    setErrorMsg('');
    setStatus(STATUS.LISTENING);
    setListening(true);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // ── Configuration ────────────────────────────────────────────────────────
    recognition.lang = STRINGS.sttLang;
    recognition.continuous = true;      // keep listening until stopped
    recognition.interimResults = true;     // show live partial results
    recognition.maxAlternatives = 1;

    // ── Event handlers ────────────────────────────────────────────────────────
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => (prev + ' ' + finalText).trim());
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      setListening(false);
      let msg = STRINGS.errorLabel;
      if (event.error === 'no-speech')   msg = STRINGS.noSpeech;
      if (event.error === 'network')     msg = STRINGS.networkError;
      if (event.error === 'not-allowed') msg = STRINGS.notAllowed;
      if (event.error === 'aborted') return; // user stopped intentionally
      setErrorMsg(msg);
      setStatus(STATUS.ERROR);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
      setStatus((prev) =>
        prev === STATUS.LISTENING ? STATUS.PROCESSING : prev
      );
      // Short delay then show result
      setTimeout(() => {
        setStatus((s) => (s === STATUS.PROCESSING ? STATUS.RESULT : s));
      }, 400);
    };

    recognition.start();
  }, [setListening]);

  // ── Stop listening ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus(STATUS.PROCESSING);
    setListening(false);
  }, [setListening]);

  // ── Use result ──────────────────────────────────────────────────────────────
  const useResult = useCallback(() => {
    const text = transcript.trim();
    if (!text) return;
    setVoiceTranscription(text);
    onTranscript?.(text);        // optional callback prop
    setStatus(STATUS.IDLE);
    setTranscript('');
  }, [transcript, setVoiceTranscription, onTranscript]);

  // ── Clear / reset ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    setStatus(STATUS.IDLE);
    setTranscript('');
    setInterim('');
    setErrorMsg('');
    setListening(false);
    setVoiceTranscription('');
  }, [setListening, setVoiceTranscription]);

  // ─── Render helpers ────────────────────────────────────────────────────────

  const isActive = status === STATUS.LISTENING || status === STATUS.PROCESSING;

  // ── Pre-mount skeleton ─────────────────────────────────────────────────────
  // Server and client first-render must be IDENTICAL to avoid hydration errors.
  // We return a neutral placeholder until useEffect has run on the client.
  if (!mounted) {
    return (
      <div
        id="voice-scanner"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-green-200 animate-pulse" />
          <div className="space-y-1">
            <div className="h-2.5 w-20 bg-green-200 rounded animate-pulse" />
            <div className="h-2 w-32 bg-green-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="px-4 py-6 flex justify-center">
          <div className="h-9 w-28 bg-green-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="voice-scanner"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)' }}
          >
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p
              className="text-gray-800 font-bold text-xs"
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              {STRINGS.title}
            </p>
            <p
              className="text-gray-500 text-[10px]"
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              {STRINGS.subtitle}
            </p>
          </div>
        </div>

        {/* Clear button — visible when there's active state */}
        {(status !== STATUS.IDLE && status !== STATUS.UNSUPPORTED) && (
          <button
            id="voice-clear-btn"
            onClick={reset}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Reset"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4">

        {/* ── UNSUPPORTED ── */}
        {status === STATUS.UNSUPPORTED && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p
              className="text-xs"
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              {STRINGS.unsupported}
            </p>
          </div>
        )}

        {/* ── IDLE ── */}
        {status === STATUS.IDLE && (
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              id="voice-start-btn"
              onClick={startListening}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #65a30d)',
                boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
                fontFamily: "'Noto Sans Ethiopic', sans-serif",
              }}
            >
              <Mic className="w-4 h-4" />
              {STRINGS.startBtn}
            </button>
            {/* Show last saved transcription if any */}
            {voiceTranscription && (
              <p
                className="text-center text-gray-500 text-xs leading-relaxed px-2"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                <span className="text-gray-400 text-[10px] block mb-0.5">{STRINGS.resultLabel}:</span>
                {voiceTranscription}
              </p>
            )}
          </div>
        )}

        {/* ── LISTENING ── */}
        {status === STATUS.LISTENING && (
          <div className="flex flex-col items-center gap-3 py-2">
            {/* Animated pulse rings */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-16 h-16 rounded-full bg-green-400/20 animate-ping" />
              <span className="absolute w-12 h-12 rounded-full bg-green-400/30 animate-ping [animation-delay:0.2s]" />
              <button
                id="voice-stop-btn"
                onClick={stopListening}
                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
              >
                <MicOff className="w-5 h-5" />
              </button>
            </div>
            <p
              className="text-green-600 text-xs font-semibold animate-pulse"
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              {STRINGS.listeningLabel}
            </p>
            {/* Live interim transcript */}
            {(transcript || interim) && (
              <div className="w-full bg-gray-50 rounded-xl p-3 text-center">
                <p
                  className="text-gray-700 text-xs leading-relaxed"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {transcript}
                  {interim && (
                    <span className="text-gray-400 italic"> {interim}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PROCESSING ── */}
        {status === STATUS.PROCESSING && (
          <div className="flex flex-col items-center gap-2 py-3">
            <svg className="animate-spin w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p
              className="text-gray-500 text-xs"
              style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
            >
              {STRINGS.processingLabel}
            </p>
          </div>
        )}

        {/* ── RESULT ── */}
        {status === STATUS.RESULT && (
          <div className="space-y-3">
            {/* Result box */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p
                className="text-[10px] text-green-600 font-semibold mb-1"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {STRINGS.resultLabel}
              </p>
              <p
                className="text-gray-800 text-sm leading-relaxed"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {transcript || '—'}
              </p>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                id="voice-use-result-btn"
                onClick={useResult}
                disabled={!transcript.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #65a30d)',
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {STRINGS.useResultBtn}
              </button>
              <button
                id="voice-retry-btn"
                onClick={startListening}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {STRINGS.retryBtn}
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === STATUS.ERROR && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p
                className="text-red-700 text-xs"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {errorMsg}
              </p>
            </div>
            <button
              id="voice-error-retry-btn"
              onClick={startListening}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #65a30d)',
                fontFamily: "'Noto Sans Ethiopic', sans-serif",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {STRINGS.retryBtn}
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {status === STATUS.IDLE && isSupported && (
        <div className="px-4 pb-3">
          <p
            className="text-gray-400 text-[10px] text-center"
            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
          >
            {STRINGS.placeholder}
          </p>
        </div>
      )}
    </div>
  );
}
