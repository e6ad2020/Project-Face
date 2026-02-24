import { useState, useEffect, useCallback, useRef } from 'react';
import { geminiLive } from '@/lib/gemini-live';

interface UseLiveApiState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (apiKey: string, gender: 'male' | 'female') => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendImage: (base64: string, mimeType?: string) => void;
  setOnFunctionCall: (handler: (functionName: string, args: any) => void) => void;
}

export function useLiveApi(): UseLiveApiState {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const functionCallRef = useRef<((functionName: string, args: any) => void) | null>(null);

  useEffect(() => {
    // Sync state with singleton service
    geminiLive.setCallbacks(
      (connected) => setIsConnected(connected),
      (speaking) => setIsSpeaking(speaking),
      (userSpeaking) => setIsUserSpeaking(userSpeaking),
      (loading) => setIsLoading(loading),
      (functionName, args) => {
        functionCallRef.current?.(functionName, args);
      }
    );

    // Initial state check
    setIsConnected(geminiLive.isConnected);

    return () => {
      // Optional cleanup
    };
  }, []);

  const connect = useCallback(async (apiKey: string, gender: 'male' | 'female') => {
    try {
      setError(null);
      await geminiLive.connect(apiKey, gender);
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

  const setOnFunctionCall = useCallback((handler: (functionName: string, args: any) => void) => {
    functionCallRef.current = handler;
  }, []);

  return {
    isConnected,
    isRecording: isConnected, // Simplified mapping
    isSpeaking,
    isUserSpeaking,
    isLoading,
    error,
    connect,
    disconnect,
    sendMessage,
    sendImage: (base64: string, mimeType?: string) => geminiLive.sendImage(base64, mimeType),
    setOnFunctionCall
  };
}
