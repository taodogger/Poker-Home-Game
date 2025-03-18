// Define themes with main colors and gradients
const themes = {
    'classic-green': {
        '--main-color': '#2E8B57',
        '--secondary-color': '#3CB371',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♠️'
    },
    'royal-blue': {
        '--main-color': '#4169E1',
        '--secondary-color': '#1E90FF',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♦️'
    },
    'crimson-red': {
        '--main-color': '#DC143C',
        '--secondary-color': '#FF4500',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♥️'
    },
    'midnight-black': {
        '--main-color': '#2F4F4F',
        '--secondary-color': '#696969',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '♣️'
    },
    'ocean-breeze': {
        '--main-color': '#20B2AA',
        '--secondary-color': '#5F9EA0',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🌊'
    },
    'firestorm': {
        '--main-color': '#FF6347',
        '--secondary-color': '#FF4500',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔥'
    },
    'purple-haze': {
        '--main-color': '#9370DB',
        '--secondary-color': '#8A2BE2',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '🔮'
    },
    'neon-nights': {
        '--main-color': '#00FFFF',
        '--secondary-color': '#00CED1',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        'icon': '💡'
    },
    'rizzler': {
        '--main-color': '#ff00ff', // Bright pink
        '--secondary-color': '#bf00ff', // Purple
        '--body-background': 'url("./images/rizzler-background.jpg")',
        'tableImage': './images/rizzler-board.jpg',
        'icon': './images/rizzler-icon.png'
    },
    'doginme': {
        '--main-color': '#1e90ff', // Dodger blue
        '--secondary-color': '#4169e1', // Royal blue
        '--body-background': 'url("./images/doginme-background.jpg")',
        'tableImage': './images/doginme-board.jpg',
        'icon': './images/doginme-icon.png'
    }
};

// Global setTheme function that can be accessed from anywhere
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update icons
    const leftIcon = document.querySelector('.title-icon.left-icon');
    const rightIcon = document.querySelector('.title-icon.right-icon');
    
    if (leftIcon && rightIcon) {
        if (theme === 'doginme') {
            leftIcon.src = 'images/doginme-icon.png';
            rightIcon.src = 'images/doginme-icon.png';
        } else if (theme === 'rizzler') {
            leftIcon.src = 'images/rizzler-icon.png';
            rightIcon.src = 'images/rizzler-icon.png';
        }
    }
    
    // Update background
    document.body.style.background = getComputedStyle(document.body).getPropertyValue('--body-background');
    
    // Update the theme selector if it exists
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = theme;
    }
    
    // Apply theme to HandAnimation if it exists
    if (window.handAnimation && themes[theme]) {
        window.handAnimation.setTheme(themes[theme]);
    }
    
    // Save to global state
    if (window.PokerApp && window.PokerApp.state) {
        window.PokerApp.state.theme = theme;
    }
}

// Dummy placeholder functions to be overridden later
function updatePlayerList() { /* Will be replaced later */ }
function saveState() { /* Will be replaced later */ }
function updateEmptyState() { /* Will be replaced later */ }

