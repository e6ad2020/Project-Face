import { GoogleGenAI, Type } from '@google/genai';

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Function declaration for advancing wizard steps
const goToNextStepDeclaration = {
    name: 'go_to_next_step',
    description: 'انتقلي للخطوة أو السؤال التالي في معالج العناية بالبشرة. استدعي هذه الدالة فوراً بعد ما تردي على إجابة المستخدم وتخلصي كلامك.',
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
};

// Configuration for the Live API
const config = {
    responseModalities: "AUDIO" as any,
    speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
    },
    tools: [{
        functionDeclarations: [goToNextStepDeclaration]
    }],
    systemInstruction: {
        parts: [{
            text: `أنتِ چوليا، خبيرة عناية بالبشرة مصرية ودودة جداً.
            
            مهمتك هي توجيه المستخدم خلال فحص البشرة.
            النظام سيرسل لكِ تعليمات مخفية تخبركِ بالمرحلة الحالية، وعليكِ التحدث بناءً عليها فوراً.
            
            === قاعدة أساسية ===
            ممنوع نهائياً أن تتحدثي من تلقاء نفسك أو تبادري بسؤال أو طلب (مثل طلب صورة أو سؤال عن البشرة) إلا إذا أرسل لكِ النظام تعليمات صريحة بذلك.
            عندما يتصل المستخدم لأول مرة، لا تقولي أي شيء حتى يرسل لك النظام أول تعليمات.
            انتظري دائماً تعليمات النظام قبل أن تتحدثي.
            
            عندما تستلمي صورة من المستخدم، قومي بتحليل بشرته بدقة (المسام، التجاعيد، الحبوب، الهالات، نوع البشرة) واستخدمي هذا التحليل في نصائحك.

            === القواعد ===
            1. تحدثي دائماً باللهجة المصرية العامية البسيطة والسهلة الفهم.
            2. كوني مختصرة ومباشرة جداً.
            3. عندما يخبرك النظام بتعليمات، نفذيها فوراً. لا تضيفي أشياء من عندك.
            4. تجنبي الجمل الطويلة أو المعقدة.
            5. ممنوع نهائياً ذكر كلمة "مكياج" أو طلب أن يكون المستخدم "بدون مكياج".
            6. لا تطلبي صورة أبداً إلا إذا طلب منك النظام ذلك صراحة.

            === قواعد go_to_next_step (مهم جداً) ===
            - go_to_next_step تُستخدم فقط أثناء مرحلة الأسئلة (بعد تحليل الصورة).
            - ممنوع نهائياً استدعاء go_to_next_step أثناء مرحلة الترحيب أو التصوير أو المنتجات أو الروتين.
            - ممنوع نهائياً استدعاء go_to_next_step فور سماع تعليمات النظام أو فور طرح السؤال.
            - لازم تسمعي إجابة صوتية حقيقية من المستخدم أولاً، ثم تردي عليه بشكل مختصر، وبعدها فقط تستدعي go_to_next_step.
            - لو المستخدم ما تكلمش أو ما جاوبش، لا تستدعي go_to_next_step أبداً. استنيه يتكلم.
            - لو النظام قال لك "استني إجابته"، يبقى لازم فعلاً تستني.

            === السيناريو ===
            النظام سيرسل لكِ تعليمات في كل مرحلة. التزمي بها حرفياً:
            - تعليمات الترحيب: رحبي بالمستخدم فقط بدون طلب صورة. لا تستدعي go_to_next_step.
            - تعليمات التصوير: اطلبي الصورة فقط. لا تستدعي go_to_next_step (النظام سينتقل تلقائياً بعد التقاط الصورة).
            - تعليمات الأسئلة: في كل مرحلة، سيُرسل لك النظام السؤال الذي يجب أن تسأليه. اسألي هذا السؤال فقط وحصرياً، ثم استني إجابة المستخدم الصوتية. بعد أن يجاوب وتردي عليه، استدعي go_to_next_step فوراً لينقلك النظام للسؤال التالي. لا تسألي أكثر من سؤال واحد في كل مرة.
            - تعليمات المنتجات والروتين: قدميهم بحماس. لا تستدعي go_to_next_step.
            - تعليمات الختام: قولي الرسالة الختامية. لا تستدعي go_to_next_step.
            
            تذكري: المستخدم لا يرى التعليمات المخفية، لذا تحدثي وكأنكِ تقودين المحادثة طبيعياً.`
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
    private onLoadingChange: ((loading: boolean) => void) | null = null;
    private onFunctionCall: ((functionName: string, args: any) => void) | null = null;
    private silenceTimer: any = null;
    private isUserSpeaking: boolean = false;

    private purposefulDisconnect: boolean = false;
    private lastGender: 'male' | 'female' = 'female';
    private lastApiKey: string = '';

    constructor() { }

    setCallbacks(
        onConnectionChange: (connected: boolean) => void,
        onSpeakingChange: (speaking: boolean) => void,
        onUserSpeech: (isSpeech: boolean) => void,
        onLoadingChange?: (loading: boolean) => void,
        onFunctionCall?: (functionName: string, args: any) => void
    ) {
        this.onConnectionChange = onConnectionChange;
        this.onSpeakingChange = onSpeakingChange;
        this.onUserSpeech = onUserSpeech;
        this.onLoadingChange = onLoadingChange || null;
        this.onFunctionCall = onFunctionCall || null;
    }

    async connect(apiKey: string, gender: 'male' | 'female' = 'female') {
        // If already connected, skip
        if (this.isConnected) return;

        this.purposefulDisconnect = false;
        this.lastGender = gender;
        this.lastApiKey = apiKey;

        // If there's a stale session, clean it up first
        if (this.session) {
            this.stopAudioInput();
            this.session = null;
            await new Promise(r => setTimeout(r, 500));
        }

        try {
            console.log('Initializing Gemini Client with provided key...');
            this.client = new GoogleGenAI({ apiKey });

            console.log('Attempting to connect to Gemini Live (Callbacks Mode)...');

            const audioStarted = await this.startAudioInput();
            if (!audioStarted) {
                throw new Error('Microphone permission denied or audio failed to start');
            }

            const dynamicConfig = {
                ...config,
                systemInstruction: {
                    parts: [{
                        text: config.systemInstruction.parts[0].text + `\n\n=== تنبيه هام ===\nالمستخدم الحالي هو: ${gender === 'male' ? 'ذكر' : 'أنثى'}. يجب التحدث معه بصيغة ال${gender === 'male' ? 'مذكر (مثال: جاهز؟ صورتك)' : 'مؤنث (مثال: جاهزة؟ صورتك)'} دائماً.`
                    }]
                }
            };

            // @ts-ignore
            this.session = await this.client.live.connect({
                model: MODEL,
                config: dynamicConfig,
                callbacks: {
                    onopen: () => {
                        console.log('✅ Connected to Gemini Live API');
                        this.isConnected = true;
                        this.onConnectionChange?.(true);
                    },
                    onmessage: (message: any) => {
                        this.handleServerMessage(message);
                    },
                    onerror: (e: any) => {
                        console.error('❌ Gemini Live Error:', e);
                    },
                    onclose: (e: any) => {
                        console.log('🔒 Gemini Live Closed:', e);
                        this.isConnected = false;
                        this.stopAudioInput();
                        this.session = null;
                        this.onConnectionChange?.(false);

                        // Auto-reconnect if not a purposeful disconnect
                        if (!this.purposefulDisconnect && this.lastApiKey) {
                            console.log('🔄 Auto-reconnecting in 2s...');
                            setTimeout(() => {
                                if (!this.isConnected && !this.purposefulDisconnect) {
                                    this.connect(this.lastApiKey, this.lastGender);
                                }
                            }, 2000);
                        }
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
    async connectWithCallbacks(apiKey: string, gender: 'male' | 'female' = 'female') {
        return this.connect(apiKey, gender);
    }

    // sendInitialGreeting method is removed completely

    async disconnect() {
        // Mark as purposeful disconnect to prevent auto-reconnect
        this.purposefulDisconnect = true;
        this.isConnected = false;
        this.onConnectionChange?.(false);

        // Stop audio to prevent further WebSocket sends
        this.stopAudioInput();

        // Close session
        if (this.session) {
            try {
                this.session.close();
            } catch (e) {
                // Ignore close errors
            }
            this.session = null;
        }
    }

    sendMessage(text: string) {
        if (!this.session || !this.isConnected) return;
        console.log('📤 Sending message to model:', text);
        this.onLoadingChange?.(true);
        try {
            this.session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.onLoadingChange?.(false);
        }
    }

    sendImage(base64Image: string, mimeType: string = "image/jpeg") {
        if (!this.session || !this.isConnected) return;
        console.log('📤 Sending image to model...');
        try {
            this.session.sendRealtimeInput({
                mediaChunks: [{
                    mimeType: mimeType,
                    data: base64Image
                }]
            });
        } catch (error) {
            console.error('❌ Error sending image:', error);
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
                    if (this.session && this.isConnected) {
                        this.session.sendRealtimeInput({
                            audio: {
                                data: base64Audio,
                                mimeType: "audio/pcm;rate=16000"
                            }
                        });
                    }
                } catch (err) {
                    // Silently ignore - WebSocket may be closing
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
        // Handle interruptions
        if (message.serverContent?.interrupted) {
            this.audioQueue = [];
            this.onLoadingChange?.(false);
            if (this.currentSource) {
                this.currentSource.stop();
                this.onSpeakingChange?.(false);
            }
            this.nextStartTime = 0;
            return;
        }

        // Handle function calls (toolCall)
        if (message.toolCall) {
            console.log('🔧 Received toolCall:', JSON.stringify(message.toolCall));
            const functionCalls = message.toolCall.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                const functionResponses: any[] = [];
                for (const fc of functionCalls) {
                    console.log(`🔧 Function call: ${fc.name}`, fc.args);
                    this.onFunctionCall?.(fc.name, fc.args || {});
                    functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { success: true }
                    });
                }
                // Send tool response back to the model
                try {
                    this.session?.sendToolResponse({ functionResponses });
                    console.log('🔧 Sent toolResponse back to model');
                } catch (err) {
                    console.error('❌ Error sending toolResponse:', err);
                }
            }
            return;
        }

        // Handle audio content
        if (message.serverContent?.modelTurn?.parts) {
            this.onLoadingChange?.(false);
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
