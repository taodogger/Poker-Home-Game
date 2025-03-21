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

    // Save active input states
    const activeInputs = {};
    document.querySelectorAll('.chip-input').forEach(input => {
        const playerId = parseInt(input.getAttribute('data-player-id'));
        if (playerId && document.activeElement === input) {
            activeInputs[playerId] = true;
        }
    });

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
        
        // Create individual cells instead of using innerHTML to maintain input state
        const nameCell = document.createElement('td');
        nameCell.className = 'player-name';
        nameCell.textContent = player.name;
        row.appendChild(nameCell);
        
        const initialChipsCell = document.createElement('td');
        initialChipsCell.className = 'initial-chips';
        initialChipsCell.textContent = player.initial_chips;
        row.appendChild(initialChipsCell);
        
        const currentChipsCell = document.createElement('td');
        currentChipsCell.className = 'current-chips';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'chip-input';
        input.value = player.current_chips;
        input.setAttribute('data-player-id', player.id);
        input.setAttribute('min', '0');
        
        // Don't use inline event handlers - we'll add proper event listeners later
        input.id = `chip-input-${player.id}`;
        
        // If this input was active, we'll focus it after appending
        if (activeInputs[player.id]) {
            // We'll focus it after the table is fully rendered
            setTimeout(() => input.focus(), 0);
        }
        
        currentChipsCell.appendChild(input);
        row.appendChild(currentChipsCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.className = 'player-actions';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-player-btn';
        removeBtn.setAttribute('data-player-id', player.id);
        
        const icon = document.createElement('span');
        icon.className = 'button-icon';
        icon.textContent = '×';
        
        removeBtn.appendChild(icon);
        actionsCell.appendChild(removeBtn);
        row.appendChild(actionsCell);
        
        playerTableBody.appendChild(row);
    });
    
    // Add totals row
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    
    const totalsLabelCell = document.createElement('td');
    totalsLabelCell.innerHTML = '<strong>TOTALS</strong>';
    totalsRow.appendChild(totalsLabelCell);
    
    const totalsInitialCell = document.createElement('td');
    totalsInitialCell.innerHTML = `<strong>${totalInitialChips}</strong>`;
    totalsRow.appendChild(totalsInitialCell);
    
    const totalsCurrentCell = document.createElement('td');
    totalsCurrentCell.innerHTML = `<strong>${totalCurrentChips}</strong>`;
    totalsRow.appendChild(totalsCurrentCell);
    
    const totalsBlankCell = document.createElement('td');
    totalsRow.appendChild(totalsBlankCell);
    
    playerTableBody.appendChild(totalsRow);

    updateEmptyState();
    
    // Add event listeners after DOM is built
    playerTableBody.querySelectorAll('.chip-input').forEach(input => {
        input.addEventListener('change', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (playerId) {
                updatePlayerChips(playerId, this.value);
            }
        });
    });
    
    playerTableBody.querySelectorAll('.remove-player-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (playerId) {
                removePlayer(playerId);
            }
        });
    });
    
    // Log success
    console.log(`[UI] Player list updated with ${PokerApp.state.players.length} players`);
}

