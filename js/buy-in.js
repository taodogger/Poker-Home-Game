// Initialize Firebase database reference
let buyInDatabase;
try {
    if (window.database) {
        buyInDatabase = window.database;
        console.log('[FIREBASE] Using existing database reference from window.database');
    } else if (window.firebaseConfig) {
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        buyInDatabase = firebase.database();
        console.log('[FIREBASE] Created new database connection using window.firebaseConfig');
    } else {
        throw new Error('Firebase configuration not found');
    }
} catch (error) {
    console.error('[FIREBASE] Error initializing database:', error);
    showError('Could not connect to the game database. Please try again later.');
}

// Get game ID and name from URL
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId') || urlParams.get('game-id');
const gameName = urlParams.get('game-name');

console.log('[BUY-IN] Starting buy-in page with gameId:', gameId);
console.log('[BUY-IN] Game name from URL:', gameName);

// Theme configuration
const themes = {
    'Classic': {
        '--main-color': '#ff4757',
        '--main-color-rgb': '255, 71, 87',
        '--secondary-color': '#ff6b81',
        '--secondary-color-rgb': '255, 107, 129',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff4757, #ff6b81)'
    },
    'Purple': {
        '--main-color': '#9370db',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#8a2be2',
        '--secondary-color-rgb': '138, 43, 226',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #9370db, #8a2be2)'
    }
};

// Set theme function
function setTheme(themeName) {
    // Ensure themeName is valid, default to Classic if not
    const theme = themes[themeName] || themes['Classic']; 
    console.log(`[THEME] Applying theme: ${themeName}`); // Log which theme is being applied
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
}

// Update document title with game name if available
if (gameName) {
    document.title = `Join ${gameName} - Kapoker`;
}

// Get chip ratio from Firebase
let chipRatio = 1.0;
if (gameId && buyInDatabase) {
    console.log('[FIREBASE] Setting up chip ratio listener for game:', gameId);
    try {
        buyInDatabase.ref(`games/${gameId}/ratio`).on('value', (snapshot) => {
            const receivedRatio = snapshot.val();
            console.log('[FIREBASE] Received chip ratio:', receivedRatio, typeof receivedRatio);
            let isValidRatio = false;
            if (snapshot.exists()) {
                const parsedRatio = parseFloat(receivedRatio);
                if (typeof parsedRatio === 'number' && !isNaN(parsedRatio) && parsedRatio > 0) {
                    chipRatio = parsedRatio;
                    console.log(`[FIREBASE] Successfully parsed and set chipRatio: ${chipRatio}`);
                    isValidRatio = true;
                } else {
                    chipRatio = 1.0;
                    console.warn(`[FIREBASE] Invalid ratio received (${receivedRatio}). Using default 1.0`);
                }
            } else {
                console.log('[FIREBASE] No chip ratio found, using default of 1.0');
                chipRatio = 1.0;
            }
            
            const chipRatioElement = document.getElementById('chip-ratio');
            if(chipRatioElement) chipRatioElement.textContent = chipRatio.toFixed(2);
            
            console.log('[FIREBASE] Calling updateChipPreview after ratio update.');
            updateChipPreview();
        }, (error) => {
            console.error('[FIREBASE] Error in chip ratio listener:', error);
            showError('Error fetching game ratio. Using default.');
            chipRatio = 1.0;
            updateChipPreview();
        });
    } catch (error) {
        console.error('[FIREBASE] Error setting up chip ratio listener:', error);
        showError('Error fetching game ratio. Using default.');
        chipRatio = 1.0;
        updateChipPreview();
    }
}

// Show game name if available
if (gameName) {
    const gameNameElem = document.querySelector('h1');
    if (gameNameElem) {
        gameNameElem.textContent = `Join ${gameName}`;
    }
}

