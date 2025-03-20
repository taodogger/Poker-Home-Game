console.log('Kapoker - Initializing...');

// Initialize Firebase database reference
let appDatabase;
try {
    if (window.database) {
        appDatabase = window.database;
        console.log('[FIREBASE] Using existing database reference');
    } else {
        throw new Error('Firebase database reference not available');
    }
} catch (error) {
    console.error('[FIREBASE] Error initializing database:', error);
    if (window.PokerApp && window.PokerApp.UI) {
        window.PokerApp.UI.showToast('Error connecting to database', 'error');
    }
}

// Global state object
window.PokerApp = window.PokerApp || {};
PokerApp.state = {
    players: [],
    gameInProgress: false,
    dealerId: null,
    nextPlayerId: 1,
    chipRatio: 1.0,
    theme: 'Classic',
    sessionId: null,
    gameName: null,
    lobbyActive: false
};

// Create UI namespace with toast functionality first
PokerApp.UI = {
    showToast(message, type = 'info') {
        this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type || 'info'}`;
        toast.textContent = message;
        const container = document.querySelector('.toast-container');
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        }
        return document.querySelector('.toast-container');
    },
    
    updateGameStatus(message, isActive = false) {
        const gameStatus = document.getElementById('game-status');
        const statusBadge = gameStatus?.closest('.game-status-badge');
        if (gameStatus) {
            gameStatus.textContent = message;
        }
        if (statusBadge) {
            statusBadge.classList.toggle('inactive', !isActive);
            statusBadge.classList.toggle('active', isActive);
        }
    },
    
    updateLobbyUI(isActive = false) {
        console.log('[UI] Updating lobby UI, active:', isActive);
        
        const qrCodeContainer = document.getElementById('qr-code-container');
        const gameControls = document.querySelector('.lobby-content');
        const lobbyStatus = document.getElementById('lobby-status');
        const statusBadge = document.querySelector('.game-status-badge');
        const createLobbyForm = document.getElementById('create-lobby-form');
        
        if (isActive && PokerApp.state.sessionId && PokerApp.state.gameName) {
            console.log('[UI] Showing active lobby with session:', PokerApp.state.sessionId);
            
            // Update status badge
            if (statusBadge) {
                statusBadge.classList.remove('inactive');
                statusBadge.classList.add('active');
            }
            
            // Update status text
            if (lobbyStatus) {
                lobbyStatus.textContent = `Lobby active: ${PokerApp.state.gameName}`;
            }
            
            // Hide create lobby form
            if (createLobbyForm) {
                createLobbyForm.style.display = 'none';
            }
            
            // Generate join URL
            const joinUrl = getJoinUrl(PokerApp.state.sessionId, PokerApp.state.gameName);
            const joinUrlElement = document.getElementById('join-url-text');
            if (joinUrlElement) {
                joinUrlElement.textContent = joinUrl;
            }
            
            // Show QR code container and generate QR code
            if (qrCodeContainer) {
                qrCodeContainer.style.display = 'block';
                
                // Force visibility - this is crucial for QR generation
                setTimeout(() => {
                    // Generate QR code
                    generateQrCode(joinUrl);
                    console.log('[QR] QR code should be visible now');
                }, 100); // Small delay to ensure display change takes effect
            }
        } else {
            console.log('[UI] Showing inactive lobby state');
            
            // Update status badge
            if (statusBadge) {
                statusBadge.classList.remove('active');
                statusBadge.classList.add('inactive');
            }
            
            // Update status text
            if (lobbyStatus) {
                lobbyStatus.textContent = 'No active game';
            }
            
            // Show create lobby form
            if (createLobbyForm) {
                createLobbyForm.style.display = 'block';
            }
            
            // Hide QR code
            if (qrCodeContainer) {
                qrCodeContainer.style.display = 'none';
            }
        }
    }
};

// Core functions that need to be defined early
function updateEmptyState() {
    const noPlayersMessage = document.getElementById('no-players-message');
    if (noPlayersMessage) {
        noPlayersMessage.style.display = PokerApp.state.players.length > 0 ? 'none' : 'block';
    }
    
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.disabled = PokerApp.state.players.length < 2;
    }
}

function updatePlayerList() {
    const playerList = document.getElementById('player-list');
    if (!playerList) return;

    if (!PokerApp.state.players.length) {
        playerList.innerHTML = '<div class="no-players">No players added yet</div>';
        return;
    }

    playerList.innerHTML = PokerApp.state.players.map(player => `
        <div class="player-row ${player.id === PokerApp.state.dealerId ? 'dealer' : ''}" data-player-id="${player.id}">
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <div class="chip-count">
                    <span class="initial-chips">${player.initial_chips}</span>
                    <span class="current-chips">${player.current_chips}</span>
                </div>
            </div>
            <div class="player-actions">
                <button class="adjust-chips" onclick="adjustChips(${player.id})">
                    <span class="icon">💰</span>
                </button>
                <button class="remove-player" onclick="removePlayer(${player.id})">
                    <span class="icon">❌</span>
                </button>
            </div>
        </div>
    `).join('');

    updateEmptyState();
}

function addPlayer(name, chips) {
    if (!name || !chips) {
        PokerApp.UI.showToast('Please provide both name and chip amount', 'error');
        return false;
    }

    if (PokerApp.state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        PokerApp.UI.showToast(`Player "${name}" already exists`, 'error');
        return false;
    }

    const player = {
        id: PokerApp.state.nextPlayerId++,
        name: name,
        initial_chips: chips,
        current_chips: chips
    };

    PokerApp.state.players.push(player);
    updatePlayerList();
    updateEmptyState();
    saveState();

    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
    }

    PokerApp.UI.showToast(`Added ${name} with ${chips} chips`, 'success');
    return true;
}

function setupEventListeners() {
    // Lobby form handler
    const lobbyForm = document.getElementById('lobby-form');
    if (lobbyForm) {
        console.log('[SETUP] Found create lobby form:', lobbyForm);
        
        // Clone form to remove any existing listeners
        const newLobbyForm = lobbyForm.cloneNode(true);
        lobbyForm.parentNode.replaceChild(newLobbyForm, lobbyForm);
        
        newLobbyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[FORM] Create lobby form submitted');
            
            const gameName = document.getElementById('game-name').value.trim();
            
            if (!gameName) {
                showToast('Please enter a game name', 'error');
                return;
            }
            
            // Disable form while creating lobby
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                console.log('[FORM] Disabling submit button during processing');
            }
            
            try {
                // Generate a unique session ID and save it immediately to state
                const gameId = generateGameId();
                PokerApp.state.sessionId = gameId;
                PokerApp.state.gameName = gameName;
                PokerApp.state.lobbyActive = true;
                
                console.log('[FIREBASE] Creating game with ID:', gameId);
                
                // Save to Firebase
                const gameRef = window.database.ref(`games/${gameId}`);
                
                // Create game object
                const gameData = {
                    id: gameId,
                    name: gameName,
                    createdAt: Date.now(),
                    state: PokerApp.state,
                    active: true,
                    ratio: PokerApp.state.chipRatio || 1.0
                };
                
                // Save game to Firebase
                gameRef.set(gameData)
                    .then(() => {
                        console.log('[FIREBASE] Game created successfully');
                        
                        // Set up Firebase listeners for the new game
                        setupGameStateListener(gameId);
                        
                        // Update UI to show game is active
                        updateLobbyUI(true);
                        
                        // Generate QR code and make it visible
                        const joinUrl = getJoinUrl(gameId, gameName);
                        
                        // Make sure QR code container is visible
                        const qrCodeContainer = document.getElementById('qr-code-container');
                        if (qrCodeContainer) {
                            qrCodeContainer.style.display = 'block';
                            console.log('[UI] QR code container display style:', qrCodeContainer.style.display);
                        }
                        
                        // Generate QR code with join URL
                        generateQrCode(joinUrl);
                        
                        showToast(`Game lobby "${gameName}" created successfully!`, 'success');
                        
                        // Re-enable form
                        if (submitButton) submitButton.disabled = false;
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Error creating game:', error);
                        showToast('Failed to create game lobby', 'error');
                        
                        // Reset state
                        PokerApp.state.sessionId = null;
                        PokerApp.state.gameName = null;
                        PokerApp.state.lobbyActive = false;
                        
                        // Update UI
                        updateLobbyUI(false);
                        
                        // Re-enable form
                        if (submitButton) submitButton.disabled = false;
                    });
            } catch (error) {
                console.error('[ERROR] Create game failed:', error);
                showToast('Failed to create game lobby', 'error');
                
                // Reset state
                PokerApp.state.sessionId = null;
                PokerApp.state.gameName = null;
                PokerApp.state.lobbyActive = false;
                
                // Update UI
                updateLobbyUI(false);
                
                // Re-enable form
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // Add player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const playerName = document.getElementById('player-name').value.trim();
            const initialChips = parseInt(document.getElementById('initial-chips').value);
            
            // Don't validate the player name - form required attribute will handle this
            // and prevents redundant toast messages
            
            if (isNaN(initialChips) || initialChips <= 0) {
                PokerApp.UI.showToast('Please enter a valid chip amount', 'error');
                return;
            }
            
            if (addPlayer(playerName, initialChips)) {
                this.reset();
                document.getElementById('player-name').focus();
            }
        });
    }

    // Reset game button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }

    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            if (themes[selectedTheme]) {
                setTheme(selectedTheme);
            }
        });
    }
}

// Initialize function
function initialize() {
    console.log('Initializing poker app...');
    
    // Clear any existing state first
    localStorage.clear();
    
    // Reset state to default values
    PokerApp.state = {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: 'Classic',
        sessionId: null,
        gameName: null,
        lobbyActive: false
    };
    
    // Clean up any existing Firebase listeners
    if (appDatabase) {
        try {
            appDatabase.ref().off();
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up listeners:', error);
        }
    }
    
    // Hide QR code section
    const qrCodeSection = document.querySelector('.qr-code-section');
    if (qrCodeSection) {
        qrCodeSection.style.display = 'none';
    }
    
    // Reset game name input
    const gameNameInput = document.getElementById('game-name');
    if (gameNameInput) {
        gameNameInput.value = '';
        gameNameInput.disabled = false;
    }
    
    // Reset create lobby button
    const createLobbyBtn = document.querySelector('.create-lobby-btn');
    if (createLobbyBtn) {
        createLobbyBtn.disabled = false;
    }
    
    // Initialize empty player list
    const playerList = document.getElementById('player-list');
    if (playerList) {
        playerList.innerHTML = '<div class="no-players">No players added yet</div>';
    }
    
    // Set up form listeners
    setupEventListeners();
    
    // Update UI to show offline state
    PokerApp.UI.updateGameStatus('No active game', false);
    PokerApp.UI.updateLobbyUI(false);
    
    console.log('Initialization complete');
}

// Make core functions available globally
window.PokerApp = {
    ...window.PokerApp,
    initialize,
    addPlayer,
    removePlayer: window.removePlayer,
    updatePlayerList,
    resetGame,
    saveState,
    loadSavedState,
    UI: PokerApp.UI
};

// Define themes with main colors and gradients
const themes = {
    'Classic': {
        '--main-color': '#2E8B57',
        '--main-color-rgb': '46, 139, 87',
        '--secondary-color': '#3CB371',
        '--secondary-color-rgb': '60, 179, 113',
        '--vibrant-gradient': 'linear-gradient(135deg, #2E8B57, #3CB371)',
        '--accent-gradient': 'linear-gradient(45deg, #2E8B57, #3CB371)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♠️'
    },
    'Royal': {
        '--main-color': '#4169E1',
        '--main-color-rgb': '65, 105, 225',
        '--secondary-color': '#1E90FF',
        '--secondary-color-rgb': '30, 144, 255',
        '--vibrant-gradient': 'linear-gradient(135deg, #4169E1, #1E90FF)',
        '--accent-gradient': 'linear-gradient(45deg, #4169E1, #1E90FF)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♦️'
    },
    'Crimson': {
        '--main-color': '#DC143C',
        '--main-color-rgb': '220, 20, 60',
        '--secondary-color': '#FF4500',
        '--secondary-color-rgb': '255, 69, 0',
        '--vibrant-gradient': 'linear-gradient(135deg, #DC143C, #FF4500)',
        '--accent-gradient': 'linear-gradient(45deg, #DC143C, #FF4500)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♥️'
    },
    'Midnight': {
        '--main-color': '#2F4F4F',
        '--main-color-rgb': '47, 79, 79',
        '--secondary-color': '#696969',
        '--secondary-color-rgb': '105, 105, 105',
        '--vibrant-gradient': 'linear-gradient(135deg, #2F4F4F, #696969)',
        '--accent-gradient': 'linear-gradient(45deg, #2F4F4F, #696969)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♣️'
    },
    'Ocean': {
        '--main-color': '#20B2AA',
        '--main-color-rgb': '32, 178, 170',
        '--secondary-color': '#5F9EA0',
        '--secondary-color-rgb': '95, 158, 160',
        '--vibrant-gradient': 'linear-gradient(135deg, #20B2AA, #5F9EA0)',
        '--accent-gradient': 'linear-gradient(45deg, #20B2AA, #5F9EA0)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🌊'
    },
    'Fire': {
        '--main-color': '#FF6347',
        '--main-color-rgb': '255, 99, 71',
        '--secondary-color': '#FF4500',
        '--secondary-color-rgb': '255, 69, 0',
        '--vibrant-gradient': 'linear-gradient(135deg, #FF6347, #FF4500)',
        '--accent-gradient': 'linear-gradient(45deg, #FF6347, #FF4500)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔥'
    },
    'Purple': {
        '--main-color': '#9370DB',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#8A2BE2',
        '--secondary-color-rgb': '138, 43, 226',
        '--vibrant-gradient': 'linear-gradient(135deg, #9370DB, #8A2BE2)',
        '--accent-gradient': 'linear-gradient(45deg, #9370DB, #8A2BE2)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔮'
    },
    'Neon': {
        '--main-color': '#00FFFF',
        '--main-color-rgb': '0, 255, 255',
        '--secondary-color': '#00CED1',
        '--secondary-color-rgb': '0, 206, 209',
        '--vibrant-gradient': 'linear-gradient(135deg, #00FFFF, #00CED1)',
        '--accent-gradient': 'linear-gradient(45deg, #00FFFF, #00CED1)',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '💡'
    },
    'Rizzler': {
        '--main-color': '#ff00ff',
        '--main-color-rgb': '255, 0, 255',
        '--secondary-color': '#bf00ff',
        '--secondary-color-rgb': '191, 0, 255',
        '--vibrant-gradient': 'linear-gradient(135deg, #ff00ff, #bf00ff)',
        '--accent-gradient': 'linear-gradient(45deg, #ff00ff, #bf00ff)',
        '--body-background': 'url("./images/rizzler-background.jpg")',
        'tableImage': './images/rizzler-board.jpg',
        'icon': './images/rizzler-icon.png'
    },
    'Doginme': {
        '--main-color': '#1e90ff',
        '--main-color-rgb': '30, 144, 255',
        '--secondary-color': '#4169e1',
        '--secondary-color-rgb': '65, 105, 225',
        '--vibrant-gradient': 'linear-gradient(135deg, #1e90ff, #4169e1)',
        '--accent-gradient': 'linear-gradient(45deg, #1e90ff, #4169e1)',
        '--body-background': 'url("./images/doginme-background.jpg")',
        'tableImage': './images/doginme-board.jpg',
        'icon': './images/doginme-icon.png',
        '--accent-color': '#1e90ff'
    }
};

// Function to set the theme
function setTheme(theme) {
    if (!theme || !themes[theme]) {
        console.warn('[THEME] Invalid theme:', theme);
        theme = 'Classic'; // Fallback to Classic theme
    }
    
    // Store the theme in localStorage and state
    localStorage.setItem('theme', theme);
    
    // Update the app state
    PokerApp.state.theme = theme;
    
    console.log('[THEME] Setting theme to:', theme);
    
    // Apply theme colors to document
    document.body.setAttribute('data-theme', theme);
    
    // Update theme properties
    const themeConfig = themes[theme];
    if (themeConfig) {
        Object.entries(themeConfig).forEach(([key, value]) => {
            if (key.startsWith('--')) {
                document.documentElement.style.setProperty(key, value);
            }
        });
    }
    
    // Handle special theme-specific backgrounds
    if (theme === 'Rizzler' || theme === 'Doginme') {
        // Set body background with repeat pattern and shadow overlay
        document.body.style.backgroundImage = `
            linear-gradient(
                rgba(0, 0, 0, 0.5),
                rgba(0, 0, 0, 0.5)
            ),
            url('./images/${theme.toLowerCase()}-background.jpg')
        `;
        document.body.style.backgroundRepeat = 'repeat';
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundAttachment = 'fixed';
        
        // Update poker table background if available
        const pokerTable = document.querySelector('.poker-table');
        if (pokerTable && themeConfig.tableImage) {
            pokerTable.style.backgroundImage = `url('${themeConfig.tableImage}')`;
            pokerTable.style.backgroundSize = 'cover';
            pokerTable.style.backgroundPosition = 'center';
        }
    } else {
        // Reset to CSS variable for other themes
        document.body.style.backgroundImage = '';
        document.body.style.background = `var(--body-background)`;
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundAttachment = '';
    }
    
    // Update icons
    const leftIcon = document.querySelector('.title-icon.left-icon');
    const rightIcon = document.querySelector('.title-icon.right-icon');
    if (leftIcon && rightIcon) {
        if (theme === 'Doginme' || theme === 'Rizzler') {
            leftIcon.src = `images/${theme.toLowerCase()}-icon.png`;
            rightIcon.src = `images/${theme.toLowerCase()}-icon.png`;
        } else if (themeConfig && themeConfig.icon) {
            leftIcon.textContent = themeConfig.icon;
            rightIcon.textContent = themeConfig.icon;
        }
    }
    
    // Update the theme selector if it exists
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = theme;
    }
    
    // Apply theme to HandAnimation
    if (window.handAnimation && themes[theme]) {
        window.handAnimation.setTheme(themes[theme]);
    }
    
    // Update Firebase if we have an active session
    if (PokerApp.state.sessionId) {
        try {
            updateGameStateInFirebase({ theme });
        } catch (error) {
            console.error('[FIREBASE] Error updating theme in Firebase:', error);
        }
    }
}

// Save game state to localStorage and Firebase
function saveState() {
    try {
        const stateToSave = {
            players: PokerApp.state.players || [],
            gameInProgress: PokerApp.state.gameInProgress || false,
            dealerId: PokerApp.state.dealerId || null,
            nextPlayerId: PokerApp.state.nextPlayerId || 1,
            chipRatio: PokerApp.state.chipRatio || 1.0,
            theme: PokerApp.state.theme || 'Classic',
            lastUpdate: Date.now()
        };
        
        // Save to localStorage
        localStorage.setItem('pokerGameState', JSON.stringify({
            ...stateToSave,
            sessionId: PokerApp.state.sessionId,
            gameName: PokerApp.state.gameName,
            lobbyActive: PokerApp.state.lobbyActive
        }));
        
        console.log('[STORAGE] Game state saved to localStorage');
        
        // Update Firebase if we have a session
        if (PokerApp.state.sessionId && typeof firebase !== 'undefined' && firebase.database) {
            const updates = {};
            updates[`games/${PokerApp.state.sessionId}/active`] = true;
            updates[`games/${PokerApp.state.sessionId}/updatedAt`] = Date.now();
            updates[`games/${PokerApp.state.sessionId}/state`] = stateToSave;
            
            return firebase.database().ref().update(updates);
        }
        
        return true;
    } catch (error) {
        console.error('[STORAGE] Error saving game state:', error);
        return false;
    }
}

// Load saved state from localStorage
function loadSavedState() {
    try {
        const savedState = localStorage.getItem('pokerGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Only restore state if there's an active game or lobby
            if (state.gameInProgress || state.lobbyActive) {
                PokerApp.state = {
                    ...PokerApp.state,  // Keep default values
                    ...state,  // Override with saved values
                    players: state.players || [],
                    gameInProgress: state.gameInProgress || false,
                    dealerId: state.dealerId || null,
                    nextPlayerId: state.nextPlayerId || 1,
                    chipRatio: state.chipRatio || 1.0,
                    sessionId: state.sessionId || null,
                    gameName: state.gameName || null,
                    lobbyActive: false  // Start with lobby inactive until Firebase confirms
                };
                
                // If we have a session ID, reconnect to Firebase first
                if (state.sessionId) {
                    setupGameStateListener(state.sessionId);
                }
            } else {
                resetGameState();
            }
            
            console.log('[STORAGE] Game state loaded:', PokerApp.state);
        } else {
            console.log('[STORAGE] No saved game state found');
            resetGameState();
        }
        
        // Apply theme
        setTheme(PokerApp.state.theme || 'Classic');
        
        // Update UI based on state
        updateUIFromState();
        
        return true;
    } catch (error) {
        console.error('[STORAGE] Error loading game state:', error);
        resetGameState();
        return false;
    }
}

// Add function to reset game state to defaults
function resetGameState() {
    // Clean up Firebase listeners first
    cleanupFirebaseListeners();
    
    PokerApp.state = {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: localStorage.getItem('theme') || 'Classic',
        sessionId: null,
        gameName: null,
        lobbyActive: false
    };
    
    // Clear game name input
    const gameNameInput = document.getElementById('game-name');
    if (gameNameInput) {
        gameNameInput.value = '';
        gameNameInput.disabled = false;
    }
    
    // Enable create lobby button
    const createLobbyBtn = document.querySelector('.create-lobby-btn');
    if (createLobbyBtn) {
        createLobbyBtn.disabled = false;
    }
    
    // Hide QR code section
    const qrCodeSection = document.querySelector('.qr-code-section');
    if (qrCodeSection) {
        qrCodeSection.style.display = 'none';
    }
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    PokerApp.UI.updateGameStatus('Game reset', false);
    PokerApp.UI.updateLobbyUI(false);
    
    // Save the reset state
    saveState();
}

// Add function to update UI based on current state
function updateUIFromState() {
    // Update player list
    updatePlayerList();
    
    // Update empty state
    updateEmptyState();
    
    // Update game status
    PokerApp.UI.updateGameStatus(
                PokerApp.state.gameInProgress ? 'Game in progress' : 'Game not active', 
                PokerApp.state.gameInProgress
            );
            
    // Update lobby UI
    PokerApp.UI.updateLobbyUI(PokerApp.state.lobbyActive);
    
    // Initialize HandAnimation only if container exists
    const container = document.getElementById('dealer-wheel');
    if (container && typeof HandAnimation !== 'undefined') {
        window.handAnimation = new HandAnimation(container);
        if (PokerApp.state.theme) {
            window.handAnimation.setTheme(themes[PokerApp.state.theme]);
        }
    }
}

// Make initialize function available globally
window.initialize = initialize;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme first
    const savedTheme = localStorage.getItem('theme') || 'Classic';
    if (themes[savedTheme]) {
        setTheme(savedTheme);
    } else {
        setTheme('Classic'); // Default theme
    }
    
    // Set up theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = savedTheme || 'Classic';
        
        // Single event listener for theme changes
        themeSelector.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            if (themes[selectedTheme]) {
                setTheme(selectedTheme);
                PokerApp.UI.showToast(`Theme set to ${selectedTheme}`, 'success');
            } else {
                PokerApp.UI.showToast('Invalid theme selected', 'error');
                setTheme('Classic');
            }
        });
    }
    
    // Initialize rest of the app
    initialize();
});

// Add event listeners
document.addEventListener('DOMContentLoaded', initialize);

// Export core functions for use in other modules
window.PokerApp = {
    ...window.PokerApp,
    initialize,
    addPlayer,
    removePlayer,
    updatePlayerList,
    resetGame,
    saveState,
    loadSavedState,
    UI: {
        showToast: PokerApp.UI.showToast,
        createToastContainer: PokerApp.UI.createToastContainer,
        updateGameStatus: PokerApp.UI.updateGameStatus,
        updateLobbyUI: PokerApp.UI.updateLobbyUI
    }
};

// Function to generate a unique game ID
function generateGameId() {
    // Create a random string of characters for the game ID
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Add timestamp component for uniqueness
    const timestamp = Date.now().toString(36);
    
    // Add 10 random characters
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return timestamp + result;
}

// Get the join URL for a game
function getJoinUrl(gameId, gameName) {
    const baseUrl = window.location.origin;
    const path = window.location.pathname.replace('index.html', '');
    const encodedName = encodeURIComponent(gameName || 'Poker Game');
    return `${baseUrl}${path}buy-in.html?gameId=${gameId}&game-name=${encodedName}`;
}

// Generate a QR code for the game join URL
function generateQrCode(url) {
    console.log('[QR] Generating QR code for URL:', url);
    
    // Find QR container
    const qrWrapper = document.querySelector('.qr-wrapper');
    if (!qrWrapper) {
        console.error('[QR] QR wrapper element not found');
        return;
    }
    
    // Clear any existing content
    qrWrapper.innerHTML = '';
    
    // Make sure QR code container is visible
    const qrCodeContainer = document.getElementById('qr-code-container');
    if (qrCodeContainer) {
        qrCodeContainer.style.display = 'block';
        console.log('[QR] Set QR container display to:', qrCodeContainer.style.display);
    }
    
    // Make sure QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('[QR] QRCode library not loaded');
        qrWrapper.innerHTML = '<div style="padding: 20px; color: #ff4757;">QR Code library not loaded</div>';
        return;
    }
    
    try {
        // Generate new QR code
        new QRCode(qrWrapper, {
            text: url,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log('[QR] QR code generated successfully');
        
        // Add the join URL text display
        const joinUrlElement = document.getElementById('join-url-text');
        if (joinUrlElement) {
            joinUrlElement.textContent = url;
            console.log('[QR] Updated join URL text');
        }
        
        // Add click-to-copy functionality
        const clickToCopy = document.querySelector('.click-to-copy');
        if (clickToCopy) {
            clickToCopy.addEventListener('click', function() {
                navigator.clipboard.writeText(url).then(() => {
                    showToast('URL copied to clipboard', 'success');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            });
        }
    } catch (error) {
        console.error('[QR] Error generating QR code:', error);
        qrWrapper.innerHTML = '<div style="padding: 20px; color: #ff4757;">Could not generate QR code: ' + error.message + '</div>';
    }
}

// Add a helper function to ensure QR code is visible
function ensureQrCodeVisible() {
    console.log('[QR] Ensuring QR code is visible');
    
    // Make sure QR code container is visible
    const qrCodeContainer = document.getElementById('qr-code-container');
    if (qrCodeContainer) {
        qrCodeContainer.style.display = 'block';
        console.log('[QR] QR container display style:', qrCodeContainer.style.display);
    }
    
    // Regenerate QR code if we have session info
    if (PokerApp.state.sessionId && PokerApp.state.gameName) {
        const joinUrl = getJoinUrl(PokerApp.state.sessionId, PokerApp.state.gameName);
        
        // Find and clear the QR wrapper
        const qrWrapper = document.querySelector('.qr-wrapper');
        if (qrWrapper) {
            qrWrapper.innerHTML = '';
            qrWrapper.style.background = 'white';
            qrWrapper.style.padding = '16px';
            qrWrapper.style.borderRadius = '16px';
            qrWrapper.style.display = 'inline-block';
            
            console.log('[QR] Regenerating QR code with URL:', joinUrl);
            generateQrCode(joinUrl);
        }
        
        // Update the join URL text
        const joinUrlElement = document.getElementById('join-url-text');
        if (joinUrlElement) {
            joinUrlElement.textContent = joinUrl;
        }
    }
}

// Call this function at the end of createGameSession
async function createGameSession(gameName, password = null, includeLocalPlayers = true) {
    console.log('[GAME] Creating game session with name:', gameName);
    
    // Check for database
    if (!window.database) {
        console.error('[FIREBASE] No database reference available');
        PokerApp.UI.showToast('Firebase database not available', 'error');
        
        // Re-enable form
        const submitButton = document.querySelector('#create-lobby-form button[type="submit"]');
        if (submitButton) submitButton.disabled = false;
        return;
    }
    
    try {
        // Disable form inputs while we process
        console.log('[GAME] Disabling form inputs');
        const gameNameInput = document.getElementById('game-name');
        const createLobbyBtn = document.querySelector('.create-lobby-btn');
        if (gameNameInput) gameNameInput.disabled = true;
        if (createLobbyBtn) createLobbyBtn.disabled = true;
        
        // Generate a unique ID for the game
        const gameId = generateGameId();
        console.log('[FIREBASE] Generated gameId:', gameId);
        
        // Set up game object with initial state
        const ratio = PokerApp.state.ratio || 1.0;
        const gameObj = {
            id: gameId,
            name: gameName,
            created: Date.now(),
            ratio: ratio,
            active: true,
            state: {
                theme: PokerApp.state.theme || 'Classic',
                ratio: ratio,
                gameInProgress: false,
                dealerId: null,
                players: includeLocalPlayers ? PokerApp.state.players : []
            }
        };
        
        console.log('[FIREBASE] Saving game to database:', gameObj);
        
        // Save to Firebase
        await window.database.ref(`games/${gameId}`).set(gameObj);
        console.log('[FIREBASE] Game saved to database successfully');
        
        // Update application state
        PokerApp.state.sessionId = gameId;
        PokerApp.state.gameName = gameName;
        PokerApp.state.lobbyActive = true;
        
        // Force the QR code to be visible immediately
        const qrCodeContainer = document.getElementById('qr-code-container');
        if (qrCodeContainer) {
            qrCodeContainer.style.display = 'block';
            console.log('[UI] Forced QR code container to display:block');
        }
        
        // Set up listener for game state changes
        setupGameStateListener(gameId);
        
        // Update UI
        PokerApp.UI.updateLobbyUI(true);
        
        // Generate QR code for players to join
        const joinUrl = getJoinUrl(gameId, gameName);
        generateQrCode(joinUrl);
        
        const joinUrlElement = document.getElementById('join-url-text');
        if (joinUrlElement) {
            joinUrlElement.textContent = joinUrl;
        }
        
        // Show toast notification
        PokerApp.UI.showToast('Game lobby created! Share the QR code or link.', 'success');
        
        // Save state
        saveState();
        
        return gameId;
    } catch (error) {
        console.error('[FIREBASE] Error creating game session:', error);
        PokerApp.UI.showToast('Failed to create game session: ' + error.message, 'error');
        
        // Re-enable form
        const gameNameInput = document.getElementById('game-name');
        const createLobbyBtn = document.querySelector('.create-lobby-btn');
        if (gameNameInput) gameNameInput.disabled = false;
        if (createLobbyBtn) createLobbyBtn.disabled = false;
        
        throw error;
    }
}

// Helper function to update player data in Firebase
function updatePlayersInFirebase() {
    try {
        if (!PokerApp.state.sessionId || !appDatabase) {
            console.error('[FIREBASE] Cannot update players: No session ID or database');
            return;
        }

        console.log('[FIREBASE] Updating players:', PokerApp.state.players);
        
        // Create a clean players array without any null values
        const cleanPlayers = PokerApp.state.players.filter(p => p !== null);
        
        const updates = {
            [`games/${PokerApp.state.sessionId}/state/players`]: cleanPlayers,
            [`games/${PokerApp.state.sessionId}/state/nextPlayerId`]: PokerApp.state.nextPlayerId,
            [`games/${PokerApp.state.sessionId}/updatedAt`]: Date.now()
        };
        
        return appDatabase.ref().update(updates)
            .then(() => {
                console.log('[FIREBASE] Players updated successfully');
            })
            .catch(error => {
                console.error('[FIREBASE] Error updating players:', error);
                PokerApp.UI.showToast('Failed to sync player data', 'error');
            });
    } catch (error) {
        console.error('[FIREBASE] Error updating players:', error);
        PokerApp.UI.showToast('Failed to update data: ' + error.message, 'error');
    }
}

// Helper function to update multiple game state properties in Firebase
function updateGameStateInFirebase(stateUpdates) {
    try {
        if (PokerApp.state.sessionId && appDatabase) {
            const updates = {};
            
            // For each property in the state updates, create a Firebase update
            Object.keys(stateUpdates).forEach(key => {
                updates[`games/${PokerApp.state.sessionId}/state/${key}`] = stateUpdates[key];
            });
            
            // Add timestamp
            updates[`games/${PokerApp.state.sessionId}/updatedAt`] = new Date().toISOString();
            
            // Update Firebase
            return appDatabase.ref().update(updates);
        }
    } catch (error) {
        console.error('[FIREBASE] Error updating game state:', error);
        PokerApp.UI.showToast(`Failed to update data: ${error.message}`, 'error');
    }
}

// Make sure key functions are exported to the window scope
window.saveState = saveState;
window.updatePlayerList = updatePlayerList;
window.updateEmptyState = updateEmptyState;
window.removePlayer = removePlayer;
window.resetGame = resetGame;

// Add a cleanup function to handle all Firebase listeners
function cleanupFirebaseListeners() {
    if (PokerApp.state.sessionId && window.database) {
        try {
            // Clean up all listeners
            window.database.ref(`games/${PokerApp.state.sessionId}`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state/players`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state/theme`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/active`).off();
            
            console.log('[FIREBASE] Successfully cleaned up all listeners');
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up listeners:', error);
        }
    }
}