// Create toast container and styles
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);

    // Add toast styles if they don't exist
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 9999;
            }
            .toast {
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideIn 0.3s ease forwards;
                opacity: 0;
                transform: translateX(50px);
            }
            .toast.success {
                background: linear-gradient(to right, #00b09b, #96c93d);
            }
            .toast.error {
                background: linear-gradient(to right, #ff5f6d, #ffc371);
            }
            .toast.info {
                background: linear-gradient(to right, #2193b0, #6dd5ed);
            }
            @keyframes slideIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .toast.fade-out {
                animation: slideOut 0.3s ease forwards;
            }
            @keyframes slideOut {
                to {
                    opacity: 0;
                    transform: translateX(50px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    return container;
}

// Save game state to localStorage and Firebase
function saveState() {
    try {
        // Save to localStorage
        const stateToSave = {
            players: PokerApp.state.players,
            gameInProgress: PokerApp.state.gameInProgress,
            dealerId: PokerApp.state.dealerId,
            nextPlayerId: PokerApp.state.nextPlayerId,
            chipRatio: PokerApp.state.chipRatio,
            theme: PokerApp.state.theme,
            sessionId: PokerApp.state.sessionId,
            gameName: PokerApp.state.gameName,
            lobbyActive: PokerApp.state.lobbyActive
        };
        
        localStorage.setItem('pokerGameState', JSON.stringify(stateToSave));
        
        // If we have an active session and Firebase is available, save to Firebase too
        if (PokerApp.state.sessionId && typeof firebase !== 'undefined' && firebase.database) {
            firebase.database().ref(`games/${PokerApp.state.sessionId}/state`).update(stateToSave);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}

// Load saved state from localStorage
function loadSavedState() {
    try {
        const savedState = localStorage.getItem('pokerGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            PokerApp.state.players = state.players || [];
            PokerApp.state.gameInProgress = state.gameInProgress || false;
            PokerApp.state.dealerId = state.dealerId || null;
            PokerApp.state.nextPlayerId = state.nextPlayerId || 1;
            PokerApp.state.chipRatio = state.chipRatio || 1.0;
            PokerApp.state.theme = state.theme || 'classic-green';
            PokerApp.state.sessionId = state.sessionId || null;
            PokerApp.state.gameName = state.gameName || null;
            PokerApp.state.lobbyActive = state.lobbyActive || false;
        }
        return true;
    } catch (error) {
        console.error('Error loading game state:', error);
        return false;
    }
}

// Player management functions
function addPlayer(name, chips) {
    // Check for duplicate names
    if (PokerApp.state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showToast(`Player "${name}" already exists`, 'error');
        return false;
    }
    
    // Add player to state
    const player = {
        id: PokerApp.state.nextPlayerId++,
        name: name,
        initial_chips: chips,
        current_chips: chips
    };
    
    PokerApp.state.players.push(player);
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Save state
    saveState();
    
    showToast(`Added ${name} with ${chips} chips`, 'success');
    return true;
}

function removePlayer(playerId) {
    // Check if game is in progress
    if (PokerApp.state.gameInProgress) {
        showToast('Cannot remove players during an active game', 'error');
        return false;
    }
    
    const playerIndex = PokerApp.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        showToast('Player not found', 'error');
        return false;
    }
    
    // Remove player
    const removedPlayer = PokerApp.state.players.splice(playerIndex, 1)[0];
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Save state
    saveState();
    
    showToast(`Removed ${removedPlayer.name}`, 'info');
    return true;
}

function updatePlayerList() {
    const tableBody = document.querySelector('#player-table tbody');
    if (!tableBody) return;
    
    // Clear current list
    tableBody.innerHTML = '';
    
    // Add players to table with modern UI
    PokerApp.state.players.forEach((player, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.1}s`; // Staggered animation
        
        // Get initial for avatar
        const initial = player.name.charAt(0).toUpperCase();
        
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center;">
                    <div class="player-avatar">${initial}</div>
                    ${player.name}
                </div>
            </td>
            <td><strong>${player.initial_chips}</strong></td>
            <td>
                <input 
                    type="number" 
                    value="${player.current_chips}" 
                    class="chip-input" 
                    data-player-id="${player.id}"
                    ${PokerApp.state.gameInProgress ? 'disabled' : ''}
                >
            </td>
            <td>
                <button 
                    class="kahoot-button remove-player" 
                    data-player-id="${player.id}"
                    style="margin: 0; padding: 8px 16px; font-size: 0.85rem;"
                    ${PokerApp.state.gameInProgress ? 'disabled' : ''}
                >
                    Remove
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add totals row
    updateTotalsRow();
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (playerId) {
                removePlayer(playerId);
            }
        });
    });
    
    // Add event listeners to chip inputs
    document.querySelectorAll('.chip-input').forEach(input => {
        // Use input event for immediate updates
        input.addEventListener('input', function() {
            if (!this.hasAttribute('data-player-id')) return;
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) return;
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) return;
            
            // Update player's current chips
            const playerIndex = PokerApp.state.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                PokerApp.state.players[playerIndex].current_chips = newChips;
                updateTotalsRow();
                updateEmptyState();
            }
        });
        
        // Use change event for validation and persistence
        input.addEventListener('change', function() {
            if (!this.hasAttribute('data-player-id')) return;
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) return;
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                showToast('Please enter a valid chip amount', 'error');
                // Reset to previous value
                const playerIndex = PokerApp.state.players.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    this.value = PokerApp.state.players[playerIndex].current_chips;
                }
                return;
            }
            
            // Update player's current chips
            const playerIndex = PokerApp.state.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                PokerApp.state.players[playerIndex].current_chips = newChips;
                saveState();
                showToast(`Updated ${PokerApp.state.players[playerIndex].name}'s chips to ${newChips}`, 'info');
                updateTotalsRow();
                updateEmptyState();
            }
        });
    });
}

function updateTotalsRow() {
    const tableBody = document.querySelector('#player-table tbody');
    if (!tableBody) return;
    
    // Remove existing totals row if it exists
    const existingTotalsRow = tableBody.querySelector('.totals-row');
    if (existingTotalsRow) {
        existingTotalsRow.remove();
    }
    
    // Calculate totals
    const totalInitial = PokerApp.state.players.reduce((total, player) => total + player.initial_chips, 0);
    const totalCurrent = PokerApp.state.players.reduce((total, player) => total + player.current_chips, 0);
    
    // Create totals row with modern style
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.style.background = 'linear-gradient(135deg, rgba(var(--main-color-rgb), 0.2), rgba(var(--secondary-color-rgb), 0.2))';
    totalsRow.style.fontWeight = 'bold';
    
    totalsRow.innerHTML = `
        <td>
            <div style="display: flex; align-items: center;">
                <div class="player-avatar" style="background: rgba(255,255,255,0.2);">Σ</div>
                <strong>Totals</strong>
            </div>
        </td>
        <td><strong>${totalInitial}</strong></td>
        <td><strong>${totalCurrent}</strong></td>
        <td></td>
    `;
    
    tableBody.appendChild(totalsRow);
}

// Calculate payouts between players
function calculatePayouts() {
    // Make sure we have players
    if (PokerApp.state.players.length < 2) {
        showToast('Need at least 2 players to calculate payouts', 'error');
        return;
    }
    
    const payoutList = document.getElementById('payout-list');
    if (!payoutList) return;
    
    // Calculate initial and final chip counts
    const players = PokerApp.state.players.map(player => ({
        name: player.name,
        initial: player.initial_chips,
        current: player.current_chips,
        diff: player.current_chips - player.initial_chips
    }));
    
    // Sort by difference (winners to losers)
    players.sort((a, b) => b.diff - a.diff);
    
    // Generate payout instructions
    let transactions = [];
    let debtors = players.filter(p => p.diff < 0);
    let creditors = players.filter(p => p.diff > 0);
    
    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        
        // Calculate the transaction amount
        const amount = Math.min(Math.abs(debtor.diff), Math.abs(creditor.diff));
        
        // Record the transaction
        transactions.push({
            from: debtor.name,
            to: creditor.name,
            chips: amount,
            cash: (amount * PokerApp.state.chipRatio).toFixed(2)
        });
        
        // Update balances
        debtor.diff += amount;
        creditor.diff -= amount;
        
        // Remove settled players
        if (Math.abs(debtor.diff) < 0.001) {
            debtors.shift();
        }
        
        if (Math.abs(creditor.diff) < 0.001) {
            creditors.shift();
        }
    }
    
    // Display transactions
    if (transactions.length === 0) {
        payoutList.innerHTML = '<div class="payout-message">All players are even, no payouts needed.</div>';
    } else {
        let html = '<div class="payout-instructions">';
        html += '<h4>Payment Instructions:</h4>';
        html += '<ul class="payout-transactions">';
        
        transactions.forEach(t => {
            html += `<li><strong>${t.from}</strong> pays <strong>${t.to}</strong>: ${t.chips} chips ($${t.cash})</li>`;
        });
        
        html += '</ul></div>';
        payoutList.innerHTML = html;
    }
}

// Initialize PokerApp immediately
window.PokerApp = {
    // Core application state
    state: {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: 'classic-green',
        sessionId: null,
        gameName: null,
        lobbyActive: false
    },
    
    // UI module for handling display and user interface
    UI: {
        handAnimation: null,
        toastTimeout: null,
        showToast: function(message, type = 'success') {
            const toastContainer = document.getElementById('toast-container') || createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        },
        initialize: function() {
            initializeUI();
            initializeDealerWheel();
            updateEmptyState();
            if (!this.theme) {
                setTheme(PokerApp.state.theme);
            }
        }
    },
    
    // Player management module
    Players: {
        // Add a new player
        add(name, chips) {
            return addPlayer(name, chips);
        },
        
        // Remove a player
        remove(playerId) {
            return removePlayer(playerId);
        },
        
        // Update the player list display
        updateList() {
            // Call both updatePlayerList and updateEmptyState to ensure everything is updated
            updatePlayerList();
            return updateEmptyState();
        }
    },
    
    // Game management module
    Game: {
        // Start a new game
        start() {
            return startGame();
        },
        
        // End the current game
        end() {
            return endGame();
        },
        
        // Reset the game state
        reset() {
            return resetGame();
        },
        
        // Calculate payouts between players
        calculatePayouts() {
            return calculatePayouts();
        }
    },
    
    // Storage module for persistence
    Storage: {
        // Save the current game state
        save() {
            return saveState();
        },
        
        // Load the saved game state
        load() {
            return loadSavedState();
        }
    },
    
    // Initialize the application
    initialize: async function() {
        console.log('Initializing PokerApp...');
        
        try {
            // Load saved state from localStorage
            const savedState = localStorage.getItem('pokerGameState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Restore all state properties from localStorage
                this.state.players = state.players || [];
                this.state.gameInProgress = state.gameInProgress || false;
                this.state.dealerId = state.dealerId || null;
                this.state.nextPlayerId = state.nextPlayerId || 1;
                this.state.chipRatio = state.chipRatio || 1.0;
                this.state.theme = state.theme || 'classic-green';
                
                // Critical: Preserve session info across refreshes
                this.state.sessionId = state.sessionId || null;
                this.state.gameName = state.gameName || null;
                this.state.lobbyActive = state.lobbyActive || false;
                
                console.log('Loaded state from localStorage:', this.state);
            }
            
            // Initialize UI components
            this.UI.initialize();
            
            // Setup event listeners
            setupEventListeners();
            
            // Set up auto-save
            setInterval(() => saveState(), 5000); // Save every 5 seconds
            window.addEventListener('beforeunload', () => saveState());
            
            // Update UI with loaded state
            updatePlayerList();
            updateEmptyState();
            
            // Important: If we have an active session from localStorage, 
            // make sure we restore the lobby UI and Firebase listeners
            if (this.state.sessionId && this.state.lobbyActive) {
                console.log('Restoring active session from localStorage:', this.state.sessionId);
                updateLobbyUI(true);
                // Setup Firebase listeners for the restored session
                setupFirebaseListeners(this.state.sessionId);
            }
            
            console.log('PokerApp initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
};

// For backward compatibility
let gameState = window.PokerApp.state;
let handAnimation = null;

// Global initialize function for backward compatibility
function initialize() {
    console.log('------ INITIALIZING APP ------');
    
    // Handle URL parameters before initializing the app
    handleURLParameters();
    
    // Then initialize the main app
    PokerApp.initialize();
    
    // Setup Firebase listeners for real-time updates
    setupFirebaseListeners();
    
    // Add a direct debug test that will run 5 seconds after initialization
    setTimeout(() => {
        console.log('------ CHECKING FIREBASE CONNECTION ------');
        
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.error('Firebase not available');
            return;
        }
        
        const testRef = firebase.database().ref('test');
        console.log('Writing test data to Firebase...');
        
        testRef.set({
            timestamp: Date.now(),
            message: 'Test connection from main app'
        })
        .then(() => {
            console.log('Test write successful');
            
            // Now test if we can read it back
            return testRef.once('value');
        })
        .then((snapshot) => {
            console.log('Test read successful:', snapshot.val());
            console.log('Firebase connection is working properly');
            
            // Check if we have an active session
            if (PokerApp.state.sessionId) {
                console.log(`Active session ID: ${PokerApp.state.sessionId}`);
                
                // Force a refresh of the Firebase listeners
                setupFirebaseListeners(PokerApp.state.sessionId, true);
            } else {
                console.log('No active session ID');
            }
        })
        .catch((error) => {
            console.error('Firebase test failed:', error);
        });
    }, 5000);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    updateEmptyState();
    setTheme(gameState.theme || 'classic-green');
});

// Initialize UI elements
function initializeUI() {
    // Set initial display states
    const animationSection = document.getElementById('animation');
    if (animationSection) {
        animationSection.style.display = 'none'; // Only show when game starts
    }
    
    // Initialize the ratio display
    const ratioDisplay = document.getElementById('ratio-display');
    if (ratioDisplay) {
        ratioDisplay.textContent = `Each chip is worth $${gameState.chipRatio.toFixed(2)}`;
    }
    
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Initialize dealer wheel
function initializeDealerWheel() {
    const container = document.getElementById('dealer-wheel');
    if (!container) {
        console.error('Dealer wheel container not found');
        return;
    }
    
    try {
        handAnimation = new HandAnimation(container);
        
        // Only set the theme if it's not already set in gameState
        if (!gameState.theme) {
            const savedTheme = localStorage.getItem('pokerTheme') || 'classic-green';
            if (themes[savedTheme]) {
                setTheme(savedTheme);
                const themeSelector = document.getElementById('theme-selector');
                if (themeSelector) {
                    themeSelector.value = savedTheme;
                }
            } else {
                setTheme('classic-green');
            }
        } else {
            // Apply the current theme to the dealer wheel
            handAnimation.setTheme(themes[gameState.theme]);
        }

        // Set up players if they exist
        if (gameState.players.length > 0) {
            handAnimation.setPlayers(gameState.players);
        }
    } catch (error) {
        console.error('Error initializing dealer wheel:', error);
        showToast('Error initializing poker table. Please refresh the page.', 'error');
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        // Set the initial value based on the current theme
        if (gameState.theme) {
            themeSelector.value = gameState.theme;
        }
        
        themeSelector.addEventListener('change', function(e) {
            const selectedTheme = e.target.value;
            setTheme(selectedTheme);
            showToast(`Theme set to ${selectedTheme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        });
    }

    // Ratio form handler
    const ratioForm = document.getElementById('ratio-form');
    if (ratioForm) {
        ratioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let realMoney = parseFloat(document.getElementById('money-amount').value);
            let chips = parseInt(document.getElementById('chip-amount').value);
            
            if (isNaN(realMoney) || isNaN(chips) || realMoney <= 0 || chips <= 0) {
                showToast('Please enter valid numbers for money and chips.', 'error');
                return;
            }
            
            gameState.chipRatio = realMoney / chips;
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.textContent = `Each chip is worth $${gameState.chipRatio.toFixed(2)}`;
                ratioDisplay.classList.add('highlight');
                setTimeout(() => {
                    ratioDisplay.classList.remove('highlight');
                }, 1500);
            }
            
            PokerApp.Storage.save();
            showToast('Ratio set successfully!');
            
            // Optionally close the form
            const ratioContent = document.getElementById('ratio-content');
            const minimizeButton = document.getElementById('minimize-button');
            if (ratioContent && minimizeButton) {
                ratioContent.classList.add('hidden');
                minimizeButton.textContent = '+';
            }
        });
    }

    // Set up the add player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            const initialChips = parseInt(document.getElementById('initial-chips').value);
            
            if (!playerName) {
                showToast('Please enter a player name', 'error');
                return;
            }
            
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

    // Game control buttons with improved functionality and feedback
    const startGameBtn = document.getElementById('start-game');
    const endGameBtn = document.getElementById('end-game');
    const resetGameBtn = document.getElementById('reset-game');
    const simulateHandBtn = document.getElementById('simulate-hand');  // New button for clarity
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            if (gameState.players.length < 2) {
                showToast('Need at least 2 players to start a game', 'error');
                startGameBtn.classList.add('invalid-action');
                setTimeout(() => startGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            PokerApp.Game.start();
        });
    }
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', function() {
            if (!gameState.gameInProgress) {
                showToast('No active game to end', 'error');
                endGameBtn.classList.add('invalid-action');
                setTimeout(() => endGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            PokerApp.Game.end();
        });
    }
    
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', function() {
            // Make reset require confirmation
            if (confirm('Are you sure you want to reset the game? This will clear all players and settings.')) {
                PokerApp.Game.reset();
            }
        });
    }
    
    // Add a new button specifically for simulating hands
    if (simulateHandBtn) {
        simulateHandBtn.addEventListener('click', function() {
            if (!gameState.gameInProgress) {
                showToast('Start the game first to simulate hands', 'error');
                simulateHandBtn.classList.add('invalid-action');
                setTimeout(() => simulateHandBtn.classList.remove('invalid-action'), 500);
                return;
            }
            
            if (handAnimation && handAnimation.isAnimating) {
                showToast('Animation already in progress', 'error');
                return;
            }
            
            // Spin the dealer wheel to simulate a hand
            if (handAnimation) {
                try {
                    handAnimation.spin();
                    showToast('Simulating a new hand...');
                } catch (error) {
                    console.error('Error simulating hand:', error);
                    showToast('Error simulating hand', 'error');
                }
            }
        });
    }

    // Payout calculation
    const calculatePayoutsBtn = document.getElementById('calculate-payouts');
    if (calculatePayoutsBtn) {
        calculatePayoutsBtn.addEventListener('click', PokerApp.Game.calculatePayouts);
    }

    // Add touch event handling for better mobile experience
    if ('ontouchstart' in window) {
        // Add passive touch listeners to improve scrolling performance
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Make buttons more responsive on touch devices
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    // Add event listeners to chip inputs for realtime updates
    document.querySelectorAll('.chip-input').forEach(input => {
        // Use input event for immediate updates
        input.addEventListener('input', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                // Don't update for invalid values
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                // Update totals row immediately
                updateTotalsRow();
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
        
        // Keep the change event for validation and persistence
        input.addEventListener('change', function() {
            // Check if the element has the data-player-id attribute
            if (!this.hasAttribute('data-player-id')) {
                return;
            }
            
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                // Log error only if there was an attempt to get a player ID but it was invalid
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                showToast('Please enter a valid chip amount.', 'error');
                // Reset to previous value
                const playerIndex = gameState.players.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    this.value = gameState.players[playerIndex].current_chips;
                }
                return;
            }
            
            // Update player's current chips
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                gameState.players[playerIndex].current_chips = newChips;
                PokerApp.Storage.save();
                showToast(`Updated ${gameState.players[playerIndex].name}'s chips to ${newChips}`, 'info');
                
                // Update totals row
                updateTotalsRow();
                
                // Update payout instructions with new prize pool info
                updateEmptyState();
            }
        });
    });

    // Lobby form handler
    const lobbyForm = document.getElementById('lobby-form');
    if (lobbyForm) {
        lobbyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const gameName = document.getElementById('game-name').value.trim();
            
            if (!gameName) {
                showToast('Please enter a game name', 'error');
                return;
            }
            
            // Disable form while creating lobby
            const submitButton = this.querySelector('button[type="submit"]');
            const gameNameInput = document.getElementById('game-name');
            if (submitButton) submitButton.disabled = true;
            if (gameNameInput) gameNameInput.disabled = true;
            
            try {
                await createGameLobby(gameName);
            } catch (error) {
                console.error('Failed to create game lobby:', error);
                // Form will be re-enabled by updateLobbyUI(false) in createGameLobby error handler
            }
        });
    }
    
    // Add refresh Firebase button handler
    const refreshFirebaseButton = document.getElementById('refresh-firebase');
    if (refreshFirebaseButton) {
        refreshFirebaseButton.addEventListener('click', function() {
            if (!PokerApp.state.sessionId) {
                showToast('No active game to refresh', 'error');
                return;
            }
            
            showToast('Manually refreshing player data...', 'info');
            console.log('[FIREBASE] Manual refresh requested for game:', PokerApp.state.sessionId);
            
            // Force refresh of Firebase listeners
            setupFirebaseListeners(PokerApp.state.sessionId, true);
            
            // Also manually fetch latest player data
            firebase.database().ref(`games/${PokerApp.state.sessionId}/state/players`).once('value')
                .then(snapshot => {
                    console.log('[FIREBASE] Manual refresh data:', snapshot.val());
                    handlePlayerDataUpdate(snapshot.val());
                    showToast('Player data refreshed', 'success');
                })
                .catch(error => {
                    console.error('[FIREBASE] Manual refresh failed:', error);
                    showToast('Failed to refresh data: ' + error.message, 'error');
                });
        });
    }
}