// --- DOM Content Loaded --- 
// Ensures the script runs after the HTML is fully parsed
document.addEventListener('DOMContentLoaded', () => {
    console.log('[BUY-IN] DOM fully loaded and parsed');

    // --- Apply Random Theme --- 
    const themeNames = Object.keys(themes);
    const randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
    setTheme(randomThemeName);

    // Update chip preview when buy-in amount changes
    const buyInAmountInput = document.getElementById('buy-in-amount');
    if (buyInAmountInput) {
        console.log('[BUY-IN] Attaching input listener to #buy-in-amount');
        buyInAmountInput.addEventListener('input', () => {
            console.log('[BUY-IN] Input event fired on #buy-in-amount');
            updateChipPreview();
        });
    } else {
        console.error('[BUY-IN] Could not find #buy-in-amount element to attach listener.');
    }

    // Initial chip preview update in case there's a default value or ratio is already known
    updateChipPreview();

    // Load game data and set up form (moved inside DOMContentLoaded)
    if (gameId && buyInDatabase) {
        console.log('[FIREBASE] Fetching game data for ID:', gameId);
        try {
            // Clean up any existing listeners first
            buyInDatabase.ref(`games/${gameId}`).off();
            buyInDatabase.ref(`games/${gameId}/state`).off();
            buyInDatabase.ref(`games/${gameId}/state/players`).off();
            buyInDatabase.ref(`games/${gameId}/state/theme`).off();
            buyInDatabase.ref(`games/${gameId}/ratio`).off(); // Ensure ratio listener is also cleaned initially

            // --- Set up Ratio Listener --- 
            console.log('[FIREBASE] Setting up chip ratio listener for game:', gameId);
            buyInDatabase.ref(`games/${gameId}/ratio`).on('value', (snapshot) => {
                const receivedRatio = snapshot.val();
                console.log('[FIREBASE] Received chip ratio:', receivedRatio, typeof receivedRatio);
                let isValidRatio = false;
                if (snapshot.exists()) {
                    const parsedRatio = parseFloat(receivedRatio);
                    if (typeof parsedRatio === 'number' && !isNaN(parsedRatio) && parsedRatio > 0) {
                        chipRatio = parsedRatio;
                        console.log(`[FIREBASE] Successfully parsed and set chipRatio: ${chipRatio}`);
                        isValidRatio = true;
                    } else {
                        chipRatio = 1.0;
                        console.warn(`[FIREBASE] Invalid ratio received (${receivedRatio}). Using default 1.0`);
                    }
                } else {
                    console.log('[FIREBASE] No chip ratio found, using default of 1.0');
                    chipRatio = 1.0;
                }
                
                const chipRatioElement = document.getElementById('chip-ratio');
                if(chipRatioElement) chipRatioElement.textContent = chipRatio.toFixed(2);
                
                console.log('[FIREBASE] Calling updateChipPreview after ratio update.');
                updateChipPreview();
            }, (error) => {
                console.error('[FIREBASE] Error in chip ratio listener:', error);
                showError('Error fetching game ratio. Using default.');
                chipRatio = 1.0;
                updateChipPreview();
            });

            // --- Fetch Initial Game Data --- 
            buyInDatabase.ref(`games/${gameId}`)
                .once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        console.error('[FIREBASE] Game not found in database');
                        throw new Error('Game not found. It may have been deleted or never existed.');
                    }
                    
                    const game = snapshot.val();
                    console.log('[FIREBASE] Retrieved game data:', game);
                    
                    if (!game || !game.active) {
                        console.error('[FIREBASE] Game not active:', game);
                        throw new Error('Game not found or no longer active');
                    }

                    // Show game info
                    const gameInfo = document.getElementById('game-info');
                    if (gameInfo) {
                        gameInfo.innerHTML = `
                            <h2>${game.name || 'Poker Game'}</h2>
                            <p>$<span id="chip-ratio-display">${(game.ratio || 1.0).toFixed(2)}</span> per chip</p>
                        `;
                         // Update the separate ratio display as well
                        const chipRatioDisplayElement = document.getElementById('chip-ratio');
                        if(chipRatioDisplayElement) chipRatioDisplayElement.textContent = (game.ratio || 1.0).toFixed(2);
                        console.log('[UI] Updated game info display');
                    }

                    // Update chip ratio (redundant if listener worked, but safe fallback)
                    const initialGameRatio = parseFloat(game.ratio);
                    if (typeof initialGameRatio === 'number' && !isNaN(initialGameRatio) && initialGameRatio > 0) {
                        chipRatio = initialGameRatio;
                        console.log(`[FIREBASE] Set chipRatio from initial fetch: ${chipRatio}`);
                    } else {
                        chipRatio = 1.0; // Fallback if initial fetch ratio is invalid
                        console.warn(`[FIREBASE] Invalid ratio from initial fetch (${game.ratio}). Using default 1.0`);
                    }
                    updateChipPreview();

                    // --- Handle Form Setup & Submission --- 
                    const form = document.getElementById('buy-in-form');
                    if (!form) {
                        console.error('[ERROR] Buy-in form not found');
                        return;
                    }

                    // Remove any existing listeners and create fresh form
                    const newForm = form.cloneNode(true);
                    form.parentNode.replaceChild(newForm, form);

                    // Set up form submission handler
                    newForm.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const submitButton = newForm.querySelector('button');
                        if (submitButton) submitButton.disabled = true;
                        
                        const playerName = document.getElementById('player-name')?.value.trim();
                        const buyInAmount = parseFloat(document.getElementById('buy-in-amount')?.value);
                        
                        if (!playerName) {
                            updateStatus('Please enter your name', 'error');
                            if (submitButton) submitButton.disabled = false;
                            return;
                        }
                        
                        if (isNaN(buyInAmount) || buyInAmount <= 0) {
                            updateStatus('Please enter a valid buy-in amount', 'error');
                            if (submitButton) submitButton.disabled = false;
                            return;
                        }
                        
                        // Use the potentially updated chipRatio
                        const currentChipRatio = chipRatio; 
                        const chips = Math.floor(buyInAmount / currentChipRatio);
                        if (chips <= 0) {
                            updateStatus(`Buy-in amount too low for minimum chips (Ratio: $${currentChipRatio.toFixed(2)})`, 'error');
                            if (submitButton) submitButton.disabled = false;
                            return;
                        }
                        
                        updateStatus('Processing buy-in...', 'pending');
                        
                        try {
                            // Re-check game status before transaction
                            const gameSnapshotCheck = await buyInDatabase.ref(`games/${gameId}`).once('value');
                            const gameDataCheck = gameSnapshotCheck.val();

                            if (!gameDataCheck || !gameDataCheck.active) {
                                throw new Error('Game is no longer active');
                            }

                            // Update game state using Firebase Transaction for atomic operation
                            let buyInAction = 'joined'; // Track if it was a join or rebuy
                            let playerUpdateDetails = {}; // Store details needed for the success message

                            await buyInDatabase.ref(`games/${gameId}/state`).transaction((currentState) => {
                                console.log('[BUY-IN] Transaction started with current state:', currentState);

                                // --- Robust State Initialization and Validation ---
                                if (!currentState) {
                                    console.warn('[BUY-IN] No current state found. Initializing default state.');
                                    currentState = {
                                        players: [],
                                        nextPlayerId: 1,
                                        lastUpdate: Date.now(),
                                        lastPlayer: null // Ensure field exists
                                    };
                                } else {
                                    // Ensure essential fields exist and have correct types if state exists
                                    currentState.players = currentState.players || [];
                                    if (!Array.isArray(currentState.players)) {
                                        console.warn('[BUY-IN] Converting players object to array');
                                        // Filter out potential null values if converting from object
                                        currentState.players = Object.values(currentState.players).filter(p => p != null);
                                    }
                                    // Ensure nextPlayerId is a number, calculate if missing
                                    if (typeof currentState.nextPlayerId !== 'number' || currentState.nextPlayerId <= 0) {
                                        console.warn('[BUY-IN] Recalculating nextPlayerId.');
                                        currentState.nextPlayerId = Math.max(0, ...currentState.players.map(p => p?.id || 0)) + 1;
                                    }
                                    // Ensure lastPlayer field exists
                                    if (!currentState.hasOwnProperty('lastPlayer')) {
                                        currentState.lastPlayer = null;
                                    }
                                    // Ensure lastUpdate exists
                                    currentState.lastUpdate = currentState.lastUpdate || Date.now();
                                }
                                // --- End State Initialization ---


                                // Now use the guaranteed-to-be-valid currentState
                                let currentPlayers = currentState.players; // Already guaranteed to be an array
                                console.log('[BUY-IN] Current players in transaction:', currentPlayers);

                                const normalizedNewName = playerName.toLowerCase().trim();
                                const existingPlayerIndex = currentPlayers.findIndex(p => p && p.name && p.name.toLowerCase().trim() === normalizedNewName);

                                let updatedPlayers = [...currentPlayers]; // Create a mutable copy
                                let nextId = currentState.nextPlayerId; // Use the validated/initialized ID
                                let playerForNotification = null; // Initialize

                                if (existingPlayerIndex !== -1) {
                                    // --- Player Exists: Handle Rebuy ---
                                    console.log(`[BUY-IN] Player '${playerName}' found at index ${existingPlayerIndex}. Handling rebuy.`);
                                    const existingPlayer = updatedPlayers[existingPlayerIndex];

                                    // Ensure chip values are valid numbers
                                    const currentInitial = parseInt(existingPlayer.initial_chips) || 0;
                                    const currentCurrent = parseInt(existingPlayer.current_chips) || 0;
                                    const addedChips = parseInt(chips) || 0;

                                    const updatedPlayer = {
                                        ...existingPlayer,
                                        initial_chips: currentInitial + addedChips,
                                        current_chips: currentCurrent + addedChips,
                                        lastBuyIn: Date.now()
                                    };
                                    updatedPlayers[existingPlayerIndex] = updatedPlayer;

                                    playerForNotification = { ...updatedPlayer, action: 'rebuy', addedChips: addedChips };
                                    buyInAction = 'rebought';
                                    playerUpdateDetails = { name: updatedPlayer.name, chips: addedChips, totalChips: updatedPlayer.current_chips };
                                    console.log(`[BUY-IN] Updated player data:`, updatedPlayer);

                                } else {
                                    // --- New Player: Add to Game ---
                                    console.log(`[BUY-IN] New player '${playerName}'. Adding to game.`);
                                    const newPlayer = {
                                        id: nextId, // Use current nextId
                                        name: playerName,
                                        initial_chips: chips,
                                        current_chips: chips,
                                        joinedAt: Date.now(),
                                        active: true
                                    };
                                    updatedPlayers.push(newPlayer);

                                    playerForNotification = { ...newPlayer, action: 'join' };
                                    nextId++; // Increment ID *only after* assigning it to the new player
                                    buyInAction = 'joined';
                                    playerUpdateDetails = { name: newPlayer.name, chips: newPlayer.initial_chips };
                                    console.log(`[BUY-IN] Added new player:`, newPlayer);
                                }

                                console.log('[BUY-IN] Final updated players list for state:', updatedPlayers);

                                // Construct the complete new state object explicitly
                                // Carry over any other top-level fields from the original currentState
                                // that weren't explicitly handled (if any exist).
                                const newState = {
                                    ...currentState, // Start with potentially other fields from original state
                                    players: updatedPlayers, // Overwrite with new players array
                                    nextPlayerId: nextId,    // Overwrite with new nextId
                                    lastUpdate: Date.now(),  // Set new update timestamp
                                    lastPlayer: playerForNotification // Set the player action details
                                };

                                console.log('[BUY-IN] Attempting to commit newState:', JSON.stringify(newState));
                                return newState; // Commit the changes

                            }, (error, committed, snapshot) => {
                                // This callback handles the result of the transaction attempt
                                if (error) {
                                    console.error('[BUY-IN] Transaction failed:', error);
                                    throw new Error("Failed to update game state. Please try again. Error: " + error.message);
                                } else if (!committed) {
                                    console.warn('[BUY-IN] Transaction not committed. Retries likely failed due to persistent concurrent updates or invalid state generation.');
                                    // Log the state we *tried* to commit for debugging
                                    // Note: We can't access 'newState' here directly, but the log before 'return' should show it.
                                    throw new Error('Could not process buy-in due to high contention or data conflict. Please try again shortly.');
                                } else {
                                    console.log('[BUY-IN] Transaction completed successfully.');
                                    // Data saved successfully
                                }
                            }); // End Transaction

                            // --- Transaction Successful: Show Confirmation ---
                            const container = document.querySelector('.container');
                            // Use the 'chips' variable calculated *before* the transaction for the success message
                            const purchasedChips = chips; 
                            if (container) {
                                let successMessageHTML = '';
                                if (buyInAction === 'joined') {
                                    successMessageHTML = `
                                        <h2>🎉 Welcome to ${gameDataCheck.name}!</h2>
                                        <p>You've successfully joined with ${purchasedChips} chips.</p>
                                    `;
                                } else { // 'rebought'
                                    successMessageHTML = `
                                        <h2>�� Chips Added!</h2>
                                        <p>Added ${purchasedChips} chips to ${playerUpdateDetails.name}.</p>
                                        <p>Your new total is ${playerUpdateDetails.totalChips} chips.</p>
                                    `;
                                }

                                container.innerHTML = `
                                    <div class="welcome-container">
                                        <div class="welcome-content">
                                            ${successMessageHTML}
                                            <p>The host will manage the game from here.</p>
                                            <p class="close-instruction">You can close this window now.</p>
                                        </div>
                                    </div>
                                `;
                            }

                            // --- Clean up Firebase listeners ---
                            console.log('[BUY-IN] Cleaning up Firebase listeners for game:', gameId);
                            buyInDatabase.ref(`games/${gameId}/ratio`).off(); // Turn off ratio listener specifically
                            buyInDatabase.ref(`games/${gameId}/state/theme`).off(); // Turn off theme listener
                            // Note: We don't need to turn off `games/${gameId}` or `games/${gameId}/state` generally
                            // if other listeners might still be attached elsewhere, but for buy-in page, it's safe.

                        } catch (error) {
                            // Catch errors from transaction or pre-check
                            console.error('[BUY-IN] Error during buy-in process:', error);
                            updateStatus(error.message || 'An unexpected error occurred.', 'error');
                            if (submitButton) submitButton.disabled = false; // Re-enable button on error
                        }
                    });
                })
                .catch(error => {
                    console.error('[FIREBASE] Error fetching initial game data:', error);
                    showError(error.message || 'Could not load game data.');
                });
        } catch (error) {
            console.error('[FIREBASE] Error setting up initial fetch:', error);
            showError('Could not connect to the game. Please try again.');
        }
    } else {
        showError('Invalid game link or missing database connection.');
    }
});