// Update the endGame function to properly cleanup
function endGame() {
    if (!PokerApp.state.gameInProgress) {
        PokerApp.UI.showToast('No active game to end', 'error');
        return;
    }
    
    PokerApp.state.gameInProgress = false;
    updateEmptyState();
    
    // Update UI elements
    document.getElementById('start-game').disabled = false;
    document.getElementById('simulate-hand').disabled = true;
    document.getElementById('end-game').disabled = true;
    
    // Update game status
    PokerApp.UI.updateGameStatus('Game ended', false);
    
    // Clean up Firebase
    if (PokerApp.state.sessionId && appDatabase) {
        try {
            // Update game status to ended
            const updates = {
                active: false,
                status: 'ended',
                endedAt: Date.now(),
                'state/gameInProgress': false
            };
            
            appDatabase.ref(`games/${PokerApp.state.sessionId}`).update(updates)
                .then(() => {
                    console.log('[FIREBASE] Game ended successfully');
                    // Clean up listeners after successful update
                    cleanupFirebaseListeners();
                })
                .catch(error => {
                    console.error('[FIREBASE] Error ending game:', error);
                });
            
            // Reset session info
            PokerApp.state.sessionId = null;
            PokerApp.state.gameName = null;
            PokerApp.state.lobbyActive = false;
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up Firebase in endGame:', error);
        }
    }
    
    // Update lobby UI
    PokerApp.UI.updateLobbyUI(false);
    
    // Save state
    saveState();
}

