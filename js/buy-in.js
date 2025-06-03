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
let currentPlayerName = null; // Variable to store the player's name after first buy-in
let isPayoutScreenVisible = false; // Flag to track if payout screen is active

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
    const themeNames = Object.keys(themes);
    const randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
    setTheme(randomThemeName);

    if (gameId && buyInDatabase) {
        buyInDatabase.ref(`games/${gameId}/payoutInfo`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const payoutInfo = snapshot.val();
                    if (payoutInfo.status === 'finalized' && payoutInfo.transactions) {
                        console.log('[BUY-IN_LOAD] Payouts ARE finalized on load.');
                        const storedPlayerName = localStorage.getItem('kapoker-lastPlayerName');
                        if (storedPlayerName) {
                            currentPlayerName = storedPlayerName; // Set it for displayPlayerPayouts
                            console.log(`[BUY-IN_LOAD] Found player ${currentPlayerName}, displaying payouts.`);
                            displayPlayerPayouts(payoutInfo.transactions);
                            return true; // Signal that payouts were handled
                        } else {
                            console.warn('[BUY-IN_LOAD] Payouts finalized, but no player name in localStorage. User needs to buy-in/restore first.');
                        }
                    }
                }
                return false; // Payouts not handled yet
            })
            .then(payoutsHandledOnLoad => {
                if (payoutsHandledOnLoad) {
                    console.log('[BUY-IN_LOAD] Payouts handled on initial load. Skipping further setup.');
                    return; // Critical: Stop if payouts were shown
                }
                
                // Payouts not handled on load, proceed with normal setup
                console.log('[BUY-IN_LOAD] Payouts not finalized or no player. Proceeding with standard UI setup.');
                setupStandardUI(); 
            })
            .catch(error => {
                console.error('[BUY-IN_LOAD] Error checking initial payout status:', error);
                setupStandardUI(); // Proceed with standard UI on error too
            });
    } else {
        // No gameId or DB, critical error for buy-in page functionality
        showToast('Game ID or database connection missing. Cannot initialize.', 'error');
        // Potentially hide all interactive elements or show a specific error message UI
        const mainContainer = document.querySelector('body > .container:not(.payout-container)');
        if (mainContainer) mainContainer.innerHTML = '<h1>Error: Game information unavailable.</h1>';
    }
});

function setupStandardUI() {
    console.log('[UI_SETUP] Starting standard UI setup (welcome/buy-in form).');
    let restoredPlayer = false;
    try {
        const storedGameId = localStorage.getItem('kapoker-lastGameId');
        const storedPlayerName = localStorage.getItem('kapoker-lastPlayerName');
        const gameNameForMessage = urlParams.get('game-name') || 'the game';

        if (storedGameId === gameId && storedPlayerName) {
            currentPlayerName = storedPlayerName;
            restoredPlayer = true;
            console.log(`[UI_SETUP] Restored session for player: ${currentPlayerName}`);
            // Display Welcome Message (Rebuy option)
            const initialForm = document.getElementById('buy-in-form');
            const gameInfoArea = document.getElementById('game-info');
            const mainTitle = document.querySelector('h1.buy-in-title');
            if(initialForm) initialForm.style.display = 'none';
            if(gameInfoArea) gameInfoArea.style.display = 'none';
            if(mainTitle) mainTitle.style.display = 'none';

            const welcomeMessageArea = document.getElementById('welcome-message-area');
            if (welcomeMessageArea) {
                welcomeMessageArea.innerHTML = `
                    <div class="welcome-content">
                        <h2>Welcome back, ${currentPlayerName}!</h2>
                        <p>You're in ${gameNameForMessage}.</p>
                        <p id="buy-in-status-message">The host is managing the game.</p>
                        <button id="rebuy-action-button" class="poker-button secondary-button">Rebuy for ${currentPlayerName}</button>
                        <p class="close-instruction" style="margin-top: 15px;">You can close this window if no action is needed.</p>
                    </div>
                `;
                welcomeMessageArea.style.display = '';
                attachWelcomeAreaButtonListeners();
            }
        } else {
            console.log('[UI_SETUP] No session to restore. Displaying initial buy-in form.');
            updateChipPreview(); // For initial buy-in form
        }
    } catch (lsError) {
        console.warn('[UI_SETUP] Error during session restoration:', lsError);
        updateChipPreview(); // Fallback for initial buy-in form
    }

    // Always set up listeners if payouts weren't displayed on load
    listenForRebuyAndPayoutStatus();
    
    // Setup for the initial buy-in form (if not a restored player shown the welcome message)
    // This was previously part of setupInitialFormAndListeners, now more targeted
    if (!restoredPlayer) {
        initializeBuyInFormFunctionality();
    }
    initializeRebuyFormFunctionality(); // Always init rebuy form logic in case it's needed later
}

