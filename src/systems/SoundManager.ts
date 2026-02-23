export class SoundManager {
    private static instance: SoundManager;
    private ctx: AudioContext | null = null;
    private volume: number = 0.3;

    private constructor() {}

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private ensureContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public play(id: string): void {
        try {
            const ctx = this.ensureContext();
            switch (id) {
                case 'playerShoot': this.playerShoot(ctx); break;
                case 'meleeSwing': this.meleeSwing(ctx); break;
                case 'mageSpell': this.mageSpell(ctx); break;
                case 'enemyHit': this.enemyHit(ctx); break;
                case 'enemyDeath': this.enemyDeath(ctx); break;
                case 'playerHit': this.playerHit(ctx); break;
                case 'itemPickup': this.itemPickup(ctx); break;
                case 'itemLevelUp': this.itemLevelUp(ctx); break;
                case 'levelUp': this.levelUp(ctx); break;
                case 'skillQ': this.skillQ(ctx); break;
                case 'skillR': this.skillR(ctx); break;
                case 'shieldActivate': this.shieldActivate(ctx); break;
                case 'dash': this.dash(ctx); break;
                case 'bossSpawn': this.bossSpawn(ctx); break;
                case 'bossDefeat': this.bossDefeat(ctx); break;
                case 'heal': this.heal(ctx); break;
                case 'crateHit': this.crateHit(ctx); break;
                case 'crateBreak': this.crateBreak(ctx); break;
                case 'shrineActivate': this.shrineActivate(ctx); break;
                case 'reroll': this.reroll(ctx); break;
                case 'xpPickup': this.xpPickup(ctx); break;
                case 'upgradeSelect': this.upgradeSelect(ctx); break;
                case 'gameOver': this.gameOverSound(ctx); break;
                case 'gameClear': this.gameClear(ctx); break;
                case 'skillUnlock': this.skillUnlock(ctx); break;
                case 'petSummon': this.petSummon(ctx); break;
                case 'waveStart': this.waveStart(ctx); break;
            }
        } catch (_e) { /* audio not available */ }
    }

    /** Soft ascending shimmer — heal */
    private heal(ctx: AudioContext): void {
        const t = ctx.currentTime;
        [440, 554, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    // --- Sound synthesis methods ---

    /** Short descending saw wave — pew pew */
    private playerShoot(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    /** Sword swoosh — melee swing */
    private meleeSwing(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Swoosh: noise shaped like a fast arc (quiet → loud → quiet)
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = Math.sin((i / bufferSize) * Math.PI); // arc envelope
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        // Sweeping bandpass for "shuuung" feel
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
        filter.frequency.exponentialRampToValueAtTime(800, t + 0.2);
        filter.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t);
    }

    /** Sine sweep upward — magic cast (bubbly) */
    private mageSpell(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    /** Short noise pop — enemy hit */
    private enemyHit(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t);
    }

    /** Low thud — enemy death */
    private enemyDeath(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    /** Dull impact — player hit */
    private playerHit(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Low sine thump
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        // Noise layer
        const noiseLen = ctx.sampleRate * 0.08;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(this.volume * 0.3, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        osc.connect(gain).connect(ctx.destination);
        noiseSrc.connect(filter).connect(nGain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
        noiseSrc.start(t);
    }

    /** Rising 2-note chime — item pickup */
    private itemPickup(ctx: AudioContext): void {
        const t = ctx.currentTime;
        [523, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.15);
        });
    }

    /** 3-note ascending arpeggio — item level up */
    private itemLevelUp(ctx: AudioContext): void {
        const t = ctx.currentTime;
        [523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }

    /** Bright fanfare — level up */
    private levelUp(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    /** Tiny blip — XP orb pickup */
    private xpPickup(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(1600, t + 0.04);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    /** Confirmation chime — upgrade select */
    private upgradeSelect(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 880;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        // Second higher note
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 1320;
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, t + 0.05);
        gain2.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(t + 0.05);
        osc2.stop(t + 0.25);
    }

    /** Descending minor — game over */
    private gameOverSound(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const notes = [440, 415, 370, 330, 294]; // A4 Ab4 F#4 E4 D4
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.5);
        });
    }

    /** Grand victory — game clear */
    private gameClear(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Triumphant major arpeggio
        const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 E5 G5 C6 E6 G6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.45, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.6);
        });
        // Sustain chord at end
        [1047, 1319, 1568].forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + 0.6;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.25, start + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 1.2);
        });
    }

    /** Power-up jingle — skill unlock */
    private skillUnlock(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const notes = [587, 784, 1047]; // D5 G5 C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.35);
        });
    }

    /** Magical summon — pet spawn */
    private petSummon(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Rising wobble
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
        // Pop at end
        const pop = ctx.createOscillator();
        pop.type = 'sine';
        pop.frequency.value = 1200;
        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(0, t + 0.25);
        popGain.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.27);
        popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        pop.connect(popGain).connect(ctx.destination);
        pop.start(t + 0.25);
        pop.stop(t + 0.4);
    }

    /** Drum hit — wave start */
    private waveStart(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Low drum
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        // High accent
        const acc = ctx.createOscillator();
        acc.type = 'triangle';
        acc.frequency.value = 660;
        const accGain = ctx.createGain();
        accGain.gain.setValueAtTime(this.volume * 0.3, t + 0.05);
        accGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        acc.connect(accGain).connect(ctx.destination);
        acc.start(t + 0.05);
        acc.stop(t + 0.15);
    }

    /** Dice roll / shuffle — reroll */
    private reroll(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Fast descending arpeggio — shuffle feel
        const notes = [880, 660, 440];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.04;
            gain.gain.setValueAtTime(this.volume * 0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.08);
        });
    }

    /** Woody thud — crate hit */
    private crateHit(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Resonant wood knock
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
        // Noise click layer
        const noiseLen = ctx.sampleRate * 0.03;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = noiseBuf;
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.value = 1200;
        nFilter.Q.value = 2;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(this.volume * 0.3, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        nSrc.connect(nFilter).connect(nGain).connect(ctx.destination);
        nSrc.start(t);
    }

    /** Wood splintering — crate break */
    private crateBreak(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Low crack
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        // Splintering noise
        const noiseLen = ctx.sampleRate * 0.15;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen) * 0.8;
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(this.volume * 0.45, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        nSrc.connect(filter).connect(nGain).connect(ctx.destination);
        nSrc.start(t);
    }

    /** Magical chime — shrine activate */
    private shrineActivate(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Sparkly ascending chime with harmonics
        const notes = [659, 880, 1047, 1319]; // E5 A5 C6 E6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.4);
        });
        // Shimmer layer
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2000, t);
        shimmer.frequency.exponentialRampToValueAtTime(4000, t + 0.3);
        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(this.volume * 0.1, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        shimmer.connect(sGain).connect(ctx.destination);
        shimmer.start(t);
        shimmer.stop(t + 0.5);
    }

    /** Whoosh + zap — Q skill */
    private skillQ(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Whoosh layer
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + 0.1);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.25);
        filter.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t);
        // Electric zap accent
        const zap = ctx.createOscillator();
        zap.type = 'square';
        zap.frequency.setValueAtTime(1800, t);
        zap.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        const zapFilter = ctx.createBiquadFilter();
        zapFilter.type = 'bandpass';
        zapFilter.frequency.value = 1200;
        zapFilter.Q.value = 2;
        const zapGain = ctx.createGain();
        zapGain.gain.setValueAtTime(this.volume * 0.35, t);
        zapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        zap.connect(zapFilter).connect(zapGain).connect(ctx.destination);
        zap.start(t);
        zap.stop(t + 0.1);
    }

    /** Low boom + ring — R ultimate */
    private skillR(ctx: AudioContext): void {
        const t = ctx.currentTime;
        // Boom
        const boom = ctx.createOscillator();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(80, t);
        boom.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        const boomGain = ctx.createGain();
        boomGain.gain.setValueAtTime(this.volume * 0.6, t);
        boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        boom.connect(boomGain).connect(ctx.destination);
        boom.start(t);
        boom.stop(t + 0.4);
        // Ring
        const ring = ctx.createOscillator();
        ring.type = 'sine';
        ring.frequency.value = 440;
        const ringGain = ctx.createGain();
        ringGain.gain.setValueAtTime(this.volume * 0.25, t);
        ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        ring.connect(ringGain).connect(ctx.destination);
        ring.start(t);
        ring.stop(t + 0.6);
    }

    /** Energy hum — shield activation */
    private shieldActivate(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(330, t + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.linearRampToValueAtTime(this.volume * 0.35, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    /** Fast whoosh — dash */
    private dash(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.06);
        filter.frequency.exponentialRampToValueAtTime(800, t + 0.12);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t);
    }

    /** Low horn — boss spawn */
    private bossSpawn(ctx: AudioContext): void {
        const t = ctx.currentTime;
        [65, 98].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            const gain = ctx.createGain();
            const start = t + i * 0.3;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.5, start + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
            osc.connect(filter).connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.8);
        });
    }

    /** Victory fanfare — boss defeat */
    private bossDefeat(ctx: AudioContext): void {
        const t = ctx.currentTime;
        const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            const start = t + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(this.volume * 0.45, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.4);
        });
    }
}
