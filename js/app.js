// Initialize sound system when the app starts
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] DOMContentLoaded triggered');
    // Call initialize directly - it will handle loading state internally
    initialize(); 
    // Sound system init. The old body click listener for resuming context is now removed.
    SoundSystem.init();
    // The AudioContext is now primarily resumed on-demand by SoundSystem._ensureAudioContextRunning()

    // Call new UI setup functions after main initialization
    if (PokerApp.UI) {
        if (typeof PokerApp.UI.setupJoinUrlCopy === 'function') PokerApp.UI.setupJoinUrlCopy();
        if (typeof PokerApp.UI.setupGlowEffect === 'function') PokerApp.UI.setupGlowEffect();
        if (typeof PokerApp.UI.applyInitialStyleFixes === 'function') PokerApp.UI.applyInitialStyleFixes();
    }
    
    // Initialize player state validation system
    if (typeof setupPlayerStateValidation === 'function') {
        setupPlayerStateValidation();
    }
});

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
    theme: 'Royal',
    sessionId: null,
    gameName: null,
    lobbyActive: false,
    currentPayoutInfo: null
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
            
            // DO NOT Reset application state here - state should only be reset explicitly
            /*
            PokerApp.state.sessionId = null;
            PokerApp.state.gameName = null;
            PokerApp.state.lobbyActive = false;
            */
        }
    },
    
    // Function to set up Join URL copy functionality
    setupJoinUrlCopy() {
        const joinUrlContainer = document.querySelector('.join-url');
        if (joinUrlContainer) {
            joinUrlContainer.addEventListener('click', function() {
                const urlText = document.getElementById('join-url-text');
                const clickToCopy = document.querySelector('.click-to-copy');
                
                if (urlText && urlText.textContent) {
                    navigator.clipboard.writeText(urlText.textContent)
                        .then(() => {
                            if (window.PokerApp && window.PokerApp.UI) {
                                window.PokerApp.UI.showToast('Join URL copied to clipboard', 'success');
                            }
                            if (clickToCopy) {
                                const originalText = clickToCopy.textContent;
                                clickToCopy.textContent = 'Copied!';
                                setTimeout(() => {
                                    clickToCopy.textContent = originalText;
                                }, 2000);
                            }
                        })
                        .catch(err => {
                            console.error('Failed to copy:', err);
                            if (window.PokerApp && window.PokerApp.UI) {
                                window.PokerApp.UI.showToast('Failed to copy URL', 'error');
                            }
                        });
                }
            });
        }
    },
    
    // Function to set up the Glow Effect on sections
    setupGlowEffect() {
        const sections = document.querySelectorAll('main > section');
        sections.forEach(section => {
            section.addEventListener('pointermove', (e) => {
                const rect = section.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element.
                const y = e.clientY - rect.top;  // y position within the element.
                section.style.setProperty('--glow-x', `${x}px`);
                section.style.setProperty('--glow-y', `${y}px`);
            });
        });
    },
    
    // Function to apply initial style fixes from index.html
    applyInitialStyleFixes() {
        // Fix game controls height
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            // The original query was looking for .poker-card inside gameControls.
            // However, the current HTML structure for game-controls is:
            // <section id="game-controls">
            //     <div class="card-header">...</div>
            //     <div class="card-content">...</div>
            // </section>
            // There isn't a direct .poker-card child. Assuming the styles should apply to the section itself or ensure its content area is flexible.
            // If .card or .card-content was a class dynamically added or expected, this might need adjustment.
            // Given the original script targeted `.poker-card` within this section, we should check if that class is added by JS elsewhere.
            // For now, I will apply some general fixes to gameControls itself if it needs to behave like a card.
            // If there is a .card or .card-content, those are better targets.
            // The original code was: 
            // const card = gameControls.querySelector('.poker-card');
            // if (card) { card.style.padding = '12px'; card.style.minHeight = '0'; card.style.height = 'auto'; }
            // Since there is no .poker-card directly in the static HTML provided for game-controls section, 
            // I will try to apply to .card-content if it exists, or the section itself as a fallback for now.
            const cardContent = gameControls.querySelector('.card-content');
            if (cardContent) {
                cardContent.style.padding = '12px'; // Example, adjust as needed
                // gameControls.style.minHeight = '0'; // Applied to section if needed
                // gameControls.style.height = 'auto'; // Applied to section if needed
            } else {
                // Fallback: Apply to the section itself if .card-content isn't found or isn't the target
                // gameControls.style.padding = '12px'; 
                // gameControls.style.minHeight = '0';
                // gameControls.style.height = 'auto';
            }
        }
                
        // Reduce space between header and content
        const main = document.querySelector('main');
        if (main) {
            main.style.paddingTop = '8px';
        }

        // Ensure reset button is active (original selector was complex)
        const resetButton = document.getElementById('reset-btn') || document.querySelector('button[onclick*="resetGame"]');
        if (resetButton) {
            resetButton.style.opacity = '1';
            resetButton.style.pointerEvents = 'auto';
            resetButton.style.cursor = 'pointer';
        }
    },

    // Method to show toast notifications
    showToast: function(message, type = 'info', duration = 3000) {
        // ... existing showToast code ...
    },

    // Method to update empty state display
    updateEmptyStateVisibility: function() {
        // ... existing updateEmptyStateVisibility code ...
    },

    // Helper to apply a temporary animation class
    triggerAnimation: function(element, animationClass) {
        if (element && animationClass) {
            element.classList.add(animationClass);
            element.addEventListener('animationend', () => {
                element.classList.remove(animationClass);
            }, { once: true });
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

    // Check if we have players (and valid array)
    if (!PokerApp.state.players || !Array.isArray(PokerApp.state.players) || PokerApp.state.players.length === 0) {
        // Update empty state message (show it)
        const noPlayersMessage = document.getElementById('no-players-message');
        if (noPlayersMessage) {
            noPlayersMessage.style.display = 'block';
        }
        console.log('[UI] No players to display in updatePlayerList');
        return;
    } else {
        // Update empty state message (hide it)
        const noPlayersMessage = document.getElementById('no-players-message');
        if (noPlayersMessage) {
            noPlayersMessage.style.display = 'none';
        }
    }

    console.log('[UI] Updating player list with players:', PokerApp.state.players);
    
    // Calculate totals for the footer
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    // Safely iterate
    const validPlayers = PokerApp.state.players.filter(p => p && p.name);
    
    validPlayers.forEach((player, index) => {
        try {
            // Validate and fix player data safely
            const safePlayer = { ...player }; // Shallow copy to avoid mutation side effects during render logic
            if (typeof safePlayer.initial_chips !== 'number' || isNaN(safePlayer.initial_chips)) safePlayer.initial_chips = 0;
            if (typeof safePlayer.current_chips !== 'number' || isNaN(safePlayer.current_chips)) safePlayer.current_chips = safePlayer.initial_chips || 0;
            if (!safePlayer.id) safePlayer.id = Date.now() + index;

            // Add to totals
            totalInitialChips += parseInt(safePlayer.initial_chips) || 0;
            totalCurrentChips += parseInt(safePlayer.current_chips) || 0;
            
            const row = document.createElement('tr');
            row.className = safePlayer.id === PokerApp.state.dealerId ? 'dealer' : '';
            row.setAttribute('data-player-id', safePlayer.id);
            
            // Animate if new player
            if (player.isNew) { // Check original object for flag
                PokerApp.UI.triggerAnimation(row, 'popIn'); 
                delete player.isNew; // Remove flag from state object
            }
            
            // Player Name
            const nameCell = document.createElement('td');
            nameCell.className = 'player-name';
            nameCell.textContent = safePlayer.name;
            row.appendChild(nameCell);
            
            // Initial Chips
            const initialChipsCell = document.createElement('td');
            initialChipsCell.className = 'initial-chips';
            initialChipsCell.textContent = safePlayer.initial_chips;
            row.appendChild(initialChipsCell);
            
            // Current Chips Input
            const currentChipsCell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'chip-input';
            input.value = safePlayer.current_chips;
            input.setAttribute('data-player-id', safePlayer.id);
            input.setAttribute('min', '0');
            input.id = `chip-input-${safePlayer.id}`;
            
            // Restore focus
            if (activeInputs[safePlayer.id]) {
                setTimeout(() => input.focus(), 0);
            }
            
            currentChipsCell.appendChild(input);
            row.appendChild(currentChipsCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'player-actions';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-player-btn';
            removeBtn.setAttribute('data-player-id', safePlayer.id);
            removeBtn.title = 'Remove Player';
            removeBtn.type = 'button'; // Prevent form submit
            
            const removeIcon = document.createElement('span');
            removeIcon.className = 'button-icon';
            removeIcon.textContent = '×';
            
            removeBtn.appendChild(removeIcon);
            actionsCell.appendChild(removeBtn);
            row.appendChild(actionsCell);
            
            playerTableBody.appendChild(row);
        } catch (rowError) {
            console.error(`[UI] Error rendering row for player index ${index}:`, rowError);
        }
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
    // Calculate total money directly using current ratio
    const currentChipRatio = PokerApp.state.chipRatio || 1.0;
    const totalMoneyValue = totalCurrentChips * currentChipRatio;
    totalsCurrentCell.innerHTML = `<strong>${totalCurrentChips}</strong> <span class="total-money-amount">($${totalMoneyValue.toFixed(2)})</span>`;
    totalsRow.appendChild(totalsCurrentCell);
    
    const totalsBlankCell = document.createElement('td');
    totalsRow.appendChild(totalsBlankCell);
    
    playerTableBody.appendChild(totalsRow);

    updateEmptyState();
    
    // Add event listeners using delegation or re-attaching
    // Re-attaching to new elements
    playerTableBody.querySelectorAll('.chip-input').forEach(input => {
        input.addEventListener('change', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (playerId) {
                updatePlayerChips(playerId, this.value);
            }
        });
    });
    
    playerTableBody.querySelectorAll('.remove-player-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // Stop any form submit
            e.stopPropagation();
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (playerId) {
                removePlayer(playerId);
            }
        });
    });
    
    // Log success
    console.log(`[UI] Player list updated with ${validPlayers.length} players`);
}