// Update chip preview calculation (now uses the global chipRatio)
function updateChipPreview() {
    // Add logs for debugging
    console.log(`[PREVIEW] updateChipPreview called. Current Ratio: ${chipRatio} (Type: ${typeof chipRatio})`);
    const buyInAmountInput = document.getElementById('buy-in-amount');
    if (!buyInAmountInput) {
        console.error('[PREVIEW] Buy-in amount input (#buy-in-amount) not found!');
        return;
    }
    const buyInAmount = parseFloat(buyInAmountInput.value) || 0;
    console.log(`[PREVIEW] Buy-in amount value: ${buyInAmount} (Type: ${typeof buyInAmount})`);
    
    // Ensure chipRatio is a positive number before calculating
    const currentValidRatio = (typeof chipRatio === 'number' && chipRatio > 0) ? chipRatio : 1.0;
    if (currentValidRatio !== chipRatio) {
        console.warn(`[PREVIEW] chipRatio was invalid (${chipRatio}). Using default 1.0 for calculation.`);
    }

    const chipAmount = Math.floor(buyInAmount / currentValidRatio);
    console.log(`[PREVIEW] Calculated chips: ${chipAmount} using ratio: ${currentValidRatio}`);

    const chipAmountElement = document.getElementById('chip-amount');
    if (chipAmountElement) {
        chipAmountElement.textContent = chipAmount;
        chipAmountElement.style.color = chipAmount > 0 ? 'var(--main-color)' : '#ff4757'; // Use theme color or red
        console.log('[PREVIEW] Updated chip amount display element.');
    } else {
        console.error('[PREVIEW] Chip amount element (#chip-amount) not found in DOM!');
    }
}

// Update status display
function updateStatus(message, type = 'pending') {
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
    }
}