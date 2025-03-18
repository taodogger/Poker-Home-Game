// Define themes with main colors and gradients
const themes = {
    'classic-green': {
        '--main-color': '#2E8B57',
        '--secondary-color': '#3CB371',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♠️'
    },
    'royal-blue': {
        '--main-color': '#4169E1',
        '--secondary-color': '#1E90FF',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♦️'
    },
    'crimson-red': {
        '--main-color': '#DC143C',
        '--secondary-color': '#FF4500',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♥️'
    },
    'midnight-black': {
        '--main-color': '#2F4F4F',
        '--secondary-color': '#696969',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♣️'
    },
    'ocean-breeze': {
        '--main-color': '#20B2AA',
        '--secondary-color': '#5F9EA0',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🌊'
    },
    'firestorm': {
        '--main-color': '#FF6347',
        '--secondary-color': '#FF4500',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔥'
    },
    'purple-haze': {
        '--main-color': '#9370DB',
        '--secondary-color': '#8A2BE2',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔮'
    },
    'neon-nights': {
        '--main-color': '#00FFFF',
        '--secondary-color': '#00CED1',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '💡'
    },
    'rizzler': {
        '--main-color': '#ff00ff', // Bright pink
        '--secondary-color': '#bf00ff', // Purple
        '--body-background': 'url("./images/rizzler-background.jpg")',
        'tableImage': './images/rizzler-board.jpg',
        'icon': './images/rizzler-icon.png'
    },
    'doginme': {
        '--main-color': '#1e90ff', // Dodger blue
        '--secondary-color': '#4169e1', // Royal blue
        '--body-background': 'url("./images/doginme-background.jpg")',
        'tableImage': './images/doginme-board.jpg',
        'icon': './images/doginme-icon.png'
    }
};