// Add player function - handles both new players and rebuys
// STARTING STACK LOGIC:
// - For new players: initial_chips and current_chips both set to chips amount
// - For rebuys: chips added to BOTH initial_chips (starting stack) and current_chips
// - This ensures payout calculations work: profit/loss = current_chips - initial_chips
function addPlayer(name, chips) {
    if (!name) {
        PokerApp.UI.showToast('Player name cannot be empty.', 'error');
        return false;
    }
    if (typeof chips !== 'number' || isNaN(chips) || chips < 0) {
        PokerApp.UI.showToast('Chip amount must be a non-negative number (0 is allowed).', 'error');
        return false;
    }

    console.log(`[MANUAL_ADD] Adding player ${name} with ${chips} chips`);

    // Check if player already exists (case-insensitive with trimming)
    const normalizedName = name.toLowerCase().trim();
    const existingPlayer = PokerApp.state.players.find(p => p.name.toLowerCase().trim() === normalizedName);
    
    if (existingPlayer) {
        console.log(`[MANUAL_ADD] Player ${name} already exists, adding ${chips} chips as rebuy`);
        
        // Store original values for rollback if needed
        const originalCurrent = existingPlayer.current_chips;
        const originalInitial = existingPlayer.initial_chips;
        
        // REBUY: Add chips to BOTH starting stack (initial_chips) and current chips
        // This increases what they've paid in, which is used for payout calculations
        existingPlayer.current_chips += parseInt(chips);
        existingPlayer.initial_chips += parseInt(chips);
        existingPlayer.lastBuyIn = Date.now();
        
        // Update UI first
        updatePlayerList();
        updateEmptyState();
        
        // Then trigger animation after a short delay to ensure DOM is updated
        setTimeout(() => {
            animateNewPlayer(existingPlayer.id, true); // Call with isUpdate = true
            PokerApp.UI.showToast(`Added ${chips} chips to ${name} (now has ${existingPlayer.current_chips})`, 'success');
        }, 50);
        
        // Save state and update Firebase with consistent transaction structure
        saveState();
        if (PokerApp.state.sessionId) {
            const stateRef = window.database.ref(`games/${PokerApp.state.sessionId}/state`);
            
            // Use same transaction pattern as buy-in for consistency
            stateRef.transaction(function(currentState) {
                if (!currentState) {
                    currentState = { players: [], nextPlayerId: 1, lastUpdate: Date.now() };
                }
                
                currentState.players = currentState.players || [];
                if (!Array.isArray(currentState.players)) {
                    currentState.players = Object.values(currentState.players).filter(p => p != null);
                }
                
                const playerIndex = currentState.players.findIndex(p => 
                    p && p.name && p.name.toLowerCase().trim() === normalizedName
                );
                
                if (playerIndex !== -1) {
                    // Update existing player with consistent structure
                    currentState.players[playerIndex].current_chips += parseInt(chips);
                    currentState.players[playerIndex].initial_chips += parseInt(chips);
                    currentState.players[playerIndex].lastBuyIn = Date.now();
                }
                
                currentState.lastUpdate = timestamp; // Use same older timestamp
                currentState.lastPlayer = {
                    name: existingPlayer.name,
                    action: 'rebuy',
                    addedChips: parseInt(chips),
                    current_chips: existingPlayer.current_chips,
                    initial_chips: existingPlayer.initial_chips,
                    manualAdd: true // Mark as manual rebuy
                };
                
                return currentState;
            }).catch(error => {
                console.error("[MANUAL_ADD] Chip addition transaction failed:", error);
                
                // Rollback local state on error
                existingPlayer.current_chips = originalCurrent;
                existingPlayer.initial_chips = originalInitial;
                updatePlayerList();
                
                PokerApp.UI.showToast('Failed to sync chip addition.', 'error');
            });
        }
        
        return true;
    }

    // Create a new player with consistent data structure
    // Use older timestamp so Firebase listeners know this is a manual host addition
    const timestamp = Date.now() - 10000; // 10 seconds ago to distinguish from QR code joins
    
    // Ensure consistent ID assignment
    const maxId = Math.max(0, ...PokerApp.state.players.map(p => p.id || 0));
    // Use existing nextPlayerId if available and safe, otherwise maxId + 1
    const nextId = Math.max(PokerApp.state.nextPlayerId || 1, maxId + 1);
    const newPlayerId = nextId;
    PokerApp.state.nextPlayerId = nextId + 1;
    
    const newPlayer = {
        id: newPlayerId,
        name: name,
        initial_chips: chips,
        current_chips: chips,
        joinedAt: timestamp,
        active: true,
        lastBuyIn: timestamp,
        manualAdd: true, // Flag to indicate this was added manually by host
        isNew: true // Flag for animation in updatePlayerList
    };

    console.log(`[MANUAL_ADD] Creating new player with ID ${newPlayerId}:`, newPlayer);

    // CRITICAL CHANGE: Push to local state AND force UI refresh immediately
    // We do NOT wait for Firebase to echo back. We trust the host's input.
    PokerApp.state.players.push(newPlayer);
    
    // Force a complete UI rebuild - Using setTimeout to break out of current stack frame
    setTimeout(() => {
        updatePlayerList();
        updateEmptyState();
        
        // Trigger animation
        setTimeout(() => {
            const row = document.querySelector(`tr[data-player-id="${newPlayerId}"]`);
            if (row) {
                PokerApp.UI.triggerAnimation(row, 'popIn');
            }
            PokerApp.UI.showToast(`Added ${name} with ${chips} chips`, 'success');
        }, 50);
    }, 0);
    
    // Save state and update Firebase with consistent transaction pattern
    saveState();
    if (PokerApp.state.sessionId) {
        const stateRef = window.database.ref(`games/${PokerApp.state.sessionId}/state`);
        
        stateRef.transaction(function(currentState) {
            if (!currentState) {
                currentState = { players: [], nextPlayerId: 1, lastUpdate: Date.now() };
            }
            
            currentState.players = currentState.players || [];
            if (!Array.isArray(currentState.players)) {
                currentState.players = Object.values(currentState.players).filter(p => p != null);
            }

            // Check for duplicate names within transaction
            const playerExists = currentState.players.some(p => 
                p && p.name && p.name.toLowerCase().trim() === normalizedName
            );
            
            if (playerExists) {
                console.log(`[MANUAL_ADD] Player ${name} already exists in Firebase, skipping add`);
                return currentState;
            }
            
            // Ensure consistent ID assignment
            const maxId = Math.max(0, ...currentState.players.map(p => p.id || 0));
            // Use existing nextPlayerId if available and safe, otherwise maxId + 1
            const nextId = Math.max(currentState.nextPlayerId || 1, maxId + 1);

            const playerToAdd = {
                id: nextId,
                name: name,
                initial_chips: chips,
                current_chips: chips,
                joinedAt: timestamp, // Older timestamp to distinguish from QR joins
                active: true,
                lastBuyIn: timestamp,
                manualAdd: true // Flag to indicate manual host addition
            };

            currentState.players.push(playerToAdd);
            currentState.nextPlayerId = nextId + 1;
            currentState.lastUpdate = timestamp;
            currentState.lastPlayer = {
                name: name,
                action: 'join',
                initial_chips: chips,
                current_chips: chips
            };
            
            console.log(`[MANUAL_ADD] Added player to Firebase with ID ${nextId}`);
            return currentState;
        }).catch(error => {
            console.error("[MANUAL_ADD] Add player transaction failed:", error);
            
            // Rollback local state on error
            const playerIndex = PokerApp.state.players.findIndex(p => p.id === newPlayerId);
            if (playerIndex !== -1) {
                PokerApp.state.players.splice(playerIndex, 1);
                PokerApp.state.nextPlayerId--;
                updatePlayerList();
                updateEmptyState();
            }
            
            PokerApp.UI.showToast('Failed to sync new player with database.', 'error');
        });
    }
    
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
                    // Play Kaching sound on successful lobby creation
                    if (SoundSystem && typeof SoundSystem.playKachingSound === 'function') {
                        SoundSystem.playKachingSound();
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
            const nameInput = document.getElementById('player-name');
            const chipsInput = document.getElementById('initial-chips');
            const chips = parseInt(chipsInput.value);

            // --- ADD NEW PLAYER LOGIC ---
            const name = nameInput.value.trim();
            if (!name || isNaN(chips) || chips < 0) { // Changed from chips <= 0
                PokerApp.UI.showToast('Please enter a valid name and a non-negative chip amount (0 is allowed)', 'error');
                return;
            }

            addPlayer(name, chips);

            // Reset form fields
            nameInput.value = '';
            chipsInput.value = '';
            nameInput.focus(); // Focus name input for next player
        });
        
        // Ensure inputs are not disabled (fix for stuck state)
        const nameInput = document.getElementById('player-name');
        const chipsInput = document.getElementById('initial-chips');
        if (nameInput) nameInput.disabled = false;
        if (chipsInput) chipsInput.disabled = false;
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
    }

    // Helper function to reset the Add Player form UI
    function resetAddPlayerForm(formElement) {
        const addPlayerSection = document.getElementById('add-player');
        const nameInput = document.getElementById('player-name');
        const chipsInput = document.getElementById('initial-chips');
        const heading = addPlayerSection.querySelector('h2');
        const submitButton = formElement.querySelector('button[type="submit"]');

        formElement.removeAttribute('data-rebuy-player-id');
        heading.textContent = 'Add Player';
        nameInput.value = '';
        nameInput.disabled = false;
        chipsInput.value = '';
        chipsInput.placeholder = 'Enter chip amount';
        submitButton.textContent = 'Add Player';
        console.log('[UI] Reset Add Player form');
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
            
            const money = parseFloat(document.getElementById('money-amount').value);
            const chips = parseInt(document.getElementById('chip-amount').value);
            
            if (isNaN(money) || money <= 0 || isNaN(chips) || chips <= 0) {
                PokerApp.UI.showToast('Please enter valid money and chip amounts', 'error');
                return;
            }
            
            // Calculate and update ratio
            PokerApp.state.chipRatio = money / chips;
            
            // Update display
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.textContent = `Each chip is worth $${PokerApp.state.chipRatio.toFixed(2)}`;
                PokerApp.UI.triggerAnimation(ratioDisplay, 'animate-value-highlight'); // Animate ratio display
            }

            const submitButton = newForm.querySelector('button[type="submit"]');
            if (submitButton) {
                PokerApp.UI.triggerAnimation(submitButton, 'animate-subtle-pop'); // Animate button
            }
            
            // Play Kaching sound - REMOVED
            // if (SoundSystem && typeof SoundSystem.playKachingSound === 'function') {
            //     SoundSystem.playKachingSound();
            // }
            
            PokerApp.UI.showToast('Chip ratio updated', 'success');
            
            // Save state
            saveState();
            
            // Update Firebase if connected
            if (PokerApp.state.sessionId) {
                updateGameStateInFirebase({ chipRatio: PokerApp.state.chipRatio }); // This updates games/<gameId>/state/chipRatio

                // ALSO UPDATE THE TOP-LEVEL RATIO that buy-in.js listens to
                window.database.ref(`games/${PokerApp.state.sessionId}/ratio`).set(PokerApp.state.chipRatio)
                    .then(() => {
                        console.log('[FIREBASE] Top-level game ratio updated successfully for buy-ins.');
                    })
                    .catch(error => {
                        console.error('[FIREBASE] Error updating top-level game ratio for buy-ins:', error);
                        PokerApp.UI.showToast('Error syncing ratio for new buy-ins. Please try again.', 'error');
                    });
            }
        });
    }
    
    // Set up Payout Calculator Button
    const calculateButton = document.getElementById('calculate-payouts');
    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            PokerApp.UI.triggerAnimation(calculateButton, 'animate-subtle-pop'); // Animate button
            // Play Kaching sound
            if (SoundSystem && typeof SoundSystem.playKachingSound === 'function') {
                SoundSystem.playKachingSound();
            }
            calculatePayouts();
        });
    }

    // Set up Finalize Payouts Button
    const finalizePayoutsButton = document.getElementById('finalize-payouts-btn');
    if (finalizePayoutsButton) {
        finalizePayoutsButton.addEventListener('click', function() {
            if (!PokerApp.state.sessionId || !window.database) {
                PokerApp.UI.showToast('Game session not active or database unavailable.', 'error');
                return;
            }

            PokerApp.UI.triggerAnimation(finalizePayoutsButton, 'animate-subtle-pop');

            const payoutInfo = PokerApp.state.currentPayoutInfo; // Use local state

            console.log('[FINALIZE_CLICK] Using PokerApp.state.currentPayoutInfo:', JSON.stringify(payoutInfo));

            if (!payoutInfo || !payoutInfo.transactions) {
                PokerApp.UI.showToast('Please calculate payouts first before finalizing.', 'warning');
                console.warn('[FINALIZE_CLICK_FAIL] payoutInfo from local state issue. payoutInfo:', payoutInfo);
                return;
            }

            if (payoutInfo.status === 'finalized') {
                PokerApp.UI.showToast('Payouts have already been finalized and sent.', 'info');
                // Ensure buttons are correctly reflecting this state, though updatePayoutActionButtons should handle it.
                updatePayoutActionButtons('finalized', false);
                return;
            }
            
            if (payoutInfo.status !== 'calculated') {
                PokerApp.UI.showToast('Payouts are not in a calculated state. Please re-calculate.', 'error');
                console.error('[FINALIZE_CLICK_FAIL] Payout status from local state is not calculated:', payoutInfo.status);
                updatePayoutActionButtons(payoutInfo.status, PokerApp.state.rebuysAllowed !== false);
                return;
            }

            const updates = {};
            updates[`games/${PokerApp.state.sessionId}/payoutInfo/status`] = 'finalized';
            updates[`games/${PokerApp.state.sessionId}/rebuysAllowed`] = false;
            updates[`games/${PokerApp.state.sessionId}/payoutInfo/finalizedAt`] = firebase.database.ServerValue.TIMESTAMP;

            window.database.ref().update(updates)
                .then(() => {
                    PokerApp.UI.showToast('Payouts finalized and sent to players!', 'success');
                    finalizePayoutsButton.disabled = true; // Disable after successful send
                    finalizePayoutsButton.textContent = 'Payouts Sent'; // Update text
                    if (SoundSystem && typeof SoundSystem.playSuccessSound === 'function') {
                        SoundSystem.playSuccessSound(); 
                    }
                    updatePayoutActionButtons('finalized', false); // Update buttons state
                })
                .catch(error => {
                    console.error('[FIREBASE] Error finalizing payouts:', error);
                    PokerApp.UI.showToast('Error finalizing payouts.', 'error');
                    finalizePayoutsButton.disabled = false; // Re-enable on error
                    finalizePayoutsButton.textContent = 'Show Payouts to Players';
                    // Determine current payout status for button update
                    const currentStatus = payoutInfo && payoutInfo.status ? payoutInfo.status : 'calculated'; 
                    updatePayoutActionButtons(currentStatus, PokerApp.state.rebuysAllowed !== false);
                });
        });
    }
    
    // Set up Reset Button
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

    // Set up Reopen Game Button
    const reopenGameButton = document.getElementById('reopen-game-btn');
    if (reopenGameButton) {
        reopenGameButton.addEventListener('click', function() {
            if (!PokerApp.state.sessionId || !window.database) {
                PokerApp.UI.showToast('Game session not active or database unavailable.', 'error');
                return;
            }

            // Confirmation dialog
            if (!confirm("Are you sure you want to re-open the game? This will clear current payout calculations and allow further changes. Players viewing payouts will be returned to the buy-in screen.")) {
                return;
            }

            PokerApp.UI.triggerAnimation(reopenGameButton, 'animate-subtle-pop');
            SoundSystem.playUIClickSound(); // Or a more specific sound

            const updates = {};
            updates[`games/${PokerApp.state.sessionId}/payoutInfo`] = null; // Clear payout info
            updates[`games/${PokerApp.state.sessionId}/rebuysAllowed`] = true;
            updates[`games/${PokerApp.state.sessionId}/state/lastReopenedAt`] = firebase.database.ServerValue.TIMESTAMP;

            window.database.ref().update(updates)
                .then(() => {
                    PokerApp.UI.showToast('Game has been re-opened for activity!', 'success');
                    // PokerApp.state.rebuysAllowed will be updated by the listener
                    // PokerApp.state.payoutInfo will be updated by the listener
                    // The listener for games/{gameId}/state will call updatePayoutActionButtons
                    // However, we can call it directly to ensure immediate UI feedback
                    updatePayoutActionButtons(null, true); 
                })
                .catch(error => {
                    console.error('[FIREBASE] Error re-opening game:', error);
                    PokerApp.UI.showToast('Error re-opening game.', 'error');
                });
        });
    }
}

