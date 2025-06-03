const SoundSystem = {
    audioContext: null,
    isInitializing: false, // Prevent re-entrant initialization
    
    async init() {
        if (this.audioContext || this.isInitializing) return;
        this.isInitializing = true;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume if suspended, often needed on first user gesture
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            console.log('[SOUND] Audio context initialized, state:', this.audioContext.state);
        } catch (error) {
            console.error('[SOUND] WebAudio API not supported or init failed:', error);
            this.audioContext = null; // Ensure it's null on failure
        } finally {
            this.isInitializing = false;
        }
    },

    async _ensureAudioContextRunning() {
        if (!this.audioContext && !this.isInitializing) {
            await this.init(); // Initialize if not already, and not currently trying
        }
        if (!this.audioContext) {
            console.warn("[SOUND] AudioContext could not be initialized.");
            return false;
        }

        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log("[SOUND] AudioContext resumed on demand. New state:", this.audioContext.state);
            } catch (e) {
                console.error("[SOUND] Error resuming AudioContext on demand:", e);
                return false; // Can't play sound if resume fails
            }
        }
        return this.audioContext.state === 'running';
    },

    async playPopSound(frequency = 1000) {
        if (!await this._ensureAudioContextRunning()) return;
        
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.2; // Reduced noise amplitude slightly
        }
        noise.buffer = noiseBuffer;
        const noiseGain = this.audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.06); // Faster, shorter sweep
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.20, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // Shorter decay
        
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.03);
    },

    async playUIClickSound() {
        if (!await this._ensureAudioContextRunning()) return;
        
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle'; 
        oscillator.frequency.setValueAtTime(1300, now); 
        oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.05); // Slight downward for more 'tick'
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.003); // Sharper attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        
        oscillator.start(now);
        oscillator.stop(now + 0.05);
    },

    // ENHANCED Kaching Sound - More "Kaching!"
    async playKachingSound() {
        if (!await this._ensureAudioContextRunning()) return;
        const now = this.audioContext.currentTime;

        // Part 1: "Ka" - Metallic Clink/Latch
        const kaAttackOsc = this.audioContext.createOscillator();
        const kaAttackGain = this.audioContext.createGain();
        kaAttackOsc.type = 'square';
        kaAttackOsc.frequency.setValueAtTime(3200, now);
        kaAttackOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.02);
        kaAttackGain.gain.setValueAtTime(0, now);
        kaAttackGain.gain.linearRampToValueAtTime(0.15, now + 0.002); // Very short sharp attack
        kaAttackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        kaAttackOsc.connect(kaAttackGain);
        kaAttackGain.connect(this.audioContext.destination);
        kaAttackOsc.start(now);
        kaAttackOsc.stop(now + 0.02);

        const kaBodyOsc = this.audioContext.createOscillator();
        const kaBodyGain = this.audioContext.createGain();
        const kaBodyFilter = this.audioContext.createBiquadFilter();
        kaBodyOsc.type = 'sawtooth';
        kaBodyOsc.frequency.setValueAtTime(1200, now + 0.01); // Slightly delayed
        kaBodyOsc.frequency.exponentialRampToValueAtTime(600, now + 0.01 + 0.05);
        kaBodyFilter.type = 'bandpass';
        kaBodyFilter.frequency.setValueAtTime(1500, now + 0.01);
        kaBodyFilter.Q.value = 5;
        kaBodyGain.gain.setValueAtTime(0, now + 0.01);
        kaBodyGain.gain.linearRampToValueAtTime(0.1, now + 0.01 + 0.005);
        kaBodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01 + 0.06);
        kaBodyOsc.connect(kaBodyFilter);
        kaBodyFilter.connect(kaBodyGain);
        kaBodyGain.connect(this.audioContext.destination);
        kaBodyOsc.start(now + 0.01);
        kaBodyOsc.stop(now + 0.01 + 0.06);

        // Part 2: "Ching" - Resonant Metallic Ring (starts after "Ka")
        const chingTime = now + 0.05; 
        const baseRingFreq = 2800;
        const ringGain = this.audioContext.createGain();
        ringGain.connect(this.audioContext.destination);
        ringGain.gain.setValueAtTime(0, chingTime);
        ringGain.gain.linearRampToValueAtTime(0.25, chingTime + 0.02); // Bell attack
        // Amplitude wobble for realism
        ringGain.gain.linearRampToValueAtTime(0.2, chingTime + 0.15);
        ringGain.gain.linearRampToValueAtTime(0.25, chingTime + 0.3);
        ringGain.gain.exponentialRampToValueAtTime(0.001, chingTime + 0.7); // Longer decay

        const freqs = [baseRingFreq, baseRingFreq * 1.503, baseRingFreq * 2.201]; // Harmonic partials for bell
        const gains = [1, 0.4, 0.25]; // Relative amplitudes

        freqs.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, chingTime);
            // Slight pitch decay for realism
            osc.frequency.exponentialRampToValueAtTime(freq * 0.98, chingTime + 0.65);
            const partialGain = this.audioContext.createGain();
            partialGain.gain.value = gains[index];
            osc.connect(partialGain);
            partialGain.connect(ringGain);
            osc.start(chingTime);
            osc.stop(chingTime + 0.7);
        });
    },

    // ENHANCED Reset Sound - Punchier and Layered
    async playResetSound() {
        if (!await this._ensureAudioContextRunning()) return;
        const now = this.audioContext.currentTime;
        const totalDuration = 0.35;

        // 1. Initial Punch/Thump (Filtered Noise)
        const punchNoise = this.audioContext.createBufferSource();
        const punchBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.08, this.audioContext.sampleRate);
        const punchOutput = punchBuffer.getChannelData(0);
        for (let i = 0; i < punchBuffer.length; i++) {
            punchOutput[i] = (Math.random() * 2 - 1);
        }
        punchNoise.buffer = punchBuffer;
        const punchFilter = this.audioContext.createBiquadFilter();
        punchFilter.type = 'lowpass';
        punchFilter.frequency.setValueAtTime(300, now); // Low-pass for thump
        punchFilter.Q.value = 1;
        const punchGain = this.audioContext.createGain();
        punchNoise.connect(punchFilter);
        punchFilter.connect(punchGain);
        punchGain.connect(this.audioContext.destination);
        punchGain.gain.setValueAtTime(0, now);
        punchGain.gain.linearRampToValueAtTime(0.25, now + 0.005);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        punchNoise.start(now);
        punchNoise.stop(now + 0.08);

        // 2. Cascading Sweeping Tones
        const sweepFrequencies = [1200, 900, 600];
        const sweepStartDelay = 0.03;

        sweepFrequencies.forEach((startFreq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'triangle'; // Clearer than sine, less harsh than saw
            const startTime = now + sweepStartDelay + (i * 0.05);
            osc.frequency.setValueAtTime(startFreq, startTime);
            osc.frequency.exponentialRampToValueAtTime(startFreq * 0.3, startTime + totalDuration * 0.7);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01); // Softer than punch
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration * 0.8);

            osc.start(startTime);
            osc.stop(startTime + totalDuration);
        });
    },

    async playChipSound() {
        if (!await this._ensureAudioContextRunning()) return;
        const now = this.audioContext.currentTime;
        const duration = 0.07; // Slightly longer for more body

        const mainOscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();

        mainOscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        mainOscillator.type = 'square'; 
        mainOscillator.frequency.setValueAtTime(2400, now); // Start a bit higher
        mainOscillator.frequency.exponentialRampToValueAtTime(1600, now + duration * 0.3);
        mainOscillator.frequency.exponentialRampToValueAtTime(2800, now + duration * 0.6);
        mainOscillator.frequency.exponentialRampToValueAtTime(1200, now + duration);

        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(2200, now); 
        filterNode.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.7);
        filterNode.Q.value = 3.5; 

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005); // Slightly softer attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        mainOscillator.start(now);
        mainOscillator.stop(now + duration);
    },

    async playPayoutSound() {
        if (!await this._ensureAudioContextRunning()) return;
        const now = this.audioContext.currentTime;
        
        // 1. Brighter, more resonant "Ching" (similar to Kaching's ring but distinct)
        const baseChingFreq = 2600;
        const chingGain = this.audioContext.createGain();
        chingGain.connect(this.audioContext.destination);
        chingGain.gain.setValueAtTime(0, now);
        chingGain.gain.linearRampToValueAtTime(0.22, now + 0.015);
        chingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Fairly long ring

        const chingFreqs = [baseChingFreq, baseChingFreq * 1.6, baseChingFreq * 2.5]; // Different harmonic series
        const chingAmps = [1, 0.35, 0.2];

        chingFreqs.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.97, now + 0.45);
            const partialGain = this.audioContext.createGain();
            partialGain.gain.value = chingAmps[index];
            osc.connect(partialGain);
            partialGain.connect(chingGain);
            osc.start(now);
            osc.stop(now + 0.5);
        });
        
        // 2. Mechanical "Register" sounds - more defined and distinct
        const registerSoundCount = 2; // Fewer, but more distinct
        const registerSoundInterval = 0.06;
        const registerStartTime = now + 0.1; // Start after the initial ching begins

        for (let i = 0; i < registerSoundCount; i++) {
            const mechOsc = this.audioContext.createOscillator();
            const mechGain = this.audioContext.createGain();
            const mechFilter = this.audioContext.createBiquadFilter();

            mechOsc.connect(mechFilter);
            mechFilter.connect(mechGain);
            mechGain.connect(this.audioContext.destination);

            mechOsc.type = 'sawtooth';
            mechFilter.type = 'bandpass'; // Bandpass for more focused mechanical sound
            mechFilter.frequency.setValueAtTime(900 - i * 150, registerStartTime + (i * registerSoundInterval));
            mechFilter.Q.value = 4;

            mechOsc.frequency.setValueAtTime(300 - i * 40, registerStartTime + (i * registerSoundInterval));
            mechOsc.frequency.exponentialRampToValueAtTime(200 - i * 30, registerStartTime + (i * registerSoundInterval) + 0.04);
            
            mechGain.gain.setValueAtTime(0, registerStartTime + (i * registerSoundInterval));
            mechGain.gain.linearRampToValueAtTime(0.12, registerStartTime + (i * registerSoundInterval) + 0.003);
            mechGain.gain.exponentialRampToValueAtTime(0.001, registerStartTime + (i * registerSoundInterval) + 0.04);
            
            mechOsc.start(registerStartTime + (i * registerSoundInterval));
            mechOsc.stop(registerStartTime + (i * registerSoundInterval) + 0.04);
        }
    },

    async playRemoveSound() {
        if (!await this._ensureAudioContextRunning()) return;
        const now = this.audioContext.currentTime;
        const duration = 0.22;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter(); // Add filter for tone shaping
        
        // Short, slightly percussive noise puff at the start
        const puff = this.audioContext.createBufferSource();
        const puffBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.03, this.audioContext.sampleRate);
        const puffOutput = puffBuffer.getChannelData(0);
        for (let i = 0; i < puffBuffer.length; i++) {
            puffOutput[i] = (Math.random() * 2 - 1) * 0.1; // Softer puff
        }
        puff.buffer = puffBuffer;
        const puffGain = this.audioContext.createGain();
        const puffFilter = this.audioContext.createBiquadFilter();
        puffFilter.type = 'highpass';
        puffFilter.frequency.setValueAtTime(1000, now);
        puff.connect(puffFilter);
        puffFilter.connect(puffGain);
        puffGain.connect(this.audioContext.destination);
        puffGain.gain.setValueAtTime(0, now);
        puffGain.gain.linearRampToValueAtTime(0.1, now + 0.002);
        puffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        puff.start(now);
        puff.stop(now + 0.03);

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle'; 
        filterNode.type = 'lowpass'; // Smooth out the triangle a bit
        filterNode.frequency.setValueAtTime(800, now + 0.01);
        filterNode.frequency.exponentialRampToValueAtTime(400, now + 0.01 + duration * 0.7);

        oscillator.frequency.setValueAtTime(300, now + 0.01);
        oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.01 + duration);
        
        gainNode.gain.setValueAtTime(0, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01 + duration);
        
        oscillator.start(now + 0.01);
        oscillator.stop(now + 0.01 + duration);
    }
}; 