function addPlayer(name, chips) {
    if (!name || !chips) {
        PokerApp.UI.showToast('Please provide both name and chip amount', 'error');
        return false;
    }

    // Check if player already exists
    const existingPlayer = PokerApp.state.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (existingPlayer) {
        // Add chips to existing player
        const previousChips = existingPlayer.current_chips;
        existingPlayer.current_chips += parseInt(chips);
        existingPlayer.initial_chips += parseInt(chips);
        
        updatePlayerList();
        updateEmptyState();
        saveState();

        if (PokerApp.state.sessionId) {
            updatePlayersInFirebase();
        }

        // Add animation for chips being added
        animateChipAddition(existingPlayer.id);
        
        PokerApp.UI.showToast(`Added ${chips} chips to ${name} (now has ${existingPlayer.current_chips})`, 'success');
        return true;
    }

    // Create a new player
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

    // Animate new player addition
    animateNewPlayer(player.id);
    
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
                    PokerApp.UI.showToast('Error creating game lobby: ' + error.message, 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Game Lobby';
                    }
                });
        });
    }
    
    // Set up player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        // First, remove any existing listeners
        const oldForm = playerForm;
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        
        // Add the new listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('player-name').value.trim();
            const chips = parseInt(document.getElementById('initial-chips').value);
            
            addPlayer(name, chips);
            
            // Reset form
            document.getElementById('player-name').value = '';
            document.getElementById('initial-chips').value = '';
        });
    }
    
    // Set up ratio form
    const ratioForm = document.getElementById('ratio-form');
    if (ratioForm) {
        // First, remove any existing listeners
        const oldForm = ratioForm;
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        
        // Add the new listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const moneyAmount = parseFloat(document.getElementById('money-amount').value);
            const chipAmount = parseInt(document.getElementById('chip-amount').value);
            
            if (isNaN(moneyAmount) || moneyAmount <= 0) {
                PokerApp.UI.showToast('Please enter a valid money amount', 'error');
                return;
            }
            
            if (isNaN(chipAmount) || chipAmount <= 0) {
                PokerApp.UI.showToast('Please enter a valid chip amount', 'error');
                return;
            }
            
            const ratio = moneyAmount / chipAmount;
            PokerApp.state.chipRatio = ratio;
            
            // Update the ratio display
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.innerText = `Each chip is worth $${ratio.toFixed(2)}`;
            }
            
            // Save state
            saveState();
            PokerApp.UI.showToast(`Set ratio to $${ratio.toFixed(2)} per chip`, 'success');
            
            // Update ratio in Firebase if in a session
            if (PokerApp.state.sessionId && window.firebase && window.firebase.database) {
                window.firebase.database().ref(`games/${PokerApp.state.sessionId}/ratio`).set(ratio)
                    .then(() => {
                        console.log('[FIREBASE] Updated chip ratio in Firebase');
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Error updating ratio:', error);
                    });
                
                // Also update in the state object
                window.firebase.database().ref(`games/${PokerApp.state.sessionId}/state/chipRatio`).set(ratio)
                    .then(() => {
                        console.log('[FIREBASE] Updated chip ratio in game state');
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Error updating ratio in state:', error);
                    });
            }
            
            // Reset form
            document.getElementById('money-amount').value = '';
            document.getElementById('chip-amount').value = '';
        });
    }
    
    // Set up reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        // Remove any existing click listeners
        resetBtn.replaceWith(resetBtn.cloneNode(true));
        
        // Re-get the button after replacing
        const newResetBtn = document.getElementById('reset-btn');
        
        // Add new listener
        newResetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[UI] Reset button clicked');
            resetGame();
            return false;
        });
        
        // Also add direct onclick attribute as backup
        newResetBtn.setAttribute('onclick', 'resetGame(); return false;');
    }

    // Set up calculate payouts button
    const calculatePayoutsBtn = document.getElementById('calculate-payouts');
    if (calculatePayoutsBtn) {
        // First, remove any existing listeners
        const oldBtn = calculatePayoutsBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        
        // Add the new listener
        newBtn.addEventListener('click', function() {
            console.log('[UI] Calculate payouts button clicked');
            calculatePayouts();
        });
    }
}

// Initialize function
function initialize() {
    console.log('Initializing poker app...');
    
    // Set a flag to prevent multiple initializations
    if (window.appInitialized) {
        console.log('[INIT] App already initialized, skipping');
        return;
    }

    window.appInitialized = true;
    
    // Remove connection status indicator as requested by user
    // const header = document.querySelector('.app-header');
    // if (header) {
    //     const connectionStatus = document.createElement('div');
    //     connectionStatus.id = 'connection-status';
    //     connectionStatus.style.display = 'inline-block';
    //     connectionStatus.style.padding = '4px 8px';
    //     connectionStatus.style.borderRadius = '4px';
    //     connectionStatus.style.fontSize = '12px';
    //     connectionStatus.style.marginRight = '10px';
    //     connectionStatus.style.backgroundColor = '#555';
    //     connectionStatus.style.color = 'white';
    //     connectionStatus.textContent = 'Connecting...';
    //     
    //     // Insert before theme selector
    //     const themeSelector = document.querySelector('#theme-selector');
    //     if (themeSelector && themeSelector.parentNode) {
    //         themeSelector.parentNode.insertBefore(connectionStatus, themeSelector);
    //     } else {
    //         header.appendChild(connectionStatus);
    //     }
    // }
    
    // Listen for Firebase connection events
    window.addEventListener('firebase-connected', () => {
        console.log('[INIT] Firebase connection established');
        
        // Update connection status indicator - removed as requested
        // const connectionStatus = document.getElementById('connection-status');
        // if (connectionStatus) {
        //     connectionStatus.textContent = 'Connected';
        //     connectionStatus.style.backgroundColor = '#4caf50';
        // }
        
        PokerApp.UI.showToast('Connected to server', 'success');
        
        // If we have an active session, ensure our data is synced
        if (PokerApp.state.sessionId) {
            updatePlayersInFirebase();
        }
    });
    
    // Check if Firebase is available and wait for it if necessary
    ensureFirebaseInitialized()
        .then(() => {
            // Continue with normal initialization
            initializeApp(true);
            
            // Set up automatic reconnection handling
            window.database.ref('.info/connected').on('value', (snap) => {
                if (!snap.val()) {
                    console.log('[FIREBASE] Connection lost, waiting for reconnect...');
                    
                    // Update connection status indicator - removed as requested
                    // const connectionStatus = document.getElementById('connection-status');
                    // if (connectionStatus) {
                    //     connectionStatus.textContent = 'Reconnecting...';
                    //     connectionStatus.style.backgroundColor = '#ff9800';
                    // }
                    
                    PokerApp.UI.showToast('Connection lost. Reconnecting...', 'error');
                }
            });
            
            // Test write function to verify connection - FIX: use a valid path instead of .info/
            window.testFirebaseConnection = function() {
                if (window.database) {
                    // Use a valid test path instead of .info/ which is reserved
                    const testRef = window.database.ref('_connection_test');
                    testRef.set({
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        manual: true,
                        userAgent: navigator.userAgent
                    })
                    .then(() => {
                        console.log('[FIREBASE] Manual test write successful');
                        PokerApp.UI.showToast('Database connection verified', 'success');
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Manual test write failed:', error);
                        PokerApp.UI.showToast('Database connection failed', 'error');
                    });
                } else {
                    console.error('[FIREBASE] Database not available for test');
                    PokerApp.UI.showToast('Database not available', 'error');
                }
            };
            
            // Expose the test function globally
            window.testConnection = window.testFirebaseConnection;
        })
        .catch(error => {
            console.error('[FIREBASE] Error initializing Firebase:', error);
            
            // Update connection status indicator - removed as requested
            // const connectionStatus = document.getElementById('connection-status');
            // if (connectionStatus) {
            //     connectionStatus.textContent = 'Offline';
            //     connectionStatus.style.backgroundColor = '#f44336';
            // }
            
            // Initialize app anyway but without Firebase features
            initializeApp(false);
            PokerApp.UI.showToast('Offline mode - some features unavailable', 'error');
        });
}

