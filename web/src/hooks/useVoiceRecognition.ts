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

// Detect browser support once at module level
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const IS_SUPPORTED = !!SpeechRecognitionAPI;

// Matches "chaina" before "cha" since "chaina" contains "cha" as a substring.
function detectCommand(raw: string): VoiceCommand | null {
  const text = raw.toLowerCase().trim();
  if (text.includes('chaina') || text.includes('china') || text.includes('chainna')) return 'CHAINA';
  if (text.includes('cha') || text.includes('cha!') || text.includes('चा')) return 'CHA';
  return null;
}

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
  const matchedRef = useRef(false); // prevents double-firing on the same utterance

  // Keep refs in sync without restarting the recognition
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
  }, []);

  const start = useCallback(() => {
    if (!IS_SUPPORTED || !SpeechRecognitionAPI) return;
    if (recognitionRef.current) return; // already running

    matchedRef.current = false;
    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Try Nepali first; browser gracefully falls back if unavailable
    recognition.lang = 'ne-NP';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (matchedRef.current) return;

      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
        // Also check alternatives
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
      // 'no-speech' and 'aborted' are expected non-fatal conditions
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.');
        setIsListening(false);
      } else {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      // Auto-restart if still enabled and no match yet (API stops on silence)
      if (enabledRef.current && !matchedRef.current) {
        setTimeout(() => {
          if (enabledRef.current && !matchedRef.current) {
            start();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [stop]);

  // Start/stop based on `enabled` prop
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