// Create toast container and styles
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);

    // Add toast styles if they don't exist
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 9999;
            }
            .toast {
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideIn 0.3s ease forwards;
                opacity: 0;
                transform: translateX(50px);
            }
            .toast.success {
                background: linear-gradient(to right, #00b09b, #96c93d);
            }
            .toast.error {
                background: linear-gradient(to right, #ff5f6d, #ffc371);
            }
            .toast.info {
                background: linear-gradient(to right, #2193b0, #6dd5ed);
            }
            @keyframes slideIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .toast.fade-out {
                animation: slideOut 0.3s ease forwards;
            }
            @keyframes slideOut {
                to {
                    opacity: 0;
                    transform: translateX(50px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    return container;
}

// Initialize PokerApp immediately
window.PokerApp = {
    // Core application state
    state: {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: 'classic-green',
        sessionId: null,
        gameName: null,
        lobbyActive: false
    },
    
    // UI module for handling display and user interface
    UI: {
        handAnimation: null,
        toastTimeout: null,
        showToast: function(message, type = 'success') {
            const toastContainer = document.getElementById('toast-container') || createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        },
        initialize: function() {
            initializeUI();
            initializeDealerWheel();
            updateEmptyState();
            if (!this.theme) {
                setTheme(PokerApp.state.theme);
            }
        }
    },
    
    // Player management module
    Players: {
        // Add a new player
        add(name, chips) {
            return addPlayer(name, chips);
        },
        
        // Remove a player
        remove(playerId) {
            return removePlayer(playerId);
        },
        
        // Update the player list display
        updateList() {
            // Call both updatePlayerList and updateEmptyState to ensure everything is updated
            updatePlayerList();
            return updateEmptyState();
        }
    },
    
    // Game management module
    Game: {
        // Start a new game
        start() {
            return startGame();
        },
        
        // End the current game
        end() {
            return endGame();
        },
        
        // Reset the game state
        reset() {
            return resetGame();
        },
        
        // Calculate payouts between players
        calculatePayouts() {
            return calculatePayouts();
        }
    },
    
    // Storage module for persistence
    Storage: {
        // Save the current game state
        save() {
            return saveState();
        },
        
        // Load the saved game state
        load() {
            return loadSavedState();
        }
    },
    
    // Initialize the application
    initialize: async function() {
        console.log('Initializing PokerApp...');
        
        try {
            // Load saved state from localStorage
            const savedState = localStorage.getItem('pokerGameState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.state.players = state.players || [];
                this.state.gameInProgress = state.gameInProgress || false;
                this.state.chipRatio = state.chipRatio || 1.0;
                this.state.theme = state.theme || 'classic-green';
            }
        
        // Initialize UI components
        this.UI.initialize();
        
        // Setup event listeners
        setupEventListeners();
        
            // Set up auto-save
            setInterval(() => saveState(), 5000); // Save every 5 seconds
            window.addEventListener('beforeunload', () => saveState());
            
            // Update UI with loaded state
            updatePlayerList();
        updateEmptyState();
        
            console.log('PokerApp initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
};

// For backward compatibility
let gameState = window.PokerApp.state;
let handAnimation = null;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    updateEmptyState();
    setTheme(gameState.theme || 'classic-green');
});

// Initialize UI elements
function initializeUI() {
    // Set initial display states
    const animationSection = document.getElementById('animation');
    if (animationSection) {
        animationSection.style.display = 'none'; // Only show when game starts
    }
    
    // Initialize the ratio display
    const ratioDisplay = document.getElementById('ratio-display');
    if (ratioDisplay) {
        ratioDisplay.textContent = `Each chip is worth $${gameState.chipRatio.toFixed(2)}`;
    }
    
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Initialize dealer wheel
function initializeDealerWheel() {
    const container = document.getElementById('dealer-wheel');
    if (!container) {
        console.error('Dealer wheel container not found');
        return;
    }
    
    try {
        handAnimation = new HandAnimation(container);
        
        // Only set the theme if it's not already set in gameState
        if (!gameState.theme) {
            const savedTheme = localStorage.getItem('pokerTheme') || 'classic-green';
            if (themes[savedTheme]) {
                setTheme(savedTheme);
                const themeSelector = document.getElementById('theme-selector');
                if (themeSelector) {
                    themeSelector.value = savedTheme;
                }
            } else {
                setTheme('classic-green');
            }
        } else {
            // Apply the current theme to the dealer wheel
            handAnimation.setTheme(themes[gameState.theme]);
        }

        // Set up players if they exist
        if (gameState.players.length > 0) {
            handAnimation.setPlayers(gameState.players);
        }
    } catch (error) {
        console.error('Error initializing dealer wheel:', error);
        showToast('Error initializing poker table. Please refresh the page.', 'error');
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        // Set the initial value based on the current theme
        if (gameState.theme) {
            themeSelector.value = gameState.theme;
        }
        
        themeSelector.addEventListener('change', function(e) {
            const selectedTheme = e.target.value;
            setTheme(selectedTheme);
            showToast(`Theme set to ${selectedTheme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        });
    }

    // Ratio form handler
    const ratioForm = document.getElementById('ratio-form');
    if (ratioForm) {
        ratioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let realMoney = parseFloat(document.getElementById('money-amount').value);
            let chips = parseInt(document.getElementById('chip-amount').value);
            
            if (isNaN(realMoney) || isNaN(chips) || realMoney <= 0 || chips <= 0) {
                showToast('Please enter valid numbers for money and chips.', 'error');
                return;
            }
            
            gameState.chipRatio = realMoney / chips;
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.textContent = `Each chip is worth $${gameState.chipRatio.toFixed(2)}`;
                ratioDisplay.classList.add('highlight');
                setTimeout(() => {
                    ratioDisplay.classList.remove('highlight');
                }, 1500);
            }
            
            PokerApp.Storage.save();
            showToast('Ratio set successfully!');
            
            // Optionally close the form
            const ratioContent = document.getElementById('ratio-content');
            const minimizeButton = document.getElementById('minimize-button');
            if (ratioContent && minimizeButton) {
                ratioContent.classList.add('hidden');
                minimizeButton.textContent = '+';
            }
        });
    }

    // Set up the add player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            const initialChips = parseInt(document.getElementById('initial-chips').value);
            
            if (!playerName) {
                showToast('Please enter a player name', 'error');
                return;
            }
            
            if (isNaN(initialChips) || initialChips <= 0) {
                showToast('Please enter a valid chip amount', 'error');
                return;
            }
            
            // Add the player directly using our addPlayer function
            addPlayer(playerName, initialChips);
            
            // Reset the form
            this.reset();
            document.getElementById('player-name').focus();
        });
    }

    // Game control buttons with improved functionality and feedback
    const startGameBtn = document.getElementById('start-game');
    const endGameBtn = document.getElementById('end-game');
    const resetGameBtn = document.getElementById('reset-game');
    const simulateHandBtn = document.getElementById('simulate-hand');  // New button for clarity
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            if (gameState.players.length < 2) {
                showToast('Need at least 2 players to start a game', 'error');
                startGameBtn.classList.add('invalid-action');
                setTimeout(() => startGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            PokerApp.Game.start();
        });
    }
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', function() {
            if (!gameState.gameInProgress) {
                showToast('No active game to end', 'error');
                endGameBtn.classList.add('invalid-action');
                setTimeout(() => endGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            PokerApp.Game.end();
        });
    }
    
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', function() {
            // Make reset require confirmation
            if (confirm('Are you sure you want to reset the game? This will clear all players and settings.')) {
                PokerApp.Game.reset();
            }
        });
    }
    
    // Add a new button specifically for simulating hands
    if (simulateHandBtn) {
        simulateHandBtn.addEventListener('click', function() {
            if (!gameState.gameInProgress) {
                showToast('Start the game first to simulate hands', 'error');
                simulateHandBtn.classList.add('invalid-action');
                setTimeout(() => simulateHandBtn.classList.remove('invalid-action'), 500);
                return;
            }
            
            if (handAnimation && handAnimation.isAnimating) {
                showToast('Animation already in progress', 'error');
                return;
            }
            
            // Spin the dealer wheel to simulate a hand
            if (handAnimation) {
                try {
                    handAnimation.spin();
                    showToast('Simulating a new hand...');
                } catch (error) {
                    console.error('Error simulating hand:', error);
                    showToast('Error simulating hand', 'error');
                }
            }
        });
    }

    // Payout calculation
    const calculatePayoutsBtn = document.getElementById('calculate-payouts');
    if (calculatePayoutsBtn) {
        calculatePayoutsBtn.addEventListener('click', PokerApp.Game.calculatePayouts);
    }

    // Add touch event handling for better mobile experience
    if ('ontouchstart' in window) {
        // Add passive touch listeners to improve scrolling performance
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Make buttons more responsive on touch devices
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    // Add event listeners to chip inputs for realtime updates
    document.querySelectorAll('.chip-input').forEach(input => {
        // Use input event for immediate updates
        input.addEventListener('input', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                // Don't update for invalid values
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                // Update totals row immediately
                updateTotalsRow();
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
        
        // Keep the change event for validation and persistence
        input.addEventListener('change', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                showToast('Please enter a valid chip amount.', 'error');
                // Reset to previous value
                const playerIndex = gameState.players.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    this.value = gameState.players[playerIndex].current_chips;
                }
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                PokerApp.Storage.save();
                showToast(`Updated ${gameState.players[playerIndex].name}'s chips to ${newChips}`, 'info');
                
                // Update totals row
                updateTotalsRow();
                
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
    });

    // Lobby form handler
    const lobbyForm = document.getElementById('lobby-form');
    if (lobbyForm) {
        lobbyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const gameName = document.getElementById('game-name').value.trim();
            
            if (!gameName) {
                showToast('Please enter a game name', 'error');
                return;
            }
            
            // Disable form while creating lobby
            const submitButton = this.querySelector('button[type="submit"]');
            const gameNameInput = document.getElementById('game-name');
            if (submitButton) submitButton.disabled = true;
            if (gameNameInput) gameNameInput.disabled = true;
            
            try {
                await createGameLobby(gameName);
            } catch (error) {
                console.error('Failed to create game lobby:', error);
                // Form will be re-enabled by updateLobbyUI(false) in createGameLobby error handler
            }
        });
    }
}

// Touch event handlers for mobile
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    // Implement if needed for swipe gestures
}

function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Reset touch coordinates
    touchStartX = 0;
    touchStartY = 0;
    
    // Minimum distance for a swipe
    const minSwipeDistance = 50;
    
    // Check for horizontal swipe (can be used for future features like swiping between players)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
            // Swipe left - can be used for future features
        } else {
            // Swipe right - can be used for future features
        }
    }
}

// Function to set theme
function setTheme(themeName) {
    if (!themes[themeName]) {
        console.error('Theme not found:', themeName);
        return;
    }
    
    const theme = themes[themeName];
    gameState.theme = themeName;
    
    // Apply theme colors to root
    const root = document.documentElement;
    root.style.setProperty('--main-color', theme['--main-color']);
    root.style.setProperty('--secondary-color', theme['--secondary-color']);
    
    // Apply background
    document.body.style.background = theme['--body-background'];
    
    // Update icons
    const leftIcon = document.getElementById('left-icon');
    const rightIcon = document.getElementById('right-icon');
    
    if (leftIcon && rightIcon) {
        if (theme.icon.startsWith('./')) {
            // Custom image icon
            leftIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" style="width: 24px; height: 24px;">`;
            rightIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" style="width: 24px; height: 24px;">`;
        } else {
            // Emoji or text icon
            leftIcon.textContent = theme.icon;
            rightIcon.textContent = theme.icon;
        }
    }
    
    // Update dealer wheel if it exists
    if (handAnimation) {
        handAnimation.setTheme(theme);
    }
    
    // Save theme preference
    localStorage.setItem('pokerTheme', themeName);
}

// Initialize theme on load
function initializeTheme() {
    const savedTheme = localStorage.getItem('pokerTheme') || gameState.theme || 'classic-green';
    const themeSelector = document.getElementById('theme-selector');
    
    if (themeSelector) {
        themeSelector.value = savedTheme;
    }
    
    setTheme(savedTheme);
}

// Initialize game state
function initialize() {
    // Start with a completely fresh state
    gameState = {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: 'classic-green',
        sessionId: null,
        gameName: null,
        lobbyActive: false
    };
    
    // Only load saved state if we're not coming from a reset
    const wasReset = sessionStorage.getItem('gameWasReset');
    if (!wasReset) {
        const savedState = localStorage.getItem('pokerGameState');
        const savedSession = localStorage.getItem('activePokerSession');
        
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                // Update gameState with saved values
                Object.assign(gameState, parsedState);
                
                // Restore lobby state if there was an active session
                if (savedSession) {
                    const session = JSON.parse(savedSession);
                    gameState.sessionId = session.sessionId;
                    gameState.gameName = session.gameName;
                    gameState.lobbyActive = true;
                    
                    // Restore the lobby UI
                    const qrContainer = document.getElementById('qr-code-container');
                    const gameName = document.getElementById('game-name');
                    if (gameName) {
                        gameName.value = session.gameName;
                        gameName.disabled = true;
                    }
                    if (qrContainer) {
                        qrContainer.style.display = 'block';
                        qrContainer.classList.add('fade-in');
                    }
                    
                    // Regenerate QR code
                    generateQRCode();
                    
                    // Update lobby UI
                    updateLobbyUI(true);
                    
                    // Reconnect to Firebase
                    setupStateSync(session.sessionId);
                }
            } catch (error) {
                console.error('Error loading saved state:', error);
                PokerApp.UI.showToast('Error loading saved state', 'error');
            }
        }
    } else {
        // Clear the reset flag
        sessionStorage.removeItem('gameWasReset');
    }
        
        // Update UI
        updatePlayerList();
        updateEmptyState();
        
    // Update dealer wheel if it exists
    if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
    }
    
    // Initialize theme
    initializeTheme();
    
    // Set up auto-save
    window.addEventListener('beforeunload', saveState);
    setInterval(saveState, 5000); // Auto-save every 5 seconds
}