// Touch event handlers for mobile
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    // Implement if needed for swipe gestures
}

function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Reset touch coordinates
    touchStartX = 0;
    touchStartY = 0;
    
    // Minimum distance for a swipe
    const minSwipeDistance = 50;
    
    // Check for horizontal swipe (can be used for future features like swiping between players)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
            // Swipe left - can be used for future features
        } else {
            // Swipe right - can be used for future features
        }
    }
}

// Function to update empty state messages and UI based on game state
function updateEmptyState() {
    const playerList = document.getElementById('player-list');
    const emptyState = document.getElementById('empty-state');
    const payoutInstructions = document.getElementById('payout-instructions');
    
    // If no player list is found, can't update anything
    if (!playerList) return;
    
    // Handle empty player list
    if (PokerApp.state.players.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>No players added yet. Add players to get started!</p>';
        }
        
        if (payoutInstructions) {
            payoutInstructions.innerHTML = '';
        }
        
        return;
    }
    
    // Hide empty state message when we have players
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Update payout instructions
    if (payoutInstructions) {
        const totalChips = PokerApp.state.players.reduce((sum, p) => sum + p.current_chips, 0);
        const totalBuyIn = PokerApp.state.players.reduce((sum, p) => sum + p.initial_chips, 0);
        
        let html = '<h3>Game Information</h3>';
        html += `<p>Total buy-in: ${totalBuyIn} chips</p>`;
        html += `<p>Current chips in play: ${totalChips} chips</p>`;
        
        if (PokerApp.state.chipRatio > 0) {
            const moneyPool = (totalBuyIn * PokerApp.state.chipRatio).toFixed(2);
            html += `<p>Prize pool: $${moneyPool}</p>`;
        }
        
        payoutInstructions.innerHTML = html;
    }
}

