import { useState, useEffect, useCallback } from 'react';
import { geminiLive } from '@/lib/gemini-live';

interface UseLiveApiState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  error: string | null;
  connect: (apiKey: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
}

export function useLiveApi(): UseLiveApiState {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync state with singleton service
    geminiLive.setCallbacks(
      (connected) => setIsConnected(connected),
      (speaking) => setIsSpeaking(speaking),
      (userSpeaking) => setIsUserSpeaking(userSpeaking)
    );

    // Initial state check
    setIsConnected(geminiLive.isConnected);

    return () => {
      // Optional cleanup
    };
  }, []);

  const connect = useCallback(async (apiKey: string) => {
    try {
      setError(null);
      await geminiLive.connect(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, []);

  const disconnect = useCallback(() => {
    geminiLive.disconnect();
  }, []);

  const sendMessage = useCallback((text: string) => {
    geminiLive.sendMessage(text);
  }, []);

  return {
    isConnected,
    isRecording: isConnected, // Simplified mapping
    isSpeaking,
    isUserSpeaking,
    error,
    connect,
    disconnect,
    sendMessage
  };
}
