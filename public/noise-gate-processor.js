// Runs off the main thread as part of the recording's audio graph (see
// lib/recording/useSessionRecorder.ts). Steady background noise — a laptop
// fan, AC hum, room hiss — sits at a roughly constant, fairly quiet level;
// an actual voice rises well above it. This tracks a short-term volume
// envelope and smoothly ducks the signal whenever it's below the
// "someone's actually talking" threshold, so that steady hum gets pushed
// down without a voice's real ups and downs getting chopped or clicked.
class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.envelope = 0;
    this.gain = 1;
    // Linear amplitude threshold (~ -34 dBFS) below which audio is treated
    // as background noise rather than speech.
    this.threshold = 0.02;
    // How far to duck background noise — not fully silenced, so the cut
    // doesn't sound like the mic is cutting in and out; just pushed well
    // below where it's audible under real speech.
    this.duckedGain = 0.12;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output || !output[0]) return true;

    const inCh = input[0];
    const outCh = output[0];

    let sumSquares = 0;
    for (let i = 0; i < inCh.length; i++) sumSquares += inCh[i] * inCh[i];
    const rms = Math.sqrt(sumSquares / inCh.length);

    // Fast rise, slow fall — reacts quickly when speech starts, but doesn't
    // let the envelope collapse between syllables/words.
    this.envelope = rms > this.envelope ? rms : this.envelope * 0.97;

    const targetGain = this.envelope > this.threshold ? 1 : this.duckedGain;
    // Smooth the gain change itself so ducking never produces an audible
    // click or an unnaturally hard cutoff.
    const smoothing = targetGain > this.gain ? 0.05 : 0.01;

    for (let i = 0; i < inCh.length; i++) {
      this.gain += (targetGain - this.gain) * smoothing;
      outCh[i] = inCh[i] * this.gain;
    }

    return true;
  }
}

registerProcessor("noise-gate-processor", NoiseGateProcessor);