// Toast notification system
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Create and manage game lobbies
async function createGameLobby(gameName) {
    try {
        // Generate a unique session ID
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        // Set up game state
        PokerApp.state.sessionId = sessionId;
        PokerApp.state.gameName = gameName;
        PokerApp.state.lobbyActive = true;
        
        // Save current state to Firebase
        const gameData = {
            id: sessionId,
            name: gameName,
            createdAt: Date.now(),
            state: PokerApp.state,
            active: true,
            ratio: PokerApp.state.chipRatio || 1.0
        };
        
        // If Firebase is initialized, save to Firebase
        if (typeof firebase !== 'undefined' && firebase.database) {
            await firebase.database().ref(`games/${sessionId}`).set(gameData);
        }
        
        // Generate QR code for joining the game
        generateQRCode(sessionId, gameName);
        
        // Update UI to show game is active
        updateLobbyUI(true);
        
        showToast(`Game lobby "${gameName}" created successfully!`, 'success');
        return sessionId;
    } catch (error) {
        console.error('Error creating game lobby:', error);
        showToast('Failed to create game lobby', 'error');
        updateLobbyUI(false);
        throw error;
    }
}

// Handle URL parameters for joining games
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game-name');
    const gameId = urlParams.get('gameId') || urlParams.get('game-id');
    
    if (gameName || gameId) {
        // We're in a game - make sure we're connecting to the correct game
        console.log(`Loading game: ${gameName || 'Unknown'} (ID: ${gameId || 'Unknown'})`);
        
        // If we have a game ID, try to load it from Firebase
        if (gameId) {
            // Set session ID immediately so Firebase listeners can be set up
            PokerApp.state.sessionId = gameId;
            PokerApp.state.gameName = gameName || 'Unknown Game';
            
            // Make sure Firebase is ready
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.database) {
                    // Firebase is ready, load the game
                    loadGameFromFirebase(gameId, gameName);
                } else {
                    // Firebase not ready yet, wait and try again
                    console.log('Waiting for Firebase to initialize...');
                    setTimeout(checkFirebase, 500);
                }
            };
            
            checkFirebase();
        }
    }
}

