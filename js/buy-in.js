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

// New helper function to update the chip preview in the rebuy form.
// It's moved here to be accessible from other functions like showUIPanel.
function updateRebuyChipPreview() {
    const rebuyAmountInput = document.getElementById('rebuy-amount');
    const rebuyChipAmountDisplay = document.getElementById('rebuy-chip-amount');
    const chipRatioRebuyDisplay = document.getElementById('chip-ratio-rebuy');

    if (!rebuyAmountInput) return;
    const amount = parseFloat(rebuyAmountInput.value) || 0;
    const chips = amount > 0 && BuyInPage.state.chipRatio > 0 ? Math.floor(amount / BuyInPage.state.chipRatio) : 0;
    if(rebuyChipAmountDisplay) rebuyChipAmountDisplay.textContent = chips;
    if(chipRatioRebuyDisplay) chipRatioRebuyDisplay.textContent = BuyInPage.state.chipRatio.toFixed(2);
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
    const buyInTitle = document.querySelector('.buy-in-title');
    if (buyInTitle) {
        buyInTitle.textContent = `Join ${gameName}`;
    }
}

// Get chip ratio from Firebase
const BuyInPage = {
    state: {
        chipRatio: 1.0,
        currentPlayerName: null,
        isPayoutScreenVisible: false,
        currentPayoutStatus: null,
        rebuysAllowed: true,
    }
};

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
                    BuyInPage.state.chipRatio = parsedRatio;
                    console.log(`[FIREBASE] Successfully parsed and set chipRatio: ${BuyInPage.state.chipRatio}`);
                    isValidRatio = true;
                } else {
                    BuyInPage.state.chipRatio = 1.0;
                    console.warn(`[FIREBASE] Invalid ratio received (${receivedRatio}). Using default 1.0`);
                }
            } else {
                console.log('[FIREBASE] No chip ratio found, using default of 1.0');
                BuyInPage.state.chipRatio = 1.0;
            }
            
            const chipRatioElement = document.getElementById('chip-ratio');
            if(chipRatioElement) chipRatioElement.textContent = BuyInPage.state.chipRatio.toFixed(2);
            
            console.log('[FIREBASE] Calling updateChipPreview after ratio update.');
            updateChipPreview();
        }, (error) => {
            console.error('[FIREBASE] Error in chip ratio listener:', error);
            showToast('Error fetching game ratio. Using default.', 'error');
            BuyInPage.state.chipRatio = 1.0;
            updateChipPreview();
        });
    } catch (error) {
        console.error('[FIREBASE] Error setting up chip ratio listener:', error);
        showToast('Error fetching game ratio. Using default.', 'error');
        BuyInPage.state.chipRatio = 1.0;
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
                            BuyInPage.state.currentPlayerName = storedPlayerName; // Set it for displayPlayerPayouts
                            console.log(`[BUY-IN_LOAD] Found player ${BuyInPage.state.currentPlayerName}, displaying payouts.`);
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
            BuyInPage.state.currentPlayerName = storedPlayerName;
            restoredPlayer = true;
            console.log(`[UI_SETUP] Restored session for player: ${BuyInPage.state.currentPlayerName}`);
            
            // Show welcome message, which includes the rebuy button.
            showUIPanel('welcome', { gameName: gameNameForMessage, playerName: BuyInPage.state.currentPlayerName });

        } else {
            console.log('[UI_SETUP] No session to restore. Displaying initial buy-in form.');
            showUIPanel('buy-in');
        }
    } catch (lsError) {
        console.warn('[UI_SETUP] Error during session restoration:', lsError);
        showUIPanel('buy-in'); // Fallback to initial buy-in form
    }

    // Always set up listeners if payouts weren't displayed on load
    listenForRebuyAndPayoutStatus();
    
    // Setup for the initial buy-in form. This now just fetches data and sets up the listener.
    // The UI is shown via showUIPanel.
    initializeBuyInFormFunctionality();
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
                BuyInPage.state.chipRatio = initialGameRatio;
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
                await handleBuyInSubmit(this);
            });
        })
        .catch(error => {
            console.error('[FIREBASE] Error fetching initial game data for buy-in form:', error);
            showToast(error.message || 'Could not load game data for buy-in form.', 'error');
            const form = document.getElementById('buy-in-form');
            if (form) form.style.display = 'none'; // Hide form if initial data load fails
        });
}

