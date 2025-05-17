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
    showToast('Could not connect to the game database. Please try again later.', 'error');
}

// Get game ID and name from URL
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId') || urlParams.get('game-id');
const gameName = urlParams.get('game-name');

console.log('[BUY-IN] Starting buy-in page with gameId:', gameId);
console.log('[BUY-IN] Game name from URL:', gameName);

// Theme configuration
const themes = {
    'Classic Red': {
        '--main-color': '#ff4757',
        '--main-color-rgb': '255, 71, 87',
        '--secondary-color': '#ff6b81',
        '--secondary-color-rgb': '255, 107, 129',
        '--body-background': 'linear-gradient(135deg, #2d0000, #400000)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff4757, #ffA0AA)'
    },
    'Deep Lilac': {
        '--main-color': '#9370db',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#aa8ff0',
        '--secondary-color-rgb': '170, 143, 240',
        '--body-background': 'linear-gradient(135deg, #151020, #251830)',
        '--vibrant-gradient': 'linear-gradient(45deg, #9370db, #c8baff)'
    },
    'Ocean Breeze': {
        '--main-color': '#38D2D2', // Bright Teal
        '--main-color-rgb': '56, 210, 210',
        '--secondary-color': '#50B9B9', // Slightly desaturated, lighter teal
        '--secondary-color-rgb': '80, 185, 185',
        '--body-background': 'linear-gradient(135deg, #0A1D24, #102A33)', // Darker, desaturated teal/blue-grey
        '--vibrant-gradient': 'linear-gradient(45deg, #38D2D2, #A0E0E0)' // Bright Teal to a much lighter teal
    },
    'Sunset Glow': {
        '--main-color': '#FF8C42', // Vibrant Orange
        '--main-color-rgb': '255, 140, 66',
        '--secondary-color': '#FFA757', // Lighter orange
        '--secondary-color-rgb': '255, 167, 87',
        '--body-background': 'linear-gradient(135deg, #3D1E00, #572A00)', // Darker, richer brown
        '--vibrant-gradient': 'linear-gradient(45deg, #FF8C42, #FFD1AA)' // Vibrant Orange to pale peach
    },
    'Minty Fresh': {
        '--main-color': '#50C878', // Fresh Mint Green
        '--main-color-rgb': '80, 200, 120',
        '--secondary-color': '#70D49A', // Lighter Mint
        '--secondary-color-rgb': '112, 212, 154',
        '--body-background': 'linear-gradient(135deg, #0A2A0A, #144014)', // Much darker green
        '--vibrant-gradient': 'linear-gradient(45deg, #50C878, #A0E0B8)' // Mint to very light mint/almost white
    },
    'Electric Violet': {
        '--main-color': '#BE00FE', // Bright Violet
        '--main-color-rgb': '190, 0, 254',
        '--secondary-color': '#D355FF', // Lighter, slightly desaturated Violet
        '--secondary-color-rgb': '211, 85, 255',
        '--body-background': 'linear-gradient(135deg, #200030, #300045)', // Much darker purple
        '--vibrant-gradient': 'linear-gradient(45deg, #BE00FE, #E0B0FF)' // Violet to very light lavender
    }
};

