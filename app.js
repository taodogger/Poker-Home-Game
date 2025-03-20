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
            
            // Generate join URL for QR code
            const joinUrl = getJoinUrl(PokerApp.state.sessionId, PokerApp.state.gameName);
            
            // Show QR code container
            if (qrCodeContainer) {
                console.log('[UI] Showing QR code container');
                qrCodeContainer.style.display = 'block';
                
                // Make sure the join URL is set
                const joinUrlElement = document.getElementById('join-url-text');
                if (joinUrlElement) {
                    joinUrlElement.textContent = joinUrl;
                }
                
                // Force QR code generation with a small delay to ensure the container is visible
                setTimeout(() => {
                    console.log('[UI] Generating QR code after delay');
                    if (typeof generateQrCode === 'function') {
                        generateQrCode(joinUrl);
                    }
                }, 100);
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
            
            // Show create lobby form and reset it
            if (createLobbyForm) {
                createLobbyForm.style.display = 'block';
                
                // Reset the form
                const gameNameInput = document.getElementById('game-name');
                const submitBtn = createLobbyForm.querySelector('button[type="submit"]');
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Game Lobby';
                }
                
                if (gameNameInput) {
                    gameNameInput.disabled = false;
                }
            }
            
            // Hide QR code container
            if (qrCodeContainer) {
                qrCodeContainer.style.display = 'none';
            }
            
            // Reset application state
            PokerApp.state.sessionId = null;
            PokerApp.state.gameName = null;
            PokerApp.state.lobbyActive = false;
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
    // Get the player table body
    const playerTableBody = document.querySelector('#player-table tbody');
    if (!playerTableBody) {
        console.error('[UI] Player table body not found');
        return;
    }

    // Update empty state message
    const noPlayersMessage = document.getElementById('no-players-message');
    if (noPlayersMessage) {
        noPlayersMessage.style.display = PokerApp.state.players.length > 0 ? 'none' : 'block';
    }

    // Clear current table rows
    playerTableBody.innerHTML = '';

    // Check if we have players
    if (!PokerApp.state.players || PokerApp.state.players.length === 0) {
        return;
    }

    console.log('[UI] Updating player list with players:', PokerApp.state.players);
    
    // Calculate totals for the footer
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    // Add player rows to the table
    PokerApp.state.players.forEach(player => {
        if (!player || !player.name) return; // Skip invalid players
        
        // Add to totals
        totalInitialChips += parseInt(player.initial_chips) || 0;
        totalCurrentChips += parseInt(player.current_chips) || 0;
        
        const row = document.createElement('tr');
        row.className = player.id === PokerApp.state.dealerId ? 'dealer' : '';
        row.setAttribute('data-player-id', player.id);
        
        row.innerHTML = `
            <td class="player-name">${player.name}</td>
            <td class="initial-chips">${player.initial_chips}</td>
            <td class="current-chips">
                <input type="number" class="chip-input" value="${player.current_chips}" 
                    data-player-id="${player.id}" 
                    onchange="updatePlayerChips(${player.id}, this.value)"
                    min="0">
            </td>
            <td class="player-actions">
                <button class="remove-player-btn" onclick="removePlayer(${player.id})">
                    <span class="button-icon">×</span>
                </button>
            </td>
        `;
        
        playerTableBody.appendChild(row);
    });
    
    // Add totals row
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.innerHTML = `
        <td><strong>TOTALS</strong></td>
        <td><strong>${totalInitialChips}</strong></td>
        <td><strong>${totalCurrentChips}</strong></td>
        <td></td>
    `;
    playerTableBody.appendChild(totalsRow);

    updateEmptyState();
    
    // Log success
    console.log(`[UI] Player list updated with ${PokerApp.state.players.length} players`);
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
    // Create lobby form
    const createLobbyForm = document.getElementById('create-lobby-form');
    console.log('[SETUP] Found create lobby form:', createLobbyForm ? 'yes' : 'no');
    
    if (createLobbyForm) {
        console.log('[SETUP] Setting up submit handler for create-lobby-form');
        
        // First, remove any existing listeners
        const oldForm = createLobbyForm;
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        
        // Add the new listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('[FORM] Create lobby form submitted');
            
            const gameName = document.getElementById('game-name').value.trim();
            if (!gameName) {
                PokerApp.UI.showToast('Please enter a game name', 'error');
                return;
            }
            
            // Disable the button to prevent double-clicks
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating...';
            }
            
            console.log('[GAME] Creating lobby for game:', gameName);
            
            // Generate a unique ID for this game
            const gameId = generateGameId();
            console.log('[GAME] Generated game ID:', gameId);
            
            // Create the game object for Firebase
            const gameData = {
                id: gameId,
                name: gameName,
                createdAt: Date.now(),
                ratio: PokerApp.state.chipRatio || 1.0,
                active: true,
                state: {
                    theme: PokerApp.state.theme || 'Classic',
                    gameInProgress: false,
                    dealerId: null,
                    players: [],
                    nextPlayerId: 1,
                    chipRatio: PokerApp.state.chipRatio || 1.0
                }
            };
            
            // Basic validation checks
            if (!window.firebase || !window.firebase.database) {
                console.error('[FIREBASE] Firebase database not available');
                PokerApp.UI.showToast('Firebase database not available', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Game Lobby';
                }
                return;
            }
            
            console.log('[FIREBASE] Saving game data to Firebase');
            
            // Save to Firebase
            window.firebase.database().ref(`games/${gameId}`).set(gameData)
                .then(() => {
                    console.log('[FIREBASE] Game saved successfully');
                    
                    // Update local state
                    PokerApp.state.sessionId = gameId;
                    PokerApp.state.gameName = gameName;
                    PokerApp.state.lobbyActive = true;
                    
                    // Update UI
                    PokerApp.UI.updateLobbyUI(true);
                    
                    // Generate QR code
                    const joinUrl = getJoinUrl(gameId, gameName);
                    if (typeof generateQrCode === 'function') {
                        generateQrCode(joinUrl);
                    }
                    
                    // Set up state listener
                    if (typeof setupGameStateListener === 'function') {
                        setupGameStateListener(gameId);
                    }
                    
                    // Show success message
                    PokerApp.UI.showToast('Game lobby created successfully', 'success');
                    
                    // Save state
                    if (typeof saveState === 'function') {
                        saveState();
                    }
                })
                .catch(error => {
                    console.error('[FIREBASE] Error saving game:', error);
                    PokerApp.UI.showToast('Error creating game: ' + error.message, 'error');
                    
                    // Re-enable the button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Game Lobby';
                    }
                });
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
    
    // Create UI namespace if it doesn't exist
    if (!window.PokerApp) {
        window.PokerApp = {};
    }
    
    if (!window.PokerApp.UI) {
        window.PokerApp.UI = {
            showToast: showToast,
            createToastContainer: createToastContainer,
            updateGameStatus: updateGameStatus,
            updateLobbyUI: updateLobbyUI
        };
    }
    
    // Reset state to default values
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
    
    // Check for Firebase availability
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error('[FIREBASE] Firebase not available! Some features may not work.');
        PokerApp.UI.showToast('Firebase connection error. Limited functionality available.', 'error');
    } else {
        console.log('[FIREBASE] Firebase initialized successfully');
        
        // Clean up any existing Firebase listeners
        try {
            firebase.database().ref().off();
            console.log('[FIREBASE] Cleaned up existing listeners');
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up listeners:', error);
        }
    }
    
    // Set up the UI appearance
    if (PokerApp.state.theme) {
        setTheme(PokerApp.state.theme);
    }
    
    // Create toast container
    PokerApp.UI.createToastContainer();
    
    // Hide QR code section
    const qrCodeContainer = document.getElementById('qr-code-container');
    if (qrCodeContainer) {
        qrCodeContainer.style.display = 'none';
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
    updatePlayerList();
    updateEmptyState();
    
    // Set up form listeners
    setupEventListeners();
    
    // Update UI to show offline state
    PokerApp.UI.updateGameStatus('No active game', false);
    PokerApp.UI.updateLobbyUI(false);
    
    console.log('Initialization complete');
    
    // Run a quick Firebase test
    if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('test').set({
            timestamp: Date.now(),
            message: 'Initialization test'
        })
        .then(() => console.log('[FIREBASE] Test write successful'))
        .catch(error => console.error('[FIREBASE] Test write failed:', error));
    }

    // Set up mobile compatibility
    setupMobileCompatibility();
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