async function handleBuyInSubmit(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
    }

    const playerNameInput = form.querySelector('#player-name');
    const buyInAmountInput = form.querySelector('#buy-in-amount');
    
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

    const currentChipRatio = BuyInPage.state.chipRatio;
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

        await buyInDatabase.ref(`games/${gameId}/state`).transaction(
            (currentState) => buyInTransaction(currentState, playerNameValue, chips)
        ).then((result) => {
            if (!result.committed) {
                throw new Error("Buy-in transaction was not committed. Please try again.");
            }
            // The result.snapshot contains the new state, from which we can get details.
            const newLastPlayer = result.snapshot.child("lastPlayer").val();
            if (newLastPlayer.name.toLowerCase().trim() === playerNameValue.toLowerCase().trim()) {
                 buyInAction = newLastPlayer.action;
                 if(buyInAction === 'rebuy') {
                     playerUpdateDetails = { name: newLastPlayer.name, chips: newLastPlayer.addedChips, totalChips: newLastPlayer.current_chips };
                 } else {
                     playerUpdateDetails = { name: newLastPlayer.name, chips: newLastPlayer.initial_chips };
                 }
            } else {
                // This case is unlikely but a good fallback.
                console.warn("Transaction player doesn't match current player. Re-finding.");
                const players = Object.values(result.snapshot.child("players").val() || {});
                const finalPlayerState = players.find(p => p.name.toLowerCase().trim() === playerNameValue.toLowerCase().trim());
                if(finalPlayerState) {
                    playerUpdateDetails = { name: finalPlayerState.name, chips: 'some', totalChips: finalPlayerState.current_chips };
                    buyInAction = 'rebought';
                }
            }
        });

        // --- Transaction Successful: UI Update ---
        BuyInPage.state.currentPlayerName = playerUpdateDetails.name; // Set global currentPlayerName
        localStorage.setItem('kapoker-lastGameId', gameId);
        localStorage.setItem('kapoker-lastPlayerName', BuyInPage.state.currentPlayerName);

        const gameDisplayName = gameDataForSubmit.name || 'the game';

        // This structure ensures all necessary data is passed to the UI function
        const welcomeData = {
            buyInAction: buyInAction, // This will be 'join' or 'rebuy'
            playerName: playerUpdateDetails.name,
            gameName: gameDisplayName,
            addedChips: playerUpdateDetails.chips, // For a join, this is the total. For a rebuy, this is the added amount.
            totalChips: playerUpdateDetails.totalChips // This is only defined for a rebuy.
        };

        showUIPanel('welcome', welcomeData);

        if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading');}

    } catch (error) {
        console.error('[BUY-IN] Error during buy-in form submission:', error);
        showToast(error.message || 'An unexpected error occurred.', 'error');
        if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
    }
}

function initializeRebuyFormFunctionality() {
    console.log('[REBUY_FORM] Initializing rebuy form functionality.');

    const rebuyFormArea = document.getElementById('rebuy-form-area');
    // To prevent duplicate listeners, we clone the form area and re-attach listeners to the clone.
    if (!rebuyFormArea) {
        console.error('[REBUY_FORM] Rebuy form area not found. Cannot initialize.');
        return;
    }
    const newRebuyFormArea = rebuyFormArea.cloneNode(true);
    rebuyFormArea.parentNode.replaceChild(newRebuyFormArea, rebuyFormArea);

    // Get all interactive elements from the new, cloned node.
    const rebuyAmountInput = newRebuyFormArea.querySelector('#rebuy-amount');
    const confirmRebuyButton = newRebuyFormArea.querySelector('#confirm-rebuy-button');
    const cancelRebuyButton = newRebuyFormArea.querySelector('#cancel-rebuy-button');

    // This function is called from the "welcome" panel to show the rebuy form.
    window.showRebuyForm = function() { 
        showUIPanel('rebuy', { playerName: BuyInPage.state.currentPlayerName });
    };

    if (rebuyAmountInput) {
        // The listener now calls the globally accessible update function.
        rebuyAmountInput.addEventListener('input', updateRebuyChipPreview);
    }

    if (confirmRebuyButton) {
        // The rebuy button is now decoupled and calls the shared transaction function directly.
        confirmRebuyButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleRebuyClick(confirmRebuyButton);
        });
    }

    if (cancelRebuyButton) {
        cancelRebuyButton.addEventListener('click', () => {
            // After cancelling, show the main welcome panel again.
            showUIPanel('welcome', { playerName: BuyInPage.state.currentPlayerName });
        });
    }
}