// Initialize function
function initialize() {
    console.log('Initializing poker app...');
    if (window.appInitialized) {
        console.log('[INIT] App already initialized, skipping');
        return;
    }
    window.appInitialized = true;

    console.log('[INIT] Attempting to load saved state first...');
    const savedStateResult = loadSavedState(); // Try loading state
    console.log('[INIT] loadSavedState result:', savedStateResult);

    if (savedStateResult) {
        // State was successfully loaded by loadSavedState()
        console.log('[INIT] Saved state loaded successfully. Setting up based on loaded state.');
        // The loadSavedState function already called setTheme, updateUIFromState,
        // and potentially setupGameStateListener if sessionId was present.
        // We just need to ensure event listeners and mobile compatibility are set up.
        try {
             console.log('[INIT] Setting up event listeners (after load)...');
             setupEventListeners();
             console.log('[INIT] Setting up mobile compatibility (after load)...');
             setupMobileCompatibility();
             console.log('[INIT] Theme-specific features setup (after load)...');
             initializeThemeSpecificFeatures(PokerApp.state.theme || 'Royal');
             console.log('[INIT] Initialization from saved state complete.');
        } catch (error) {
            console.error('[INIT_ERROR] Error during setup after loading saved state:', error);
            // If setup fails even after loading state, maybe fallback to clean init?
            // For now, just log.
        }

    } else {
        // No valid saved state found, proceed with default initialization
        console.log('[INIT] No saved state found or load failed. Proceeding with default initialization.');

        // Apply default theme explicitly before initializeApp
        setTheme('Royal');

        // Now, initialize Firebase and the core app logic
        ensureFirebaseInitialized()
            .then(() => {
                initializeApp(true); // Firebase available
                // Set up Firebase-specific listeners (like .info/connected)
                 if (window.database) { // Check if database is available
                     window.database.ref('.info/connected').on('value', (snap) => {
                         if (!snap.val()) {
                             console.log('[FIREBASE] Connection lost, waiting for reconnect...');
                             PokerApp.UI.showToast('Connection lost. Reconnecting...', 'error');
                         } else {
                              // Optional: Add a log or toast when reconnected
                              console.log('[FIREBASE] Reconnected.');
                         }
                     });
                     // Setup test connection function
                     window.testFirebaseConnection = function() { 
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
                      }; // <-- Fixed: Added semicolon
                     window.testConnection = window.testFirebaseConnection;
                 } else {
                     console.warn('[FIREBASE] Database reference not available for setting up connection listener or test function.');
                 }
            })
            .catch(error => {
                initializeApp(false); // Firebase unavailable
                PokerApp.UI.showToast('Offline mode - some features unavailable', 'error');
            });

         // Initialize theme-specific features for default theme
         initializeThemeSpecificFeatures('Royal');
         console.log('[INIT] Default initialization complete.');
    } // <-- End of main if/else (savedStateResult)

    // --- MOVED THEME SETUP HERE --- 
    // Setup theme swatches (runs regardless of loaded state)
    console.log('[INIT] Setting up theme swatches...');
    const themeSwatchesContainer = document.getElementById('theme-swatches');
    if (themeSwatchesContainer) {
         // Clear any existing swatches first
         themeSwatchesContainer.innerHTML = ''; 
         Object.entries(availableThemes).forEach(([themeName, themeData]) => {
             const swatch = document.createElement('div');
             swatch.className = 'theme-swatch';
             swatch.dataset.themeName = themeName;
             swatch.style.setProperty('--swatch-main-color', themeData.mainColor);
             swatch.style.setProperty('--swatch-secondary-color', themeData.secondaryColor);
             swatch.title = themeData.name;
             if (themeName === 'RainbowLight') {
                  swatch.style.border = '2px solid #e2e8f0';
             }
             swatch.addEventListener('click', () => {
                  PokerApp.UI.triggerAnimation(swatch, 'animate-subtle-pop'); // Add animation to the clicked swatch
                  if (typeof setTheme === 'function') {
                       setTheme(themeName);
                       document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
                       swatch.classList.add('active');
                  }
             });
             // Set active state based on CURRENT theme (loaded or default)
             if ((PokerApp.state.theme || 'Royal') === themeName) { 
                  swatch.classList.add('active');
             }
             themeSwatchesContainer.appendChild(swatch);
         });
         console.log('[INIT] Theme swatches setup complete.');
    } else {
        console.warn('[INIT] Theme swatches container not found.');
    }
    // Setup random theme button (runs regardless of loaded state)
    console.log('[INIT] Setting up random theme button...');
     const randomThemeBtn = document.getElementById('random-theme');
     if (randomThemeBtn) {
         // Remove potential old listener before adding new one
         const newRandomBtn = randomThemeBtn.cloneNode(true);
         randomThemeBtn.parentNode.replaceChild(newRandomBtn, randomThemeBtn);
         newRandomBtn.addEventListener('click', () => {
             PokerApp.UI.triggerAnimation(newRandomBtn, 'animate-subtle-pop'); // Add animation to random theme button
             const themeNames = Object.keys(availableThemes);
             let randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
             // Ensure a different theme is chosen if current one is selected randomly
             while (randomThemeName === PokerApp.state.currentTheme) {
                 randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
             }
             setTheme(randomThemeName);
             document.querySelectorAll('.theme-swatch').forEach(swatch => {
                  swatch.classList.toggle('active', swatch.dataset.themeName === randomThemeName);
             });
             newRandomBtn.style.transform = 'rotate(360deg)';
             setTimeout(() => { newRandomBtn.style.transform = ''; }, 300);
         });
         console.log('[INIT] Random theme button setup complete.');
     } else {
        console.warn('[INIT] Random theme button not found.');
     }
     // --- END OF MOVED THEME SETUP --- 

     // This should only run once, regardless of loaded state or not
     console.log('[INIT] Finalizing initialization (logo, etc)...');
     initializeLogoAnimation();
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
            updateLobbyUI: updateLobbyUI,
            setupJoinUrlCopy: PokerApp.UI.setupJoinUrlCopy,
            setupGlowEffect: PokerApp.UI.setupGlowEffect,
            applyInitialStyleFixes: PokerApp.UI.applyInitialStyleFixes,
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
            theme: localStorage.getItem('theme') || 'Royal',
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
            appContent.style.display = 'flex';
            appContent.style.flexDirection = 'column';
            appContent.style.gap = '15px'; // Use gap for spacing
            
            // Make all sections full width and ensure content is visible
            document.querySelectorAll('section, .poker-card').forEach(section => {
                section.style.width = '100%';
                section.style.maxWidth = 'none';
                // section.style.margin = '0 0 15px 0'; // Remove individual margin
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
        appContent.style.gap = '15px'; // Use gap for spacing
        appContent.style.width = '100%';
        
        // Make all sections full width
        document.querySelectorAll('section, .poker-card').forEach(section => {
            section.style.width = '100%';
            section.style.maxWidth = 'none';
            // section.style.margin = '0 0 15px 0'; // Remove individual margin
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
        '--accent-color': '#98FB98',
        '--background-color': '#1a1a1a',
        '--surface-color': 'rgba(255, 255, 255, 0.1)',
        '--text-color': 'white',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, var(--main-color), var(--secondary-color))',
        '--card-bg': 'rgba(30, 30, 40, 0.5)',
        '--glow-effect': '0 0 20px rgba(var(--main-color-rgb), 0.5)',
        'icon': '♣️'
    },
    'Royal': {
        '--main-color': '#4169E1',
        '--main-color-rgb': '65, 105, 225',
        '--secondary-color': '#1E90FF',
        '--secondary-color-rgb': '30, 144, 255',
        '--accent-color': '#87CEFA',
        '--background-color': '#0f172a',
        '--surface-color': 'rgba(255, 255, 255, 0.1)',
        '--text-color': 'white',
        '--body-background': 'linear-gradient(135deg, #0f172a, #1e293b)',
        '--vibrant-gradient': 'linear-gradient(45deg, var(--main-color), var(--secondary-color))',
        '--card-bg': 'rgba(30, 41, 59, 0.5)',
        '--glow-effect': '0 0 20px rgba(var(--main-color-rgb), 0.5)',
        'icon': '♠️'
    },
    'Midnight': {
        '--main-color': '#2F4F4F',
        '--main-color-rgb': '47, 79, 79',
        '--secondary-color': '#696969',
        '--secondary-color-rgb': '105, 105, 105',
        '--accent-color': '#A9A9A9',
        '--background-color': '#111111',
        '--surface-color': 'rgba(255, 255, 255, 0.08)',
        '--text-color': '#E0E0E0',
        '--body-background': '#111111',
        '--vibrant-gradient': 'linear-gradient(45deg, var(--main-color), var(--secondary-color))',
        '--card-bg': 'rgba(40, 40, 40, 0.6)',
        '--glow-effect': '0 0 15px rgba(var(--main-color-rgb), 0.4)',
        'icon': '♦️'
    },
    'Purple': {
        '--main-color': '#9370DB',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#8A2BE2',
        '--secondary-color-rgb': '138, 43, 226',
        '--accent-color': '#BA55D3',
        '--background-color': '#1a1a2d',
        '--surface-color': 'rgba(255, 255, 255, 0.1)',
        '--text-color': 'white',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, var(--main-color), var(--secondary-color))',
        '--card-bg': 'rgba(30, 30, 60, 0.5)',
        '--glow-effect': '0 0 20px rgba(var(--main-color-rgb), 0.5)',
        'icon': '💜'
    },
    'RainbowLight': {
        '--main-color': '#0ea5e9', // Sky blue - Keep for accents like underlines
        '--main-color-rgb': '14, 165, 233',
        '--secondary-color': '#22c55e', // Green - Keep for accents
        '--secondary-color-rgb': '34, 197, 94',
        '--accent-color': '#f97316', // Orange - Keep for accents
        '--background-color': '#f8fafc', // Very light gray background
        '--surface-color': '#ffffff', // White surface for sections/cards
        '--text-color': '#1e293b', // Slate dark blue/gray text
        '--text-muted-color': '#64748b', // Lighter text for muted elements
        '--body-background': 'var(--background-color)',
        '--header-background': '#ffffff', // White header background
        '--card-bg': 'var(--surface-color)', // White cards
        '--card-shadow': '0 4px 15px rgba(0, 0, 0, 0.07)', // Softer shadow for light theme
        '--button-background': '#334155', // Dark Slate for buttons
        '--button-text-color': '#ffffff', // White text on dark buttons
        '--glow-effect': '0 0 20px rgba(var(--main-color-rgb), 0.2)', // Subtle glow
        // Modern/Pastel Rainbow Colors for Logo Letters
        '--logo-colors': JSON.stringify([ // Store as stringified JSON for easy parsing in JS
            '#fb7185', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6' 
            // Rose, Amber, Green, Sky, Violet, Pink
        ]),
        'icon': '🌈'
    },
    // Adding the new BananaBlake theme
    'Banana Bonanza': { // Renamed from BananaBlake
        '--main-color': '#4A4A4A', // Dark Grey
        '--main-color-rgb': '74, 74, 74',
        '--secondary-color': '#5A5A5A', // Slightly Lighter Grey
        '--secondary-color-rgb': '90, 90, 90',
        '--accent-color': '#FCEC52', // Banana Yellow
        '--background-color': '#1E1E1E', // Very Dark Grey/Almost Black
        '--surface-color': 'rgba(50, 50, 50, 0.5)', // Darker Grey for surfaces
        '--text-color': '#E0E0E0', // Light Grey
        '--text-muted-color': '#A0A0A0', // Muted Grey
        '--body-background': 'linear-gradient(135deg, #181818, #282828)', // Dark grey gradient
        '--vibrant-gradient': 'linear-gradient(45deg, #4A4A4A, #FCEC52)', // Grey to Yellow
        '--card-bg': 'rgba(30, 30, 30, 0.6)', // Very dark card background
        '--glow-effect': '0 0 20px rgba(252, 236, 82, 0.4)', // Yellow glow
        '--logo-colors': JSON.stringify(['#FCEC52', '#FFD700', '#FFE875']), // Shades of yellow for logo if needed
        'icon': '🍌'
    }
};

// Function to set the theme
function setTheme(theme) {
    if (!theme || !themes[theme]) {
        console.warn('[THEME] Invalid theme:', theme);
        theme = 'Royal'; // Fallback to Royal theme
    }
    
    // Play sound when theme changes
    if (SoundSystem && typeof SoundSystem.playUIClickSound === 'function') {
        SoundSystem.playUIClickSound(); // Use the new UI click sound
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

    // Initialize features for the new theme
    initializeThemeSpecificFeatures(theme); 

    PokerApp.state.currentTheme = theme;
    saveState(); // Save the selected theme

    // Update active swatch
    const themeSwatchesContainer = document.getElementById('theme-swatches');
    if (themeSwatchesContainer) {
        themeSwatchesContainer.querySelectorAll('.theme-swatch').forEach(swatch => {
            if (swatch.dataset.themeName === theme) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });
    }

    // Initialize theme-specific features (like RainbowLight animations)
    initializeThemeSpecificFeatures(theme);
}

// Function to animate the logo text letters (per-letter)
function animateLogoLetters() {
    const logoElement = document.getElementById('text-logo');
    if (!logoElement) return;

    const letterSpans = logoElement.querySelectorAll('span');
    if (letterSpans.length === 0) return;

    let logoColors = [];
    try {
        // Get colors from CSS variable (defined in theme)
        const colorsJson = getComputedStyle(document.documentElement).getPropertyValue('--logo-colors').trim();
        if (colorsJson) {
            logoColors = JSON.parse(colorsJson);
        }
    } catch (e) {
        console.error("Error parsing logo colors from CSS variable:", e);
        // Fallback colors if parsing fails
        logoColors = ['#fb7185', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6'];
    }

    if (logoColors.length === 0) return null; // Return null if no colors to avoid issues

    let intervalId = null;

    const updateColors = () => {
        // Shuffle colors
        const shuffledColors = [...logoColors].sort(() => Math.random() - 0.5);
        
        letterSpans.forEach((span, index) => {
            span.style.color = shuffledColors[index % shuffledColors.length];
            // Add subtle animation (optional - can be enhanced)
            span.style.transition = 'color 0.5s ease-in-out'; 
        });
    };

    // Function to start the interval
    const startAnimation = () => {
        if (intervalId) clearInterval(intervalId); // Clear existing interval if any
        updateColors(); // Initial color set
        intervalId = setInterval(updateColors, 3000); // Shuffle every 3 seconds
    };

    // Start the animation
    startAnimation();

    // Return a function to stop the animation if needed elsewhere
    return () => {
        if (intervalId) clearInterval(intervalId);
        // Reset letter colors and transitions when animation is stopped
        if (logoElement) { // Check if logoElement is still valid
            const spansToReset = logoElement.querySelectorAll('span');
            spansToReset.forEach(span => {
                span.style.color = ''; // Clear inline color
                span.style.transition = ''; // Clear inline transition
            });
        }
    };
}

// Function to animate the color of whole elements cycling through a list
function animateElementColorCycle(selector, interval = 1500) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return null;

    let logoColors = [];
    try {
        const colorsJson = getComputedStyle(document.documentElement).getPropertyValue('--logo-colors').trim();
        if (colorsJson) {
            logoColors = JSON.parse(colorsJson);
        }
    } catch (e) {
        console.error("Error parsing logo colors from CSS variable:", e);
        logoColors = ['#fb7185', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6'];
    }

    if (logoColors.length === 0) return null;

    // Use a Map to store the current color index for each element
    const elementColorIndices = new Map();
    elements.forEach((element, i) => {
        // Initialize each element with a slightly offset starting color index
        elementColorIndices.set(element, i % logoColors.length);
        element.style.color = logoColors[elementColorIndices.get(element)]; // Set initial color
        element.style.transition = 'color 0.5s ease-in-out'; // Apply transition once
    });

    const intervalId = setInterval(() => {
        elements.forEach(element => {
            // Get the current index for this element, default to 0 if not set
            let currentIndex = elementColorIndices.get(element) || 0;
            // Increment the index for the next cycle
            currentIndex = (currentIndex + 1) % logoColors.length;
            // Update the map
            elementColorIndices.set(element, currentIndex);
            // Apply the new color
            element.style.color = logoColors[currentIndex];
        });
    }, interval);

    // Return a function to stop this specific animation
    return () => {
        clearInterval(intervalId);
        // Reset color on stop
        elements.forEach(element => {
            element.style.color = ''; 
            element.style.transition = '';
            elementColorIndices.delete(element); // Clean up map entry
        });
    };
}

// Add a function to re-initialize logo animation when theme changes
function initializeThemeSpecificFeatures(themeName) {
    // Stop previous animations first
    if (window.stopLogoAnimation) {
        window.stopLogoAnimation();
        window.stopLogoAnimation = null;
    }
    if (window.stopHeaderAnimation) {
        window.stopHeaderAnimation();
        window.stopHeaderAnimation = null;
    }
    if (window.stopResetBtnAnimation) {
        window.stopResetBtnAnimation();
        window.stopResetBtnAnimation = null;
    }
    if (window.stopBananaAnimation) { // Stop banana animation if active
        window.stopBananaAnimation();
        window.stopBananaAnimation = null;
    }
    if (window.stopRandomBoatAnimation) { // Stop random boat animation if active
        window.stopRandomBoatAnimation();
        window.stopRandomBoatAnimation = null;
    }

    if (themeName === 'RainbowLight') {
        // Start new animations and store the stop functions
        window.stopLogoAnimation = animateLogoLetters();
        window.stopHeaderAnimation = animateElementColorCycle('.card-header h2');
        window.stopResetBtnAnimation = animateElementColorCycle('#reset-btn');
    } else if (themeName === 'Banana Bonanza') { // Renamed from BananaBlake
        window.stopLogoAnimation = animateLogoLetters(); // Add this line
        window.stopBananaAnimation = startBananaAnimation(); // Start full-screen banana animation
        window.stopRandomBoatAnimation = startRandomBananaBoatAnimation(); // Start header banana boat animation
    } else {
        // Ensure styles are reset if not RainbowLight (or BananaBlake for its specific elements)
        const logoElement = document.getElementById('text-logo');
         if (logoElement) {
            const letterSpans = logoElement.querySelectorAll('span');
            letterSpans.forEach(span => {
                span.style.color = ''; 
                span.style.transition = '';
            });
        }
        document.querySelectorAll('.card-header h2, #reset-btn').forEach(el => {
            el.style.color = '';
            el.style.transition = '';
        });
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
                theme: state.theme || 'Royal',
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
            theme: PokerApp.state.theme || 'Royal',
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
                    localStorage.removeItem('pokerGameState');
                    return;
                }
                
                const gameData = snapshot.val();
                
                if (!gameData.active) {
                    console.error('[FIREBASE] Game is not active:', gameId);
                    PokerApp.state.lobbyActive = false;
                    PokerApp.state.sessionId = null;
                    PokerApp.UI.updateLobbyUI(false);
                    localStorage.removeItem('pokerGameState');
                    return;
                }
                
                // Game exists and is active
                console.log('[FIREBASE] Game is active:', gameData);
                
                // Update state with game data
                PokerApp.state.gameName = gameData.name;
                PokerApp.state.sessionId = gameId;
                PokerApp.state.lobbyActive = true;
                
                // Set up players listener with robust error handling
                database.ref(`games/${gameId}/state/players`).on('child_added', snapshot => {
                    try {
                        const playerData = snapshot.val();
                        if (!playerData || !playerData.name) {
                            console.warn('[FIREBASE] Invalid player data received:', playerData);
                            return;
                        }
                        
                        console.log('[FIREBASE] New player data received:', playerData);
                        
                        // Validate player data structure
                        const validatedPlayer = {
                            id: playerData.id || Date.now(),
                            name: playerData.name,
                            initial_chips: parseInt(playerData.initial_chips) || 0,
                            current_chips: parseInt(playerData.current_chips) || parseInt(playerData.initial_chips) || 0,
                            joinedAt: playerData.joinedAt || Date.now(),
                            active: playerData.active !== false
                        };
                        
                        // Check if this is a new player (more robust checking)
                        const existingPlayerIndex = PokerApp.state.players.findIndex(p => 
                            p.id === validatedPlayer.id || 
                            (p.name && p.name.toLowerCase().trim() === validatedPlayer.name.toLowerCase().trim())
                        );
                        
                        if (existingPlayerIndex === -1) {
                            // Only add if it's genuinely new to local state
                            PokerApp.state.players.push(validatedPlayer);
                            console.log('[FIREBASE] Added new player to local state from child_added:', validatedPlayer.name);
                            
                            // Use requestAnimationFrame for smooth animation
                            requestAnimationFrame(() => {
                                updatePlayerList();
                                updateEmptyState();
                                setTimeout(() => {
                                    animateNewPlayer(validatedPlayer.id);
                                    if (!validatedPlayer.manualAdd) {
                                        PokerApp.UI.showToast(`${validatedPlayer.name} joined with ${validatedPlayer.initial_chips} chips`, 'success');
                                    }
                                }, 100);
                            });
                        } else {
                            console.log('[FIREBASE] Player already exists locally, skipping add:', validatedPlayer.name);
                        }
                    } catch (error) {
                        console.error('[FIREBASE] Error processing new player:', error);
                        PokerApp.UI.showToast('Error adding new player', 'error');
                    }
                }, error => {
                    console.error('[FIREBASE] Error in child_added listener:', error);
                    PokerApp.UI.showToast('Connection error - player updates may be delayed', 'error');
                });
                
                // Listen for player updates (rebuys and host updates) with error handling
                database.ref(`games/${gameId}/state/players`).on('child_changed', snapshot => {
                    try {
                        const updatedPlayer = snapshot.val();
                        if (!updatedPlayer || !updatedPlayer.name) {
                            console.warn('[FIREBASE_SYNC] Invalid updated player data:', updatedPlayer);
                            return;
                        }
                        
                        const existingPlayer = PokerApp.state.players.find(p => p.id === updatedPlayer.id);
                        if (!existingPlayer) {
                            console.warn(`[FIREBASE_SYNC] Player not found locally: ${updatedPlayer.name} (ID: ${updatedPlayer.id})`);
                            return;
                        }
                        
                        // Validate updated player data
                        const validatedUpdate = {
                            ...updatedPlayer,
                            initial_chips: parseInt(updatedPlayer.initial_chips) || 0,
                            current_chips: parseInt(updatedPlayer.current_chips) || 0
                        };
                        
                        // HOST PRIORITY: Check if local player has recent host update
                        const localHasRecentHostUpdate = existingPlayer.hostUpdated && 
                                                        existingPlayer.lastHostUpdate && 
                                                        (Date.now() - existingPlayer.lastHostUpdate < 10000); // 10 second protection window
                        
                        // Check if incoming update is a host update
                        const isIncomingHostUpdate = validatedUpdate.hostUpdated && validatedUpdate.lastHostUpdate;
                        const isNewerThanLocal = !existingPlayer.lastHostUpdate || 
                                              (validatedUpdate.lastHostUpdate > existingPlayer.lastHostUpdate);
                        
                        // HOST AUTHORITY: Always prioritize local host updates over any Firebase changes
                        // EXCEPTION: If the update is a REBUY (initial_chips increased), we must accept it because the host
                        // typically updates 'current_chips' locally, but rebuys add new chips to the ecosystem.
                        const isRebuy = !validatedUpdate.manualAdd && validatedUpdate.initial_chips > existingPlayer.initial_chips;

                        // CRITICAL FIX: If it's a rebuy, we MUST accept it regardless of host priority.
                        // Rebuys are valid state transitions that happen externally (via QR code).
                        if (isRebuy) {
                             // QR CODE REBUY: Add chips to BOTH initial (starting stack) and current totals
                             const chipDiff = validatedUpdate.initial_chips - existingPlayer.initial_chips;
                             console.log(`[FIREBASE_SYNC] Applying QR code rebuy for ${existingPlayer.name}: +${chipDiff} chips (starting stack: ${existingPlayer.initial_chips} -> ${validatedUpdate.initial_chips})`);
                             
                             // Update starting stack (initial_chips) - this is what payouts calculate from
                             existingPlayer.initial_chips = validatedUpdate.initial_chips;
                             // Add the difference to current chips
                             existingPlayer.current_chips += chipDiff;
                             
                             // Save state to persist the starting stack update
                             saveState();
                             
                             // Update UI and trigger animation
                             updatePlayerList();
                             
                             requestAnimationFrame(() => {
                                 setTimeout(() => {
                                     if (typeof animateChipAddition === 'function') {
                                         animateChipAddition(existingPlayer.id);
                                     } else {
                                         animateNewPlayer(existingPlayer.id, true);
                                     }
                                     PokerApp.UI.showToast(`${existingPlayer.name} added ${chipDiff} chips!`, 'success');
                                 }, 100);
                             });
                             return; // Exit after handling rebuy
                        }

                        if (localHasRecentHostUpdate) {
                            console.log(`[FIREBASE_SYNC] BLOCKING update for ${existingPlayer.name} - local host update takes priority (${Date.now() - existingPlayer.lastHostUpdate}ms ago)`);
                            return;
                        }
                        
                        if (isIncomingHostUpdate) {
                            // Only apply incoming host updates if they're newer than our local state
                            if (isNewerThanLocal) {
                                console.log(`[FIREBASE_SYNC] Applying newer host update for ${existingPlayer.name}`);
                                existingPlayer.current_chips = validatedUpdate.current_chips;
                                existingPlayer.lastHostUpdate = validatedUpdate.lastHostUpdate;
                                existingPlayer.hostUpdated = true;
                                updatePlayerList();
                                saveState();
                            } else {
                                console.log(`[FIREBASE_SYNC] Ignoring older host update for ${existingPlayer.name}`);
                            }
                            return;
                        } else {
                            // Logic for other updates... if any.
                             if (validatedUpdate.manualAdd) {
                                console.log(`[FIREBASE_SYNC] Ignoring manual update for ${existingPlayer.name} - handled locally by host`);
                            } else {
                                console.log(`[FIREBASE_SYNC] Ignoring update for ${existingPlayer.name} - not newer or not applicable`);
                            }
                        }
                    } catch (error) {
                        console.error('[FIREBASE_SYNC] Error processing player update:', error);
                        PokerApp.UI.showToast('Error syncing player update', 'error');
                    }
                }, error => {
                    console.error('[FIREBASE] Error in child_changed listener:', error);
                    PokerApp.UI.showToast('Connection error - player updates may be delayed', 'error');
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
        
        // Add a specific listener for payoutInfo to directly update buttons
        database.ref(`games/${gameId}/payoutInfo`).on('value', snapshot => {
            const payoutInfoData = snapshot.val();
            PokerApp.state.currentPayoutInfo = payoutInfoData; // Store payoutInfo in app state
            const status = payoutInfoData ? payoutInfoData.status : null;
            // Assuming PokerApp.state.rebuysAllowed is kept up-to-date by the general state listener
            const rebuysAllowed = PokerApp.state.rebuysAllowed !== false; 
            updatePayoutActionButtons(status, rebuysAllowed);
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
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Uppercase alphanumeric
    let result = '';
    
    // Add timestamp component for uniqueness
    const timestamp = Date.now().toString(36); // This will be lowercase alphanumeric
    
    // Add 4 random uppercase characters
    for (let i = 0; i < 4; i++) {
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
            width: 200, // Adjusted size
            height: 200, // Adjusted size
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
                        width: 200, // Adjusted size
                        height: 200, // Adjusted size
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
    // Play reset sound
    SoundSystem.playResetSound();
    
    // Remove any existing animation elements first
    document.querySelectorAll('.reset-curtain, .flying-cards-container, .confetti-container, .shuffle-effect, .ripple-effect').forEach(el => {
        el.remove();
    });

    // Create reset curtain if it doesn't exist
    let resetCurtain = document.createElement('div');
    resetCurtain.className = 'reset-curtain';
    document.body.appendChild(resetCurtain);

    // Create flying cards container
    let flyingCardsContainer = document.createElement('div');
    flyingCardsContainer.className = 'flying-cards-container';
    document.body.appendChild(flyingCardsContainer);

    // Create confetti container
    let confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    // Create shuffle effect
    let shuffleEffect = document.createElement('div');
    shuffleEffect.className = 'shuffle-effect';
    document.body.appendChild(shuffleEffect);

    // Create ripple effect
    let rippleEffect = document.createElement('div');
    rippleEffect.className = 'ripple-effect';
    document.body.appendChild(rippleEffect);

    // Play card shuffle sound if available
    const shuffleSound = document.getElementById('card-shuffle-sound');
    if (shuffleSound) {
        shuffleSound.currentTime = 0;
        shuffleSound.play().catch(() => {});
    }

    // Trigger reset animation sequence
    resetCurtain.classList.add('active');
    rippleEffect.classList.add('active');

    // Create and animate flying cards with enhanced 3D effects
    flyingCardsContainer.innerHTML = '';
    const cardSuits = ['♠', '♥', '♦', '♣'];
    
    for (let i = 0; i < 16; i++) {
        const card = document.createElement('div');
        card.className = 'reset-card';
        const suit = cardSuits[Math.floor(Math.random() * cardSuits.length)];
        const isRed = suit === '♥' || suit === '♦';
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-suit ${isRed ? 'red' : 'black'}">${suit}</div>
            </div>
        `;
        
        // Set random position and rotation
        const flyX = Math.random() * 1000 - 500; // Random X between -500 and 500
        const flyY = Math.random() * 800 - 400;  // Random Y between -400 and 400
        const rotation = Math.random() * 1080 - 540; // Random rotation between -540 and 540 degrees
        
        card.style.setProperty('--flyX', `${flyX}px`);
        card.style.setProperty('--flyY', `${flyY}px`);
        card.style.setProperty('--flyRotate', `${rotation}deg`);
        
        flyingCardsContainer.appendChild(card);
        
        // Add active class with a slight delay for each card
        setTimeout(() => {
            card.classList.add('active');
        }, i * 50);
    }

    // Create and animate enhanced confetti
    confettiContainer.innerHTML = '';
    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9370db', '#ff6b81', '#ffd700', '#00ff00', '#ff1493', '#00ffff'];
    for (let i = 0; i < 75; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.setProperty('--fall-delay', `${Math.random() * 2}s`);
        confetti.style.setProperty('--fall-distance', `${100 + Math.random() * 100}vh`);
        confetti.style.setProperty('--rotation', `${Math.random() * 720}deg`);
        confettiContainer.appendChild(confetti);
    }

    // Show enhanced shuffle effect
    shuffleEffect.classList.add('active');

    // Reset game state after animation sequence
    setTimeout(() => {
        // End current game if in progress
        if (PokerApp.state.gameInProgress) {
            endGame();
        }
        
        // First clean up any Firebase connections
    if (PokerApp.state.sessionId) {
            // Update game status to inactive in Firebase
            try {
                firebase.database().ref(`games/${PokerApp.state.sessionId}`).update({
                    active: false,
                    status: 'reset'
                });
                
                // Remove all Firebase listeners
                firebase.database().ref(`games/${PokerApp.state.sessionId}`).off();
                firebase.database().ref(`games/${PokerApp.state.sessionId}/state/players`).off();
                firebase.database().ref(`games/${PokerApp.state.sessionId}/state/lastUpdate`).off();
                firebase.database().ref(`games/${PokerApp.state.sessionId}/state/lastPlayer`).off();
                
                console.log('Cleaned up all Firebase listeners and connections');
            } catch (error) {
                console.error('Error cleaning up Firebase connections:', error);
            }
        }
        
        // Reset game state
        PokerApp.state.players = [];
        PokerApp.state.dealerId = null;
        PokerApp.state.nextPlayerId = 1;
        PokerApp.state.gameInProgress = false;
        PokerApp.state.sessionId = null;
        PokerApp.state.gameName = null;
        PokerApp.state.lobbyActive = false;
        // PokerApp.state.chipRatio = 1.0; // Explicitly reset chip ratio - THIS LINE IS REMOVED
        
        // Reset player counter
        window._lastPlayerCount = 0;
        
        // Update UI
        updatePlayerList();
        updateEmptyState();
        updateLobbyUI(false);
        
        // Clear QR code container
        const qrCodeContainer = document.getElementById('qr-code-container');
        if (qrCodeContainer) {
            qrCodeContainer.style.display = 'none';
            const qrWrapper = qrCodeContainer.querySelector('.qr-wrapper');
            if (qrWrapper) {
                qrWrapper.innerHTML = '';
            }
        }

        // Reset Payout Section
        PokerApp.state.currentPayoutInfo = null;
        const payoutResultsDiv = document.getElementById('payout-results');
        if (payoutResultsDiv) {
            payoutResultsDiv.innerHTML = `
                <div class="no-payouts-message">
                    <p>No payouts calculated yet</p>
                    <span>Update final chip counts and click calculate</span>
                </div>
            `;
        }
        const finalizePayoutsBtn = document.getElementById('finalize-payouts-btn');
        const reopenGameBtn = document.getElementById('reopen-game-btn');
        const calculatePayoutsBtn = document.getElementById('calculate-payouts');

        if (calculatePayoutsBtn) calculatePayoutsBtn.disabled = false;
        if (finalizePayoutsBtn) {
            finalizePayoutsBtn.style.display = 'inline-flex'; // Or 'block' depending on original display
            finalizePayoutsBtn.disabled = false;
        }
        if (reopenGameBtn) reopenGameBtn.style.display = 'none';


        // Clean up animation elements
        resetCurtain.classList.remove('active');
        shuffleEffect.classList.remove('active');
        rippleEffect.classList.remove('active');

        // Remove animation elements after they're done
        setTimeout(() => {
            document.querySelectorAll('.reset-curtain, .flying-cards-container, .confetti-container, .shuffle-effect, .ripple-effect').forEach(el => {
                el.remove();
            });
        }, 2000);
    }, 2500);
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
// Add calculatePayouts function (Refactored for Robustness & Normalization)
function calculatePayouts() {
    console.log('[PAYOUT] Calculating payouts (Robust Mode)');
    
    if (!PokerApp.state.players || PokerApp.state.players.length === 0) {
        PokerApp.UI.showToast('No players to calculate payouts for', 'error');
        return;
    }

    if (PokerApp.state.players.length < 2) {
        PokerApp.UI.showToast('Need at least 2 players to calculate payouts', 'error');
        return;
    }

    SoundSystem.playPayoutSound();

    const players = PokerApp.state.players.filter(p => p.active !== false);
    const nominalRatio = PokerApp.state.chipRatio || 1.0;

    console.log('[PAYOUT] Processing players:', players.length);

    // 1. Calculate Totals & Detect Discrepancies
    let totalInitialChips = 0;
    let totalCurrentChips = 0;

    const playerData = players.map(player => {
        const initial = parseInt(player.initial_chips, 10) || 0;
        const current = parseInt(player.current_chips, 10) || 0;
        totalInitialChips += initial;
        totalCurrentChips += current;
        
        return {
            id: player.id,
            name: player.name,
            initial,
            current,
            nominalBuyIn: initial * nominalRatio
        };
    });

    const chipDiscrepancy = totalCurrentChips - totalInitialChips;
    let effectiveRatio = nominalRatio;
    let discrepancyMsg = '';
    let hasDiscrepancy = false;
    let discrepancyType = ''; // 'short' or 'surplus'

    // Normalization Logic:
    // If chips are missing or extra, we adjust the effective value of each chip 
    // so that the Total Cash Value Out equals Total Cash Value In.
    // This ensures zero-sum settlements.
    if (totalCurrentChips > 0 && Math.abs(chipDiscrepancy) > 0) {
        hasDiscrepancy = true;
        const totalPotValue = totalInitialChips * nominalRatio;
        effectiveRatio = totalPotValue / totalCurrentChips;
        
        discrepancyType = chipDiscrepancy < 0 ? 'short' : 'surplus';
        const discrepancyValue = Math.abs(chipDiscrepancy) * nominalRatio;
        
        console.warn(`[PAYOUT] Discrepancy detected: ${chipDiscrepancy} chips.`);
        console.warn(`[PAYOUT] Adjusted Ratio: ${nominalRatio} -> ${effectiveRatio}`);
        
        discrepancyMsg = chipDiscrepancy < 0 
            ? `Table is short ${Math.abs(chipDiscrepancy)} chips ($${discrepancyValue.toFixed(2)}).`
            : `Table has extra ${chipDiscrepancy} chips ($${discrepancyValue.toFixed(2)}).`;
        
        discrepancyMsg += ` Values adjusted to balance.`;
    } else if (totalCurrentChips === 0 && totalInitialChips > 0) {
        // Edge case: All chips lost?
        effectiveRatio = 0;
        discrepancyMsg = "All chips are missing! 100% Loss.";
        hasDiscrepancy = true;
    }

    // 2. Calculate Net Position (Profit/Loss in CASH)
    const settlements = playerData.map(p => {
        const cashOutValue = p.current * effectiveRatio;
        const netCash = cashOutValue - p.nominalBuyIn;
        
        return {
            ...p,
            cashOutValue,
            netCash, // Precise float
            displayNet: netCash // For display logic
        };
    });

    // 3. Sort into Debtors (Losers) and Creditors (Winners)
    const winners = settlements.filter(p => p.netCash > 0.005).sort((a, b) => b.netCash - a.netCash); // Largest winners first
    const losers = settlements.filter(p => p.netCash < -0.005).sort((a, b) => a.netCash - b.netCash); // Largest losers (most negative) first

    // 4. Greedy Matching Algorithm
    const transactions = [];
    let winnerIdx = 0;
    let loserIdx = 0;

    // Work with mutable balances to track remaining debts/credits
    const winnerBalances = winners.map(w => w.netCash);
    const loserBalances = losers.map(l => Math.abs(l.netCash));

    while (winnerIdx < winners.length && loserIdx < losers.length) {
        const amountOwed = loserBalances[loserIdx];
        const amountToReceive = winnerBalances[winnerIdx];
        
        // Settle the smaller of the two amounts
        const settlementAmount = Math.min(amountOwed, amountToReceive);
        
        if (settlementAmount > 0.005) { // Ignore micro-cents
            transactions.push({
                from: losers[loserIdx].name,
                to: winners[winnerIdx].name,
                cash: parseFloat(settlementAmount.toFixed(2)),
                chips: Math.round(settlementAmount / effectiveRatio) // Approx chips
            });
        }

        // Adjust balances
        loserBalances[loserIdx] -= settlementAmount;
        winnerBalances[winnerIdx] -= settlementAmount;

        // Advance pointers if settled (within epsilon)
        if (loserBalances[loserIdx] < 0.005) loserIdx++;
        if (winnerBalances[winnerIdx] < 0.005) winnerIdx++;
    }

    // 5. Update Cash Values for Stats & Display
    // Update the original 'settlements' objects with final cashValue (Net Profit) for stats
    settlements.forEach(p => {
        p.cashValue = p.netCash; 
    });
    
    // Create player result cards (Sorted by Win/Loss)
    const sortedPlayers = [...settlements].sort((a, b) => b.netCash - a.netCash);
    
    // Calculate Fun Stats
    const biggestWinner = settlements.reduce((prev, curr) => (curr.netCash > prev.netCash) ? curr : prev, settlements[0]);
    const biggestLoser = settlements.reduce((prev, curr) => (curr.netCash < prev.netCash) ? curr : prev, settlements[0]);
    
    const totalMoneyMoved = transactions.reduce((sum, t) => sum + t.cash, 0).toFixed(2);
    const totalChipsMoved = transactions.reduce((sum, t) => sum + t.chips, 0); // Approx
    
    const winnersList = settlements.filter(p => p.netCash > 0);
    const averageWin = winnersList.length > 0 
        ? winnersList.reduce((sum, p) => sum + p.netCash, 0) / winnersList.length 
        : 0;

    // Build the HTML string
    let html = `
        <div class="payout-wrapper">
            <div class="payout-summary-header">
                <h3>Game Results</h3>
                <div class="payout-timestamp">${new Date().toLocaleTimeString()}</div>
            </div>
            
            ${hasDiscrepancy ? `
            <div class="discrepancy-banner ${discrepancyType}">
                <strong>⚠️ Adjustment:</strong> ${discrepancyMsg}
            </div>` : ''}

            <div class="results-container">
                <!-- Fun Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👑</div>
                        <div class="stat-title">Biggest Winner</div>
                        <div class="stat-value">${biggestWinner.name}</div>
                        <div class="stat-detail">+$${Math.abs(biggestWinner.netCash).toFixed(2)}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">😅</div>
                        <div class="stat-title">Biggest L</div>
                        <div class="stat-value">${biggestLoser.name}</div>
                        <div class="stat-detail">-$${Math.abs(biggestLoser.netCash).toFixed(2)}</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💸</div>
                        <div class="stat-title">Money Moved</div>
                        <div class="stat-value">$${totalMoneyMoved}</div>
                        <div class="stat-detail">~${totalChipsMoved} chips</div>
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
                            <span class="payment-amount">$${payment.cash.toFixed(2)}</span>
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
                
                <!-- Detailed Player Breakdown -->
                <div class="player-breakdown">
                    <h3>Detail Breakdown</h3>
                    <div class="breakdown-list">`;
                    
    sortedPlayers.forEach(player => {
        const isWinner = player.netCash > 0;
        const netClass = isWinner ? 'positive' : (player.netCash < 0 ? 'negative' : 'neutral');
        const sign = isWinner ? '+' : ''; // Negative has sign already
        const netAmount = player.netCash.toFixed(2);
        
        html += `
            <div class="breakdown-item">
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    <span class="chip-count">${player.current} chips</span>
                </div>
                <div class="financial-info">
                    <span class="net-amount ${netClass}">${sign}$${netAmount}</span>
                    <span class="buy-in-info">in: $${player.nominalBuyIn.toFixed(2)}</span>
                </div>
            </div>`;
    });
    
    html += `
                    </div>
                </div>
            </div>
            
            <div class="action-buttons-container">
                <button id="finalize-payouts-btn-internal" class="poker-button primary-button" onclick="document.getElementById('finalize-payouts-btn').click()">Show Payouts to Players</button>
                <button id="reopen-game-btn-internal" class="poker-button secondary-button" onclick="document.getElementById('reopen-game-btn').click()">Re-open Game</button>
            </div>
        </div>
    `;

    // Render Logic
    const payoutResults = document.getElementById('payout-results');
    if (payoutResults) {
        payoutResults.innerHTML = html;
        payoutResults.style.display = 'block';
        
        // Hide external buttons to prevent duplication/clutter
        const extFinalize = document.getElementById('finalize-payouts-btn');
        const extReopen = document.getElementById('reopen-game-btn');
        if (extFinalize) extFinalize.style.display = 'none';
        if (extReopen) extReopen.style.display = 'none';
        
        payoutResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Store payout info in state
        PokerApp.state.currentPayoutInfo = {
            status: 'calculated', // 'calculated' vs 'finalized'
            transactions: transactions,
            players: settlements,
            timestamp: Date.now()
        };
        
        // Update global buttons status (even if hidden, their logic matters)
        updatePayoutActionButtons('calculated', PokerApp.state.rebuysAllowed !== false);
        
        // --- Save payout info to Firebase ---
        if (PokerApp.state.sessionId && window.database) {
             const payoutInfo = {
                transactions: transactions,
                calculatedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'calculated'
            };
            window.database.ref(`games/${PokerApp.state.sessionId}/payoutInfo`).set(payoutInfo);
        }
    }
}

function removePlayer(playerId) {
    if (!PokerApp.state.players) return;

    const playerRow = document.querySelector(`tr[data-player-id="${playerId}"]`);
    const playerIndex = PokerApp.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        console.warn(`[PLAYER] removePlayer called for non-existent player ID: ${playerId}`);
        return;
    }

    const performRemove = () => {
        // Optimistically remove from local state for immediate UI feedback.
        const removedPlayer = PokerApp.state.players.splice(playerIndex, 1);
        console.log('[PLAYER] Optimistically removed player from state:', removedPlayer[0]?.name);

        if (PokerApp.state.dealerId === playerId) {
            PokerApp.state.dealerId = null; 
        }

        saveState();
        updatePlayerList(); // Re-render list which will exclude the removed row

        // Now, transactionally update Firebase
        if (PokerApp.state.sessionId && window.database) {
            const playersRef = window.database.ref(`games/${PokerApp.state.sessionId}/state/players`);
            playersRef.transaction(function(players) {
                if (players) {
                    if (!Array.isArray(players)) {
                        players = Object.values(players).filter(p => p != null);
                    }
                    return players.filter(p => p && p.id !== playerId);
                }
                return players;
            }).catch(error => {
                console.error("Remove player transaction failed:", error);
                PokerApp.UI.showToast(`Failed to sync removal for ${removedPlayer[0]?.name}.`, 'error');
                // Consider adding logic to reload state from Firebase to correct the UI
            });
        }
    };

    if (playerRow) {
        SoundSystem.playRemoveSound();
        PokerApp.UI.triggerAnimation(playerRow, 'animate-player-remove');
        
        // The optimistic update and Firebase call happen AFTER the animation.
        playerRow.addEventListener('animationend', performRemove, { once: true });
    } else {
        // Fallback if row not found for animation, perform removal immediately.
        SoundSystem.playRemoveSound(); // Still play sound
        console.log(`[PLAYER] Removed player from state (row not found for animation): ${playerId}`);
        performRemove();
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
        theme: localStorage.getItem('theme') || 'Royal',
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

    // Update chip ratio display
    const ratioDisplay = document.getElementById('ratio-display');
    if (ratioDisplay) {
        const currentChipRatio = PokerApp.state.chipRatio || 1.0;
        ratioDisplay.textContent = `Each chip is worth $${currentChipRatio.toFixed(2)}`;
    }
    
    // Initialize HandAnimation only if container exists
    // const container = document.getElementById('dealer-wheel'); // Removed
    // if (container && typeof HandAnimation !== 'undefined') { // Removed
    //     window.handAnimation = new HandAnimation(container); // Removed
    //     if (PokerApp.state.theme) { // Removed
    //         window.handAnimation.setTheme(themes[PokerApp.state.theme]); // Removed
    //     } // Removed
    // } // Removed

    // After updating UI from state, also update payout button states if session exists
    if (PokerApp.state.sessionId && window.database) {
        window.database.ref(`games/${PokerApp.state.sessionId}/payoutInfo`).once('value', snapshot => {
            const payoutInfo = snapshot.val();
            const rebuysAllowed = PokerApp.state.rebuysAllowed !== false; // Assuming rebuysAllowed is part of PokerApp.state
            updatePayoutActionButtons(payoutInfo ? payoutInfo.status : null, rebuysAllowed);
        });
    } else {
        updatePayoutActionButtons(null, true); // Default state if no session
    }
}

// Function to manage the state of payout-related action buttons
function updatePayoutActionButtons(payoutStatus, rebuysAllowed) {
    const calculateButton = document.getElementById('calculate-payouts');
    const finalizeButton = document.getElementById('finalize-payouts-btn');
    const reopenButton = document.getElementById('reopen-game-btn');

    if (!calculateButton || !finalizeButton || !reopenButton) {
        console.warn("[UI_BUTTONS] One or more payout action buttons not found in the DOM.");
        return;
    }

    // Default states
    calculateButton.disabled = false;
    finalizeButton.disabled = true;
    finalizeButton.textContent = 'Show Payouts to Players';
    reopenButton.style.display = 'none';
    reopenButton.disabled = true;

    if (payoutStatus === 'finalized') {
        finalizeButton.disabled = true;
        finalizeButton.textContent = 'Payouts Sent';
        reopenButton.style.display = ''; // Show the reopen button
        reopenButton.disabled = false;
    } else if (payoutStatus === 'calculated') {
        calculateButton.disabled = (PokerApp.state.players && PokerApp.state.players.length < 2);
        finalizeButton.disabled = false;
        // finalizeButton.textContent remains 'Show Payouts to Players'
        // reopenButton remains hidden
    } else { // null or any other status (game open/reset)
        calculateButton.disabled = (PokerApp.state.players && PokerApp.state.players.length < 2);
        // finalizeButton remains disabled and with default text
        // reopenButton remains hidden
    }
    console.log(`[UI_BUTTONS] Payout buttons updated. Status: ${payoutStatus}, Calculate: ${calculateButton.disabled}, Finalize: ${finalizeButton.disabled}, Reopen: ${reopenButton.style.display !== 'none'}`);
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

// Function to update player chips directly from input field (HOST AUTHORITY)
// HOST PRIORITY: This function has the HIGHEST priority for chip count changes
// - Updates current_chips only (NOT initial_chips/starting stack)
// - Payouts calculate profit/loss as: current_chips - initial_chips
// - Host updates override any Firebase sync for 10 seconds
function updatePlayerChips(playerId, newValue) {
    const player = PokerApp.state.players.find(p => p.id === playerId);
    const parsedNewValue = parseInt(newValue, 10);

    if (!player) {
        PokerApp.UI.showToast('Player not found', 'error');
        return;
    }

    if (isNaN(parsedNewValue) || parsedNewValue < 0) {
        PokerApp.UI.showToast('Invalid chip update. Please enter a valid number.', 'error');
        updatePlayerList(); // Revert the input field to last known good state
        return;
    }

    console.log(`[HOST_UPDATE] Host updating ${player.name} chips to ${parsedNewValue} (was ${player.current_chips}, starting stack: ${player.initial_chips})`);

    // HOST AUTHORITY: Update current chips only - starting stack (initial_chips) remains unchanged
    // This ensures payout calculations work correctly: profit/loss = current_chips - initial_chips
    player.current_chips = parsedNewValue;
    player.lastHostUpdate = Date.now();
    player.hostUpdated = true;
    
    // Save state locally
    saveState();
    
    // Update ONLY the specific player row to avoid affecting others
    updateSinglePlayerRow(playerId);

    PokerApp.UI.showToast(`${player.name}'s chips updated to ${parsedNewValue}`, 'success');

    // ISOLATED FIREBASE UPDATE - only update this specific player
    if (PokerApp.state.sessionId && window.database) {
        const playerRef = window.database.ref(`games/${PokerApp.state.sessionId}/state/players`)
            .orderByChild('id').equalTo(playerId);
        
        // Use a targeted update to avoid affecting other players
        playerRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(childSnapshot => {
                    const key = childSnapshot.key;
                    updates[`games/${PokerApp.state.sessionId}/state/players/${key}/current_chips`] = parsedNewValue;
                    updates[`games/${PokerApp.state.sessionId}/state/players/${key}/lastHostUpdate`] = Date.now();
                    updates[`games/${PokerApp.state.sessionId}/state/players/${key}/hostUpdated`] = true;
                });
                
                // Apply the isolated update
                window.database.ref().update(updates).then(() => {
                    console.log(`[HOST_UPDATE] Successfully updated ${player.name} chips in Firebase`);
                }).catch(error => {
                    console.error(`[HOST_UPDATE] Firebase update failed:`, error);
                    PokerApp.UI.showToast(`Failed to sync ${player.name}'s chips`, 'error');
                });
            }
        });
    }
}

// Update only a single player row without affecting others
function updateSinglePlayerRow(playerId) {
    const player = PokerApp.state.players.find(p => p.id === playerId);
    if (!player) return;
    
    const row = document.querySelector(`tr[data-player-id="${playerId}"]`);
    if (!row) return;
    
    // Update only the current chips input for this specific player
    const chipInput = row.querySelector('.chip-input');
    if (chipInput && parseInt(chipInput.value) !== player.current_chips) {
        chipInput.value = player.current_chips;
        
        // Add visual feedback without affecting other players
        row.style.background = 'rgba(var(--main-color-rgb), 0.2)';
        setTimeout(() => {
            row.style.background = '';
        }, 300);
    }
    
    // Update totals row only
    updateTotalsRow();
}

// Update just the totals row without rebuilding the entire table
function updateTotalsRow() {
    const totalsRow = document.querySelector('.totals-row');
    if (!totalsRow) return;
    
    // Calculate new totals
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    PokerApp.state.players.forEach(player => {
        if (player && typeof player.initial_chips === 'number' && typeof player.current_chips === 'number') {
            totalInitialChips += player.initial_chips;
            totalCurrentChips += player.current_chips;
        }
    });
    
    // Update totals cells
    const cells = totalsRow.children;
    if (cells.length >= 3) {
        cells[1].innerHTML = `<strong>${totalInitialChips}</strong>`;
        
        const currentChipRatio = PokerApp.state.chipRatio || 1.0;
        const totalMoneyValue = totalCurrentChips * currentChipRatio;
        cells[2].innerHTML = `<strong>${totalCurrentChips}</strong> <span class="total-money-amount">($${totalMoneyValue.toFixed(2)})</span>`;
    }
}

// Add to global scope
window.updatePlayerChips = updatePlayerChips;

// Player state validation and cleanup function
function validateAndCleanPlayerState() {
    console.log('[VALIDATION] Checking player state integrity...');
    
    if (!PokerApp.state.players || !Array.isArray(PokerApp.state.players)) {
        console.warn('[VALIDATION] Player state is not an array, resetting...');
        PokerApp.state.players = [];
        return;
    }
    
    let cleanupCount = 0;
    const validPlayers = [];
    
    PokerApp.state.players.forEach((player, index) => {
        if (!player || typeof player !== 'object') {
            console.warn(`[VALIDATION] Removing invalid player object at index ${index}:`, player);
            cleanupCount++;
            return;
        }
        
        if (!player.name || typeof player.name !== 'string' || player.name.trim() === '') {
            console.warn(`[VALIDATION] Removing player with invalid name at index ${index}:`, player);
            cleanupCount++;
            return;
        }
        
        // Fix invalid chip values
        if (typeof player.initial_chips !== 'number' || isNaN(player.initial_chips) || player.initial_chips < 0) {
            console.warn(`[VALIDATION] Fixing invalid initial_chips for ${player.name}:`, player.initial_chips);
            player.initial_chips = 0;
        }
        
        if (typeof player.current_chips !== 'number' || isNaN(player.current_chips) || player.current_chips < 0) {
            console.warn(`[VALIDATION] Fixing invalid current_chips for ${player.name}:`, player.current_chips);
            player.current_chips = Math.max(0, player.initial_chips);
        }
        
        // Fix missing or invalid ID
        if (!player.id || typeof player.id !== 'number') {
            console.warn(`[VALIDATION] Fixing invalid player ID for ${player.name}:`, player.id);
            player.id = Date.now() + index;
        }
        
        // Ensure required properties exist
        player.active = player.active !== false;
        player.joinedAt = player.joinedAt || Date.now();
        
        validPlayers.push(player);
    });
    
    // Check for duplicate IDs and fix them
    const idCounts = {};
    validPlayers.forEach(player => {
        idCounts[player.id] = (idCounts[player.id] || 0) + 1;
    });
    
    const duplicateIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);
    if (duplicateIds.length > 0) {
        console.warn('[VALIDATION] Found duplicate player IDs, fixing...', duplicateIds);
        validPlayers.forEach((player, index) => {
            if (duplicateIds.includes(player.id.toString())) {
                player.id = Date.now() + index + Math.random() * 1000;
                console.log(`[VALIDATION] Assigned new ID ${player.id} to ${player.name}`);
            }
        });
    }
    
    // Update the state if any changes were made
    if (cleanupCount > 0 || duplicateIds.length > 0) {
        console.log(`[VALIDATION] Cleaned up player state. Removed: ${cleanupCount}, Fixed IDs: ${duplicateIds.length}`);
        PokerApp.state.players = validPlayers;
        
        // Save the cleaned state
        saveState();
        
        // Update UI to reflect changes
        updatePlayerList();
        updateEmptyState();
    } else {
        console.log('[VALIDATION] Player state is clean');
    }
    
    return validPlayers.length;
}

// Run validation periodically and when needed
function setupPlayerStateValidation() {
    // Run validation every 30 seconds
    setInterval(validateAndCleanPlayerState, 30000);
    
    // Run validation when visibility changes (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(validateAndCleanPlayerState, 1000);
        }
    });
}

// Animation for new player joining OR chip updates
function animateNewPlayer(playerId, isUpdate = false) { // Added isUpdate parameter
    const playerRow = document.querySelector(`tr[data-player-id="${playerId}"]`);
    if (!playerRow) {
        console.log('[ANIMATION] Player row not found for animation:', playerId);
        return;
    }
    
    const animationClass = isUpdate ? 'player-chips-updated' : 'player-added';
    console.log(`[ANIMATION] Animating ${isUpdate ? 'chip update' : 'new player'}: ${playerId} using class ${animationClass}`);
    
    // Play appropriate sound
    if (isUpdate) {
        SoundSystem.playChipSound(); // Play chip sound for updates
            } else {
        SoundSystem.playPopSound(800); // Play pop sound for new players
    }
    
    // First make sure any old animation classes are removed
    playerRow.classList.remove('player-added', 'player-chips-updated');
    
    // Force reflow
    void playerRow.offsetWidth;
    
    // Add the appropriate animation class
    playerRow.classList.add(animationClass);
    
    // Remove the class after animation completes
    playerRow.addEventListener('animationend', () => {
        playerRow.classList.remove(animationClass);
    }, { once: true });
}

// Animation for adding chips to existing player -- REMOVING THIS
// function animateChipAddition(playerId) { ... }

// Create flying chips animation -- REMOVING THIS
// function createFlyingChips(target) { ... }

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
    // Call initialize directly - it will handle loading state internally
    initialize(); 
    // Sound system init and resume listener remain here
    SoundSystem.init();
    // The AudioContext is now primarily resumed on-demand by SoundSystem._ensureAudioContextRunning()
});