// Load saved state from localStorage
function loadSavedState() {
    try {
        // First load from localStorage
        const savedState = localStorage.getItem('pokerGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            console.log('[STORAGE] Found saved state:', state);
            
            // Set basic state from localStorage
            PokerApp.state = {
                ...PokerApp.state,  // Keep default values
                players: state.players || [],
                gameInProgress: state.gameInProgress || false,
                dealerId: state.dealerId || null,
                nextPlayerId: state.nextPlayerId || 1,
                chipRatio: state.chipRatio || 1.0,
                theme: state.theme || 'Classic',
                sessionId: state.sessionId || null,
                gameName: state.gameName || null,
                lobbyActive: state.sessionId ? true : false  // Mark as active if we have a session ID
            };
            
            // Update UI immediately with what we know
            setTheme(PokerApp.state.theme);
            updateUIFromState();
            
            // If we have a session ID, reconnect to Firebase for latest data
            if (PokerApp.state.sessionId) {
                console.log('[STORAGE] Reconnecting to Firebase session:', PokerApp.state.sessionId);
                setupGameStateListener(PokerApp.state.sessionId);
            }
            
            return true;
        } else {
            console.log('[STORAGE] No saved game state found');
            resetGameState();
            return false;
        }
    } catch (error) {
        console.error('[STORAGE] Error loading game state:', error);
        resetGameState();
        return false;
    }
}