async function handleRebuyClick(button) {
    const rebuyAmountInput = document.getElementById('rebuy-amount');
    if (!rebuyAmountInput) return;
    const rebuyAmount = parseFloat(rebuyAmountInput.value);
    const playerName = BuyInPage.state.currentPlayerName;

    if (!playerName) {
        showToast('Error: Player name not set for rebuy.', 'error');
        return;
    }
    
    // Directly call the new shared function, passing the button for state management.
    await performBuyIn(playerName, rebuyAmount, button);
}

// New shared function to handle the transaction logic for both initial buy-ins and rebuys.
// This avoids code duplication and decouples the rebuy form from the main buy-in form.
async function performBuyIn(playerName, buyInAmount, submitButton = null) {
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
    }

    if (!playerName) {
        showToast('Player name is missing.', 'error');
        if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
        return;
    }
    if (isNaN(buyInAmount) || buyInAmount <= 0) {
        showToast('Please enter a valid buy-in amount', 'error');
        if (submitButton) { submitButton.disabled = false; submitButton.classList.remove('loading'); }
        return;
    }

    const currentChipRatio = BuyInPage.state.chipRatio;
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

        await buyInDatabase.ref(`games/${gameId}/state`).transaction(
            (currentState) => buyInTransaction(currentState, playerName, chips)
        ).then((result) => {
            if (!result.committed) {
                throw new Error("Buy-in transaction was not committed. Please try again.");
            }
            // The result.snapshot contains the new state, from which we can get details.
            const newLastPlayer = result.snapshot.child("lastPlayer").val();
            if (newLastPlayer.name.toLowerCase().trim() === playerName.toLowerCase().trim()) {
                 buyInAction = newLastPlayer.action;
                 if(buyInAction === 'rebuy') {
                     playerUpdateDetails = { name: newLastPlayer.name, chips: newLastPlayer.addedChips, totalChips: newLastPlayer.current_chips };
                 } else {
                     playerUpdateDetails = { name: newLastPlayer.name, chips: newLastPlayer.initial_chips };
                 }
            } else {
                // This case is unlikely but a good fallback.
                console.warn("Transaction player doesn't match current player. Re-finding.");
                const players = Object.values(result.snapshot.child("players").val() || {});
                const finalPlayerState = players.find(p => p.name.toLowerCase().trim() === playerName.toLowerCase().trim());
                if(finalPlayerState) {
                    playerUpdateDetails = { name: finalPlayerState.name, chips: 'some', totalChips: finalPlayerState.current_chips };
                    buyInAction = 'rebought';
                }
            }
        });

        // --- Transaction Successful: UI Update ---
        BuyInPage.state.currentPlayerName = playerUpdateDetails.name; // Set global currentPlayerName
        localStorage.setItem('kapoker-lastGameId', gameId);
        localStorage.setItem('kapoker-lastPlayerName', BuyInPage.state.currentPlayerName);

        const gameDisplayName = gameDataForSubmit.name || 'the game';

        // This structure ensures all necessary data is passed to the UI function
        const welcomeData = {
            buyInAction: buyInAction, // This will be 'join' or 'rebuy'
            playerName: playerUpdateDetails.name,
            gameName: gameDisplayName,
            addedChips: playerUpdateDetails.chips, // For a join, this is the total. For a rebuy, this is the added amount.
            totalChips: playerUpdateDetails.totalChips // This is only defined for a rebuy.
        };

        showUIPanel('welcome', welcomeData);

    } catch (error) {
        console.error(`[BUY-IN] Error during transaction for ${playerName}:`, error);
        showToast(error.message || 'An unexpected error occurred.', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    }
}

// Extracted transaction logic for clarity
function buyInTransaction(currentState, playerName, chips) {
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

    const normalizedNewName = playerName.toLowerCase().trim();
    const existingPlayerIndex = currentState.players.findIndex(p => p && p.name && p.name.toLowerCase().trim() === normalizedNewName);
    let playerForNotification = null;

    if (existingPlayerIndex !== -1) { // Player exists - rebuy logic
        const existingPlayer = currentState.players[existingPlayerIndex];
        const currentInitial = parseInt(existingPlayer.initial_chips) || 0;
        const currentCurrent = parseInt(existingPlayer.current_chips) || 0;
        const addedChips = parseInt(chips) || 0;
        const updatedPlayer = { ...existingPlayer, initial_chips: currentInitial + addedChips, current_chips: currentCurrent + addedChips, lastBuyIn: Date.now() };
        currentState.players[existingPlayerIndex] = updatedPlayer;
        playerForNotification = { ...updatedPlayer, action: 'rebuy', addedChips: addedChips };
    } else { // New player
        const newPlayer = { id: currentState.nextPlayerId, name: playerName, initial_chips: chips, current_chips: chips, joinedAt: Date.now(), active: true };
        currentState.players.push(newPlayer);
        playerForNotification = { ...newPlayer, action: 'join' };
        currentState.nextPlayerId++;
    }
    currentState.lastUpdate = Date.now();
    currentState.lastPlayer = playerForNotification;
    return currentState;
}