// Helper function to make sure Firebase is initialized
function ensureFirebaseInitialized() {
    return new Promise((resolve, reject) => {
        // Check if Firebase and database are already available
        if (typeof window.database !== 'undefined' && window.database) {
            console.log('[FIREBASE] Using existing database reference from window.database');
            resolve(window.database);
            return;
        }
        
        // If Firebase libraries are loaded but not initialized
        if (typeof firebase !== 'undefined') {
            try {
                // Check if firebase is already initialized
                if (firebase.apps && firebase.apps.length > 0) {
                    console.log('[FIREBASE] Firebase already initialized, getting database reference');
                    window.database = firebase.database();
                    resolve(window.database);
                    return;
                }
                
                // Check if we have config
                if (window.firebaseConfig) {
                    console.log('[FIREBASE] Initializing Firebase with window.firebaseConfig');
                    firebase.initializeApp(window.firebaseConfig);
                    window.database = firebase.database();
                    resolve(window.database);
                    return;
                }
                
                // No config available
                reject(new Error('Firebase configuration not found'));
            } catch (error) {
                console.error('[FIREBASE] Error initializing Firebase:', error);
                reject(error);
            }
        } else {
            // Firebase libraries not loaded, listen for the firebase-ready event
            console.log('[FIREBASE] Waiting for Firebase libraries to load...');
            
            // Listen for firebase-ready event with timeout
            const firebaseReadyPromise = new Promise((resolveEvent, rejectEvent) => {
                window.addEventListener('firebase-ready', () => {
                    console.log('[FIREBASE] Received firebase-ready event');
                    if (window.database) {
                        resolveEvent(window.database);
                    } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                        window.database = firebase.database();
                        resolveEvent(window.database);
                    } else {
                        rejectEvent(new Error('Firebase still not properly initialized after firebase-ready event'));
                    }
                }, { once: true });
                
                // Set a timeout to avoid hanging indefinitely
                setTimeout(() => {
                    rejectEvent(new Error('Timed out waiting for Firebase to load'));
                }, 8000);
            });
            
            firebaseReadyPromise.then(resolve).catch(reject);
        }
    });
}

// Main initialization function
function initializeApp(firebaseAvailable = true) {
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
    
    // Only initialize state if it doesn't already have players and other data
    // This prevents overwriting state that was loaded from localStorage
    if (!PokerApp.state.players || PokerApp.state.players.length === 0) {
        console.log('[INIT] Initializing with default state');
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
    } else {
        console.log('[INIT] Using existing state with', PokerApp.state.players.length, 'players');
    }
    
    // Log Firebase availability
    if (!firebaseAvailable) {
        console.error('[FIREBASE] Firebase not available! Some features may not work.');
        PokerApp.UI.showToast('Firebase connection error. Limited functionality available.', 'error');
    } else {
        console.log('[FIREBASE] Firebase initialized successfully');
        
        // Safely clean up any existing Firebase listeners
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                firebase.database().ref().off();
                console.log('[FIREBASE] Cleaned up existing listeners');
            }
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
    if (firebaseAvailable && typeof firebase !== 'undefined' && firebase.database) {
        try {
            firebase.database().ref('test').set({
                timestamp: Date.now(),
                message: 'Initialization test'
            })
            .then(() => console.log('[FIREBASE] Test write successful'))
            .catch(error => console.error('[FIREBASE] Test write failed:', error));
        } catch (error) {
            console.error('[FIREBASE] Error during test write:', error);
        }
    }
    
    // Set up mobile compatibility
    setupMobileCompatibility();
}

// Make initialize function available globally
window.initialize = initialize;