// Save game state
function saveState() {
    try {
        // Add timestamp to state
        const stateToSave = {
            ...gameState,
            lastSaved: Date.now()
        };
        
        // Save to localStorage
        localStorage.setItem('pokerGameState', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Error saving state:', error);
        PokerApp.UI.showToast('Error saving game state', 'error');
    }
}

// Function to add a player
function addPlayer(name, chips) {
    if (!name || !chips) {
        PokerApp.UI.showToast('Please enter both name and chips', 'error');
        return;
    }
    
    // Check for duplicate names
    if (gameState.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        PokerApp.UI.showToast('A player with this name already exists', 'error');
        return;
    }
    
    // Add player
    gameState.players.push({
        id: Date.now(),
        name: name,
        initial_chips: parseInt(chips),
        current_chips: parseInt(chips)
    });
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Update dealer wheel if it exists
    if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
    }
    
    // Save state
    saveState();
    
    PokerApp.UI.showToast(`Added player ${name} with ${chips} chips`, 'success');
}

// Function to remove a player
function removePlayer(playerId) {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        PokerApp.UI.showToast('Player not found', 'error');
        return;
    }
    
    const playerName = gameState.players[playerIndex].name;
    gameState.players.splice(playerIndex, 1);
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Update dealer wheel if it exists
    if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
    }
    
    // Save state
    saveState();
    
    PokerApp.UI.showToast(`Removed player ${playerName}`, 'success');
}