// Save game state to localStorage and Firebase
function saveState() {
    try {
        // Create state object to save
        const stateToSave = {
            players: PokerApp.state.players || [],
            gameInProgress: PokerApp.state.gameInProgress || false,
            dealerId: PokerApp.state.dealerId || null,
            nextPlayerId: PokerApp.state.nextPlayerId || 1,
            chipRatio: PokerApp.state.chipRatio || 1.0,
            theme: PokerApp.state.theme || 'Classic',
            sessionId: PokerApp.state.sessionId,
            gameName: PokerApp.state.gameName,
            lobbyActive: PokerApp.state.sessionId ? true : false,
            lastUpdate: Date.now()
        };
        
        // Always save to localStorage first
        localStorage.setItem('pokerGameState', JSON.stringify(stateToSave));
        console.log('[STORAGE] Saved state to localStorage');
        
        // Then update Firebase if we have a session
        if (PokerApp.state.sessionId && window.database) {
            // We don't want to update players here as that would overwrite
            // what's in Firebase (which might include players from buy-in)
            const updates = {};
            updates[`games/${PokerApp.state.sessionId}/active`] = true;
            updates[`games/${PokerApp.state.sessionId}/updatedAt`] = Date.now();
            
            // Only update game state properties, not players
            updates[`games/${PokerApp.state.sessionId}/state/gameInProgress`] = PokerApp.state.gameInProgress;
            updates[`games/${PokerApp.state.sessionId}/state/dealerId`] = PokerApp.state.dealerId;
            updates[`games/${PokerApp.state.sessionId}/state/theme`] = PokerApp.state.theme;
            
            return window.database.ref().update(updates);
        }
        
        return true;
    } catch (error) {
        console.error('[STORAGE] Error saving game state:', error);
        return false;
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
        
        console.log('[FIREBASE] Setting up listeners for game:', gameId);
        
        // First check if game exists and is active
        database.ref(`games/${gameId}`).once('value')
            .then(snapshot => {
                if (!snapshot.exists()) {
                    console.error('[FIREBASE] Game not found:', gameId);
                    PokerApp.state.lobbyActive = false;
                    PokerApp.state.sessionId = null;
                    PokerApp.UI.updateLobbyUI(false);
                    localStorage.removeItem('pokerGameState'); // Clear local storage
                    return;
                }
                
                const gameData = snapshot.val();
                
                if (!gameData.active) {
                    console.error('[FIREBASE] Game is not active:', gameId);
                    PokerApp.state.lobbyActive = false;
                    PokerApp.state.sessionId = null;
                    PokerApp.UI.updateLobbyUI(false);
                    localStorage.removeItem('pokerGameState'); // Clear local storage
                    return;
                }
                
                // Game exists and is active
                console.log('[FIREBASE] Game is active:', gameData);
                
                // Update state with game data
                PokerApp.state.gameName = gameData.name;
                PokerApp.state.sessionId = gameId;
                PokerApp.state.lobbyActive = true;
                
                // Set up players listener
                database.ref(`games/${gameId}/state/players`).on('value', snapshot => {
                    console.log('[FIREBASE] Received player update from Firebase:', snapshot.val());
                    
                    if (!snapshot.exists()) {
                        console.log('[FIREBASE] No players found in snapshot');
                        return;
                    }
                    
                    let playersData = snapshot.val();
                    let players = [];
                    
                    if (Array.isArray(playersData)) {
                        console.log('[FIREBASE] Players data is an array with length:', playersData.length);
                        players = playersData.filter(p => p != null);
                    } else if (typeof playersData === 'object') {
                        console.log('[FIREBASE] Players data is an object with keys:', Object.keys(playersData));
                        players = Object.values(playersData).filter(p => p != null);
                    } else {
                        console.error('[FIREBASE] Unexpected players data format:', typeof playersData);
                    }
                    
                    console.log('[FIREBASE] Filtered players data:', players.length, 'players found');
                    
                    // Update local state with players from Firebase
                    PokerApp.state.players = players.map(p => ({
                        id: p.id,
                        name: p.name,
                        initial_chips: p.initial_chips || 0,
                        current_chips: p.current_chips || p.initial_chips || 0,
                        joinedAt: p.joinedAt || Date.now(),
                        active: p.active !== false
                    }));
                    
                    console.log('[UI] Updated local player state with players:', PokerApp.state.players);
                    
                    // Update UI
                    updatePlayerList();
                    
                    // Save to localStorage to persist
                    localStorage.setItem('pokerGameState', JSON.stringify(PokerApp.state));
                });
                
                // Listen for lastPlayer updates for notifications
                database.ref(`games/${gameId}/state/lastPlayer`).on('value', snapshot => {
                    if (!snapshot.exists()) return;
                    
                    const lastPlayer = snapshot.val();
                    if (lastPlayer && lastPlayer.name) {
                        console.log('[FIREBASE] New player joined:', lastPlayer.name);
                        PokerApp.UI.showToast(`${lastPlayer.name} joined with ${lastPlayer.initial_chips} chips`, 'success');
                    }
                });
                
                // Listen for game state changes
                database.ref(`games/${gameId}/state`).on('value', snapshot => {
                    if (!snapshot.exists()) return;
                    
                    const state = snapshot.val();
                    console.log('[FIREBASE] Game state updated:', state);
                    
                    // Update local state with Firebase data
                    if (state.theme) PokerApp.state.theme = state.theme;
                    if (state.gameInProgress !== undefined) PokerApp.state.gameInProgress = state.gameInProgress;
                    if (state.dealerId !== undefined) PokerApp.state.dealerId = state.dealerId;
                    if (state.chipRatio) PokerApp.state.chipRatio = state.chipRatio;
                    if (state.nextPlayerId) PokerApp.state.nextPlayerId = state.nextPlayerId;
                    
                    // Update UI
                    setTheme(PokerApp.state.theme);
                    updateUIFromState();
                    
                    // Save to localStorage
                    localStorage.setItem('pokerGameState', JSON.stringify(PokerApp.state));
                });
                
                // Listen for game active status
                database.ref(`games/${gameId}/active`).on('value', snapshot => {
                    const isActive = snapshot.val();
                    
                    if (isActive === false) {
                        // Game was deactivated
                        console.log('[FIREBASE] Game was deactivated');
                        PokerApp.state.lobbyActive = false;
                        PokerApp.state.sessionId = null;
                        PokerApp.UI.updateLobbyUI(false);
                        PokerApp.UI.showToast('Game session ended', 'info');
                        
                        // Clean up listeners
                        cleanupFirebaseListeners();
                        
                        // Clear localStorage
                        localStorage.removeItem('pokerGameState');
                    }
                });
                
                // Initialize UI
                PokerApp.UI.updateLobbyUI(true);
                
                // Force QR code generation
                if (PokerApp.state.sessionId && PokerApp.state.gameName) {
                    const joinUrl = getJoinUrl(PokerApp.state.sessionId, PokerApp.state.gameName);
                    setTimeout(() => {
                        generateQrCode(joinUrl);
                    }, 100);
                }
            })
            .catch(error => {
                console.error('[FIREBASE] Error checking game:', error);
                PokerApp.UI.showToast('Error connecting to game', 'error');
            });
        
        return true;
    } catch (error) {
        console.error('[FIREBASE] Error setting up listener:', error);
        return false;
    }
}