// Set theme function
function setTheme(themeName) {
    // Ensure themeName is valid, default to Classic if not
    const theme = themes[themeName] || themes['Classic Red']; 
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
            showToast('Error fetching game ratio. Using default.', 'error');
            chipRatio = 1.0;
            updateChipPreview();
        });
    } catch (error) {
        console.error('[FIREBASE] Error setting up chip ratio listener:', error);
        showToast('Error fetching game ratio. Using default.', 'error');
        chipRatio = 1.0;
        updateChipPreview();
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

    // Initial chip preview update - this will run once with default/empty values
    // The input listener, once working, will handle subsequent updates from typing.
    updateChipPreview(); 

    // Load game data and set up form
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
                showToast('Error fetching game ratio. Using default.', 'error');
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

                    // --- NEW: Event Delegation on the newForm for #buy-in-amount --- 
                    console.log('[BUY-IN] Attaching delegated input listener to newForm');
                    newForm.addEventListener('input', function(event) {
                        if (event.target && event.target.id === 'buy-in-amount') {
                            console.log('<<<<< DELEGATED INPUT EVENT FIRED! Value: ' + event.target.value + ' >>>>>');
                            updateChipPreview();
                        }
                    });
                    // --- END NEW Event Delegation ---

                    newForm.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const submitButton = newForm.querySelector('button[type="submit"]'); // More specific selector
                        if (submitButton) {
                            submitButton.disabled = true;
                            submitButton.classList.add('loading');
                        }
                        
                        const playerName = newForm.querySelector('#player-name')?.value.trim(); // Query within newForm
                        const buyInAmountValue = newForm.querySelector('#buy-in-amount')?.value; // Query within newForm
                        const buyInAmount = parseFloat(buyInAmountValue) || 0;
                        
                        if (!playerName) {
                            showToast('Please enter your name', 'error');
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.classList.remove('loading');
                            }
                            return;
                        }
                        
                        if (isNaN(buyInAmount) || buyInAmount <= 0) {
                            showToast('Please enter a valid buy-in amount', 'error');
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.classList.remove('loading');
                            }
                            return;
                        }
                        
                        const currentChipRatio = chipRatio; 
                        const chips = Math.floor(buyInAmount / currentChipRatio);
                        if (chips <= 0) {
                            showToast(`Buy-in amount too low for minimum chips (Ratio: $${currentChipRatio.toFixed(2)})`, 'error');
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.classList.remove('loading');
                            }
                            return;
                        }
                        
                        showToast('Processing buy-in...', 'info'); // Changed from updateStatus
                        
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

                            // Note: updateStatus already calls showToast, so this is fine.
                            // However, if the form is replaced on success, resetting button state here might not be seen.
                            // The primary reset is for error cases before form replacement.
                            if (submitButton) { // Ensure submitButton is still in scope and valid if needed after await
                                submitButton.disabled = false; 
                                submitButton.classList.remove('loading');
                            }
                        } catch (error) {
                            // Catch errors from transaction or pre-check
                            console.error('[BUY-IN] Error during buy-in process:', error);
                            showToast(error.message || 'An unexpected error occurred.', 'error');
                            if (submitButton) {
                                submitButton.disabled = false;
                                submitButton.classList.remove('loading');
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('[FIREBASE] Error fetching initial game data:', error);
                    showToast(error.message || 'Could not load game data.', 'error');
                });
        } catch (error) {
            console.error('[FIREBASE] Error setting up initial fetch:', error);
            showToast('Could not connect to the game. Please try again.', 'error');
        }
    } else {
        showToast('Invalid game link or missing database connection.', 'error');
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
    // --- BEGIN DEBUG LOGS ---
    const rawInputValue = buyInAmountInput.value;
    console.log(`[PREVIEW DEBUG] Raw input value: '${rawInputValue}' (Type: ${typeof rawInputValue})`);
    // --- END DEBUG LOGS ---
    const buyInAmount = parseFloat(rawInputValue) || 0;
    console.log(`[PREVIEW] Buy-in amount value (parsed): ${buyInAmount} (Type: ${typeof buyInAmount})`);
    
    const currentValidRatio = (typeof chipRatio === 'number' && chipRatio > 0) ? chipRatio : 1.0;
    // --- BEGIN DEBUG LOGS ---
    console.log(`[PREVIEW DEBUG] chipRatio (global) for calculation: ${chipRatio} (Type: ${typeof chipRatio})`);
    console.log(`[PREVIEW DEBUG] currentValidRatio for calculation: ${currentValidRatio} (Type: ${typeof currentValidRatio})`);
    // --- END DEBUG LOGS ---
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

// Function to show toast notifications
function showToast(message, type = 'info', duration = 4000) {
    const container = document.querySelector('.toast-container');
    if (!container) {
        console.error('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10); // Small delay to allow CSS to apply before transition

    // Auto-dismiss
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode === container) { // Check if still child before removing
                container.removeChild(toast);
            }
        }, 500); // Allow slide-out animation to complete
    }, duration);
}

// Update status display (now uses toasts)
function updateStatus(message, type = 'pending') { // maps to toast types
    let toastType = 'info'; // Default for pending or unknown
    if (type === 'success') {
        toastType = 'success';
    } else if (type === 'error') {
        toastType = 'error';
    } else if (type === 'pending') {
        toastType = 'info'; // Or a specific 'pending' style if you create one in CSS
        // For pending, you might want a longer duration or no auto-dismiss if it indicates an ongoing process
        // For now, we'll use 'info' with standard duration.
    }
    showToast(message, toastType);
}