// Load game data from Firebase
function loadGameFromFirebase(gameId, gameName) {
    console.log(`Loading game data from Firebase for ${gameId}`);
    
    firebase.database().ref(`games/${gameId}`).once('value')
        .then(snapshot => {
            const gameData = snapshot.val();
            if (!gameData) {
                showToast('Game not found or no longer active', 'error');
                return;
            }
            
            // Update our state with the game data
            if (gameData.state) {
                PokerApp.state = {...PokerApp.state, ...gameData.state};
            }
            
            // Ensure the sessionId is set for Firebase listeners
            PokerApp.state.sessionId = gameId;
            PokerApp.state.gameName = gameData.name || gameName || 'Unknown Game';
            PokerApp.state.lobbyActive = true;
            
            // Update the UI
            updatePlayerList();
            updateEmptyState();
            updateLobbyUI(true);
            
            // Set up Firebase listeners after confirming the game exists
            setupFirebaseListeners(gameId);
            
            showToast(`Connected to game: ${PokerApp.state.gameName}`, 'success');
        })
        .catch(error => {
            console.error('Error loading game:', error);
            showToast('Error loading game. Please try again.', 'error');
        });
}

// Generate QR code for players to join
function generateQRCode(sessionId, gameName) {
    const qrWrapper = document.querySelector('#qr-code-container .qr-wrapper');
    if (!qrWrapper) return;
    
    // Clear previous QR code
    qrWrapper.innerHTML = '';
    
    // Create join URL
    const baseUrl = window.location.origin;
    const joinUrl = `${baseUrl}/buy-in.html?game-id=${sessionId}&game-name=${encodeURIComponent(gameName)}`;
    
    // Generate QR code if library is available
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrWrapper, {
            text: joinUrl,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Add link below QR code
        const linkElement = document.createElement('a');
        linkElement.href = joinUrl;
        linkElement.target = '_blank';
        linkElement.textContent = 'Open Join Link';
        linkElement.className = 'join-link';
        qrWrapper.appendChild(linkElement);

        // Show the QR code container
        const qrCodeContainer = document.getElementById('qr-code-container');
        if (qrCodeContainer) {
            qrCodeContainer.style.display = 'block';
        }
    } else {
        // Fallback if QR library not loaded
        qrWrapper.innerHTML = `
            <div class="qr-fallback">
                <p>QR code generation failed</p>
                <a href="${joinUrl}" target="_blank" class="join-link">Open Join Link</a>
            </div>
        `;
    }
}