// Refactored Initialize function
function initialize() {
    console.log('Initializing poker app...');
    if (window.appInitialized) {
        console.log('[INIT] App already initialized, skipping');
        return;
    }
    window.appInitialized = true;

    console.log('[INIT] Attempting to load saved state first...');
    const savedStateResult = loadSavedState(); // Try loading state
    console.log('[INIT] loadSavedState result:', savedStateResult);

    if (savedStateResult) {
        // State was successfully loaded by loadSavedState()
        console.log('[INIT] Saved state loaded successfully. Setting up based on loaded state.');
        // The loadSavedState function already called setTheme, updateUIFromState,
        // and potentially setupGameStateListener if sessionId was present.
        // We just need to ensure event listeners and mobile compatibility are set up.
        try {
             console.log('[INIT] Setting up event listeners (after load)...');
             setupEventListeners();
             console.log('[INIT] Setting up mobile compatibility (after load)...');
             setupMobileCompatibility();
             console.log('[INIT] Theme-specific features setup (after load)...');
             initializeThemeSpecificFeatures(PokerApp.state.theme || 'Royal');
             console.log('[INIT] Initialization from saved state complete.');
        } catch (error) {
            console.error('[INIT_ERROR] Error during setup after loading saved state:', error);
            // If setup fails even after loading state, maybe fallback to clean init?
            // For now, just log.
        }

    } else {
        // No valid saved state found, proceed with default initialization
        console.log('[INIT] No saved state found or load failed. Proceeding with default initialization.');

        // Apply default theme explicitly before initializeApp
        setTheme('Royal');

        // Now, initialize Firebase and the core app logic
        ensureFirebaseInitialized()
            .then(() => {
                initializeApp(true); // Firebase available
                // Set up Firebase-specific listeners (like .info/connected)
                 if (window.database) { // Check if database is available
                     window.database.ref('.info/connected').on('value', (snap) => {
                         if (!snap.val()) {
                             console.log('[FIREBASE] Connection lost, waiting for reconnect...');
                             PokerApp.UI.showToast('Connection lost. Reconnecting...', 'error');
                         } else {
                              // Optional: Add a log or toast when reconnected
                              console.log('[FIREBASE] Reconnected.');
                         }
                     });
                     // Setup test connection function
                     window.testFirebaseConnection = function() { 
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
                      }; // <-- Fixed: Added semicolon
                     window.testConnection = window.testFirebaseConnection;
                 } else {
                     console.warn('[FIREBASE] Database reference not available for setting up connection listener or test function.');
                 }
            })
            .catch(error => {
                initializeApp(false); // Firebase unavailable
                PokerApp.UI.showToast('Offline mode - some features unavailable', 'error');
            });

         // Initialize theme-specific features for default theme
         initializeThemeSpecificFeatures('Royal');
         console.log('[INIT] Default initialization complete.');
    } // <-- End of main if/else (savedStateResult)

    // --- MOVED THEME SETUP HERE --- 
    // Setup theme swatches (runs regardless of loaded state)
    console.log('[INIT] Setting up theme swatches...');
    const themeSwatchesContainer = document.getElementById('theme-swatches');
    if (themeSwatchesContainer) {
         // Clear any existing swatches first
         themeSwatchesContainer.innerHTML = ''; 
         Object.entries(availableThemes).forEach(([themeName, themeData]) => {
             const swatch = document.createElement('div');
             swatch.className = 'theme-swatch';
             swatch.dataset.themeName = themeName;
             swatch.style.setProperty('--swatch-main-color', themeData.mainColor);
             swatch.style.setProperty('--swatch-secondary-color', themeData.secondaryColor);
             swatch.title = themeData.name;
             if (themeName === 'RainbowLight') {
                  swatch.style.border = '2px solid #e2e8f0';
             }
             swatch.addEventListener('click', () => {
                  PokerApp.UI.triggerAnimation(swatch, 'animate-subtle-pop'); // Add animation to the clicked swatch
                  if (typeof setTheme === 'function') {
                       setTheme(themeName);
                       document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
                       swatch.classList.add('active');
                  }
             });
             // Set active state based on CURRENT theme (loaded or default)
             if ((PokerApp.state.theme || 'Royal') === themeName) { 
                  swatch.classList.add('active');
             }
             themeSwatchesContainer.appendChild(swatch);
         });
         console.log('[INIT] Theme swatches setup complete.');
    } else {
        console.warn('[INIT] Theme swatches container not found.');
    }
    // Setup random theme button (runs regardless of loaded state)
    console.log('[INIT] Setting up random theme button...');
     const randomThemeBtn = document.getElementById('random-theme');
     if (randomThemeBtn) {
         // Remove potential old listener before adding new one
         const newRandomBtn = randomThemeBtn.cloneNode(true);
         randomThemeBtn.parentNode.replaceChild(newRandomBtn, randomThemeBtn);
         newRandomBtn.addEventListener('click', () => {
             PokerApp.UI.triggerAnimation(newRandomBtn, 'animate-subtle-pop'); // Add animation to random theme button
             const themeNames = Object.keys(availableThemes);
             let randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
             // Ensure a different theme is chosen if current one is selected randomly
             while (randomThemeName === PokerApp.state.currentTheme) {
                 randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
             }
             setTheme(randomThemeName);
             document.querySelectorAll('.theme-swatch').forEach(swatch => {
                  swatch.classList.toggle('active', swatch.dataset.themeName === randomThemeName);
             });
             newRandomBtn.style.transform = 'rotate(360deg)';
             setTimeout(() => { newRandomBtn.style.transform = ''; }, 300);
         });
         console.log('[INIT] Random theme button setup complete.');
     } else {
        console.warn('[INIT] Random theme button not found.');
     }
     // --- END OF MOVED THEME SETUP --- 

     // This should only run once, regardless of loaded state or not
     console.log('[INIT] Finalizing initialization (logo, etc)...');
     initializeLogoAnimation();
}

