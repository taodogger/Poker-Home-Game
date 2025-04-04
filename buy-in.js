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
    'Ocean': {
        '--main-color': '#2ed3ff',
        '--main-color-rgb': '46, 211, 255',
        '--secondary-color': '#1e90ff',
        '--secondary-color-rgb': '30, 144, 255',
        '--body-background': 'linear-gradient(135deg, #0a192f, #112240)',
        '--vibrant-gradient': 'linear-gradient(45deg, #2ed3ff, #1e90ff)'
    },
    'Forest': {
        '--main-color': '#2ed573',
        '--main-color-rgb': '46, 213, 115',
        '--secondary-color': '#7bed9f',
        '--secondary-color-rgb': '123, 237, 159',
        '--body-background': 'linear-gradient(135deg, #1a2f1a, #2d4a2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #2ed573, #7bed9f)'
    },
    'Sunset': {
        '--main-color': '#ffa502',
        '--main-color-rgb': '255, 165, 2',
        '--secondary-color': '#ff6b81',
        '--secondary-color-rgb': '255, 107, 129',
        '--body-background': 'linear-gradient(135deg, #2d1a1a, #4a2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ffa502, #ff6b81)'
    },
    'Fire': {
        '--main-color': '#ff6347',
        '--main-color-rgb': '255, 99, 71',
        '--secondary-color': '#ff4500',
        '--secondary-color-rgb': '255, 69, 0',
        '--body-background': 'linear-gradient(135deg, #2d1a1a, #4a2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff6347, #ff4500)'
    },
    'Purple': {
        '--main-color': '#9370db',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#8a2be2',
        '--secondary-color-rgb': '138, 43, 226',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #9370db, #8a2be2)'
    },
    'Neon': {
        '--main-color': '#00ffff',
        '--main-color-rgb': '0, 255, 255',
        '--secondary-color': '#00ced1',
        '--secondary-color-rgb': '0, 206, 209',
        '--body-background': 'linear-gradient(135deg, #0a1a2d, #1a2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #00ffff, #00ced1)'
    },
    'Rizzler': {
        '--main-color': '#ff00ff',
        '--main-color-rgb': '255, 0, 255',
        '--secondary-color': '#bf00ff',
        '--secondary-color-rgb': '191, 0, 255',
        '--body-background': 'linear-gradient(135deg, #2d1a2d, #4a2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff00ff, #bf00ff)'
    },
    'Doginme': {
        '--main-color': '#1e90ff',
        '--main-color-rgb': '30, 144, 255',
        '--secondary-color': '#4169e1',
        '--secondary-color-rgb': '65, 105, 225',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #1e90ff, #4169e1)'
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

                                // If the game state doesn't exist (edge case), abort
                                if (!currentState) {
                                    console.error('[BUY-IN] No current state found in transaction');
                                    return; // Abort transaction
                                }

                                // Ensure players is an array, converting from object if necessary
                                let currentPlayers = currentState.players || [];
                                if (!Array.isArray(currentPlayers)) {
                                    console.log('[BUY-IN] Converting players object to array');
                                    currentPlayers = Object.values(currentPlayers).filter(p => p != null); // Filter out null/removed players
                                }
                                console.log('[BUY-IN] Current players in transaction:', currentPlayers);

                                // Normalize the submitted name for comparison
                                const normalizedNewName = playerName.toLowerCase().trim();
                                // Find if player already exists (case-insensitive)
                                const existingPlayerIndex = currentPlayers.findIndex(p => p && p.name && p.name.toLowerCase().trim() === normalizedNewName);

                                let updatedPlayers = [...currentPlayers]; // Create a mutable copy
                                let nextId = currentState.nextPlayerId || (Math.max(...updatedPlayers.map(p => p?.id || 0), 0) + 1);
                                let playerForNotification; // Object to send in lastPlayer field

                                if (existingPlayerIndex !== -1) {
                                    // --- Player Exists: Handle Rebuy ---
                                    console.log(`[BUY-IN] Player '${playerName}' found at index ${existingPlayerIndex}. Handling rebuy.`);
                                    const existingPlayer = updatedPlayers[existingPlayerIndex];

                                    // Ensure chip values are valid numbers
                                    const currentInitial = parseInt(existingPlayer.initial_chips) || 0;
                                    const currentCurrent = parseInt(existingPlayer.current_chips) || 0;
                                    const addedChips = parseInt(chips) || 0;

                                    // Create a *new* object for the updated player to avoid modifying the original state directly
                                    const updatedPlayer = {
                                        ...existingPlayer,
                                        initial_chips: currentInitial + addedChips, // Add to initial for correct payout calculation later
                                        current_chips: currentCurrent + addedChips, // Add to current stack
                                        lastBuyIn: Date.now()
                                    };

                                    // Replace the old player object with the updated one in our mutable array
                                    updatedPlayers[existingPlayerIndex] = updatedPlayer;

                                    // Prepare notification object for the main app
                                    playerForNotification = {
                                        ...updatedPlayer,
                                        action: 'rebuy',
                                        addedChips: addedChips
                                    };
                                    buyInAction = 'rebought'; // Set flag for success message
                                    playerUpdateDetails = { name: updatedPlayer.name, chips: addedChips, totalChips: updatedPlayer.current_chips };
                                    console.log(`[BUY-IN] Updated player data:`, updatedPlayer);

                                } else {
                                    // --- New Player: Add to Game ---
                                    console.log(`[BUY-IN] New player '${playerName}'. Adding to game.`);
                                    const newPlayer = {
                                        id: nextId,
                                        name: playerName,
                                        initial_chips: chips,
                                        current_chips: chips,
                                        joinedAt: Date.now(),
                                        active: true // Assuming new players start active
                                    };
                                    updatedPlayers.push(newPlayer); // Add to our mutable array

                                    // Prepare notification object
                                    playerForNotification = {
                                        ...newPlayer,
                                        action: 'join'
                                    };
                                    nextId++; // Increment ID for the *next* potential new player
                                    buyInAction = 'joined'; // Set flag for success message
                                    playerUpdateDetails = { name: newPlayer.name, chips: newPlayer.initial_chips };
                                    console.log(`[BUY-IN] Added new player:`, newPlayer);
                                }

                                console.log('[BUY-IN] Final updated players list for state:', updatedPlayers);

                                // Construct the complete new state object to return for the transaction
                                const newState = {
                                    ...currentState, // Preserve other state properties
                                    players: updatedPlayers,
                                    nextPlayerId: nextId,
                                    lastUpdate: Date.now(),
                                    lastPlayer: playerForNotification // This triggers update in main app
                                };

                                console.log('[BUY-IN] Returning new state from transaction:', newState);
                                return newState; // Commit the changes

                            }, (error, committed, snapshot) => {
                                // This callback handles the result of the transaction attempt
                                if (error) {
                                    console.error('[BUY-IN] Transaction failed:', error);
                                    // Rethrow the error to be caught by the outer try/catch block
                                    throw new Error("Failed to update game state. Please try again. Error: " + error.message);
                                } else if (!committed) {
                                    console.log('[BUY-IN] Transaction not committed (likely aborted due to concurrent update or validation failure)');
                                    // This usually means the state changed between reading and writing (e.g., name taken)
                                    throw new Error('Could not process buy-in because the game state changed. Please try again.');
                                } else {
                                    console.log('[BUY-IN] Transaction completed successfully.');
                                    // Data saved successfully
                                }
                            });

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