// This function will now ONLY contain the logic for the main buy-in form submission and its related Firebase calls
function initializeBuyInFormFunctionality() {
    console.log('[BUY_IN_FORM] Initializing main buy-in form functionality.');

    if (!gameId || !buyInDatabase) {
        showToast('Game ID or database missing for buy-in form setup.', 'error');
        const form = document.getElementById('buy-in-form');
        if (form) form.style.display = 'none';
        return;
    }

    // --- Ratio Listener (scoped or ensure global one is active) ---
    // The global ratio listener at the top of the file should cover this.
    // We just need to ensure updateChipPreview() is called if ratio changes while form is visible.
    // updateChipPreview() is already called on input in the buy-in amount field.

    // --- Fetch Initial Game Data (for game name, initial ratio display if needed) ---
    buyInDatabase.ref(`games/${gameId}`)
        .once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                throw new Error('Game not found. It may have been deleted or never existed.');
            }
            const game = snapshot.val();
            if (!game || !game.active) {
                throw new Error('Game not found or no longer active');
            }

            // Update game info display (e.g., game name, ratio for the initial form view)
            const gameInfo = document.getElementById('game-info');
            if (gameInfo) {
                gameInfo.innerHTML = `
                    <h2>${game.name || 'Poker Game'}</h2>
                    <p>$<span id="chip-ratio-display">${(game.ratio || 1.0).toFixed(2)}</span> per chip</p>
                `;
                const chipRatioDisplayElement = document.getElementById('chip-ratio'); // General display
                if(chipRatioDisplayElement) chipRatioDisplayElement.textContent = (game.ratio || 1.0).toFixed(2);
            }
            // Ensure global chipRatio variable is also set from this initial fetch if it's more current
            const initialGameRatio = parseFloat(game.ratio);
            if (typeof initialGameRatio === 'number' && !isNaN(initialGameRatio) && initialGameRatio > 0) {
                chipRatio = initialGameRatio;
            }
            updateChipPreview(); // Update preview with potentially new ratio

            // --- Setup #buy-in-form --- 
            const form = document.getElementById('buy-in-form');
            if (!form) {
                console.error('[ERROR] Buy-in form not found for initialization.');
                return;
            }
            // Clone to remove old listeners and add new ones
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            newForm.addEventListener('input', function(event) {
                if (event.target && event.target.id === 'buy-in-amount') {
                    updateChipPreview();
                }
            });

            newForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const submitButton = newForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.classList.add('loading');
                }

                const playerNameInput = newForm.querySelector('#player-name');
                const buyInAmountInput = newForm.querySelector('#buy-in-amount');
                
                const playerNameValue = playerNameInput ? playerNameInput.value.trim() : null;
                const buyInAmountValue = buyInAmountInput ? buyInAmountInput.value : null;
                const buyInAmount = parseFloat(buyInAmountValue) || 0;

                if (!playerNameValue) {
                    showToast('Please enter your name', 'error');
                    if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
                    return;
                }
                if (isNaN(buyInAmount) || buyInAmount <= 0) {
                    showToast('Please enter a valid buy-in amount', 'error');
                    if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
                    return;
                }

                const currentChipRatio = chipRatio;
                const chips = Math.floor(buyInAmount / currentChipRatio);
                if (chips <= 0) {
                    showToast(`Buy-in amount $${buyInAmount.toFixed(2)} is too low for minimum chips (Ratio: $${currentChipRatio.toFixed(2)})`, 'error');
                    if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
                    return;
                }

                try {
                    const gameSnapshotCheck = await buyInDatabase.ref(`games/${gameId}`).once('value');
                    const gameDataForSubmit = gameSnapshotCheck.val();
                    if (!gameDataForSubmit || !gameDataForSubmit.active) {
                        throw new Error('Game is no longer active');
                    }

                    let buyInAction = 'joined';
                    let playerUpdateDetails = {};

                    await buyInDatabase.ref(`games/${gameId}/state`).transaction((currentState) => {
                        // ... (Full transaction logic as in the original file: robust state init, player exists check, add/update player, update nextId)
                        // For brevity, this part is not fully re-typed here but should be the complete transaction logic from before.
                        // Ensure it uses playerNameValue and chips.
                        // --- Start of Transaction Logic Placeholder ---
                        if (!currentState) {
                            currentState = { players: [], nextPlayerId: 1, lastUpdate: Date.now(), lastPlayer: null };
                        }
                        currentState.players = currentState.players || [];
                        if (!Array.isArray(currentState.players)) {
                            currentState.players = Object.values(currentState.players).filter(p => p != null);
                        }
                        if (typeof currentState.nextPlayerId !== 'number' || currentState.nextPlayerId <= 0) {
                            currentState.nextPlayerId = Math.max(0, ...currentState.players.map(p => p?.id || 0)) + 1;
                        }
                        currentState.lastPlayer = currentState.lastPlayer === undefined ? null : currentState.lastPlayer;
                        currentState.lastUpdate = currentState.lastUpdate || Date.now();

                        const normalizedNewName = playerNameValue.toLowerCase().trim();
                        const existingPlayerIndex = currentState.players.findIndex(p => p && p.name && p.name.toLowerCase().trim() === normalizedNewName);
                        let playerForNotification = null;

                        if (existingPlayerIndex !== -1) { // Player exists - rebuy logic from main form
                            const existingPlayer = currentState.players[existingPlayerIndex];
                            const currentInitial = parseInt(existingPlayer.initial_chips) || 0;
                            const currentCurrent = parseInt(existingPlayer.current_chips) || 0;
                            const addedChips = parseInt(chips) || 0;
                            const updatedPlayer = { ...existingPlayer, initial_chips: currentInitial + addedChips, current_chips: currentCurrent + addedChips, lastBuyIn: Date.now() };
                            currentState.players[existingPlayerIndex] = updatedPlayer;
                            playerForNotification = { ...updatedPlayer, action: 'rebuy', addedChips: addedChips };
                            buyInAction = 'rebought';
                            playerUpdateDetails = { name: updatedPlayer.name, chips: addedChips, totalChips: updatedPlayer.current_chips };
                        } else { // New player
                            const newPlayer = { id: currentState.nextPlayerId, name: playerNameValue, initial_chips: chips, current_chips: chips, joinedAt: Date.now(), active: true };
                            currentState.players.push(newPlayer);
                            playerForNotification = { ...newPlayer, action: 'join' };
                            currentState.nextPlayerId++;
                            buyInAction = 'joined';
                            playerUpdateDetails = { name: newPlayer.name, chips: newPlayer.initial_chips };
                        }
                        currentState.lastUpdate = Date.now();
                        currentState.lastPlayer = playerForNotification;
                        return currentState;
                        // --- End of Transaction Logic Placeholder ---
                    });

                    // --- Transaction Successful: UI Update ---
                    currentPlayerName = playerUpdateDetails.name; // Set global currentPlayerName
                    localStorage.setItem('kapoker-lastGameId', gameId);
                    localStorage.setItem('kapoker-lastPlayerName', currentPlayerName);

                    const welcomeMessageArea = document.getElementById('welcome-message-area');
                    const gameInfoAreaForHide = document.getElementById('game-info');
                    const mainTitleForHide = document.querySelector('h1.buy-in-title');
                    
                    if(newForm) newForm.style.display = 'none';
                    if(gameInfoAreaForHide) gameInfoAreaForHide.style.display = 'none';
                    if(mainTitleForHide) mainTitleForHide.style.display = 'none';

                    let successMessageHTML = '';
                    const gameDisplayName = gameDataForSubmit.name || 'the game';
                    if (buyInAction === 'joined') {
                        successMessageHTML = `<h2>Welcome to ${gameDisplayName}!</h2><p>You've successfully joined with ${chips} chips.</p>`;
                    } else { 
                        successMessageHTML = `<h2>Chips Added!</h2><p>Added ${chips} chips to ${playerUpdateDetails.name}.</p><p>Your new total is ${playerUpdateDetails.totalChips} chips.</p>`;
                    }

                    if (welcomeMessageArea) {
                        welcomeMessageArea.innerHTML = `
                            <div class="welcome-content">
                                ${successMessageHTML}
                                <p id="buy-in-status-message">The host is managing the game.</p>
                                <button id="rebuy-action-button" class="poker-button secondary-button">Rebuy for ${currentPlayerName}</button>
                                <p class="close-instruction" style="margin-top: 15px;">You can close this window now.</p>
                            </div>
                        `;
                        welcomeMessageArea.style.display = '';
                        attachWelcomeAreaButtonListeners(); // Attach listeners for the new rebuy button
                    }
                    // listenForRebuyAndPayoutStatus() is already active from setupStandardUI()
                    if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading');}

                } catch (error) {
                    console.error('[BUY-IN] Error during buy-in form submission:', error);
                    showToast(error.message || 'An unexpected error occurred.', 'error');
                    if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
                }
            });
        })
        .catch(error => {
            console.error('[FIREBASE] Error fetching initial game data for buy-in form:', error);
            showToast(error.message || 'Could not load game data for buy-in form.', 'error');
            const form = document.getElementById('buy-in-form');
            if (form) form.style.display = 'none'; // Hide form if initial data load fails
        });
}

