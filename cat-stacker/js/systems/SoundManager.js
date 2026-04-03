// Sound Manager - Handles audio playback for game events
export class SoundManager {
    constructor() {
        // Create a pool of audio instances for pickup sounds to allow overlapping
        this.pickupSoundPool = [];
        for (let i = 0; i < 5; i++) {
            const sound = new Audio('sounds/pickup.wav');
            sound.volume = 0.7;
            sound.preload = 'auto';
            this.pickupSoundPool.push(sound);
        }
        this.pickupSoundIndex = 0;
        
        // Single instances for other sounds
        this.bridgeSound = new Audio('sounds/bridge.wav');
        this.victorySound = new Audio('sounds/victory.wav');
        this.damageSound = new Audio('sounds/damage.mp3');
        
        // Set volume levels (0.0 to 1.0)
        this.bridgeSound.volume = 0.5; // Lower volume since it plays frequently
        this.victorySound.volume = 0.8;
        this.damageSound.volume = 0.7;
        
        // Preload sounds
        this.bridgeSound.preload = 'auto';
        this.victorySound.preload = 'auto';
        this.damageSound.preload = 'auto';
        
        // Error handling
        this.pickupSoundPool[0].addEventListener('error', () => {
            console.warn('Failed to load pickup.wav');
        });
        this.bridgeSound.addEventListener('error', () => {
            console.warn('Failed to load bridge.wav');
        });
        this.victorySound.addEventListener('error', () => {
            console.warn('Failed to load victory.wav');
        });
        this.damageSound.addEventListener('error', () => {
            console.warn('Failed to load damage.mp3');
        });
    }
    
    playPickup() {
        try {
            // Use pool of audio instances to allow overlapping sounds
            const sound = this.pickupSoundPool[this.pickupSoundIndex];
            this.pickupSoundIndex = (this.pickupSoundIndex + 1) % this.pickupSoundPool.length;
            
            // Reset to beginning and play
            sound.currentTime = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    // Ignore autoplay restrictions - user interaction will enable audio
                    console.debug('Audio play prevented:', err);
                });
            }
        } catch (err) {
            console.debug('Error playing pickup sound:', err);
        }
    }
    
    playBridge() {
        try {
            // Clone and play to allow overlapping sounds
            const sound = this.bridgeSound.cloneNode();
            sound.volume = this.bridgeSound.volume;
            sound.play().catch(err => {
                // Ignore autoplay restrictions - user interaction will enable audio
                console.debug('Audio play prevented:', err);
            });
        } catch (err) {
            console.debug('Error playing bridge sound:', err);
        }
    }
    
    playVictory() {
        try {
            // Clone and play to allow overlapping sounds
            const sound = this.victorySound.cloneNode();
            sound.volume = this.victorySound.volume;
            sound.play().catch(err => {
                // Ignore autoplay restrictions - user interaction will enable audio
                console.debug('Audio play prevented:', err);
            });
        } catch (err) {
            console.debug('Error playing victory sound:', err);
        }
    }
    
    playDamage() {
        try {
            // Clone and play to allow overlapping sounds
            const sound = this.damageSound.cloneNode();
            sound.volume = this.damageSound.volume;
            sound.play().catch(err => {
                // Ignore autoplay restrictions - user interaction will enable audio
                console.debug('Audio play prevented:', err);
            });
        } catch (err) {
            console.debug('Error playing damage sound:', err);
        }
    }
}

