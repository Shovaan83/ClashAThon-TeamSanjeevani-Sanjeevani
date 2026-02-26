import { useEffect, useRef, useState, useCallback } from 'react';

export type VoiceCommand = 'CHA' | 'CHAINA';

interface UseVoiceRecognitionOptions {
  enabled: boolean;
  onMatch: (command: VoiceCommand) => void;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const IS_SUPPORTED = !!SpeechRecognitionAPI;

/**
 * Detects "Cha" (have it / yes) or "Chaina" (don't have / no) from a transcript.
 *
 * Rules:
 * - Check CHAINA before CHA because "chaina" contains "cha" as a substring.
 * - Devanagari forms: छैन / चैन (chaina), छ / चा (cha).
 * - Latin forms: use \b word boundaries so partial words like "chair",
 *   "change", "each", "china" are NOT matched.
 */
function detectCommand(raw: string): VoiceCommand | null {
  const text = raw.toLowerCase().trim();

  // Devanagari — what ne-NP STT actually returns
  if (text.includes('छैन') || text.includes('चैन') || text.includes('चाइन')) return 'CHAINA';
  if (text.includes('छ') || text.includes('चा') || text.includes('छ।')) return 'CHA';

  // Latin script with word boundaries to avoid false positives
  if (/\bchaina\b|\bchainna\b|\bchhayna\b|\bchhainn\b/.test(text)) return 'CHAINA';
  if (/\bcha\b|\bchha\b/.test(text)) return 'CHA';

  return null;
}

const LANG_PRIMARY = 'ne-NP';
const LANG_FALLBACK = 'en-US';
// After this many consecutive silent onend events with no result, switch language.
const SILENT_THRESHOLD = 2;

export function useVoiceRecognition({
  enabled,
  onMatch,
}: UseVoiceRecognitionOptions): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const onMatchRef = useRef(onMatch);
  const matchedRef = useRef(false);

  // Language fallback state
  const langRef = useRef<string>(LANG_PRIMARY);
  const silentCountRef = useRef(0);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
    // Reset language fallback when explicitly stopped so next activation starts fresh.
    langRef.current = LANG_PRIMARY;
    silentCountRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!IS_SUPPORTED || !SpeechRecognitionAPI) return;
    if (recognitionRef.current) return;

    matchedRef.current = false;
    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langRef.current;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (matchedRef.current) return;

      // A real result arrived — reset the silent counter regardless of match.
      silentCountRef.current = 0;

      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;

        // Check alternative hypotheses first
        for (let a = 1; a < event.results[i].length; a++) {
          const alt = event.results[i][a].transcript;
          const cmd = detectCommand(alt);
          if (cmd) {
            matchedRef.current = true;
            recognition.abort();
            setTranscript(alt);
            onMatchRef.current(cmd);
            return;
          }
        }
      }

      setTranscript(fullTranscript);

      const cmd = detectCommand(fullTranscript);
      if (cmd) {
        matchedRef.current = true;
        recognition.abort();
        onMatchRef.current(cmd);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.');
        setIsListening(false);
      } else if (event.error === 'language-not-supported') {
        // Immediately fall back to English if the language is not supported.
        langRef.current = LANG_FALLBACK;
      } else {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);

      if (!enabledRef.current || matchedRef.current) return;

      // Count how many consecutive silent ends have occurred.
      silentCountRef.current += 1;

      if (silentCountRef.current >= SILENT_THRESHOLD && langRef.current !== LANG_FALLBACK) {
        // ne-NP produced no usable results — switch to English.
        langRef.current = LANG_FALLBACK;
        silentCountRef.current = 0;
      }

      // Auto-restart after a short pause.
      setTimeout(() => {
        if (enabledRef.current && !matchedRef.current) {
          start();
        }
      }, 300);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [stop]);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  return {
    isListening,
    transcript,
    error,
    isSupported: IS_SUPPORTED,
    start,
    stop,
  };
}