function initializeRebuyFormFunctionality() {
    console.log('[REBUY_FORM] Initializing rebuy form functionality.');

    const welcomeMessageArea = document.getElementById('welcome-message-area');
    const rebuyFormArea = document.getElementById('rebuy-form-area');
    const rebuyPlayerNameDisplay = document.getElementById('rebuy-player-name-display');
    const rebuyAmountInput = document.getElementById('rebuy-amount');
    const rebuyChipAmountDisplay = document.getElementById('rebuy-chip-amount');
    const chipRatioRebuyDisplay = document.getElementById('chip-ratio-rebuy');
    const confirmRebuyButton = document.getElementById('confirm-rebuy-button');
    const cancelRebuyButton = document.getElementById('cancel-rebuy-button');
    // Note: mainBuyInForm, mainPlayerNameInput, mainBuyInAmountInput are part of initializeBuyInFormFunctionality

    function updateRebuyChipPreview() {
        if (!rebuyAmountInput) return;
        const amount = parseFloat(rebuyAmountInput.value) || 0;
        const chips = amount > 0 && chipRatio > 0 ? Math.floor(amount / chipRatio) : 0;
        if(rebuyChipAmountDisplay) rebuyChipAmountDisplay.textContent = chips;
        if(chipRatioRebuyDisplay) chipRatioRebuyDisplay.textContent = chipRatio.toFixed(2);
    }

    // Make showRebuyForm globally accessible if it's called from HTML, or ensure it's called by a listener set up here.
    // If attachWelcomeAreaButtonListeners sets up the #rebuy-action-button, then this is fine.
    window.showRebuyForm = function() { 
        if (welcomeMessageArea) welcomeMessageArea.style.display = 'none';
        if (rebuyFormArea) {
            if(rebuyPlayerNameDisplay && currentPlayerName) rebuyPlayerNameDisplay.textContent = currentPlayerName;
            else if (rebuyPlayerNameDisplay) rebuyPlayerNameDisplay.textContent = 'Player'; // Fallback
            
            if(rebuyAmountInput) rebuyAmountInput.value = ''; 
            updateRebuyChipPreview(); 
            rebuyFormArea.style.display = '';

            if (confirmRebuyButton) {
                confirmRebuyButton.disabled = false;
                confirmRebuyButton.classList.remove('loading');
            }
        }
    };

    if (rebuyAmountInput) {
        rebuyAmountInput.addEventListener('input', updateRebuyChipPreview);
    }

    if (confirmRebuyButton) {
        confirmRebuyButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!rebuyAmountInput) return;
            const rebuyAmount = parseFloat(rebuyAmountInput.value);

            if (isNaN(rebuyAmount) || rebuyAmount <= 0) {
                showToast('Please enter a valid rebuy amount', 'error');
                return;
            }

            // The main buy-in form is used to process the actual transaction.
            // We need to ensure it exists and its input fields can be populated.
            const currentMainForm = document.getElementById('buy-in-form');
            if (!currentMainForm) {
                showToast('Error: Main buy-in form not found for rebuy.', 'error');
                return;
            }
            const playerNameInputInMainForm = currentMainForm.querySelector('#player-name');
            const buyInAmountInputInMainForm = currentMainForm.querySelector('#buy-in-amount');

            if (!playerNameInputInMainForm || !buyInAmountInputInMainForm) {
                showToast('Error preparing rebuy. Critical form fields missing.', 'error');
                return;
            }
            if (!currentPlayerName) {
                showToast('Error: Player name not set for rebuy.', 'error');
                return;
            }

            playerNameInputInMainForm.value = currentPlayerName;
            buyInAmountInputInMainForm.value = rebuyAmount.toString();

            if (rebuyFormArea) rebuyFormArea.style.display = 'none';
            confirmRebuyButton.disabled = true;
            confirmRebuyButton.classList.add('loading');
            
            // Programmatically submit the main buy-in form (which should be set up by initializeBuyInFormFunctionality)
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            currentMainForm.dispatchEvent(submitEvent);
            // The main form's submit handler will manage button states and UI transitions.
        });
    }

    if (cancelRebuyButton) {
        cancelRebuyButton.addEventListener('click', () => {
            if (rebuyFormArea) rebuyFormArea.style.display = 'none';
            if (welcomeMessageArea) welcomeMessageArea.style.display = ''; // Show welcome again
        });
    }
}