// Helper function to handle lastPlayer updates
function handleLastPlayerUpdate(lastPlayer) {
    // ... rest of file ...
}

// Logo animation
const logo = document.querySelector('.header-logo');
if (logo) {
    logo.addEventListener('mousemove', (e) => {
        const rect = logo.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        logo.style.setProperty('--x', `${x}%`);
        logo.style.setProperty('--y', `${y}%`);
    });

    logo.addEventListener('mouseleave', () => {
        logo.style.setProperty('--x', '50%');
        logo.style.setProperty('--y', '50%');
    });
}

// Initialize logo animation
function initializeLogoAnimation() {
    const logo = document.querySelector('.header-logo');
    if (!logo) {
        console.log('[LOGO] Logo element not found');
        return;
    }

    console.log('[LOGO] Initializing logo animation');

    // Remove any existing listeners
    const newLogo = logo.cloneNode(true);
    logo.parentNode.replaceChild(newLogo, logo);

    // Set initial position for the glow effect
    newLogo.style.setProperty('--x', '50%');
    newLogo.style.setProperty('--y', '50%');

    // Add mousemove listener with throttling
    let lastUpdate = 0;
    const throttleDelay = 1000 / 60; // 60fps

    newLogo.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastUpdate > throttleDelay) {
            const rect = newLogo.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            newLogo.style.setProperty('--x', `${x}%`);
            newLogo.style.setProperty('--y', `${y}%`);
            lastUpdate = now;
        }
    });

    // Add mouseleave listener to reset position
    newLogo.addEventListener('mouseleave', () => {
        newLogo.style.setProperty('--x', '50%');
        newLogo.style.setProperty('--y', '50%');
    });

    // Add mouseenter listener to ensure effects are visible
    newLogo.addEventListener('mouseenter', () => {
        newLogo.style.setProperty('--x', '50%');
        newLogo.style.setProperty('--y', '50%');
    });

    console.log('[LOGO] Logo animation initialized');
}