// Update player list in UI
function updatePlayerList() {
    const playerList = document.querySelector('#player-table tbody');
    if (!playerList) {
        console.error('Player table not found');
        return;
    }

    playerList.innerHTML = '';
    
    // Track totals
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    gameState.players.forEach(player => {
        const row = document.createElement('tr');
        
        // Make sure we have the current_chips value
        if (player.current_chips === undefined) {
            player.current_chips = player.initial_chips;
        }
        
        // Add to totals
        totalInitialChips += player.initial_chips;
        totalCurrentChips += player.current_chips;
        
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.initial_chips}</td>
            <td>
                <input
                    type="number"
                    class="chip-input"
                    value="${player.current_chips}"
                    min="0"
                    ${gameState.gameInProgress ? 'disabled' : ''}
                    data-player-id="${player.id}"
                >
            </td>
            <td>
                <button class="remove-player" data-player-id="${player.id}" ${gameState.gameInProgress ? 'disabled' : ''}>
                    Remove
                </button>
            </td>
        `;
        playerList.appendChild(row);
    });
    
    // Add a totals row if there are players
    if (gameState.players.length > 0) {
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'totals-row';
        totalsRow.innerHTML = `
            <td><strong>TOTALS</strong></td>
            <td><strong>${totalInitialChips}</strong></td>
            <td><strong>${totalCurrentChips}</strong></td>
            <td></td>
        `;
        playerList.appendChild(totalsRow);
    }
    
    // Add event listeners to the newly created remove buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                console.error('Invalid player ID for removal');
                return;
            }
            PokerApp.Players.remove(playerId);
        });
    });
    
    // Add event listeners to chip inputs for realtime updates
    document.querySelectorAll('.chip-input').forEach(input => {
        // Use input event for immediate updates
        input.addEventListener('input', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                // Don't update for invalid values
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                // Update totals row immediately
                updateTotalsRow();
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
        
        // Keep the change event for validation and persistence
        input.addEventListener('change', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                showToast('Please enter a valid chip amount.', 'error');
                // Reset to previous value
                const playerIndex = gameState.players.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    this.value = gameState.players[playerIndex].current_chips;
                }
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                PokerApp.Storage.save();
                showToast(`Updated ${gameState.players[playerIndex].name}'s chips to ${newChips}`, 'info');
                
                // Update totals row
                updateTotalsRow();
                
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
    });
    
    // Make sure to update the empty state after all UI changes
    updateEmptyState();
}