// Add this function near the initialize function
function setupMobileCompatibility() {
    // Check if we're on iOS or mobile device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isIOS || isMobile) {
        // Add device-specific class to body
        document.body.classList.add(isIOS ? 'ios-device' : 'mobile-device');
        
        // Force main app content to stack vertically
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            // Simply add a "mobile-layout" class instead of inline styles
            appContent.classList.add('mobile-layout');
            
            // Make all sections full width and ensure content is visible
            document.querySelectorAll('section, .poker-card').forEach(section => {
                section.style.width = '100%';
                section.style.maxWidth = 'none';
                section.style.margin = '0 0 15px 0';
                section.style.boxSizing = 'border-box';
                section.style.minHeight = 'auto';
                section.style.height = 'auto';
                section.style.overflow = 'visible';
            });
            
            // Fix iOS height issues
            function updateLayout() {
                if (isIOS) {
                    const windowHeight = window.innerHeight;
                    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                    appContent.style.minHeight = `${windowHeight - headerHeight}px`;
                }
            }
            
            // Update on various events
            window.addEventListener('resize', updateLayout);
            window.addEventListener('orientationchange', updateLayout);
            document.addEventListener('DOMContentLoaded', updateLayout);
            
            // Initial layout update
            updateLayout();
        }
    }
}

// Ensure forceUpdateMobileLayout is available globally even if not on mobile
window.forceUpdateMobileLayout = window.forceUpdateMobileLayout || function() {
    console.log('[MOBILE] Force update called on non-mobile device');
    const appContent = document.querySelector('.app-content');
    if (appContent) {
        // Apply mobile-friendly styles anyway
        appContent.style.display = 'flex';
        appContent.style.flexDirection = 'column';
        appContent.style.width = '100%';
        
        // Make all sections full width
        document.querySelectorAll('section, .poker-card').forEach(section => {
            section.style.width = '100%';
            section.style.maxWidth = 'none';
            section.style.margin = '0 0 15px 0';
            section.style.boxSizing = 'border-box';
        });
        
        PokerApp.UI.showToast('Mobile layout forced on non-mobile device', 'info');
    } else {
        console.error('[MOBILE] Could not find app-content element');
    }
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
                        current_chips: p.current_chips !== undefined ? p.current_chips : (p.initial_chips || 0),
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
    // Create reset curtain if it doesn't exist
    let resetCurtain = document.querySelector('.reset-curtain');
    if (!resetCurtain) {
        resetCurtain = document.createElement('div');
        resetCurtain.className = 'reset-curtain';
        document.body.appendChild(resetCurtain);
    }

    // Create flying cards container if it doesn't exist
    let flyingCardsContainer = document.querySelector('.flying-cards-container');
    if (!flyingCardsContainer) {
        flyingCardsContainer = document.createElement('div');
        flyingCardsContainer.className = 'flying-cards-container';
        document.body.appendChild(flyingCardsContainer);
    }

    // Create confetti container if it doesn't exist
    let confettiContainer = document.querySelector('.confetti-container');
    if (!confettiContainer) {
        confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
    }

    // Create shuffle effect if it doesn't exist
    let shuffleEffect = document.querySelector('.shuffle-effect');
    if (!shuffleEffect) {
        shuffleEffect = document.createElement('div');
        shuffleEffect.className = 'shuffle-effect';
        document.body.appendChild(shuffleEffect);
    }

    // Play card shuffle sound if available
    const shuffleSound = document.getElementById('shuffleSound');
    if (shuffleSound) {
        shuffleSound.currentTime = 0;
        shuffleSound.play().catch(() => {});
    }

    // Trigger reset animation
    resetCurtain.classList.add('active');

    // Create and animate flying cards
    flyingCardsContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const card = document.createElement('div');
        card.className = 'reset-card';
        card.style.setProperty('--flyX', `${Math.random() * 800 - 400}px`);
        card.style.setProperty('--flyY', `${Math.random() * 600 - 300}px`);
        card.style.setProperty('--flyRotate', `${Math.random() * 720 - 360}deg`);
        flyingCardsContainer.appendChild(card);
        setTimeout(() => card.classList.add('active'), 50 * i);
    }

    // Create and animate confetti
    confettiContainer.innerHTML = '';
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9370db', '#ff6b81'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.setProperty('--fall-delay', `${Math.random() * 2}s`);
        confetti.style.setProperty('--fall-distance', `${100 + Math.random() * 50}vh`);
        confettiContainer.appendChild(confetti);
    }

    // Show shuffle effect
    shuffleEffect.classList.add('active');

    // Reset game state after animation
    setTimeout(() => {
        resetGameState();
        resetCurtain.classList.remove('active');
        shuffleEffect.classList.remove('active');

        // Clean up animation elements
        setTimeout(() => {
            flyingCardsContainer.innerHTML = '';
            confettiContainer.innerHTML = '';
            shuffleEffect.innerHTML = '';
        }, 2000);
    }, 2000);
}