// Call logo initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] Initializing logo animation on DOMContentLoaded');
    initializeLogoAnimation();
});

// Central theme definitions (REORDERED - Royal First)
const availableThemes = {
    'Royal': { name: 'Royal', mainColor: '#4169E1', secondaryColor: '#1E90FF' },
    'Classic': { name: 'Classic', mainColor: '#2E8B57', secondaryColor: '#3CB371' },
    'Purple': { name: 'Purple', mainColor: '#9370DB', secondaryColor: '#8A2BE2' },
    'Midnight': { name: 'Midnight', mainColor: '#2F4F4F', secondaryColor: '#696969' },
    'RainbowLight': { name: 'Rainbow Light', mainColor: '#f8fafc', secondaryColor: '#e0f2fe' }, // Use white/light blue
    'Banana Bonanza': { name: 'Banana Bonanza', mainColor: '#4A4A4A', secondaryColor: '#FCEC52' } // Renamed from BananaBlake
};

// New function to handle chip update logic and animation
function handleChipUpdate(playerId, newChips, rowElement) {
    const targetPlayer = PokerApp.state.players.find(p => p.id === playerId);
    if (targetPlayer) {
        targetPlayer.current_chips = newChips;
        console.log(`[CHIPS] Player ${targetPlayer.name} (ID: ${targetPlayer.id}) chips updated to: ${newChips}`);
        saveState();
        updateActiveSessionPlayers(); // Update Firebase if connected

        if (rowElement) {
            PokerApp.UI.triggerAnimation(rowElement, 'quickHighlight');
        } else {
            console.warn('[CHIPS] Row element not provided for animation for player ID:', playerId);
        }
    } else {
        console.warn('[CHIPS] Target player not found for ID:', playerId);
    }
}