// Update the resetGame function to properly cleanup
function resetGame() {
    if (window.confirm('Are you sure you want to reset the game? This will clear all players and game data.')) {
        // Clean up Firebase first
        if (PokerApp.state.sessionId && appDatabase) {
            try {
                const updates = {
                    active: false,
                    status: 'ended',
                    endedAt: Date.now()
                };
                
                appDatabase.ref(`games/${PokerApp.state.sessionId}`).update(updates)
                    .then(() => {
                        console.log('[FIREBASE] Game reset successfully');
                        cleanupFirebaseListeners();
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Error resetting game:', error);
                    });
            } catch (error) {
                console.error('[FIREBASE] Error cleaning up Firebase in resetGame:', error);
            }
        }
        
        // Reset state and UI
        resetGameState();
        
        // Show confirmation
        PokerApp.UI.showToast('Game has been reset', 'success');
    }
}

// Add calculatePayouts function
function calculatePayouts() {
    if (!PokerApp.state.players || PokerApp.state.players.length === 0) {
        PokerApp.UI.showToast('No players to calculate payouts for', 'error');
        return;
    }

    const players = PokerApp.state.players;
    const payouts = [];
    let totalDifference = 0;

    // Calculate differences from initial chips
    players.forEach(player => {
        const difference = player.current_chips - player.initial_chips;
        totalDifference += difference;
        payouts.push({
            name: player.name,
            difference: difference,
            amount: Math.abs(difference * PokerApp.state.chipRatio)
        });
    });

    // Verify the total difference sums to zero (or close to it due to rounding)
    if (Math.abs(totalDifference) > 0.01) {
        PokerApp.UI.showToast('Error: Chip counts don\'t balance. Please check the numbers.', 'error');
        return;
    }

    // Sort payouts by difference (winners to losers)
    payouts.sort((a, b) => b.difference - a.difference);

    // Display results
    const payoutResults = document.getElementById('payout-results');
    if (!payoutResults) return;

    let html = '<div class="payout-list">';
    payouts.forEach(payout => {
        const amountText = payout.difference > 0 
            ? `Receives $${payout.amount.toFixed(2)}` 
            : payout.difference < 0 
                ? `Pays $${payout.amount.toFixed(2)}`
                : 'Break even';

        html += `
            <div class="payout-item ${payout.difference > 0 ? 'winner' : payout.difference < 0 ? 'loser' : 'neutral'}">
                <span class="player-name">${payout.name}</span>
                <span class="amount">${amountText}</span>
            </div>
        `;
    });
    html += '</div>';

    payoutResults.innerHTML = html;
    payoutResults.style.display = 'block';
}