// Update the UI based on lobby state
function updateLobbyUI(isActive) {
    const lobbyForm = document.getElementById('lobby-form');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const submitButton = lobbyForm ? lobbyForm.querySelector('button[type="submit"]') : null;
    const gameNameInput = document.getElementById('game-name');
    const lobbyStatusBadge = document.querySelector('#game-lobby .game-status-badge');
    const lobbyStatusText = document.getElementById('lobby-status');
    
    if (isActive) {
        // Show QR code and update form
        if (qrCodeContainer) qrCodeContainer.style.display = 'block';
        if (submitButton) submitButton.textContent = 'Update Lobby';
        if (gameNameInput) {
            gameNameInput.value = PokerApp.state.gameName || '';
            gameNameInput.disabled = false;
        }
        
        // Update lobby status badge
        if (lobbyStatusBadge) {
            lobbyStatusBadge.classList.remove('inactive');
            lobbyStatusBadge.classList.add('active');
        }
        
        // Update lobby status text
        if (lobbyStatusText) {
            lobbyStatusText.textContent = 'Lobby Active';
        }
        
        // Display game status
        updateGameStatus('Lobby Active', true);
    } else {
        // Hide QR code and reset form
        if (qrCodeContainer) qrCodeContainer.style.display = 'none';
        if (submitButton) {
            submitButton.textContent = 'Create Game Lobby';
            submitButton.disabled = false;
        }
        if (gameNameInput) {
            gameNameInput.value = '';
            gameNameInput.disabled = false;
        }
        
        // Update lobby status badge
        if (lobbyStatusBadge) {
            lobbyStatusBadge.classList.remove('active');
            lobbyStatusBadge.classList.add('inactive');
        }
        
        // Update lobby status text
        if (lobbyStatusText) {
            lobbyStatusText.textContent = 'No active game';
        }
        
        // Reset game status
        updateGameStatus(PokerApp.state.gameInProgress ? 'Game in progress' : 'No active game', PokerApp.state.gameInProgress);
        
        // Reset state
        PokerApp.state.sessionId = null;
        PokerApp.state.gameName = null;
        PokerApp.state.lobbyActive = false;
    }
}

// Update game status badge and text
function updateGameStatus(statusText, isActive = false) {
    const gameStatusBadge = document.querySelector('#game-controls .game-status-badge');
    const gameStatusText = document.getElementById('game-status');
    
    if (gameStatusBadge) {
        if (isActive) {
            gameStatusBadge.classList.remove('inactive');
            gameStatusBadge.classList.add('active');
        } else {
            gameStatusBadge.classList.remove('active');
            gameStatusBadge.classList.add('inactive');
        }
    }
    
    if (gameStatusText) {
        gameStatusText.textContent = statusText;
    }
}

// Theme handling
document.addEventListener('DOMContentLoaded', function() {
    const themeSelector = document.getElementById('theme-selector');
    
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'doginme';
    if (themeSelector) {
        // Set the value first
        themeSelector.value = savedTheme;
        
        // Force text color and visibility
        themeSelector.style.color = 'white';
        themeSelector.style.webkitTextFillColor = 'white';
        themeSelector.style.opacity = '1';
        themeSelector.style.backgroundColor = '#1a1a1a';
        
        // Force text display for mobile
        if (window.innerWidth <= 480) {
            themeSelector.style.textIndent = '0';
            themeSelector.style.appearance = 'menulist';
            themeSelector.style.webkitAppearance = 'menulist';
        }
        
        // Force text color for options
        Array.from(themeSelector.options).forEach(option => {
            option.style.color = 'white';
            option.style.webkitTextFillColor = 'white';
            option.style.opacity = '1';
            option.style.backgroundColor = '#1a1a1a';
        });
        
        // Force text color for selected option
        const selectedOption = themeSelector.options[themeSelector.selectedIndex];
        if (selectedOption) {
            selectedOption.style.color = 'white';
            selectedOption.style.webkitTextFillColor = 'white';
            selectedOption.style.opacity = '1';
            selectedOption.style.backgroundColor = '#333';
            selectedOption.style.fontWeight = 'bold';
        }
    }
    
    // Set the theme
    setTheme(savedTheme);

    // Handle theme changes
    if (themeSelector) {
        themeSelector.addEventListener('change', function(e) {
            const theme = e.target.value;
            setTheme(theme);
            
            // Force text color and visibility
            themeSelector.style.color = 'white';
            themeSelector.style.webkitTextFillColor = 'white';
            themeSelector.style.opacity = '1';
            themeSelector.style.backgroundColor = '#1a1a1a';
            
            // Force text display for mobile
            if (window.innerWidth <= 480) {
                themeSelector.style.textIndent = '0';
                themeSelector.style.appearance = 'menulist';
                themeSelector.style.webkitAppearance = 'menulist';
            }
            
            // Force text color for options
            Array.from(themeSelector.options).forEach(option => {
                option.style.color = 'white';
                option.style.webkitTextFillColor = 'white';
                option.style.opacity = '1';
                option.style.backgroundColor = '#1a1a1a';
            });
            
            // Force text color for selected option
            const selectedOption = themeSelector.options[themeSelector.selectedIndex];
            if (selectedOption) {
                selectedOption.style.color = 'white';
                selectedOption.style.webkitTextFillColor = 'white';
                selectedOption.style.opacity = '1';
                selectedOption.style.backgroundColor = '#333';
                selectedOption.style.fontWeight = 'bold';
            }
        });
    }
});

