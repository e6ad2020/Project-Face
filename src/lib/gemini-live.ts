import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Configuration for the Live API
const config = {
    responseModalities: "AUDIO" as any,
    speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
    },
    systemInstruction: {
        parts: [{
            text: `أنتِ چوليا، خبيرة عناية بالبشرة مصرية ودودة جداً.
            
            مهمتك هي توجيه المستخدمة خلال فحص البشرة.
            النظام سيرسل لكِ تعليمات مخفية تخبركِ بالمرحلة الحالية، وعليكِ التحدث بناءً عليها فوراً.

            === القواعد ===
            1. تحدثي دائماً باللهجة المصرية العامية الودودة.
            2. كوني مختصرة ومباشرة.
            3. عندما يخبرك النظام "لقد انتقلت للسؤال X"، اسألي السؤال الموجه لكِ فوراً بصيغة طبيعية.

            === الأسئلة والسيناريو ===
            1. الترحيب: رحبي بها واطلبي صورة (هذا يحدث في البداية).
            2. الأسئلة: ستصلك تعليمات بكل سؤال (نوع البشرة، المشاكل، الروتين، الحساسية، الهدف). اسألي السؤال فوراً عندما يطلب منك.
            3. الروتين: عندما يطلب منك النظام اقتراح المنتجات، قدميها بحماس.

            تذكري: المستخدمة لا ترى التعليمات المخفية، لذا تحدثي وكأنكِ تقودين المحادثة طبيعياً.`
        }]
    }
};

class GeminiLiveService {
    private client: GoogleGenAI | null = null;
    private session: any = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private audioProcessor: ScriptProcessorNode | null = null;
    public isConnected: boolean = false;
    private audioQueue: ArrayBuffer[] = [];
    private currentSource: AudioBufferSourceNode | null = null;
    private playbackContext: AudioContext | null = null;
    private nextStartTime: number = 0;
    private isProcessingQueue: boolean = false;
    private onConnectionChange: ((connected: boolean) => void) | null = null;
    private onSpeakingChange: ((speaking: boolean) => void) | null = null;
    private onUserSpeech: ((isSpeech: boolean) => void) | null = null;
    private silenceTimer: any = null;
    private isUserSpeaking: boolean = false;

    constructor() { }

    setCallbacks(
        onConnectionChange: (connected: boolean) => void,
        onSpeakingChange: (speaking: boolean) => void,
        onUserSpeech: (isSpeech: boolean) => void
    ) {
        this.onConnectionChange = onConnectionChange;
        this.onSpeakingChange = onSpeakingChange;
        this.onUserSpeech = onUserSpeech;
    }

    async connect(apiKey: string) {
        if (this.isConnected) return;

        try {
            console.log('Initializing Gemini Client with provided key...');
            this.client = new GoogleGenAI({ apiKey });

            console.log('Attempting to connect to Gemini Live (Callbacks Mode)...');

            const audioStarted = await this.startAudioInput();
            if (!audioStarted) {
                throw new Error('Microphone permission denied or audio failed to start');
            }

            // @ts-ignore
            this.session = await this.client.live.connect({
                model: MODEL,
                config: config,
                callbacks: {
                    onopen: () => {
                        console.log('✅ Connected to Gemini Live API');
                        this.isConnected = true;
                        this.onConnectionChange?.(true);
                        setTimeout(() => this.sendInitialGreeting(), 100);
                    },
                    onmessage: (message: any) => {
                        this.handleServerMessage(message);
                    },
                    onerror: (e: any) => {
                        console.error('❌ Gemini Live Error:', e);
                        this.disconnect();
                    },
                    onclose: (e: any) => {
                        console.log('🔒 Gemini Live Closed:', e);
                        this.disconnect();
                    }
                }
            });

        } catch (error) {
            console.error('Failed to connect to Gemini Live:', error);
            this.disconnect();
            throw error;
        }
    }

    // Removed the old connect method and merged logic into the main connect
    async connectWithCallbacks(apiKey: string) {
        return this.connect(apiKey);
    }

    private async sendInitialGreeting() {
        if (this.session) {
            console.log('📤 Sending greeting message to model...');
            try {
                // Using the format that explicitly requests the model to speak
                await this.session.sendRealtimeInput({
                    text: "ابدأي المحادثة ورحبي بي واطلبي مني التقاط صورة لوجهي"
                });
            } catch (error) {
                console.error('❌ Error sending greeting:', error);
            }
        }
    }

    async disconnect() {
        if (!this.isConnected) return;

        // Stop audio first to prevent "WebSocket closed" spam
        this.stopAudioInput();

        // Then close session
        // if (this.session) {
        //    this.session.close();
        // }

        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.session = null;
    }

