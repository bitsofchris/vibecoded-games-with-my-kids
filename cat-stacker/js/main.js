// Cat Stack Dash - Entry Point
import { Game } from './Game.js';

// Game settings - persists for session
window.gameSettings = {
    yarnDensity: 1.5,      // Multiplier: 1x - 20x (default 1.5x as in original)
    obstacleDensity: 2,    // Multiplier: 0x - 3x (default 2x as in original)
    catSpeed: 1,           // Multiplier: 0.5x - 3x
    startingLevel: 1       // Level: 1 - 20
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const titleScreen = document.getElementById('title-screen');
    const startBtn = document.getElementById('start-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    
    // Slider elements
    const yarnDensitySlider = document.getElementById('yarn-density');
    const obstacleDensitySlider = document.getElementById('obstacle-density');
    const catSpeedSlider = document.getElementById('cat-speed');
    const startingLevelSlider = document.getElementById('starting-level');
    
    // Value display elements
    const yarnDensityValue = document.getElementById('yarn-density-value');
    const obstacleDensityValue = document.getElementById('obstacle-density-value');
    const catSpeedValue = document.getElementById('cat-speed-value');
    const startingLevelValue = document.getElementById('starting-level-value');
    
    if (!canvas) {
        console.error('Game canvas not found!');
        return;
    }
    
    // Create game instance (renders scene in background)
    const game = new Game(canvas, window.gameSettings);
    
    // Render initial frame so scene is visible behind title
    game.renderOnce();
    
    // Update slider value displays
    const updateSliderDisplays = () => {
        yarnDensityValue.textContent = `${window.gameSettings.yarnDensity}x`;
        obstacleDensityValue.textContent = `${window.gameSettings.obstacleDensity}x`;
        catSpeedValue.textContent = `${window.gameSettings.catSpeed}x`;
        startingLevelValue.textContent = window.gameSettings.startingLevel;
    };
    
    // Initialize slider values from settings
    const initSliders = () => {
        yarnDensitySlider.value = window.gameSettings.yarnDensity;
        obstacleDensitySlider.value = window.gameSettings.obstacleDensity;
        catSpeedSlider.value = window.gameSettings.catSpeed;
        startingLevelSlider.value = window.gameSettings.startingLevel;
        updateSliderDisplays();
    };
    
    // Slider change handlers
    yarnDensitySlider.addEventListener('input', () => {
        window.gameSettings.yarnDensity = parseFloat(yarnDensitySlider.value);
        updateSliderDisplays();
    });
    
    obstacleDensitySlider.addEventListener('input', () => {
        window.gameSettings.obstacleDensity = parseFloat(obstacleDensitySlider.value);
        updateSliderDisplays();
    });
    
    catSpeedSlider.addEventListener('input', () => {
        window.gameSettings.catSpeed = parseFloat(catSpeedSlider.value);
        updateSliderDisplays();
    });
    
    startingLevelSlider.addEventListener('input', () => {
        window.gameSettings.startingLevel = parseInt(startingLevelSlider.value);
        updateSliderDisplays();
    });
    
    // Open settings modal
    const openSettings = () => {
        initSliders();
        settingsModal.classList.remove('hidden');
    };
    
    // Close settings modal
    const closeSettings = () => {
        settingsModal.classList.add('hidden');
        // Apply settings to game
        game.applySettings(window.gameSettings);
        console.log('Settings applied:', JSON.stringify(window.gameSettings));
    };
    
    // Settings button handlers
    settingsBtn.addEventListener('click', openSettings);
    settingsBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        openSettings();
    });
    
    settingsCloseBtn.addEventListener('click', closeSettings);
    settingsCloseBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeSettings();
    });
    
    // Start game when start button is clicked
    const startGame = () => {
        // Apply settings before starting
        game.applySettings(window.gameSettings);
        
        // Fade out title screen
        titleScreen.classList.add('fade-out');
        
        // Start game after fade animation
        setTimeout(() => {
            titleScreen.classList.add('hidden');
            
            // Show level screen
            game.showLevelScreen();
            game.start();
            
            // Auto-hide level screen after a delay
            setTimeout(() => {
                game.hideLevelScreen();
            }, 1500);
        }, 500);
    };
    
    // Support both click and touch for iOS compatibility
    startBtn.addEventListener('click', startGame);
    startBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        startGame();
    });
    
    // Initialize sliders on load
    initSliders();
    
    // Expose for debugging (optional)
    window.game = game;
    
    console.log('Sophia\'s Cat Stacker initialized!');
    console.log('Controls: A/D or Arrow Keys to switch lanes, R to restart');
});