// Function to update just the totals row
function updateTotalsRow() {
    const totalsRow = document.querySelector('.totals-row');
    if (!totalsRow) return;
    
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    gameState.players.forEach(player => {
        totalInitialChips += player.initial_chips;
        totalCurrentChips += player.current_chips;
    });
    
    totalsRow.innerHTML = `
        <td><strong>TOTALS</strong></td>
        <td><strong>${totalInitialChips}</strong></td>
        <td><strong>${totalCurrentChips}</strong></td>
        <td></td>
    `;
}

// Function to force-read all chip values from the DOM
function forceUpdateChipValues() {
    try {
        // Get all chip inputs and update player data
        document.querySelectorAll('.chip-input').forEach(input => {
            // Check if the input element has the data-player-id attribute
            if (!input.hasAttribute('data-player-id')) {
                // Skip inputs without a player ID
                return;
            }
            
            const playerId = parseInt(input.getAttribute('data-player-id'));
            if (!playerId) {
                // Skip inputs with invalid player IDs (non-numeric or zero)
                return;
            }
            
            // Ensure we're getting the current value from the DOM
            const inputValue = input.value.trim();
            const newChips = parseInt(inputValue);
            
            if (isNaN(newChips)) {
                console.warn(`Invalid chip value for player ID ${playerId}: "${inputValue}"`);
                return;
            }
            
            // Find and update the player
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                const oldValue = gameState.players[playerIndex].current_chips;
                gameState.players[playerIndex].current_chips = newChips;
                
                if (oldValue !== newChips) {
                    console.log(`Updated player ${gameState.players[playerIndex].name} chips from ${oldValue} to ${newChips}`);
                }
            }
        });
        
        // Save the updated state
        PokerApp.Storage.save();
        console.log('Chip values updated from inputs');
    } catch (error) {
        console.error('Error updating chip values:', error);
        showToast('Error updating chip values', 'error');
    }
}