// Update chip preview calculation (now uses the global chipRatio)
function updateChipPreview() {
    // Add logs for debugging
    console.log(`[PREVIEW] updateChipPreview called. Current Ratio: ${BuyInPage.state.chipRatio} (Type: ${typeof BuyInPage.state.chipRatio})`);
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
    
    const currentValidRatio = (typeof BuyInPage.state.chipRatio === 'number' && BuyInPage.state.chipRatio > 0) ? BuyInPage.state.chipRatio : 1.0;
    // --- BEGIN DEBUG LOGS ---
    console.log(`[PREVIEW DEBUG] chipRatio (global) for calculation: ${BuyInPage.state.chipRatio} (Type: ${typeof BuyInPage.state.chipRatio})`);
    console.log(`[PREVIEW DEBUG] currentValidRatio for calculation: ${currentValidRatio} (Type: ${typeof currentValidRatio})`);
    // --- END DEBUG LOGS ---
    if (currentValidRatio !== BuyInPage.state.chipRatio) {
        console.warn(`[PREVIEW] chipRatio was invalid (${BuyInPage.state.chipRatio}). Using default 1.0 for calculation.`);
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
    console.log('[STATUS_LISTEN] Setting up focused listeners for game state:', gameId);

    const gameRef = buyInDatabase.ref(`games/${gameId}`);

    // Listener for connection status to help debug connection-related issues
    buyInDatabase.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === false) {
            console.warn('[FIREBASE_CONN] Firebase connection lost.');
            showToast('Connection lost, attempting to reconnect...', 'error');
        } else {
            console.log('[FIREBASE_CONN] Firebase connection established.');
        }
    });

    // 1. Listen specifically for payout status changes
    const payoutRef = gameRef.child('payoutInfo');
    payoutRef.on('value', (snapshot) => {
        const payoutInfo = snapshot.val();
        const status = payoutInfo ? payoutInfo.status : null;
        BuyInPage.state.currentPayoutStatus = status;

        if (status === 'finalized' && payoutInfo.transactions) {
            if (!BuyInPage.state.isPayoutScreenVisible) {
                console.log('[STATUS_LISTEN/PAYOUT] Payouts are FINALIZED. Triggering display.');
                displayPlayerPayouts(payoutInfo.transactions);
            }
        } else if (BuyInPage.state.isPayoutScreenVisible && status !== 'finalized') {
            console.log('[STATUS_LISTEN/PAYOUT] Payouts no longer finalized. Reverting to standard UI.');
            showToast('The host has re-opened the game.', 'info');
            revertToStandardUI();
        }
    }, (error) => {
        console.error('[STATUS_LISTEN/PAYOUT] Error listening to payoutInfo:', error);
        showToast('Error syncing payout status.', 'error');
    });

    // 2. Listen specifically for rebuy status changes
    const rebuyRef = gameRef.child('rebuysAllowed');
    rebuyRef.on('value', (snapshot) => {
        // Coerce to boolean. `undefined` or `true` means rebuys are allowed.
        const rebuysAllowed = snapshot.val() !== false;
        BuyInPage.state.rebuysAllowed = rebuysAllowed;
        console.log(`[STATUS_LISTEN/REBUY] Rebuys allowed status changed to: ${rebuysAllowed}`);
        if (!BuyInPage.state.isPayoutScreenVisible) {
            updateWelcomeAreaUI();
        }
    }, (error) => {
        console.error('[STATUS_LISTEN/REBUY] Error listening to rebuysAllowed:', error);
        showToast('Error syncing rebuy status.', 'error');
    });

    // 3. Listen for game activity status (e.g., host resets the game)
    const activeRef = gameRef.child('active');
    activeRef.on('value', (snapshot) => {
        if (snapshot.val() === false) {
            console.log('[STATUS_LISTEN/ACTIVE] Game has been deactivated or reset by the host.');
            showToast('Game session has ended.', 'error');
            
            // Detach all listeners for this game to prevent memory leaks
            payoutRef.off();
            rebuyRef.off();
            activeRef.off();

            hideAllMainUISections();
            // Show a definitive "Game Over" message
            const mainContainer = document.querySelector('body > .container:not(.payout-container)');
            if (mainContainer) {
                 mainContainer.innerHTML = '<h1>This game session has ended.</h1><p>Please close this window or get a new link from the host.</p>';
                 mainContainer.style.display = '';
            }
        }
    }, (error) => {
        console.error('[STATUS_LISTEN/ACTIVE] Error listening to game activity:', error);
    });
}