// listenForRebuyAndPayoutStatus, displayPlayerPayouts, etc. remain mostly the same
// ... but ensure listener detachment in listenForRebuyAndPayoutStatus is solid.

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

// --- Payout Display Logic ---
let payoutDataCache = null; // Cache for payout transactions
let currentPayoutStatus = null;
let currentRebuysAllowed = true; // Assume true initially

function attachWelcomeAreaButtonListeners() {
    const rebuyActionButton = document.getElementById('rebuy-action-button');
    if (rebuyActionButton) {
        rebuyActionButton.addEventListener('click', () => {
            showRebuyForm(); 
        });
    }
}

function listenForRebuyAndPayoutStatus() {
    if (!gameId || !buyInDatabase) {
        console.log('[STATUS_LISTEN] Missing gameId or database. Cannot listen for status updates.');
        return;
    }
    console.log('[STATUS_LISTEN] Setting up listeners for rebuyAllowed and payoutInfo for game:', gameId);

    const gameRef = buyInDatabase.ref(`games/${gameId}`);
    // Store the listener function to allow detachment
    const gameListener = (snapshot) => {
        if (!snapshot.exists()) {
            console.log('[STATUS_LISTEN] Game data not found or no longer exists.');
            showToast('Game session not found. It may have ended or been reset by the host.', 'error');
            hideAllMainUISections();
            isPayoutScreenVisible = false; // Ensure flag is reset
            // Potentially try to re-initialize or guide user if game truly gone
            // For now, just detach and show error.
            gameRef.off('value', gameListener); // Detach listener if game is gone
            return;
        }

        const gameData = snapshot.val();
        const payoutInfo = gameData.payoutInfo;
        const rebuysAllowed = gameData.rebuysAllowed !== false;

        // Scenario 1: Payouts are finalized by host.
        if (payoutInfo && payoutInfo.status === 'finalized' && payoutInfo.transactions) {
            if (!isPayoutScreenVisible) {
                console.log('[STATUS_LISTEN] Payouts are FINALIZED. Triggering display.');
                payoutDataCache = payoutInfo; // Cache the data
                displayPlayerPayouts(payoutInfo.transactions); // This sets isPayoutScreenVisible = true
                // Do NOT detach listener here anymore.
                return; // Payout screen is now active, no further UI updates in this branch for this event
            }
            // If payout screen is already visible and status is still finalized, do nothing further here.
            // This prevents re-rendering if other minor gameData changes occur.
            return; 
        }
        
        // Scenario 2: Payouts were visible but are no longer finalized (host reopened or reset).
        // This also covers cases where payoutInfo becomes null or status changes from 'finalized'.
        if (isPayoutScreenVisible && (!payoutInfo || payoutInfo.status !== 'finalized')) {
            console.log('[STATUS_LISTEN] Payouts no longer finalized or cleared. Reverting to standard UI.');
            showToast('The host has re-opened the game or reset payouts. Reloading session...', 'info');
            // hideAllMainUISections() is called by displayPlayerPayouts if it was the last one to hide things,
            // but to be safe, call it here if we are explicitly moving away from payouts.
            // However, setupStandardUI will likely re-show necessary parts.
            // The key is to ensure isPayoutScreenVisible is false BEFORE setupStandardUI.
            
            // Hide the payout display area explicitly
            const payoutDisplayAreaElement = document.getElementById('payout-display-area');
            if(payoutDisplayAreaElement) payoutDisplayAreaElement.style.display = 'none';
            isPayoutScreenVisible = false; // Critical: update flag BEFORE standard UI setup

            // Clear any player-specific content that might have been in the main container
            const initialContainer = document.querySelector('body > .container:not(.payout-container)');
            if(initialContainer) initialContainer.style.display = ''; // Make sure main container is visible again

            setupStandardUI(); // Re-initialize the standard view (welcome/buy-in)
            // setupStandardUI will re-attach listeners if necessary and show appropriate UI.
            return; // Standard UI is now active
        }

        // Scenario 3: Payout screen is not visible, and payouts are not (yet) finalized.
        // This means we are in the standard buy-in/welcome flow.
        if (!isPayoutScreenVisible) {
            currentRebuysAllowed = rebuysAllowed;
            currentPayoutStatus = payoutInfo ? payoutInfo.status : null;
            // Update welcome area UI (e.g., rebuy button status, messages about payout calculation)
            updateWelcomeAreaUI(); 
        }
    };

    gameRef.on('value', gameListener, (error) => {
        console.error('[STATUS_LISTEN] Error listening to game data:', error);
        showToast('Error syncing with game state.', 'error');
    });
}