function resetGameState() {
    // Reset all game state variables
    currentHand = [];
    handHistory = [];
    potTotal = 0;
    currentBet = 0;
    currentRound = 0;
    gameStarted = false;
    
    // Clear the UI
    document.getElementById('currentHand').innerHTML = '';
    document.getElementById('handHistory').innerHTML = '';
    document.getElementById('potTotal').textContent = '0';
    document.getElementById('currentBet').textContent = '0';
    
    // Re-enable all inputs and buttons
    const inputs = document.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Show a toast notification
    showToast('Game reset successfully!', 'success');
}

// Add calculatePayouts function
function calculatePayouts() {
    console.log('[PAYOUT] Calculating payouts');
    if (!PokerApp.state.players || PokerApp.state.players.length === 0) {
        PokerApp.UI.showToast('No players to calculate payouts for', 'error');
        return;
    }

    if (PokerApp.state.players.length < 2) {
        PokerApp.UI.showToast('Need at least 2 players to calculate payouts', 'error');
        return;
    }

    const players = PokerApp.state.players;
    let totalDifference = 0;
    let html = ''; // Initialize html variable here

    console.log('[PAYOUT] Processing players:', players.length);

    // Calculate chip differences and initial cash values
    const playerDiffs = players.map(player => {
        const initialChips = parseInt(player.initial_chips, 10) || 0;
        const currentChips = parseInt(player.current_chips, 10) || 0;
        const chipDifference = currentChips - initialChips;
        
        return {
            id: player.id,
            name: player.name,
            initialChips,
            currentChips,
            chipDifference,
            cashValue: 0 // Will be updated from transactions
        };
    });

    // Split into winners and losers based on chip differences
    const winners = playerDiffs.filter(p => p.chipDifference > 0)
        .sort((a, b) => b.chipDifference - a.chipDifference);
        
    const losers = playerDiffs.filter(p => p.chipDifference < 0)
        .sort((a, b) => a.chipDifference - b.chipDifference);

    // Create transactions
    const transactions = [];
    
    // Match losers with winners
    while (losers.length > 0 && winners.length > 0) {
        const loser = losers.shift();
        const winner = winners[0];
        
        const lossAmount = Math.abs(loser.chipDifference);
        
        if (lossAmount >= winner.chipDifference) {
            const paymentChips = winner.chipDifference;
            const paymentCash = (paymentChips * PokerApp.state.chipRatio).toFixed(2);
            
            transactions.push({
                from: loser.name,
                to: winner.name,
                chips: paymentChips,
                cash: paymentCash
            });
            
            const remainder = lossAmount - winner.chipDifference;
            if (remainder > 0) {
                losers.push({
                    ...loser,
                    chipDifference: -remainder
                });
                losers.sort((a, b) => a.chipDifference - b.chipDifference);
            }
            
            winners.shift();
        } else {
            const paymentChips = lossAmount;
            const paymentCash = (paymentChips * PokerApp.state.chipRatio).toFixed(2);
            
            transactions.push({
                from: loser.name,
                to: winner.name,
                chips: paymentChips,
                cash: paymentCash
            });
            
            winner.chipDifference -= lossAmount;
        }
    }

    // Update cash values based on transactions
    transactions.forEach(transaction => {
        const amount = parseFloat(transaction.cash);
        const fromPlayer = playerDiffs.find(p => p.name === transaction.from);
        const toPlayer = playerDiffs.find(p => p.name === transaction.to);
        
        if (fromPlayer) fromPlayer.cashValue -= amount;
        if (toPlayer) toPlayer.cashValue += amount;
    });
    
    // Create player result cards
    const sortedPlayers = [...playerDiffs].sort((a, b) => b.chipDifference - a.chipDifference);
    
    // Calculate fun stats first
    const biggestWinner = playerDiffs.reduce((prev, curr) => 
        (curr.cashValue > prev.cashValue) ? curr : prev
    );
    
    const biggestLoser = playerDiffs.reduce((prev, curr) => 
        (curr.cashValue < prev.cashValue) ? curr : prev
    );
    
    const totalMoneyMoved = transactions.reduce((sum, t) => 
        sum + parseFloat(t.cash), 0
    ).toFixed(2);
    
    const totalChipsMoved = transactions.reduce((sum, t) => 
        sum + parseInt(t.chips), 0
    );
    
    const averageWin = playerDiffs
        .filter(p => p.cashValue > 0)
        .reduce((sum, p) => sum + p.cashValue, 0) / 
        playerDiffs.filter(p => p.cashValue > 0).length;

    // Build the HTML string
    html = `
        <div class="payout-wrapper">
            <div class="payout-summary-header">
                <h3>Game Results</h3>
                <div class="payout-timestamp">${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="results-container">
                <!-- Fun Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👑</div>
                        <div class="stat-title">Biggest Winner</div>
                        <div class="stat-value">${biggestWinner.name}</div>
                        <div class="stat-detail">+$${Math.abs(biggestWinner.cashValue).toFixed(2)}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">😅</div>
                        <div class="stat-title">Biggest L</div>
                        <div class="stat-value">${biggestLoser.name}</div>
                        <div class="stat-detail">-$${Math.abs(biggestLoser.cashValue).toFixed(2)}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💸</div>
                        <div class="stat-title">Money Moved</div>
                        <div class="stat-value">$${totalMoneyMoved}</div>
                        <div class="stat-detail">${totalChipsMoved} chips</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-title">Avg Win</div>
                        <div class="stat-value">$${averageWin.toFixed(2)}</div>
                        <div class="stat-detail">per winner</div>
                    </div>
                </div>
                
                <!-- Payment Instructions -->
                <div class="payment-instructions">
                    <h3>${transactions.length > 0 ? 'Payment Instructions' : 'No Payments Needed'}</h3>`;

    if (transactions.length === 0) {
        html += `<div class="no-payments-message">All players are even!</div>`;
    } else {
        // Group transactions by payer
        const payerGroups = {};
        transactions.forEach(t => {
            if (!payerGroups[t.from]) {
                payerGroups[t.from] = [];
            }
            payerGroups[t.from].push(t);
        });
        
        // Display each payer's obligations
        Object.entries(payerGroups).forEach(([payer, payments]) => {
            html += `
                <div class="payment-group">
                    <div class="payer">${payer} pays:</div>
                    <div class="payment-list">`;
                    
            payments.forEach(payment => {
                html += `
                    <div class="payment-item">
                        <div class="payment-arrow">→</div>
                        <div class="payment-details">
                            <span class="payment-recipient">${payment.to}</span>
                            <span class="payment-amount">$${payment.cash}</span>
                        </div>
                    </div>`;
            });
            
            html += `
                </div>
                </div>`;
        });
    }
    
    html += `
                </div>
            </div>
        </div>`;
    
    // Display results
    const payoutResults = document.getElementById('payout-results');
    if (!payoutResults) {
        console.error('[PAYOUT] Payout results element not found');
        return;
    }

    payoutResults.innerHTML = html;
    
    // Add styles for the new display
    if (!document.querySelector('#payout-styles')) {
        const style = document.createElement('style');
        style.id = 'payout-styles';
        style.textContent = `
            .payout-wrapper {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                width: 100%;
            }
            
            .payout-summary-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .payout-summary-header h3 {
                margin: 0;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .payout-timestamp {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .results-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                animation: fadeIn 0.5s ease-out;
            }
            
            .stat-card {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                transition: transform 0.2s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-icon {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            
            .stat-title {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .stat-value {
                color: white;
                font-size: 1.4rem;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .stat-detail {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.8rem;
            }
            
            /* Payment Instructions Section */
            .payment-instructions {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                padding: 16px;
                margin-top: 20px;
            }
            
            .payment-instructions h3 {
                margin-top: 0;
                margin-bottom: 12px;
                color: white;
                font-size: 1.1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 8px;
            }
            
            .no-payments-message {
                text-align: center;
                padding: 12px;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 6px;
            }
            
            .payment-group {
                margin-bottom: 16px;
                animation: fadeIn 0.3s ease forwards;
            }
            
            .payer {
                font-weight: 600;
                color: #ff4757;
                margin-bottom: 8px;
            }
            
            .payment-list {
                padding-left: 12px;
            }
            
            .payment-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                padding: 10px;
                transition: transform 0.2s ease;
            }
            
            .payment-item:hover {
                transform: scale(1.02);
            }
            
            .payment-arrow {
                color: rgba(255, 255, 255, 0.5);
                margin-right: 10px;
                font-size: 1.2rem;
            }
            
            .payment-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex: 1;
            }
            
            .payment-recipient {
                color: #2ed573;
                font-weight: 600;
            }
            
            .payment-amount {
                font-weight: 700;
                font-size: 1.1rem;
                color: white;
                background: rgba(0, 0, 0, 0.3);
                padding: 4px 12px;
                border-radius: 50px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Mobile optimizations */
            @media (max-width: 768px) {
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .stat-card {
                    padding: 15px;
                }
                
                .stat-icon {
                    font-size: 1.5rem;
                }
                
                .stat-value {
                    font-size: 1.2rem;
                }
                
                .payment-details {
                    flex-direction: row;
                    align-items: center;
                }
                
                .payment-recipient, .payment-amount {
                    padding: 4px 8px;
                }
            }
            
            @media (max-width: 480px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Scroll to the results
    payoutResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('[PAYOUT] Results displayed');
    PokerApp.UI.showToast('Game results calculated', 'success');
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

// Animation for new player joining
function animateNewPlayer(playerId) {
    // Add a small delay to ensure the DOM has been updated
    setTimeout(() => {
        const playerRow = document.querySelector(`tr[data-player-id="${playerId}"]`);
        if (!playerRow) {
            console.log('[ANIMATION] Player row not found for animation:', playerId);
            return;
        }
        
        console.log('[ANIMATION] Animating new player:', playerId);
        
        // First make sure any old animation classes are removed
        playerRow.classList.remove('player-added');
        
        // Force reflow
        void playerRow.offsetWidth;
        
        // Add animation class
        playerRow.classList.add('player-added');
        
        // Create flying cards animation
        createFlyingCards(playerRow);
    }, 300); // 300ms delay to ensure DOM update completes
}

// Animation for adding chips to existing player
function animateChipAddition(playerId) {
    // Add a small delay to ensure the DOM has been updated
    setTimeout(() => {
        const playerRow = document.querySelector(`tr[data-player-id="${playerId}"]`);
        if (!playerRow) {
            console.log('[ANIMATION] Player row not found for chip animation:', playerId);
            return;
        }
        
        // Find the chip count cell - use the correct class name
        const chipCell = playerRow.querySelector('.current-chips');
        if (!chipCell) {
            console.log('[ANIMATION] Chip cell not found for animation');
            return;
        }
        
        console.log('[ANIMATION] Animating chip addition for player:', playerId);
        
        // First make sure any old animation classes are removed
        chipCell.classList.remove('chips-added');
        
        // Force reflow
        void chipCell.offsetWidth;
        
        // Add animation class
        chipCell.classList.add('chips-added');
        
        // Create flying chips animation
        createFlyingChips(chipCell);
    }, 300); // 300ms delay to ensure DOM update completes
}

// Create flying cards animation
function createFlyingCards(target) {
    const cardCount = 5;
    const container = document.createElement('div');
    container.className = 'flying-cards-container';
    
    // Position the container over the target
    const rect = target.getBoundingClientRect();
    container.style.position = 'fixed';
    container.style.top = `${rect.top}px`;
    container.style.left = `${rect.left}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'none';
    
    // Add cards
    for (let i = 0; i < cardCount; i++) {
        const card = document.createElement('div');
        card.className = 'flying-card';
        
        // Apply random rotation and scale
        const rotation = Math.random() * 360;
        card.style.transform = `rotate(${rotation}deg) scale(0.8)`;
        
        // Add suit and rank
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', 'K', 'Q', 'J', '10'];
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        card.innerHTML = `<div class="card-inner"><span class="card-value">${rank}</span><span class="card-suit ${suit === '♥' || suit === '♦' ? 'red' : 'black'}">${suit}</span></div>`;
        
        container.appendChild(card);
    }
    
    document.body.appendChild(container);
    
    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, 2000); // Animation duration + delays
}

