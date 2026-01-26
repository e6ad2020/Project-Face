export class AudioStreamPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number = 24000; // Gemini Live API default output

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playChunk(pcmData: ArrayBuffer) {
    if (!this.audioContext) await this.initialize();

    // Convert Int16 PCM to Float32
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const buffer = this.audioContext!.createBuffer(1, float32Array.length, this.sampleRate);
    buffer.getChannelData(0).set(float32Array);

    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);

    const currentTime = this.audioContext!.currentTime;
    // Schedule just after the previous chunk or now if we fell behind
    const startTime = Math.max(currentTime, this.nextStartTime);

    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextStartTime = 0;
  }
}