// Show/hide empty state message
function updateEmptyState() {
    const noPlayersMessage = document.getElementById('no-players-message');
    const playerTable = document.querySelector('#player-table');
    const payoutInstructions = document.getElementById('payout-instructions');
    
    if (!noPlayersMessage || !playerTable) {
        console.error('Empty state elements not found');
        return;
    }
    
    if (gameState.players.length === 0) {
        // No players case
        noPlayersMessage.style.display = 'block';
        playerTable.style.display = 'none';
        
        if (payoutInstructions) {
            payoutInstructions.textContent = 'Add players to see payout details.';
        }
    } else {
        // Have players case
        noPlayersMessage.style.display = 'none';
        playerTable.style.display = 'table';
        
        // Calculate total prize pool
        const totalChips = gameState.players.reduce((sum, player) => sum + player.initial_chips, 0);
        const totalMoney = totalChips * gameState.chipRatio;
        
        if (payoutInstructions) {
            payoutInstructions.innerHTML = `
                The current prize pool is <strong>$${totalMoney.toFixed(2)}</strong> (${totalChips} chips).<br>
                Update the current chip counts and click 'Calculate Payouts' to see the settlement.
            `;
        }
    }
    
    // Update game control button states
    const startGameBtn = document.getElementById('start-game');
    const simulateHandBtn = document.getElementById('simulate-hand');
    const endGameBtn = document.getElementById('end-game');
    
    if (startGameBtn) {
        startGameBtn.disabled = gameState.players.length < 2 || gameState.gameInProgress;
    }
    
    if (simulateHandBtn) {
        simulateHandBtn.disabled = !gameState.gameInProgress;
    }
    
    if (endGameBtn) {
        endGameBtn.disabled = !gameState.gameInProgress;
    }
}

// Function to set up automatic state saving
function setupAutoSave() {
    // Save state every 30 seconds
    setInterval(async () => {
        if (gameState.sessionId) {
            try {
                await saveState();
    } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }
    }, 30000);

    // Save state before page unload
    window.addEventListener('beforeunload', async (event) => {
        if (gameState.sessionId) {
            try {
                await saveState();
        } catch (error) {
                console.error('Final state save failed:', error);
            }
        }
    });
}

