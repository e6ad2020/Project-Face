export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onDataAvailable: (data: ArrayBuffer) => void;

  constructor(onDataAvailable: (data: ArrayBuffer) => void) {
    this.onDataAvailable = onDataAvailable;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 }); // Try to ask for 16kHz directly
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Buffer size 4096 gives ~250ms latency at 16kHz, acceptable for chunking
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        this.onDataAvailable(pcmData);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      throw error;
    }
  }

  stop() {
    if (this.processor && this.source) {
      this.processor.disconnect();
      this.source.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
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
}