function updateWelcomeAreaUI() {
    const rebuyActionButton = document.getElementById('rebuy-action-button');
    const welcomeMessageArea = document.getElementById('welcome-message-area');
    const statusMessageEl = document.getElementById('buy-in-status-message');
    const payoutDisplayArea = document.getElementById('payout-display-area');

    // Do not update if payout screen is already visible
    if (payoutDisplayArea && payoutDisplayArea.style.display !== 'none') {
        return;
    }

    if (!welcomeMessageArea || welcomeMessageArea.style.display === 'none') {
        // If welcome area isn't visible (e.g. initial buy-in form is up), don't try to update its internals.
        return; 
    }

    if (rebuyActionButton) {
        if (currentRebuysAllowed) {
            rebuyActionButton.style.display = '';
            rebuyActionButton.disabled = false;
            if(currentPlayerName) rebuyActionButton.textContent = `Rebuy for ${currentPlayerName}`;
        } else {
            rebuyActionButton.style.display = 'none';
        }
    }

    if (statusMessageEl) {
        if (!currentRebuysAllowed) {
            if (currentPayoutStatus === 'calculated') {
                statusMessageEl.textContent = 'Rebuys closed. Payouts calculated by host, awaiting finalization...';
            } else if (currentPayoutStatus !== 'finalized') { // Only show this if not yet finalized
                statusMessageEl.textContent = 'Rebuys closed. Awaiting final payout information from host.';
            }
            // If finalized, this whole welcome area will be hidden by displayPlayerPayouts
        } else {
            // Default message when rebuys are open
            statusMessageEl.textContent = 'The host is managing the game.'; 
        }
    }
}