// New functions for BananaBlake theme animation
function startBananaAnimation() {
    let container = document.getElementById('banana-float-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'banana-float-container';
        document.body.appendChild(container);
    }
    container.innerHTML = ''; // Clear previous bananas

    const numBananas = 20; // Number of bananas
    for (let i = 0; i < numBananas; i++) {
        const banana = document.createElement('div');
        banana.className = 'floating-banana';
        
        // Random horizontal start position
        banana.style.left = `${Math.random() * 100}vw`;
        
        // Random animation duration and delay for variety
        banana.style.animationDuration = `${Math.random() * 8 + 7}s`; // Duration between 7s and 15s
        banana.style.animationDelay = `${Math.random() * 10}s`;       // Delay up to 10s
        
        // Set CSS custom property for scale, to be used by the animation
        const randomScale = Math.random() * 0.5 + 0.6; // e.g. 0.6 to 1.1
        banana.style.setProperty('--banana-scale', randomScale);
        
        // Apply varied initial transformations for different orientations
        const randomZRotation = Math.random() * 90 - 45; // -45 to 45 degrees
        const randomSkewX = Math.random() * 30 - 15;   // -15 to 15 degrees skew
        const horizontalFlip = Math.random() < 0.5 ? 'scaleX(-1)' : 'scaleX(1)'; // 50% chance to flip

        banana.style.transform = `${horizontalFlip} rotate(${randomZRotation}deg) skewX(${randomSkewX}deg)`;

        container.appendChild(banana);
    }

    return () => { // Return a stop function
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        window.stopBananaAnimation = null;
    };
}

