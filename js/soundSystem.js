const SoundSystem = {
    audioContext: null,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[SOUND] Audio context initialized');
        } catch (error) {
            console.error('[SOUND] WebAudio API not supported:', error);
        }
    },

    playPopSound(frequency = 1000) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 2, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    },

    // NEW Sound for UI Clicks / Theme Swaps
    playUIClickSound() {
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') return; 
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Use a sine wave for a smoother sound
        oscillator.type = 'sine'; 
        // Start higher, quick upward sweep for upbeat feel
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime); 
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
        
        // Keep it short and slightly louder
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Increased gain slightly
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.12); // Slightly slower decay
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.12); // Match gain duration
    },

    // NEW: Kaching sound for ratio set / payout calculation
    playKachingSound() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        const now = this.audioContext.currentTime;
        const timeOffset = 0.05; // Slight delay between sounds

        // 1. "Ka" - Mechanical Sound
        const kaOsc = this.audioContext.createOscillator();
        const kaGain = this.audioContext.createGain();
        const kaFilter = this.audioContext.createBiquadFilter();

        kaOsc.connect(kaFilter);
        kaFilter.connect(kaGain);
        kaGain.connect(this.audioContext.destination);

        kaFilter.type = 'bandpass';
        kaFilter.frequency.setValueAtTime(1200, now); // Mid-range frequency
        kaFilter.Q.value = 5; 

        kaOsc.type = 'square'; // Square wave for mechanical feel
        kaOsc.frequency.setValueAtTime(300, now);
        kaOsc.frequency.exponentialRampToValueAtTime(100, now + 0.1); // Quick downward sweep

        kaGain.gain.setValueAtTime(0, now);
        kaGain.gain.linearRampToValueAtTime(0.25, now + 0.01); // Very quick attack
        kaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // Short decay

        kaOsc.start(now);
        kaOsc.stop(now + 0.1);

        // 2. "Ching" - Ringing Sound (Delayed)
        const chingOsc = this.audioContext.createOscillator();
        const chingGain = this.audioContext.createGain();
        const chingFilter = this.audioContext.createBiquadFilter();

        chingOsc.connect(chingFilter);
        chingFilter.connect(chingGain);
        chingGain.connect(this.audioContext.destination);

        chingFilter.type = 'bandpass';
        chingFilter.frequency.setValueAtTime(2800, now + timeOffset); // Higher frequency for ring
        chingFilter.Q.value = 10; // Reasonably sharp Q

        chingOsc.type = 'sine'; // Sine or triangle for the ring
        chingOsc.frequency.setValueAtTime(2800, now + timeOffset);
        chingOsc.frequency.exponentialRampToValueAtTime(2200, now + timeOffset + 0.2); // Slower decay

        chingGain.gain.setValueAtTime(0, now + timeOffset);
        chingGain.gain.linearRampToValueAtTime(0.3, now + timeOffset + 0.02); // Quick attack
        chingGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4); // Longer decay for ring

        chingOsc.start(now + timeOffset);
        chingOsc.stop(now + timeOffset + 0.4);
    },

    playResetSound() {
        if (!this.audioContext) return;
        
        // Create multiple oscillators for a richer sound
        const oscillators = [];
        const gains = [];
        const frequencies = [400, 600, 800];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioContext.currentTime + 0.5);
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            
            oscillators.push(osc);
            gains.push(gain);
            
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + 0.5 + i * 0.1);
        });
    },

    playChipSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },

    playPayoutSound() {
        if (!this.audioContext) return;
        
        // Create a cash register style sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // High-pitched "ding" sound
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.Q.value = 10;
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1500, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
        
        // Add a lower "register" sound after a slight delay
        setTimeout(() => {
            const lowOsc = this.audioContext.createOscillator();
            const lowGain = this.audioContext.createGain();
            
            lowOsc.connect(lowGain);
            lowGain.connect(this.audioContext.destination);
            
            lowOsc.type = 'sine';
            lowOsc.frequency.setValueAtTime(300, this.audioContext.currentTime);
            lowOsc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2);
            
            lowGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            lowGain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
            lowGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
            
            lowOsc.start();
            lowOsc.stop(this.audioContext.currentTime + 0.2);
        }, 100);
    },

    playRemoveSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}; 