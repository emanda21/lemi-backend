'use client';

/**
 * AppContext.js
 * Global state management for LEMI AI using React Context + useReducer.
 *
 * Provides:
 *  - currentScan         : the most recent scan result returned by the AI model
 *  - scanHistory         : array of all past scan results (persisted to localStorage)
 *  - isLoading           : true while a scan request is in-flight
 *  - error               : last error message, null when clear
 *  - voiceTranscription  : last Amharic speech-to-text result string
 *  - isListening         : true while the microphone is actively recording
 *  - language            : active UI language code ('am' | 'or')
 *  - theme               : active colour scheme ('light' | 'dark')
 *
 * Actions:
 *  - addScan(result)              : push a new result, set as currentScan, save to localStorage
 *  - setCurrentScan(scan)         : view an existing history item as the active scan
 *  - setLoading(bool)             : toggle the loading flag
 *  - setError(message)            : store an error string
 *  - clearError()                 : reset error to null
 *  - clearHistory()               : wipe scanHistory + localStorage
 *  - setVoiceTranscription(text)  : store the latest speech-to-text result
 *  - setListening(bool)           : toggle the microphone active flag
 *  - toggleLanguage()             : switch between Amharic ('am') and Afaan Oromoo ('or')
 *  - toggleTheme()                : switch between light and dark mode
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

// ─── Shape of a scan result (reference only, not enforced at runtime) ─────────
// {
//   id          : string  (UUID)
//   timestamp   : string  (ISO-8601)
//   plantName   : string  e.g. "Tomato"
//   diseaseName : string  e.g. "Leaf Blight"
//   confidence  : number  0-100
//   riskLevel   : "Low" | "Medium" | "High"
//   status      : "healthy" | "diseased"
//   imageUrl    : string  (local object URL created from the uploaded File)
//   treatment   : { about: string, symptoms: string, conditions: string }
//   rawResponse : object  (full FastAPI response, for debugging)
// }

// ─── Storage key ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'lemi_ai_scan_history';
const MAX_HISTORY = 10; // cap to prevent localStorage overload (base64 images are large)

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  currentScan:        null,
  scanHistory:        [],
  isLoading:          false,
  error:              null,
  voiceTranscription: '',      // latest STT result
  isListening:        false,   // microphone active flag
  language:           'am',    // 'am' = Amharic | 'or' = Afaan Oromoo
  theme:              'light', // 'light' | 'dark'
};

// ─── Action types ─────────────────────────────────────────────────────────────
const ActionTypes = {
  ADD_SCAN:                'ADD_SCAN',
  SET_CURRENT_SCAN:        'SET_CURRENT_SCAN',
  SET_LOADING:             'SET_LOADING',
  SET_ERROR:               'SET_ERROR',
  CLEAR_ERROR:             'CLEAR_ERROR',
  CLEAR_HISTORY:           'CLEAR_HISTORY',
  HYDRATE:                 'HYDRATE',
  SET_VOICE_TRANSCRIPTION: 'SET_VOICE_TRANSCRIPTION',
  SET_LISTENING:           'SET_LISTENING',
  SET_LANGUAGE:            'SET_LANGUAGE',
  SET_THEME:               'SET_THEME',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {

    case ActionTypes.HYDRATE:
      // Restore history from localStorage on first mount
      return { ...state, scanHistory: action.payload };

    case ActionTypes.ADD_SCAN: {
      const newHistory = [action.payload, ...state.scanHistory].slice(0, MAX_HISTORY);
      return {
        ...state,
        currentScan: action.payload,
        scanHistory: newHistory,
        isLoading: false,
        error: null,
      };
    }

    case ActionTypes.SET_CURRENT_SCAN:
      return { ...state, currentScan: action.payload };

    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case ActionTypes.CLEAR_HISTORY:
      return { ...state, scanHistory: [], currentScan: null };

    case ActionTypes.SET_VOICE_TRANSCRIPTION:
      return { ...state, voiceTranscription: action.payload };

    case ActionTypes.SET_LISTENING:
      return { ...state, isListening: action.payload };

    case ActionTypes.SET_LANGUAGE:
      return { ...state, language: action.payload };

    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      // Scan history
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: ActionTypes.HYDRATE, payload: parsed });
        }
      }
      // Theme preference
      const savedTheme = localStorage.getItem('lemi_theme') ?? 'light';
      dispatch({ type: ActionTypes.SET_THEME, payload: savedTheme });
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      // Language preference
      const savedLang = localStorage.getItem('lemi_language') ?? 'am';
      dispatch({ type: ActionTypes.SET_LANGUAGE, payload: savedLang });
    } catch {
      // Corrupt data — silently ignore
    }
  }, []);

  // Apply/remove 'dark' class on <html> whenever theme changes
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('lemi_theme', state.theme); } catch { /* ignore */ }
  }, [state.theme]);

  // Persist language choice
  useEffect(() => {
    try { localStorage.setItem('lemi_language', state.language); } catch { /* ignore */ }
  }, [state.language]);

  // Persist scanHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scanHistory));
    } catch {
      // Storage quota exceeded — silently ignore
    }
  }, [state.scanHistory]);

  // ── Helper actions (stable references via useCallback) ───────────────────

  /** Push a new scan result and make it the active scan */
  const addScan = useCallback((result) => {
    dispatch({ type: ActionTypes.ADD_SCAN, payload: result });
  }, []);

  /** Make an existing history item the active scan (for detail views) */
  const setCurrentScan = useCallback((scan) => {
    dispatch({ type: ActionTypes.SET_CURRENT_SCAN, payload: scan });
  }, []);

  /** Toggle the in-flight loading indicator */
  const setLoading = useCallback((bool) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: bool });
  }, []);

  /** Store an error message (clears loading) */
  const setError = useCallback((message) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: message });
  }, []);

  /** Dismiss the current error */
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  /** Wipe all scan history from state and localStorage */
  const clearHistory = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_HISTORY });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  /** Store the latest speech-to-text transcription */
  const setVoiceTranscription = useCallback((text) => {
    dispatch({ type: ActionTypes.SET_VOICE_TRANSCRIPTION, payload: text });
  }, []);

  /** Toggle the microphone active / idle flag */
  const setListening = useCallback((bool) => {
    dispatch({ type: ActionTypes.SET_LISTENING, payload: bool });
  }, []);

  /** Cycle UI language: Amharic ↔ Afaan Oromoo */
  const toggleLanguage = useCallback(() => {
    dispatch({
      type: ActionTypes.SET_LANGUAGE,
      payload: state.language === 'am' ? 'or' : 'am',
    });
  }, [state.language]);

  /** Switch colour scheme: light ↔ dark */
  const toggleTheme = useCallback(() => {
    dispatch({
      type: ActionTypes.SET_THEME,
      payload: state.theme === 'light' ? 'dark' : 'light',
    });
  }, [state.theme]);

  // Memoised context value — prevents unnecessary re-renders of consumers
  const value = useMemo(() => ({
    // State
    currentScan:        state.currentScan,
    scanHistory:        state.scanHistory,
    isLoading:          state.isLoading,
    error:              state.error,
    voiceTranscription: state.voiceTranscription,
    isListening:        state.isListening,
    language:           state.language,
    theme:              state.theme,
    // Actions
    addScan,
    setCurrentScan,
    setLoading,
    setError,
    clearError,
    clearHistory,
    setVoiceTranscription,
    setListening,
    toggleLanguage,
    toggleTheme,
  }), [
    state,
    addScan,
    setCurrentScan,
    setLoading,
    setError,
    clearError,
    clearHistory,
    setVoiceTranscription,
    setListening,
    toggleLanguage,
    toggleTheme,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Custom hook ─────────────────────────────────────────────────────────────
/**
 * useApp()
 * Consume the LEMI AI global context.
 * Must be used inside <AppProvider>.
 *
 * @example
 * const { currentScan, isLoading, addScan } = useApp();
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>. Check app/layout.js.');
  }
  return ctx;
}

export default AppContext;