function hideAllMainUISections() {
    const initialContainer = document.querySelector('body > .container:not(.payout-container)'); // Target the first main container
    const mainTitle = document.querySelector('h1.buy-in-title'); // This might be inside initialContainer or specific
    
    // Hide individual forms/areas within the initial container as a fallback or if they exist outside
    const initialForm = document.getElementById('buy-in-form');
    const gameInfoArea = document.getElementById('game-info');
    const welcomeArea = document.getElementById('welcome-message-area');
    const rebuyArea = document.getElementById('rebuy-form-area');

    if (initialContainer) {
        initialContainer.style.display = 'none';
        console.log('[UI] Main initial container hidden.');
    } else {
        // If the main container isn't found by that specific query, hide parts individually
        if (initialForm) initialForm.style.display = 'none';
        if (gameInfoArea) gameInfoArea.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none'; // Title might be outside the container or targeted separately
    }
    
    // These are likely inside initialContainer but hide them explicitly too
    if (welcomeArea) welcomeArea.style.display = 'none';
    if (rebuyArea) rebuyArea.style.display = 'none';
    
    isPayoutScreenVisible = false; // Reset flag when hiding main UI to show payouts
    console.log('[UI] All main UI sections hidden. Payout screen visibility: false.');
}

function displayPlayerPayouts(transactions) {
    hideAllMainUISections(); // Hide all other primary sections

    const payoutDisplayArea = document.getElementById('payout-display-area');
    const playerSpecificPayoutsDiv = document.getElementById('player-specific-payouts');

    if (!payoutDisplayArea || !playerSpecificPayoutsDiv) {
        console.error('[PAYOUTS] Payout display elements not found.');
        isPayoutScreenVisible = false; // Ensure flag is correct if elements are missing
        return;
    }

    let payoutHTML = '';
    let hasTransactions = false;

    transactions.forEach(t => {
        if (t.from === currentPlayerName) {
            payoutHTML += `<p class="payout-instruction payout-owes">You owe <strong>${t.to}</strong>: $${t.cash.toFixed(2)} (${t.chips} chips)</p>`;
            hasTransactions = true;
        } else if (t.to === currentPlayerName) {
            payoutHTML += `<p class="payout-instruction payout-owed"><strong>${t.from}</strong> owes you: $${t.cash.toFixed(2)} (${t.chips} chips)</p>`;
            hasTransactions = true;
        }
    });

    if (!hasTransactions) {
        payoutHTML = '<p class="payout-instruction payout-even">You are all settled up! No payments needed.</p>';
    }

    playerSpecificPayoutsDiv.innerHTML = payoutHTML;
    payoutDisplayArea.style.display = ''; // Show the payout area
    isPayoutScreenVisible = true; // Set flag when payout screen is shown
    
    // Scroll to the payout area for visibility
    payoutDisplayArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log('[PAYOUTS] Displayed payout information for', currentPlayerName);
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