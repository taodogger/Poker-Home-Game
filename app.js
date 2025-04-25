// Add sound system at the top of the file
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

// Initialize sound system when the app starts
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] DOMContentLoaded triggered');
    // Call initialize directly - it will handle loading state internally
    initialize(); 
    // Sound system init and resume listener remain here
    SoundSystem.init();
    document.body.addEventListener('click', () => { // Resume context listener
        if (SoundSystem.audioContext && SoundSystem.audioContext.state === 'suspended') {
            SoundSystem.audioContext.resume().then(() => {
                 console.log('[SOUND] AudioContext resumed successfully after user interaction.');
            }).catch(e => console.error('[SOUND] Error resuming AudioContext:', e));
        }
    }, { once: true });
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
            
            // DO NOT Reset application state here - state should only be reset explicitly
            /*
            PokerApp.state.sessionId = null;
            PokerApp.state.gameName = null;
            PokerApp.state.lobbyActive = false;
            */
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
        removeBtn.title = 'Remove Player'; // Add tooltip
        
        const removeIcon = document.createElement('span');
        removeIcon.className = 'button-icon';
        removeIcon.textContent = '×'; // Keep simple remove icon
        
        removeBtn.appendChild(removeIcon);
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
    // Calculate total money directly using current ratio
    const currentChipRatio = PokerApp.state.chipRatio || 1.0;
    const totalMoneyValue = totalCurrentChips * currentChipRatio;
    totalsCurrentCell.innerHTML = `<strong>${totalCurrentChips}</strong> <span class="total-money-amount">($${totalMoneyValue.toFixed(2)})</span>`;
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
        existingPlayer.current_chips += parseInt(chips);
        existingPlayer.initial_chips += parseInt(chips);
        
        // Update UI first
        updatePlayerList();
        updateEmptyState();
        
        // Then trigger animation after a short delay to ensure DOM is updated
        setTimeout(() => {
            animateNewPlayer(existingPlayer.id, true); // Call with isUpdate = true
            PokerApp.UI.showToast(`Added ${chips} chips to ${name} (now has ${existingPlayer.current_chips})`, 'success');
        }, 50);
        
        // Save state and update Firebase
        saveState();
        if (PokerApp.state.sessionId) {
            updatePlayersInFirebase();
        }
        
        return true;
    }

    // Create a new player
    const player = {
        id: PokerApp.state.nextPlayerId++,
        name: name,
        initial_chips: parseInt(chips),
        current_chips: parseInt(chips)
        // No buyinAmount needed here
        // No rebuys needed here for this simpler approach yet
    };

    // Add to state
    PokerApp.state.players.push(player);
    
    // Update UI first
    updatePlayerList();
    updateEmptyState();
    
    // Then trigger animation after a short delay to ensure DOM is updated
    setTimeout(() => {
        animateNewPlayer(player.id); // Default is isUpdate = false
        PokerApp.UI.showToast(`Added ${name} with ${chips} chips`, 'success');
    }, 50);
    
    // Save state and update Firebase
    saveState();
    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
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
            if (!name || isNaN(chips) || chips <= 0) {
                PokerApp.UI.showToast('Please enter a valid name and chip amount', 'error');
                return;
            }

            addPlayer(name, chips);

            // Reset form fields
            nameInput.value = '';
            chipsInput.value = '';
            nameInput.focus(); // Focus name input for next player
        });
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
            }
            
            // Play Kaching sound
            if (SoundSystem && typeof SoundSystem.playKachingSound === 'function') {
                SoundSystem.playKachingSound();
            }
            
            PokerApp.UI.showToast('Chip ratio updated', 'success');
            
            // Save state
            saveState();
            
            // Update Firebase if connected
            if (PokerApp.state.sessionId) {
                updateGameStateInFirebase({ chipRatio: PokerApp.state.chipRatio });
            }
        });
    }
    
    // Set up Payout Calculator Button
    const calculateButton = document.getElementById('calculate-payouts');
    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            // Play Kaching sound
            if (SoundSystem && typeof SoundSystem.playKachingSound === 'function') {
                SoundSystem.playKachingSound();
            }
            calculatePayouts();
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
             const themeNames = Object.keys(availableThemes);
             const availableChoices = themeNames.filter(name => name !== PokerApp.state.currentTheme);
             const randomIndex = Math.floor(Math.random() * availableChoices.length);
             const randomTheme = availableChoices[randomIndex];
             setTheme(randomTheme);
             document.querySelectorAll('.theme-swatch').forEach(swatch => {
                  swatch.classList.toggle('active', swatch.dataset.themeName === randomTheme);
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

    if (logoColors.length === 0) return; // Don't run if no colors

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

    if (themeName === 'RainbowLight') {
        // Start new animations and store the stop functions
        window.stopLogoAnimation = animateLogoLetters();
        window.stopHeaderAnimation = animateElementColorCycle('.card-header h2');
        window.stopResetBtnAnimation = animateElementColorCycle('#reset-btn');
    } else {
        // Ensure styles are reset if not RainbowLight
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
                
                // Set up players listener with animation handling
                database.ref(`games/${gameId}/state/players`).on('child_added', snapshot => {
                    const playerData = snapshot.val();
                    if (!playerData) return;
                    
                    console.log('[FIREBASE] New player data received:', playerData);
                    
                    // Check if this is a new player
                    const existingPlayer = PokerApp.state.players.find(p => 
                        p.id === playerData.id || 
                        (p.name && playerData.name && p.name.toLowerCase() === playerData.name.toLowerCase())
                    );
                    
                    if (!existingPlayer) {
                        // Add new player to state
                        PokerApp.state.players.push(playerData);
                        
                        // Update UI and trigger animation
                        updatePlayerList();
                        updateEmptyState();
                        
                        // Use requestAnimationFrame for smooth animation
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                animateNewPlayer(playerData.id);
                                PokerApp.UI.showToast(`${playerData.name} joined with ${playerData.initial_chips} chips`, 'success');
                            }, 100);
                        });
                    }
                });
                
                // Listen for player updates (rebuys)
                database.ref(`games/${gameId}/state/players`).on('child_changed', snapshot => {
                    const updatedPlayer = snapshot.val();
                    if (!updatedPlayer) return;
                    
                    const existingPlayer = PokerApp.state.players.find(p => p.id === updatedPlayer.id);
                    if (existingPlayer && updatedPlayer.initial_chips > existingPlayer.initial_chips) {
                        const chipDiff = updatedPlayer.initial_chips - existingPlayer.initial_chips;
                        existingPlayer.initial_chips = updatedPlayer.initial_chips;
                        existingPlayer.current_chips += chipDiff;
                        
                        // Update UI and trigger animation
                        updatePlayerList();
                        
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                animateChipAddition(existingPlayer.id);
                                PokerApp.UI.showToast(`${existingPlayer.name} added ${chipDiff} chips!`, 'success');
                            }, 100);
                        });
                    }
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
            width: 220, // Increase size
            height: 220, // Increase size
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
                        width: 220, // Increase size
                        height: 220, // Increase size
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

    // Play payout sound when calculating
    SoundSystem.playPayoutSound();

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
    
    // Play remove sound before removing the player
    SoundSystem.playRemoveSound();
    
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
    
    // Store previous amount for comparison if needed
    const previousAmount = player.current_chips;
    
    // Update player's chips
    player.current_chips = parsedAmount;
    
    // Update UI with recalculated totals
    updatePlayerList();
    
    // Trigger animation if value changed
    if (parsedAmount !== previousAmount) {
        setTimeout(() => {
            animateNewPlayer(playerId, true); // Call with isUpdate = true
        }, 50); // Small delay after UI update
    }
    
    // Save state locally and to Firebase if needed
    saveState();
    if (PokerApp.state.sessionId) {
        updatePlayersInFirebase();
    }
}

// Add to global scope
window.updatePlayerChips = updatePlayerChips;

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
    document.body.addEventListener('click', () => { // Resume context listener
        if (SoundSystem.audioContext && SoundSystem.audioContext.state === 'suspended') {
            SoundSystem.audioContext.resume().then(() => {
                 console.log('[SOUND] AudioContext resumed successfully after user interaction.');
            }).catch(e => console.error('[SOUND] Error resuming AudioContext:', e));
        }
    }, { once: true });
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
             const themeNames = Object.keys(availableThemes);
             const availableChoices = themeNames.filter(name => name !== PokerApp.state.currentTheme);
             const randomIndex = Math.floor(Math.random() * availableChoices.length);
             const randomTheme = availableChoices[randomIndex];
             setTheme(randomTheme);
             document.querySelectorAll('.theme-swatch').forEach(swatch => {
                  swatch.classList.toggle('active', swatch.dataset.themeName === randomTheme);
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
    'RainbowLight': { name: 'Rainbow Light', mainColor: '#f8fafc', secondaryColor: '#e0f2fe' } // Use white/light blue
};