// Add a cleanup function to handle all Firebase listeners
function cleanupFirebaseListeners() {
    if (PokerApp.state.sessionId && window.database) {
        try {
            // Clean up all listeners
            window.database.ref(`games/${PokerApp.state.sessionId}`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state/players`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state/theme`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/state/lastPlayer`).off();
            window.database.ref(`games/${PokerApp.state.sessionId}/active`).off();
            
            console.log('[FIREBASE] Successfully cleaned up all listeners');
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up listeners:', error);
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
    
    // Load saved state after initialization
    loadSavedState();
    
    // Add styles for small buttons and modern UI
    const style = document.createElement('style');
    style.textContent = `
        /* Modern UI styles */
        .button-icon.small {
            font-size: 0.8em;
        }
        
        .totals-row {
            border-top: 2px solid var(--main-color);
            background-color: rgba(var(--main-color-rgb), 0.1);
            font-weight: bold;
        }
        
        .totals-row td {
            padding: 10px;
            font-size: 1.1em;
        }
        
        /* Modern input field */
        .chip-input {
            width: 80px;
            padding: 6px 10px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-weight: 500;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .chip-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 0 2px var(--main-color);
        }
        
        /* Modern table styling */
        #player-table {
            border-collapse: separate;
            border-spacing: 0 8px;
        }
        
        #player-table tbody tr {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        
        #player-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
        
        #player-table td {
            padding: 12px 15px;
        }
        
        #player-table td:first-child {
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
        }
        
        #player-table td:last-child {
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        
        /* Modern remove button */
        .remove-player-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: rgba(255, 71, 87, 0.8);
            border: none;
            color: white;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.2s ease;
            box-shadow: 0 2px 6px rgba(255, 71, 87, 0.3);
        }
        
        .remove-player-btn:hover {
            opacity: 1;
            background: rgba(255, 71, 87, 1);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(255, 71, 87, 0.5);
        }
        
        /* Add player button */
        .add-player-btn {
            background: var(--main-color);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 0.9em;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(var(--main-color-rgb), 0.3);
        }
        
        .add-player-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(var(--main-color-rgb), 0.4);
        }
        
        .add-player-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
});

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
    
    if (!url) {
        console.error('[QR] No URL provided for QR code generation');
        return;
    }
    
    // Find QR container
    const qrWrapper = document.querySelector('.qr-wrapper');
    if (!qrWrapper) {
        console.error('[QR] QR wrapper element not found');
        return;
    }
    
    // Clear any existing content
    qrWrapper.innerHTML = '';
    
    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('[QR] QRCode library not loaded');
        qrWrapper.innerHTML = '<div style="padding: 20px; color: red;">QR Code library not loaded</div>';
        return;
    }
    
    try {
        // Generate new QR code
        console.log('[QR] Creating new QR code in element:', qrWrapper);
        new QRCode(qrWrapper, {
            text: url,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log('[QR] QR code generated successfully');
        
        // Update URL text display
        const joinUrlElement = document.getElementById('join-url-text');
        if (joinUrlElement) {
            joinUrlElement.textContent = url;
            console.log('[QR] Updated join URL text');
        }
    } catch (error) {
        console.error('[QR] Error generating QR code:', error);
        qrWrapper.innerHTML = '<div style="padding: 20px; color: red;">Could not generate QR code: ' + error.message + '</div>';
    }
}

// Helper function to ensure QR code is visible
function ensureQrCodeVisible() {
    const qrCodeContainer = document.getElementById('qr-code-container');
    if (!qrCodeContainer) return;
    
    console.log('[QR] Ensuring QR code is visible');
    
    // Force container to be visible
    qrCodeContainer.style.display = 'block';
    
    // If we have an active session, regenerate the QR code
    if (PokerApp.state.sessionId && PokerApp.state.gameName) {
        const joinUrl = getJoinUrl(PokerApp.state.sessionId, PokerApp.state.gameName);
        
        // Make sure content is clear
        const qrWrapper = document.querySelector('.qr-wrapper');
        if (qrWrapper) {
            qrWrapper.innerHTML = '';
            
            try {
                // Generate QR code if library is loaded
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrWrapper, {
                        text: joinUrl,
                        width: 180,
                        height: 180,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    console.log('[QR] QR code regenerated successfully');
                    
                    // Update URL text as well
                    const joinUrlElement = document.getElementById('join-url-text');
                    if (joinUrlElement) {
                        joinUrlElement.textContent = joinUrl;
                    }
                } else {
                    console.error('[QR] QRCode library not available');
                    qrWrapper.innerHTML = '<div style="padding: 20px; color: red;">QR Code library not loaded</div>';
                }
            } catch (error) {
                console.error('[QR] Error generating QR code:', error);
                qrWrapper.innerHTML = '<div style="padding: 20px; color: red;">Error generating QR code</div>';
            }
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
            createdAt: Date.now(),
            ratio: ratio,
            active: true,
            state: {
                theme: PokerApp.state.theme || 'Classic',
                ratio: ratio,
                gameInProgress: false,
                dealerId: null,
                players: includeLocalPlayers ? PokerApp.state.players : [],
                nextPlayerId: PokerApp.state.nextPlayerId || 1,
                chipRatio: ratio
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

// Update the resetGame function to properly cleanup and show animation
function resetGame() {
    if (window.confirm('Are you sure you want to reset the game? This will clear all players and game data.')) {
        // Show reset animation
        const resetCurtain = document.querySelector('.reset-curtain');
        const flyingCards = document.querySelector('.flying-cards-container');
        const shuffleEffect = document.querySelector('.shuffle-effect');
        
        if (resetCurtain) {
            resetCurtain.classList.add('active');
            
            // Play card shuffle sound if available
            const shuffleSound = document.getElementById('card-shuffle-sound');
            if (shuffleSound) {
                shuffleSound.currentTime = 0;
                shuffleSound.play().catch(e => console.log('Audio play error:', e));
            }
            
            // Animate flying cards
            if (flyingCards) {
                flyingCards.classList.add('active');
                
                // Add random animation to each card
                document.querySelectorAll('.reset-card').forEach(card => {
                    const randomX = Math.random() * 100 - 50;
                    const randomY = Math.random() * 100 - 50;
                    const randomRotate = Math.random() * 360;
                    
                    card.style.transform = `translate(${randomX}vw, ${randomY}vh) rotate(${randomRotate}deg)`;
                    card.style.animationDelay = `${Math.random() * 0.5}s`;
                    card.classList.add('active');
                });
            }
            
            // Animate shuffle effect
            if (shuffleEffect) {
                shuffleEffect.classList.add('active');
            }
        }
        
        // Wait for animation to complete before resetting game state
        setTimeout(() => {
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
            
            // Hide animation elements after delay
            setTimeout(() => {
                if (resetCurtain) resetCurtain.classList.remove('active');
                if (flyingCards) {
                    flyingCards.classList.remove('active');
                    document.querySelectorAll('.reset-card').forEach(card => {
                        card.classList.remove('active');
                        card.style.transform = '';
                    });
                }
                if (shuffleEffect) shuffleEffect.classList.remove('active');
            }, 500);
            
        }, 1500); // Animation time before reset completes
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

function updateThemeElements(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    // Update any theme-specific elements here
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
}

// Toast notification system
function showToast(message, type = 'success') {
    // Forward to the PokerApp's showToast if available
    if (window.PokerApp && window.PokerApp.UI && window.PokerApp.UI.showToast) {
        window.PokerApp.UI.showToast(message, type);
        return;
    }
    
    // Fallback implementation
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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

// Function to edit a player's current chips
function editPlayerChips(playerId) {
    const player = PokerApp.state.players.find(p => p.id === playerId);
    if (!player) {
        PokerApp.UI.showToast('Player not found', 'error');
        return;
    }
    
    const newAmount = prompt(`Update ${player.name}'s current chips:`, player.current_chips);
    if (newAmount === null) return; // User canceled
    
    const parsedAmount = parseInt(newAmount);
    if (isNaN(parsedAmount)) {
        PokerApp.UI.showToast('Please enter a valid number', 'error');
        return;
    }
    
    // Update player's chips
    player.current_chips = parsedAmount;
    
    // Update UI
    updatePlayerList();
    
    // Save state locally and to Firebase if needed
    saveState();
    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
    }
    
    PokerApp.UI.showToast(`Updated ${player.name}'s chips to ${parsedAmount}`, 'success');
}

// Add to global scope
window.editPlayerChips = editPlayerChips;

// Function to update player chips directly from input field
function updatePlayerChips(playerId, newValue) {
    const player = PokerApp.state.players.find(p => p.id === playerId);
    if (!player) {
        PokerApp.UI.showToast('Player not found', 'error');
        return;
    }
    
    const parsedAmount = parseInt(newValue);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        PokerApp.UI.showToast('Please enter a valid chip amount', 'error');
        // Revert to previous value
        updatePlayerList();
        return;
    }
    
    // Update player's chips
    player.current_chips = parsedAmount;
    
    // Update UI with recalculated totals
    updatePlayerList();
    
    // Save state locally and to Firebase if needed
    saveState();
    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
    }
}

// Add to global scope
window.updatePlayerChips = updatePlayerChips;

// Add this function near the initialize function
function setupMobileCompatibility() {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // Add iOS-specific class to body
        document.body.classList.add('ios-device');
        
        // Fix for iOS height issues with vh units
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            // Set initial height
            function setAppContentHeight() {
                const windowHeight = window.innerHeight;
                const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                appContent.style.height = `${windowHeight - headerHeight}px`;
            }
            
            // Set height on load and resize
            window.addEventListener('resize', setAppContentHeight);
            window.addEventListener('orientationchange', setAppContentHeight);
            setAppContentHeight();
        }
    }
}