// New helper function to revert from payout screen to standard UI
function revertToStandardUI() {
    const payoutDisplayAreaElement = document.getElementById('payout-display-area');
    if(payoutDisplayAreaElement) payoutDisplayAreaElement.style.display = 'none';
    BuyInPage.state.isPayoutScreenVisible = false; 

    const initialContainer = document.querySelector('body > .container:not(.payout-container)');
    if(initialContainer) initialContainer.style.display = ''; 

    setupStandardUI(); 
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
        if (BuyInPage.state.rebuysAllowed) {
            rebuyActionButton.style.display = '';
            rebuyActionButton.disabled = false;
            if(BuyInPage.state.currentPlayerName) rebuyActionButton.textContent = `Rebuy for ${BuyInPage.state.currentPlayerName}`;
        } else {
            rebuyActionButton.style.display = 'none';
        }
    }

    if (statusMessageEl) {
        if (!BuyInPage.state.rebuysAllowed) {
            if (BuyInPage.state.currentPayoutStatus === 'calculated') {
                statusMessageEl.textContent = 'Rebuys closed. Payouts calculated by host, awaiting finalization...';
            } else if (BuyInPage.state.currentPayoutStatus !== 'finalized') { // Only show this if not yet finalized
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
    
    BuyInPage.state.isPayoutScreenVisible = false; // Reset flag when hiding main UI to show payouts
    console.log('[UI] All main UI sections hidden. Payout screen visibility: false.');
}

function displayPlayerPayouts(transactions) {
    showUIPanel('payouts', { transactions: transactions, playerName: BuyInPage.state.currentPlayerName });
}

function showUIPanel(panelName, data = {}) {
    console.log(`[UI] Showing panel: ${panelName} with data:`, data);

    // Define all panels
    const panels = {
        'buy-in': document.getElementById('buy-in-form'),
        'welcome': document.getElementById('welcome-message-area'),
        'rebuy': document.getElementById('rebuy-form-area'),
        'payouts': document.getElementById('payout-display-area'),
        'game-info': document.getElementById('game-info'),
        'main-title': document.querySelector('h1.buy-in-title'),
    };

    // Hide all panels first
    for (const key in panels) {
        if (panels[key]) {
            panels[key].style.display = 'none';
        }
    }
    
    BuyInPage.state.isPayoutScreenVisible = false;

    // Show the requested panel and configure it
    switch (panelName) {
        case 'buy-in':
            if (panels['buy-in']) panels['buy-in'].style.display = '';
            if (panels['game-info']) panels['game-info'].style.display = '';
            if (panels['main-title']) panels['main-title'].style.display = '';
            updateChipPreview();
            break;

        case 'welcome':
            if (panels['welcome']) {
                let welcomeHTML;
                // This is a success buy-in event with animations
                if (data.buyInAction) {
                    const isJoin = data.buyInAction === 'join';
                    const title = isJoin ? `Welcome, ${data.playerName}!` : 'Chips Added!';
                    
                    const addedAmount = isJoin ? data.addedChips : data.addedChips;
                    const totalAmount = isJoin ? data.addedChips : data.totalChips;

                    // Start counters from 0 for a join, or previous total for a rebuy
                    const initialAdded = 0;
                    const initialTotal = isJoin ? 0 : totalAmount - addedAmount;

                    welcomeHTML = `
                        <div class="welcome-content">
                            <h2 class="animate-text-pop-in">${title}</h2>
                            
                            <div class="buy-in-summary animate-fade-in-up-sm" style="animation-delay: 0.1s;">
                                ${isJoin ? `
                                    <div>
                                        <span class="summary-label">You've joined with</span>
                                        <strong id="total-chips-animated" class="summary-value">${initialTotal.toLocaleString()}</strong>
                                        <span class="summary-label-small">chips</span>
                                    </div>
                                ` : `
                                    <div>
                                        <span class="summary-label">Added</span>
                                        <strong id="added-chips-animated" class="summary-value">${initialAdded.toLocaleString()}</strong>
                                        <span class="summary-label-small">chips</span>
                                    </div>
                                    <div class="summary-divider"></div>
                                    <div>
                                        <span class="summary-label">Your new total is</span>
                                        <strong id="total-chips-animated" class="summary-value">${initialTotal.toLocaleString()}</strong>
                                        <span class="summary-label-small">chips</span>
                                    </div>
                                `}
                            </div>

                            <p id="buy-in-status-message" class="animate-fade-in-up-sm" style="animation-delay: 0.3s;">The host is managing the game.</p>
                            <button id="rebuy-action-button" class="poker-button secondary-button animate-fade-in-up-sm" style="animation-delay: 0.4s;">Rebuy for ${data.playerName}</button>
                            <p class="close-instruction animate-fade-in-up-sm" style="animation-delay: 0.5s;">You can close this window if no action is needed.</p>
                        </div>
                    `;
                    panels['welcome'].innerHTML = welcomeHTML;

                    // Use a short timeout to ensure elements are in the DOM before animating
                    setTimeout(() => {
                        const addedChipsEl = document.getElementById('added-chips-animated');
                        const totalChipsEl = document.getElementById('total-chips-animated');

                        if (!isJoin && addedChipsEl) {
                            animateValue(addedChipsEl, initialAdded, addedAmount, 800);
                        }
                        if (totalChipsEl) {
                            animateValue(totalChipsEl, initialTotal, totalAmount, 1000);
                        }
                    }, 50);

                } else { // This is the simple "welcome back" for a restored session
                    const gameNameForMessage = data.gameName || 'the game';
                    welcomeHTML = `
                        <div class="welcome-content">
                            <h2>Welcome back, ${data.playerName}!</h2>
                            <p>You're in ${gameNameForMessage}.</p>
                            <p id="buy-in-status-message">The host is managing the game.</p>
                            <button id="rebuy-action-button" class="poker-button secondary-button">Rebuy for ${data.playerName}</button>
                            <p class="close-instruction" style="margin-top: 15px;">You can close this window if no action is needed.</p>
                        </div>
                    `;
                    panels['welcome'].innerHTML = welcomeHTML;
                }

                panels['welcome'].style.display = '';
                attachWelcomeAreaButtonListeners();
                updateWelcomeAreaUI();
            }
            break;

        case 'rebuy':
            if (panels['rebuy']) {
                const rebuyPlayerNameDisplay = document.getElementById('rebuy-player-name-display');
                const rebuyAmountInput = document.getElementById('rebuy-amount');
                const confirmRebuyButton = document.getElementById('confirm-rebuy-button');

                if (rebuyPlayerNameDisplay) rebuyPlayerNameDisplay.textContent = data.playerName || 'Player';
                if (rebuyAmountInput) rebuyAmountInput.value = '';
                if (confirmRebuyButton) {
                    confirmRebuyButton.disabled = false;
                    confirmRebuyButton.classList.remove('loading');
                }
                panels['rebuy'].style.display = '';
                // The broken code is removed, and we now call the refactored, working function
                // to ensure the chip preview is correctly updated when the panel is shown.
                updateRebuyChipPreview();
            }
            break;

        case 'payouts':
             BuyInPage.state.isPayoutScreenVisible = true;
            if (panels['payouts']) {
                const playerSpecificPayoutsDiv = document.getElementById('player-specific-payouts');
                if (playerSpecificPayoutsDiv && data.transactions) {
                    let payoutHTML = '';
                    let hasTransactions = false;
                    data.transactions.forEach(t => {
                        if (t.from === BuyInPage.state.currentPlayerName) {
                            payoutHTML += `<p class="payout-instruction payout-owes">You owe <strong>${t.to}</strong>: $${t.cash.toFixed(2)} (${t.chips} chips)</p>`;
                            hasTransactions = true;
                        } else if (t.to === BuyInPage.state.currentPlayerName) {
                            payoutHTML += `<p class="payout-instruction payout-owed"><strong>${t.from}</strong> owes you: $${t.cash.toFixed(2)} (${t.chips} chips)</p>`;
                            hasTransactions = true;
                        }
                    });
                    if (!hasTransactions) {
                        payoutHTML = '<p class="payout-instruction payout-even">You are all settled up! No payments needed.</p>';
                    }
                    playerSpecificPayoutsDiv.innerHTML = payoutHTML;
                }
                panels['payouts'].style.display = '';
                panels['payouts'].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            break;
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

function animateValue(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}