// Load state from localStorage or Firebase
async function loadSavedState() {
    try {
        // First try to load from Firebase if we have an active session
        if (gameState.sessionId) {
            const snapshot = await database.ref(`games/${gameState.sessionId}/state`).once('value');
            const firebaseState = snapshot.val();
            if (firebaseState) {
                gameState.players = firebaseState.players || [];
                gameState.gameInProgress = firebaseState.gameInProgress || false;
                gameState.chipRatio = firebaseState.chipRatio || 1.0;
                gameState.theme = firebaseState.theme || 'classic-green';
        return;
    }
        }
        
        // Fallback to localStorage
        const savedState = localStorage.getItem('pokerGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            gameState.players = state.players || [];
            gameState.gameInProgress = state.gameInProgress || false;
            gameState.chipRatio = state.chipRatio || 1.0;
            gameState.theme = state.theme || 'classic-green';
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
    }
    
    // Update UI after loading state
    updatePlayerList();
    updateEmptyState();
    if (gameState.theme) {
        setTheme(gameState.theme);
    }
}

// Function to set up real-time state synchronization
function setupStateSync(sessionId) {
    const stateRef = database.ref(`games/${sessionId}/state`);
    
    // Listen for state changes
    stateRef.on('value', (snapshot) => {
        const firebaseState = snapshot.val();
        if (!firebaseState) return;
        
        // Update local state with Firebase data
        if (firebaseState.players) {
            gameState.players = firebaseState.players;
            updatePlayerList();
    updateEmptyState();
        }
        
        if (firebaseState.gameInProgress !== undefined) {
            gameState.gameInProgress = firebaseState.gameInProgress;
        }
        
        if (firebaseState.chipRatio) {
            gameState.chipRatio = firebaseState.chipRatio;
        }
        
        if (firebaseState.theme) {
            gameState.theme = firebaseState.theme;
            setTheme(gameState.theme);
        }
        
        // Save to localStorage
        saveState();
    });
    
    // Handle disconnection
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            // Client is connected
            database.ref(`games/${sessionId}`).update({
                active: true,
                lastPing: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

// Function to create a game lobby
async function createGameLobby(gameName) {
    try {
        // Create new session
        const sessionRef = database.ref('games').push();
        gameState.sessionId = sessionRef.key;
        gameState.gameName = gameName;
        gameState.lobbyActive = true;
        
        // Save session info to localStorage
        localStorage.setItem('activePokerSession', JSON.stringify({
            sessionId: sessionRef.key,
            gameName: gameName
        }));
        
        // Set initial session data
        await sessionRef.set({
            name: gameName,
            ratio: gameState.chipRatio,
            active: true,
            status: 'lobby',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            state: {
                players: gameState.players,
                gameInProgress: gameState.gameInProgress,
                chipRatio: gameState.chipRatio,
                theme: gameState.theme,
                timestamp: Date.now()
            }
        });
        
        // Set up real-time sync
        setupStateSync(sessionRef.key);
        
        // Generate and display QR code
        await generateQRCode();
        
        // Show success message
        PokerApp.UI.showToast(`Game lobby "${gameName}" created successfully`, 'success');
        
        // Update UI to show lobby is active
        updateLobbyUI(true);
        
    } catch (error) {
        console.error('Error creating game lobby:', error);
        PokerApp.UI.showToast(`Error creating game lobby: ${error.message}`, 'error');
        
        // Clean up if we failed
        if (gameState.sessionId) {
            try {
                await database.ref(`games/${gameState.sessionId}`).remove();
            } catch (cleanupError) {
                console.error('Error cleaning up failed session:', cleanupError);
            }
        }
        
        // Reset state
        gameState.sessionId = null;
        gameState.gameName = null;
        gameState.lobbyActive = false;
        
        // Update UI
        updateLobbyUI(false);
    }
}

// Function to update UI based on lobby state
function updateLobbyUI(isActive) {
    const lobbyForm = document.getElementById('lobby-form');
    const qrContainer = document.getElementById('qr-code-container');
    const gameName = document.getElementById('game-name');
    
    if (isActive) {
        // Show QR code
        qrContainer.style.display = 'block';
        qrContainer.classList.add('fade-in');
        
        // Disable form
        if (gameName) gameName.disabled = true;
        if (lobbyForm) {
            const submitBtn = lobbyForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Lobby Active';
                submitBtn.disabled = true;
            }
        }
    } else {
        // Hide QR code
        if (qrContainer) {
            qrContainer.classList.remove('fade-in');
            qrContainer.classList.add('fade-out');
            setTimeout(() => {
                qrContainer.style.display = 'none';
                qrContainer.classList.remove('fade-out');
            }, 500);
        }
        
        // Enable form
        if (gameName) {
            gameName.disabled = false;
            gameName.value = '';
        }
        if (lobbyForm) {
            const submitBtn = lobbyForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Create Game Lobby';
                submitBtn.disabled = false;
            }
        }
    }
}

// Function to generate QR code
async function generateQRCode() {
    // Check if we have a valid session
    if (!gameState.sessionId || !gameState.gameName) {
        console.error('No active game session');
        PokerApp.UI.showToast('Error: No active game session', 'error');
        return;
    }

    // Get QR wrapper
    const qrWrapper = document.querySelector('.qr-wrapper');
    if (!qrWrapper) {
        console.error('QR wrapper element not found');
        return;
    }

    // Clear any existing QR code
    qrWrapper.innerHTML = '';

    // Create the URL for joining the game
    // Handle both localhost and production URLs correctly
    const baseUrl = window.location.href.split('/').slice(0, -1).join('/');
    const joinUrl = `${baseUrl}/buy-in.html?gameId=${encodeURIComponent(gameState.sessionId)}`;

    try {
        // Create new QR code
        new QRCode(qrWrapper, {
            text: joinUrl,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });

        // Add click-to-copy functionality with the URL display
        const clickToCopy = document.createElement('div');
        clickToCopy.className = 'click-to-copy';
        
        // Add URL display
        const urlDisplay = document.createElement('div');
        urlDisplay.className = 'join-url';
        urlDisplay.textContent = joinUrl;
        
        clickToCopy.textContent = 'Click to copy join link';
        qrWrapper.appendChild(clickToCopy);
        qrWrapper.appendChild(urlDisplay);

        // Add click handler to both elements
        [clickToCopy, urlDisplay].forEach(element => {
            element.addEventListener('click', () => {
                navigator.clipboard.writeText(joinUrl)
                    .then(() => {
                        PokerApp.UI.showToast('Join link copied to clipboard!', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                        PokerApp.UI.showToast('Failed to copy link', 'error');
                    });
            });
        });

        // Show the QR code container
        const qrContainer = document.getElementById('qr-code-container');
        if (qrContainer) {
            qrContainer.style.display = 'block';
            qrContainer.classList.add('fade-in');
        }

    } catch (error) {
        console.error('Error generating QR code:', error);
        PokerApp.UI.showToast('Error generating QR code', 'error');
    }
}

function resetGame() {
    // Store current theme before reset
    const currentTheme = gameState.theme;
    
    // End current game if in progress
    if (gameState.gameInProgress) {
        endGame();
    }
    
    // Clean up Firebase session if exists
    if (gameState.sessionId) {
        try {
            // Remove Firebase listeners first
            database.ref(`games/${gameState.sessionId}`).off();
            
            // Attempt to remove the session, but don't block on it
            database.ref(`games/${gameState.sessionId}`).remove()
                .catch(error => {
                    // Log but don't throw - this is expected if we don't have permission
                    console.log('Note: Could not remove Firebase session (expected if not owner)');
                });
    } catch (error) {
            // Log but continue - we don't want Firebase errors to block the reset
            console.log('Note: Firebase cleanup skipped');
        }
    }
    
    // Clear ALL related data from localStorage except theme
    const savedTheme = localStorage.getItem('pokerTheme'); // Preserve theme setting
    localStorage.removeItem('activePokerSession');
    localStorage.removeItem('pokerGameState');
    if (savedTheme) {
        localStorage.setItem('pokerTheme', savedTheme); // Restore theme setting
    }
    
    // Set a flag to prevent reloading the old state on initialize
    sessionStorage.setItem('gameWasReset', 'true');
    
    // Reset game state completely while preserving theme
    gameState = {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: currentTheme, // Keep the current theme
        sessionId: null,
        gameName: null,
        lobbyActive: false
    };
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    updateLobbyUI(false);
    
    // Reset the game name input and enable it
    const gameNameInput = document.getElementById('game-name');
    if (gameNameInput) {
        gameNameInput.value = '';
        gameNameInput.disabled = false;
    }
    
    // Reset the create lobby button
    const lobbyForm = document.getElementById('lobby-form');
    if (lobbyForm) {
        const submitBtn = lobbyForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Create Game Lobby';
            submitBtn.disabled = false;
        }
    }
    
    // Hide QR code section
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer) {
        qrContainer.style.display = 'none';
        qrContainer.classList.remove('fade-in');
    }
    
    // Save clean state
    saveState();
    
    PokerApp.UI.showToast('Game reset successfully', 'success');
}

// Theme handling
document.addEventListener('DOMContentLoaded', function() {
    const themeSelector = document.getElementById('theme-selector');
    const leftIcon = document.querySelector('.title-icon.left-icon');
    const rightIcon = document.querySelector('.title-icon.right-icon');

    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'doginme';
    setTheme(savedTheme);

    // Handle theme changes
    themeSelector.addEventListener('change', function(e) {
        const theme = e.target.value;
        setTheme(theme);
    });

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeSelector.value = theme;
        
        // Update icons
        if (theme === 'doginme') {
            leftIcon.src = 'images/doginme-icon.png';
            rightIcon.src = 'images/doginme-icon.png';
        } else if (theme === 'rizzler') {
            leftIcon.src = 'images/rizzler-icon.png';
            rightIcon.src = 'images/rizzler-icon.png';
        }
        
        // Update background
        document.body.style.background = getComputedStyle(document.body).getPropertyValue('--body-background');
    }
});