    sendMessage(text: string) {
        if (this.session && this.isConnected) {
            console.log('📤 Sending message to model:', text);
            try {
                this.session.sendRealtimeInput({ text });
            } catch (error) {
                console.error('❌ Error sending message:', error);
            }
        }
    }

    private async startAudioInput(): Promise<boolean> {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000
        });

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                }
            });

            console.log(`AudioContext State: ${this.audioContext.state}`);
            if (this.audioContext.state === 'suspended') {
                console.log('🔊 Resuming AudioContext...');
                await this.audioContext.resume();
                console.log(`AudioContext New State: ${this.audioContext.state}`);
            }

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

            let frameCount = 0;
            this.audioProcessor.onaudioprocess = (e) => {
                if (!this.isConnected || !this.session) return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Calculate RMS for logging and VAD
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);

                // Simple VAD (Voice Activity Detection)
                const VAD_THRESHOLD = 0.01;
                if (rms > VAD_THRESHOLD) {
                    if (!this.isUserSpeaking) {
                        this.isUserSpeaking = true;
                        this.onUserSpeech?.(true);
                    }
                    // Reset silence timer
                    if (this.silenceTimer) clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        this.isUserSpeaking = false;
                        this.onUserSpeech?.(false);
                    }, 1000); // 1 second of silence to consider speech ended
                }

                frameCount++;
                if (frameCount % 40 === 0) { // Reduce log frequency
                    console.log(`🎤 RMS: ${rms.toFixed(4)} | Connected: ${this.isConnected}`);
                }

                const pcm16 = this.floatTo16BitPCM(inputData);
                const base64Audio = this.arrayBufferToBase64(pcm16);

                try {
                    this.session.sendRealtimeInput({
                        audio: {
                            data: base64Audio,
                            mimeType: "audio/pcm;rate=16000"
                        }
                    });
                } catch (err) {
                    console.error("Error sending audio frame:", err);
                }
            };

            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);
            console.log('🔊 Audio Configured: Source -> Processor -> Destination');
            return true;

        } catch (error) {
            console.error('Error accessing microphone:', error);
            return false;
        }
    }

    private stopAudioInput() {
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.audioProcessor?.disconnect();
        this.audioContext?.close();
        this.currentSource?.stop();
        this.playbackContext?.close();

        this.mediaStream = null;
        this.audioProcessor = null;
        this.audioContext = null;
        this.currentSource = null;
        this.playbackContext = null;
        this.nextStartTime = 0;
    }

    private handleServerMessage(message: any) {
        if (message.serverContent?.interrupted) {
            this.audioQueue = [];
            if (this.currentSource) {
                this.currentSource.stop();
                this.onSpeakingChange?.(false);
            }
            this.nextStartTime = 0;
            return;
        }

        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const audioData = this.base64ToArrayBuffer(part.inlineData.data);
                    this.audioQueue.push(audioData);
                    this.playNextInQueue();
                }
            }
        }
    }

    private async playNextInQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        try {
            if (!this.playbackContext) {
                this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: 24000,
                });
            }

            if (this.playbackContext.state === 'suspended') {
                await this.playbackContext.resume();
            }

            this.onSpeakingChange?.(true);

            while (this.audioQueue.length > 0) {
                const audioData = this.audioQueue.shift()!;
                try {
                    const audioBuffer = this.createAudioBufferFromPCM(audioData, 24000, this.playbackContext);
                    const source = this.playbackContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(this.playbackContext.destination);

                    const currentTime = this.playbackContext.currentTime;
                    const startTime = Math.max(currentTime, this.nextStartTime);

                    source.start(startTime);
                    this.nextStartTime = startTime + audioBuffer.duration;
                    this.currentSource = source;

                } catch (error) {
                    console.error('❌ Error playing audio:', error);
                }
            }
        } catch (error) {
            console.error('❌ Error in audio playback loop:', error);
        } finally {
            this.isProcessingQueue = false;
            setTimeout(() => {
                if (this.audioQueue.length === 0 && !this.isProcessingQueue) {
                    this.onSpeakingChange?.(false);
                }
            }, 500);
        }
    }

    private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    private createAudioBufferFromPCM(data: ArrayBuffer, sampleRate: number, context: AudioContext): AudioBuffer {
        const int16 = new Int16Array(data);
        const float32 = new Float32Array(int16.length);

        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }

        const buffer = context.createBuffer(1, float32.length, sampleRate);
        buffer.getChannelData(0).set(float32);
        return buffer;
    }
}

export const geminiLive = new GeminiLiveService();