// Create flying chips animation
function createFlyingChips(target) {
    const chipCount = 8;
    const container = document.createElement('div');
    container.className = 'flying-chips-container';
    
    // Position the container over the target
    const rect = target.getBoundingClientRect();
    container.style.position = 'fixed';
    container.style.top = `${rect.top}px`;
    container.style.left = `${rect.left}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'none';
    
    // Add chips
    for (let i = 0; i < chipCount; i++) {
        const chip = document.createElement('div');
        chip.className = 'flying-chip';
        
        // Randomize chip color
        const chipColors = ['red', 'blue', 'green', 'black', 'purple'];
        const chipColor = chipColors[Math.floor(Math.random() * chipColors.length)];
        chip.classList.add(`chip-${chipColor}`);
        
        // Set random delay for each chip
        const delay = Math.random() * 0.5;
        chip.style.animationDelay = `${delay}s`;
        
        // Apply random rotation
        const rotation = Math.random() * 360;
        chip.style.transform = `rotate(${rotation}deg)`;
        
        container.appendChild(chip);
    }
    
    document.body.appendChild(container);
    
    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, 2000); // Animation duration + delays
}

// Add to global scope
window.animateNewPlayer = animateNewPlayer;
window.animateChipAddition = animateChipAddition;

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
    UI: PokerApp.UI,
    calculatePayouts  // Add calculatePayouts to PokerApp object
};

// Export calculatePayouts to the global window object
window.calculatePayouts = calculatePayouts;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] DOMContentLoaded triggered');
    
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
                if (window.PokerApp && window.PokerApp.UI) {
                    window.PokerApp.UI.showToast(`Theme set to ${selectedTheme}`, 'success');
                }
            } else {
                if (window.PokerApp && window.PokerApp.UI) {
                    window.PokerApp.UI.showToast('Invalid theme selected', 'error');
                }
                setTheme('Classic');
            }
        });
    }
    
    // First load the saved state
    const savedStateResult = loadSavedState();
    console.log('[INIT] Loaded saved state result:', savedStateResult);
    
    // Only initialize if we need to (state loading failed)
    if (!savedStateResult) {
        console.log('[INIT] No saved state, initializing app');
        initialize();
    } else {
        console.log('[INIT] Using saved state, updating UI');
        // Make sure the UI is updated with the current state
        updateUIFromState();
        
        // Connect to Firebase if needed but don't reinitialize the app
        if (PokerApp.state.sessionId) {
            ensureFirebaseInitialized()
                .then(() => {
                    console.log('[FIREBASE] Reconnecting to session:', PokerApp.state.sessionId);
                    setupGameStateListener(PokerApp.state.sessionId);
                })
                .catch(error => {
                    console.error('[FIREBASE] Error reconnecting to Firebase:', error);
                });
        }
        
        // Set up event listeners without reinitializing
        setupEventListeners();
        setupMobileCompatibility();
    }
});

// Helper function to handle lastPlayer updates
function handleLastPlayerUpdate(lastPlayer) {
    if (!lastPlayer) {
        console.log(`[FIREBASE] No lastPlayer data to process`);
        return;
    }
    
    console.log(`[FIREBASE] Processing lastPlayer:`, lastPlayer);
    
    // Check if this player already exists in our state
    const existingPlayerIndex = PokerApp.state.players.findIndex(p => 
        (p.id && p.id === parseInt(lastPlayer.id)) || 
        (p.name && lastPlayer.name && 
            p.name.toLowerCase() === lastPlayer.name.toLowerCase())
    );
    
    if (existingPlayerIndex === -1) {
        // New player - add them
        const playerData = {
            id: parseInt(lastPlayer.id),
            name: lastPlayer.name,
            initial_chips: parseInt(lastPlayer.initial_chips),
            current_chips: parseInt(lastPlayer.current_chips)
        };
        
        console.log(`[FIREBASE] Adding new player to state:`, playerData);
        PokerApp.state.players.push(playerData);
        
        // Update UI
        updatePlayerList();
        updateEmptyState();
        
        // Update hand animation if it exists
        if (window.handAnimation) {
            window.handAnimation.setPlayers(PokerApp.state.players);
        }
        
        // Show toast notification
        PokerApp.UI.showToast(`New player joined: ${lastPlayer.name}`, 'success');
        
        // The animation must be triggered after the DOM is updated
        console.log('[ANIMATION] Triggering new player animation:', playerData.id);
        animateNewPlayer(playerData.id);
        
        // Save state to localStorage
        saveState();
        
        return true;
    } else {
        // Player exists - check if this is a rebuy (chip addition)
        const existingPlayer = PokerApp.state.players[existingPlayerIndex];
        const newChips = parseInt(lastPlayer.initial_chips);
        
        if (newChips > 0 && existingPlayer.initial_chips !== newChips) {
            // This is a rebuy - add the chips
            const previousChips = existingPlayer.current_chips;
            existingPlayer.current_chips += newChips;
            existingPlayer.initial_chips += newChips;
            
            // Update UI
            updatePlayerList();
            
            // Show toast notification
            PokerApp.UI.showToast(`${existingPlayer.name} added ${newChips} chips!`, 'success');
            
            // The animation must be triggered after the DOM is updated
            console.log('[ANIMATION] Triggering chip addition animation:', existingPlayer.id);
            animateChipAddition(existingPlayer.id);
            
            // Save state
            saveState();
            
            // Update Firebase
            if (PokerApp.state.sessionId) {
                updatePlayersInFirebase();
            }
            
            return true;
        }
        
        console.log(`[FIREBASE] Player already exists in state, skipping:`, lastPlayer.name);
        return false;
    }
}

// Add to global scope
window.handleLastPlayerUpdate = handleLastPlayerUpdate;

// Setup lastPlayer listener
function setupLastPlayerListener(gameId) {
    if (!gameId) return;
    
    // Instead of using playerNotifications, we'll listen for changes to lastPlayer
    const lastPlayerRef = firebase.database().ref(`games/${gameId}/state/lastPlayer`);
    
    // Clear any existing listeners
    lastPlayerRef.off('value');
    
    console.log(`[FIREBASE] Setting up lastPlayer listener for game: ${gameId}`);
    
    // First, get the current lastPlayer value to handle any player that joined before we set up the listener
    lastPlayerRef.once('value')
        .then(snapshot => {
            const currentLastPlayer = snapshot.val();
            if (currentLastPlayer) {
                console.log('[FIREBASE] Found existing lastPlayer, processing...');
                handleLastPlayerUpdate(currentLastPlayer);
            }
            
            // Now set up the ongoing listener
            setupLastPlayerListener2(lastPlayerRef);
        })
        .catch(error => {
            console.error('[FIREBASE] Error getting current lastPlayer:', error);
            // Still set up listener even if first fetch fails
            setupLastPlayerListener2(lastPlayerRef);
        });
}

// Helper function to set up the lastPlayer listener
function setupLastPlayerListener2(lastPlayerRef) {
    // Set up a listener for lastPlayer changes
    lastPlayerRef.on('value', 
        snapshot => {
            const lastPlayer = snapshot.val();
            console.log(`[FIREBASE] Received lastPlayer update:`, lastPlayer);
            
            // Process the update
            handleLastPlayerUpdate(lastPlayer);
        }, 
        error => {
            console.error('[FIREBASE] Error in lastPlayer listener:', error);
        }
    );
    
    console.log(`[FIREBASE] lastPlayer listener set up`);
}