// New function to animate the banana boat in the header randomly
function startRandomBananaBoatAnimation() {
    const boat = document.querySelector('.banana-boat-header-graphic');
    if (!boat) {
        console.warn('[BananaBoat] Header boat element not found for animation.');
        return () => {}; // Return a no-op stop function
    }

    let animationInterval = null;

    const animateBoat = () => {
        // Range for random rotation (e.g., -5 to 5 degrees)
        const randomRotation = Math.random() * 10 - 5;
        // Range for random horizontal translation (e.g., -40% to 40% of boat width, relative to its centered position)
        // The boat is 130px wide. Let's allow it to move, say, up to 30% of viewport width L/R from center.
        // Max left: boat's right edge is at 10% vw. Max right: boat's left edge is at 90% vw.
        // Initial boat center is 50% vw. Boat width is ~130px.
        // Let's try translating it relative to its current centered position by a random pixel value.
        // A wider range, e.g., -150px to 150px from its CSS-defined centered position.
        const randomTranslateX = Math.random() * 300 - 150; // Boat moves -150px to +150px horizontally

        // The boat is already centered by transform: translateX(-50%) and left: 50% in CSS.
        // So, this new randomTranslateX will be *in addition* to that centering.
        boat.style.transform = `translateX(calc(-50% + ${randomTranslateX}px)) rotate(${randomRotation}deg)`;
    };

    // Initial animation call
    animateBoat(); 

    // Set interval to change animation periodically
    // The CSS transition is 2s, so interval should be longer to allow animation to finish
    animationInterval = setInterval(animateBoat, 3000 + Math.random() * 2000); // Change every 3-5 seconds

    // Return a function to stop the animation
    return () => {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
            console.log('[BananaBoat] Stopped header boat animation.');
        }
        // Optionally reset boat transform to a default or initial state
        // boat.style.transform = 'translateX(0px) rotate(0deg)'; 
    };
}