// Setup Firebase listeners for real-time player updates
function setupFirebaseListeners(gameIdOverride, forceRefresh = false) {
    // Use the override if provided, otherwise use the state
    const gameId = gameIdOverride || PokerApp.state.sessionId;
    
    if (!gameId) {
        console.error('[FIREBASE] No game ID provided for Firebase listeners');
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error('[FIREBASE] Firebase not initialized yet');
        return;
    }
    
    console.log(`[FIREBASE] Setting up Firebase listeners for game: ${gameId}`);
    
    // Test if the gameId exists first
    firebase.database().ref(`games/${gameId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.error(`[FIREBASE] Game with ID ${gameId} does not exist in the database`);
                showToast(`Game with ID ${gameId} not found in database`, 'error');
                return;
            }
            
            console.log(`[FIREBASE] Game data exists:`, snapshot.val());
            
            // Game exists, so set up listeners
            setupPlayerListener(gameId, forceRefresh);
            setupGameListener(gameId, forceRefresh);
            
            // NEW: Set up notification listener for real-time player joins
            setupNotificationListener(gameId);
        })
        .catch(error => {
            console.error(`[FIREBASE] Error checking game existence:`, error);
        });
}

// NEW: Set up notification listener for real-time player joins
function setupNotificationListener(gameId) {
    // Listen for notification events, especially player joins
    const notificationRef = firebase.database().ref('playerNotifications');
    
    // Remove any existing notification listeners
    notificationRef.off('child_added');
    
    // Store the current timestamp - we'll only process notifications
    // that came in after we set up this listener
    const startTime = Date.now() - (60 * 1000); // Include the last minute for safety
    
    // Set up a listener for new and recent notifications
    notificationRef.orderByChild('timestamp').startAt(startTime).on('child_added', 
        (snapshot) => {
            const notification = snapshot.val();
            console.log(`[FIREBASE] Received notification:`, notification);
            
            // Only process notifications for our game
            if (notification && notification.gameId === gameId) {
                console.log(`[FIREBASE] Processing notification for our game:`, notification);
                
                if (notification.type === 'playerJoined') {
                    // A new player has joined - update immediately
                    console.log(`[FIREBASE] New player joined:`, notification.player);
                    
                    // First, check if we already have this player
                    const existingPlayerIndex = PokerApp.state.players.findIndex(p => 
                        (p.id && p.id === parseInt(notification.player.id)) || 
                        (p.name && notification.player.name && 
                         p.name.toLowerCase() === notification.player.name.toLowerCase())
                    );
                    
                    if (existingPlayerIndex === -1) {
                        // New player - add them
                        const playerData = {
                            id: parseInt(notification.player.id),
                            name: notification.player.name,
                            initial_chips: parseInt(notification.player.initial_chips),
                            current_chips: parseInt(notification.player.current_chips)
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
                        showToast(`New player joined: ${notification.player.name}`, 'success');
                        
                        // Save state to localStorage
                        saveState();
                    } else {
                        console.log(`[FIREBASE] Player already exists in state, skipping:`, notification.player.name);
                    }
                    
                    // Once processed, remove the notification
                    snapshot.ref.remove().catch(error => {
                        console.error('[FIREBASE] Error removing processed notification:', error);
                    });
                }
            }
        },
        (error) => {
            console.error('[FIREBASE] Error in notification listener:', error);
        }
    );
    
    console.log(`[FIREBASE] Notification listener set up`);
}

// Set up the player list listener separately
function setupPlayerListener(gameId, forceRefresh = false) {
    // Listen for player list changes
    const playersRef = firebase.database().ref(`games/${gameId}/state/players`);
    
    // Remove any existing listeners first to avoid duplicates
    if (forceRefresh) {
        console.log(`[FIREBASE] Force refreshing player listener for game: ${gameId}`);
        playersRef.off('value');
    }
    
    console.log(`[FIREBASE] Setting up player listener for path: games/${gameId}/state/players`);
    
    // Set up the listener with error handling
    playersRef.on('value', 
        // Success callback
        (snapshot) => {
            console.log(`[FIREBASE] Received player data update for game ${gameId}:`, snapshot.val());
            handlePlayerDataUpdate(snapshot.val());
        }, 
        // Error callback
        (error) => {
            console.error(`[FIREBASE] Error in player listener:`, error);
            showToast(`Error syncing player data: ${error.message}`, 'error');
        }
    );
    
    // Also listen for lastUpdate changes which can trigger a refresh
    const lastUpdateRef = firebase.database().ref(`games/${gameId}/state/lastUpdate`);
    lastUpdateRef.on('value', (snapshot) => {
        const timestamp = snapshot.val();
        if (timestamp) {
            console.log(`[FIREBASE] Detected state update at ${new Date(timestamp).toLocaleTimeString()}`);
            
            // Refresh player data explicitly
            playersRef.once('value').then(snapshot => {
                console.log(`[FIREBASE] Explicitly refreshing player data:`, snapshot.val());
                handlePlayerDataUpdate(snapshot.val());
            }).catch(error => {
                console.error(`[FIREBASE] Error refreshing player data:`, error);
            });
        }
    });
}

// Set up the game state listener separately
function setupGameListener(gameId, forceRefresh = false) {
    // Listen for game state changes
    const gameRef = firebase.database().ref(`games/${gameId}`);
    
    // Remove any existing listeners first to avoid duplicates
    if (forceRefresh) {
        console.log(`[FIREBASE] Force refreshing game listener for game: ${gameId}`);
        gameRef.off('value');
    }
    
    console.log(`[FIREBASE] Setting up game listener for path: games/${gameId}`);
    
    // Set up the listener with error handling
    gameRef.on('value', 
        // Success callback
        (snapshot) => {
            console.log(`[FIREBASE] Received game data update for game ${gameId}:`, snapshot.val());
            handleGameDataUpdate(snapshot.val());
        }, 
        // Error callback
        (error) => {
            console.error(`[FIREBASE] Error in game listener:`, error);
            showToast(`Error syncing game data: ${error.message}`, 'error');
        }
    );
}

// Handle player data updates separately for better error handling
function handlePlayerDataUpdate(playersData) {
    // Only update if we have valid player data
    if (!playersData) {
        console.log('[FIREBASE] No player data received or empty data');
        return;
    }
    
    try {
        // Handle both array and object formats from Firebase
        let playersList = [];
        
        if (Array.isArray(playersData)) {
            console.log('[FIREBASE] Players data is an array with length:', playersData.length);
            playersList = playersData.filter(p => p !== null && p !== undefined);
        } else if (typeof playersData === 'object') {
            console.log('[FIREBASE] Players data is an object, converting to array');
            playersList = Object.values(playersData).filter(p => p !== null && p !== undefined);
        }
        
        if (playersList.length > 0) {
            console.log('[FIREBASE] Processing player list with length:', playersList.length);
            
            // Log the first player for debugging
            if (playersList[0]) {
                console.log('[FIREBASE] Sample player data:', playersList[0]);
            }
            
            // Update the local state with the new player data
            PokerApp.state.players = playersList.map(player => ({
                id: parseInt(player.id || 0),
                name: player.name || 'Unknown Player',
                initial_chips: parseInt(player.initial_chips || 0),
                current_chips: parseInt(player.current_chips || 0)
            }));
            
            // Log the updated state
            console.log('[FIREBASE] Updated player state:', PokerApp.state.players);
            
            // Update UI with new players
            updatePlayerList();
            updateEmptyState();
            
            // Update hand animation if it exists
            if (window.handAnimation) {
                window.handAnimation.setPlayers(PokerApp.state.players);
            }
            
            // Only show toast for new players to avoid flooding
            updatePlayerCountNotification(playersList.length);
        } else {
            console.log('[FIREBASE] Player list is empty after processing');
        }
    } catch (error) {
        console.error('[FIREBASE] Error processing player data:', error);
    }
}

// Handle game data updates separately
function handleGameDataUpdate(gameData) {
    if (!gameData) {
        console.log('[FIREBASE] No game data received or empty data');
        return;
    }
    
    try {
        console.log('[FIREBASE] Processing game data update');
        
        // Update ratio if it exists
        if (gameData.ratio) {
            const ratio = parseFloat(gameData.ratio);
            PokerApp.state.chipRatio = ratio;
            
            // Update ratio display
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.textContent = `Each chip is worth $${ratio.toFixed(2)}`;
                console.log('[FIREBASE] Updated chip ratio to:', ratio);
            }
        }
        
        // Check game active status
        if (gameData.active === false) {
            console.log('[FIREBASE] Game is no longer active');
            showToast('Game is no longer active', 'error');
            
            // Clean up all listeners for this game
            firebase.database().ref(`games/${gameData.id}`).off();
            
            // Update UI to reflect inactive game
            updateLobbyUI(false);
        }
    } catch (error) {
        console.error('[FIREBASE] Error processing game data:', error);
    }
}

// Track player count for notifications
window._lastPlayerCount = 0;
function updatePlayerCountNotification(currentCount) {
    // If this is our first update or we have new players
    if (!window._lastPlayerCount || currentCount > window._lastPlayerCount) {
        const diff = currentCount - window._lastPlayerCount;
        
        if (diff > 0) {
            console.log(`[FIREBASE] ${diff} new player(s) joined`);
            showToast(`${diff} new player${diff > 1 ? 's' : ''} joined`, 'success');
        }
    }
    
    // Update the counter
    window._lastPlayerCount = currentCount;
}

function endGame() {
    PokerApp.state.gameInProgress = false;
    updateEmptyState();
    
    // Update UI elements
    document.getElementById('start-game').disabled = false;
    document.getElementById('simulate-hand').disabled = true;
    document.getElementById('end-game').disabled = true;
    document.getElementById('game-status').textContent = 'Game ended';
    document.getElementById('game-status').classList.remove('active');
    
    // Clean up Firebase
    if (PokerApp.state.sessionId) {
        // Update game status to ended
        firebase.database().ref(`games/${PokerApp.state.sessionId}`).update({
            status: 'ended',
            active: false
        });
        
        // Remove all listeners
        firebase.database().ref(`games/${PokerApp.state.sessionId}`).off();
        firebase.database().ref(`games/${PokerApp.state.sessionId}/state/players`).off();
        
        // Reset session info
        PokerApp.state.sessionId = null;
        PokerApp.state.gameName = null;
        PokerApp.state.lobbyActive = false;
    }
    
    // Update lobby UI
    updateLobbyUI(false);
    
    // Save state
    saveState();
}