// Add removePlayer function
function removePlayer(playerId) {
    if (!PokerApp.state.players) return;
    
    const index = PokerApp.state.players.findIndex(p => p.id === playerId);
    if (index === -1) return;
    
    PokerApp.state.players.splice(index, 1);
    updatePlayerList();
    updateEmptyState();
    saveState();
    
    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
    }
}

// Add setupGameStateListener function
function setupGameStateListener(gameId) {
    if (!gameId) return;

    try {
        // Clean up any existing listeners first
        cleanupFirebaseListeners();
        
        // Get database reference
        const database = window.database;
        if (!database) {
            throw new Error('Firebase database is not available');
        }
        
        console.log('[FIREBASE] Setting up new state listener for game:', gameId);
        
        // Listen for game state changes
        const stateRef = database.ref(`games/${gameId}/state`);
        stateRef.on('value', snapshot => {
            if (!snapshot.exists()) {
                console.warn('[FIREBASE] Game state not found for:', gameId);
                PokerApp.state.lobbyActive = false;
                PokerApp.UI.updateLobbyUI(false);
                return;
            }

            const gameState = snapshot.val();
            console.log('[FIREBASE] Received game state update:', gameState);

            // Ensure players array is clean and properly formatted
            let players = [];
            if (gameState.players) {
                // Convert to array if it's an object
                if (!Array.isArray(gameState.players)) {
                    players = Object.values(gameState.players);
                } else {
                    players = [...gameState.players];
                }
                // Filter out null/undefined entries and ensure required fields
                players = players.filter(p => p && p.id && p.name && p.initial_chips && p.current_chips);
                // Sort by join time if available
                players.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
            }
            console.log('[FIREBASE] Processed players:', players);

            // Update local state with Firebase state
            PokerApp.state = {
                ...PokerApp.state,
                players: players,
                gameInProgress: gameState.gameInProgress || false,
                dealerId: gameState.dealerId || null,
                nextPlayerId: gameState.nextPlayerId || Math.max(...players.map(p => p.id), 0) + 1,
                chipRatio: gameState.chipRatio || 1.0,
                theme: gameState.theme || PokerApp.state.theme,
                lobbyActive: true,  // If we have game state, lobby is active
                sessionId: gameId,  // Ensure we maintain the session ID
                gameName: PokerApp.state.gameName  // Maintain the game name
            };

            // Update UI
            updateUIFromState();
            updatePlayerList(); // Explicitly update player list
            PokerApp.UI.updateLobbyUI(true);
            
            console.log('[FIREBASE] State updated successfully:', PokerApp.state);
        }, error => {
            console.error('[FIREBASE] Error listening to game state:', error);
            PokerApp.UI.showToast('Error syncing with game state', 'error');
        });

        // Listen for game active status
        const activeRef = database.ref(`games/${gameId}/active`);
        activeRef.on('value', snapshot => {
            const isActive = snapshot.val();
            console.log('[FIREBASE] Game active status:', isActive);
            
            if (!isActive) {
                // Game was deactivated
                PokerApp.state.lobbyActive = false;
                PokerApp.UI.updateLobbyUI(false);
                PokerApp.UI.showToast('Game session ended', 'info');
                
                // Clean up listeners
                cleanupFirebaseListeners();
            } else {
                PokerApp.state.lobbyActive = true;
                PokerApp.UI.updateLobbyUI(true);
            }
        });

        // Listen specifically for player changes
        const playersRef = database.ref(`games/${gameId}/state/players`);
        playersRef.on('value', snapshot => {
            if (!snapshot.exists()) return;
            
            let players = [];
            const playersData = snapshot.val();
            
            if (Array.isArray(playersData)) {
                players = [...playersData];
            } else if (typeof playersData === 'object') {
                players = Object.values(playersData);
            }
            
            // Filter and sort players
            players = players
                .filter(p => p && p.id && p.name && p.initial_chips && p.current_chips)
                .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
            
            console.log('[FIREBASE] Players updated:', players);
            
            // Update state and UI
            PokerApp.state.players = players;
            PokerApp.state.nextPlayerId = Math.max(...players.map(p => p.id), 0) + 1;
            
            updatePlayerList();
        });

    } catch (error) {
        console.error('[FIREBASE] Error setting up game state listener:', error);
        PokerApp.UI.showToast('Error connecting to game session', 'error');
    }
}

function updateThemeElements(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    // Update any theme-specific elements here
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
}