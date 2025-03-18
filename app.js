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

// Define application namespaces for better organization and future extensibility
const PokerApp = {
    // Core application state
    state: {
        players: [],
        gameInProgress: false,
        dealerId: null,
        nextPlayerId: 1,
        chipRatio: 1.0,
        theme: 'classic-green', // Default theme
        sessionId: null
    },
    
    // UI module for handling display and user interface
    UI: {
        handAnimation: null,
        toastTimeout: null,
        
        // Method to initialize the UI components
        initialize() {
            initializeUI();
            initializeDealerWheel();
            updateEmptyState();
            
            // Set default theme if none is saved
            if (!this.theme) {
                setTheme(PokerApp.state.theme);
            }
        },
        
        // Show a toast message to the user
        showToast(message, type = 'success') {
            return showToast(message, type);
        },
        
        // Update the UI to reflect the current game state
        updateUI() {
            updatePlayerList();
            updateEmptyState();
        },
        
        // Set the application theme
        setTheme(themeName) {
            return setTheme(themeName);
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
    initialize() {
        // Load saved state if available
        this.Storage.load();
        
        // Initialize UI components
        this.UI.initialize();
        
        // Setup event listeners
        setupEventListeners();
        
        // Make sure the empty state and payout instructions are updated
        updateEmptyState();
        
        console.log('Poker Home Game Manager initialized successfully');
        console.log('Player count:', gameState.players.length);
        console.log('Game in progress:', gameState.gameInProgress);
        console.log('Chip ratio:', gameState.chipRatio);
    }
};

// For backward compatibility - will reference the new structure internally
let gameState = PokerApp.state;
let handAnimation = null;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    PokerApp.initialize();
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

// Add player function
function addPlayer(name, chips) {
    if (!name || !chips) {
        console.error('Cannot add player: Missing name or chips');
        return false;
    }
    
    // Normalize and validate inputs
    name = name.trim();
    chips = parseInt(chips);
    
    if (name === '') {
        console.error('Cannot add player: Empty name');
        return false;
    }
    
    if (isNaN(chips) || chips <= 0) {
        console.error('Cannot add player: Invalid chip amount');
        return false;
    }
    
    console.log(`Adding player: ${name} with ${chips} chips`);
    
    // Check if player already exists
    const existingPlayerIndex = gameState.players.findIndex(
        p => p.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingPlayerIndex !== -1) {
        // Add chips to existing player instead of showing an error
        const existingPlayer = gameState.players[existingPlayerIndex];
        const previousChips = existingPlayer.initial_chips;
        existingPlayer.initial_chips += chips;
        existingPlayer.current_chips += chips;
        
        // Save players to localStorage
        savePlayers();
        
        // Update UI
        updatePlayerList();
        updateEmptyState();
        
        // Show success message
        showToast(`Added ${chips} chips to ${name}. New total: ${existingPlayer.initial_chips} chips`, 'success');
        return true;
    }
    
    // Add new player
    const newPlayer = {
        id: Date.now(), // Use timestamp as unique ID
        name: name,
        initial_chips: chips,
        current_chips: chips
    };
    
    // Add player to state
    gameState.players.push(newPlayer);
    
    // Save players to localStorage
    savePlayers();
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Show success message
    showToast(`Added ${name} with ${chips} chips`, 'success');
    
    // Initialize dealer wheel animation if needed
    if (gameState.players.length === 1) {
        initializeDealerWheel();
    } else if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
    }
    
    return true;
}

// Save players to localStorage
function savePlayers() {
    localStorage.setItem('pokerPlayers', JSON.stringify(gameState.players));
}

// Update player list in UI
function updatePlayerList() {
    const playerList = document.querySelector('#player-table tbody');
    if (!playerList) {
        console.error('Player table not found');
        return;
    }

    playerList.innerHTML = '';
    
    // Track totals
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    gameState.players.forEach(player => {
        const row = document.createElement('tr');
        
        // Make sure we have the current_chips value
        if (player.current_chips === undefined) {
            player.current_chips = player.initial_chips;
        }
        
        // Add to totals
        totalInitialChips += player.initial_chips;
        totalCurrentChips += player.current_chips;
        
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.initial_chips}</td>
            <td>
                <input
                    type="number"
                    class="chip-input"
                    value="${player.current_chips}"
                    min="0"
                    ${gameState.gameInProgress ? 'disabled' : ''}
                    data-player-id="${player.id}"
                >
            </td>
            <td>
                <button class="remove-player" data-player-id="${player.id}" ${gameState.gameInProgress ? 'disabled' : ''}>
                    Remove
                </button>
            </td>
        `;
        playerList.appendChild(row);
    });
    
    // Add a totals row if there are players
    if (gameState.players.length > 0) {
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'totals-row';
        totalsRow.innerHTML = `
            <td><strong>TOTALS</strong></td>
            <td><strong>${totalInitialChips}</strong></td>
            <td><strong>${totalCurrentChips}</strong></td>
            <td></td>
        `;
        playerList.appendChild(totalsRow);
    }
    
    // Add event listeners to the newly created remove buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                console.error('Invalid player ID for removal');
                return;
            }
            PokerApp.Players.remove(playerId);
        });
    });
    
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
    
    // Make sure to update the empty state after all UI changes
    updateEmptyState();
}

// Function to update just the totals row
function updateTotalsRow() {
    const totalsRow = document.querySelector('.totals-row');
    if (!totalsRow) return;
    
    let totalInitialChips = 0;
    let totalCurrentChips = 0;
    
    gameState.players.forEach(player => {
        totalInitialChips += player.initial_chips;
        totalCurrentChips += player.current_chips;
    });
    
    totalsRow.innerHTML = `
        <td><strong>TOTALS</strong></td>
        <td><strong>${totalInitialChips}</strong></td>
        <td><strong>${totalCurrentChips}</strong></td>
        <td></td>
    `;
}

// Function to force-read all chip values from the DOM
function forceUpdateChipValues() {
    try {
        // Get all chip inputs and update player data
        document.querySelectorAll('.chip-input').forEach(input => {
            // Check if the input element has the data-player-id attribute
            if (!input.hasAttribute('data-player-id')) {
                // Skip inputs without a player ID
                return;
            }
            
            const playerId = parseInt(input.getAttribute('data-player-id'));
            if (!playerId) {
                // Skip inputs with invalid player IDs (non-numeric or zero)
                return;
            }
            
            // Ensure we're getting the current value from the DOM
            const inputValue = input.value.trim();
            const newChips = parseInt(inputValue);
            
            if (isNaN(newChips)) {
                console.warn(`Invalid chip value for player ID ${playerId}: "${inputValue}"`);
                return;
            }
            
            // Find and update the player
            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                const oldValue = gameState.players[playerIndex].current_chips;
                gameState.players[playerIndex].current_chips = newChips;
                
                if (oldValue !== newChips) {
                    console.log(`Updated player ${gameState.players[playerIndex].name} chips from ${oldValue} to ${newChips}`);
                }
            }
        });
        
        // Save the updated state
        PokerApp.Storage.save();
        console.log('Chip values updated from inputs');
    } catch (error) {
        console.error('Error updating chip values:', error);
        showToast('Error updating chip values', 'error');
    }
}

// Remove player function
function removePlayer(playerId) {
    // Don't allow removing players if game has started
    if (gameState.gameInProgress) {
        showToast('Cannot remove players during an active game.', 'error');
        return;
    }
    
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        console.error('Player not found for removal:', playerId);
        return;
    }
    
    const playerName = gameState.players[playerIndex].name;
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    
    // Save state and update UI
    PokerApp.Storage.save();
    updatePlayerList(); // This will call updateEmptyState
    
    // Update dealer wheel if it exists
    if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
    }
    
    // Show success message
    showToast(`Player ${playerName} removed successfully`, 'success');
}

// Add game session management to gameState
gameState.sessionId = null;

// Function to initialize a new game session
async function initializeGameSession() {
    if (gameState.sessionId) {
        // Clear old session listeners
        database.ref(`games/${gameState.sessionId}`).off();
    }
    
    // Create new session
    const sessionRef = database.ref('games').push();
    gameState.sessionId = sessionRef.key;
    
    // Set initial session data
    await sessionRef.set({
        ratio: gameState.chipRatio,
        active: true,
        requests: {}
    });
    
    // Listen for buy-in requests
    listenForBuyInRequests();
    
    // Generate and display QR code
    generateQRCode();
}

// Function to generate QR code
function generateQRCode() {
    const buyInUrl = `${window.location.origin}/buy-in.html?gameId=${gameState.sessionId}`;
    
    // Create QR code container if it doesn't exist
    let qrContainer = document.getElementById('qr-code-container');
    if (!qrContainer) {
        qrContainer = document.createElement('div');
        qrContainer.id = 'qr-code-container';
        qrContainer.className = 'qr-code-section';
        
        const header = document.createElement('h2');
        header.textContent = 'Buy-in QR Code';
        qrContainer.appendChild(header);
        
        const qrWrapper = document.createElement('div');
        qrWrapper.className = 'qr-wrapper';
        qrContainer.appendChild(qrWrapper);
        
        const instructions = document.createElement('p');
        instructions.textContent = 'Players can scan this QR code to buy into the game';
        qrContainer.appendChild(instructions);
        
        // Add container after the money-to-chip-ratio section
        const ratioSection = document.getElementById('money-to-chip-ratio');
        ratioSection.parentNode.insertBefore(qrContainer, ratioSection.nextSibling);
    }
    
    // Generate QR code using qrcode.js library
    const qrWrapper = qrContainer.querySelector('.qr-wrapper');
    qrWrapper.innerHTML = '';
    new QRCode(qrWrapper, {
        text: buyInUrl,
        width: 200,
        height: 200,
        colorDark: getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim(),
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Function to listen for buy-in requests
function listenForBuyInRequests() {
    const requestsRef = database.ref(`games/${gameState.sessionId}/requests`);
    
    requestsRef.on('child_added', (snapshot) => {
        const request = snapshot.val();
        if (request.status === 'pending') {
            showBuyInRequest(snapshot.key, request);
        }
    });
}

// Function to show buy-in request
function showBuyInRequest(requestId, request) {
    // Create request notification
    const notification = document.createElement('div');
    notification.className = 'buy-in-request';
    notification.innerHTML = `
        <div class="request-details">
            <h3>Buy-in Request</h3>
            <p><strong>${request.name}</strong> wants to buy in for:</p>
            <p class="amount">$${request.buyInAmount.toFixed(2)} (${request.chipAmount} chips)</p>
        </div>
        <div class="request-actions">
            <button class="approve-btn">Approve</button>
            <button class="reject-btn">Reject</button>
        </div>
    `;
    
    // Add to notifications area
    let notificationsArea = document.getElementById('notifications-area');
    if (!notificationsArea) {
        notificationsArea = document.createElement('div');
        notificationsArea.id = 'notifications-area';
        document.querySelector('main').insertBefore(notificationsArea, document.querySelector('main').firstChild);
    }
    notificationsArea.appendChild(notification);
    
    // Handle approve/reject actions
    notification.querySelector('.approve-btn').addEventListener('click', () => {
        handleBuyInResponse(requestId, 'approved', request);
        notification.remove();
    });
    
    notification.querySelector('.reject-btn').addEventListener('click', () => {
        handleBuyInResponse(requestId, 'rejected', request);
        notification.remove();
    });
}

// Function to handle buy-in response
async function handleBuyInResponse(requestId, status, request) {
    try {
        // Update request status
        await database.ref(`games/${gameState.sessionId}/requests/${requestId}`).update({
            status: status
        });
        
        if (status === 'approved') {
            // Add player to the game
            addPlayer(request.name, request.chipAmount);
            showToast(`${request.name} has been added to the game with ${request.chipAmount} chips`);
        }
    } catch (error) {
        console.error('Error handling buy-in response:', error);
        showToast('Error processing buy-in request', 'error');
    }
}

// Modify startGame function to initialize game session
const originalStartGame = startGame;
startGame = async function() {
    if (gameState.players.length < 2) {
        showToast('Need at least 2 players to start the game.', 'error');
        return;
    }
    
    // Initialize game session first
    await initializeGameSession();
    
    // Call original startGame function
    originalStartGame();
};

// Add QR code library to the page
const qrScript = document.createElement('script');
qrScript.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
document.head.appendChild(qrScript);

// Start game function
function startGame() {
    if (gameState.players.length < 2) {
        showToast('Need at least 2 players to start the game.', 'error');
        return;
    }
    
    if (gameState.gameInProgress) {
        showToast('Game is already in progress.', 'error');
        return;
    }
    
    gameState.gameInProgress = true;
    
    // Record the session start time
    gameState.sessionStartTime = Date.now();
    
    // Update UI with more visual feedback
    const addPlayerSection = document.getElementById('add-player');
    const gameControls = document.getElementById('game-controls');
    const endGameBtn = document.getElementById('end-game');
    const startGameBtn = document.getElementById('start-game');
    const simulateHandBtn = document.getElementById('simulate-hand');
    const animationSection = document.getElementById('animation');
    
    if (addPlayerSection) {
        addPlayerSection.style.display = 'none';
        addPlayerSection.classList.add('fade-out');
    }
    
    if (gameControls) {
        gameControls.classList.add('active-game');
    }
    
    if (endGameBtn) endGameBtn.disabled = false;
    if (startGameBtn) startGameBtn.disabled = true;
    if (simulateHandBtn) simulateHandBtn.disabled = false;
    
    if (animationSection) {
        animationSection.style.display = 'flex';
        animationSection.classList.add('fade-in');
    }
    
    // Disable all player chip inputs
    document.querySelectorAll('.chip-input').forEach(input => {
        input.disabled = true;
    });
    
    // Disable remove player buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.disabled = true;
    });
    
    // Run initial animation
    if (handAnimation) {
        handAnimation.setPlayers(gameState.players);
        try {
            handAnimation.spin();
        } catch (error) {
            console.error('Error in initial animation:', error);
            showToast('Error with animation. Please try again.', 'error');
        }
    }
    
    PokerApp.Storage.save();
    showToast('Game started! Players locked in.');
}

// End game function
function endGame() {
    if (!gameState.gameInProgress) {
        showToast('No game in progress to end.', 'info');
        return;
    }
    
    gameState.gameInProgress = false;
    
    // Update UI with clear visual transitions
    const addPlayerSection = document.getElementById('add-player');
    const gameControls = document.getElementById('game-controls');
    const endGameBtn = document.getElementById('end-game');
    const startGameBtn = document.getElementById('start-game');
    const simulateHandBtn = document.getElementById('simulate-hand');
    const animationSection = document.getElementById('animation');
    
    if (endGameBtn) endGameBtn.disabled = true;
    if (startGameBtn) startGameBtn.disabled = false;
    if (simulateHandBtn) simulateHandBtn.disabled = true;
    
    if (gameControls) {
        gameControls.classList.remove('active-game');
    }
    
    // Enable chip inputs for final counts
    document.querySelectorAll('.chip-input').forEach(input => {
        input.disabled = false;
        input.classList.add('highlight-input');
        setTimeout(() => input.classList.remove('highlight-input'), 2000);
    });
    
    // Enable remove player buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.disabled = false;
    });
    
    // Show add player section again with animation
    if (addPlayerSection) {
        addPlayerSection.style.display = 'block';
        addPlayerSection.classList.remove('fade-out');
        addPlayerSection.classList.add('fade-in');
    }
    
    if (animationSection) {
        animationSection.classList.remove('fade-in');
        animationSection.classList.add('fade-out');
        setTimeout(() => {
            animationSection.style.display = 'none';
            animationSection.classList.remove('fade-out');
        }, 500);
    }
    
    PokerApp.Storage.save();
    showToast('Game ended. Update chip counts and calculate payouts.', 'info');
    
    // Add clear call to action for next steps
    const calculatePayoutsBtn = document.getElementById('calculate-payouts');
    if (calculatePayoutsBtn) {
        calculatePayoutsBtn.classList.add('pulse-animation');
        setTimeout(() => calculatePayoutsBtn.classList.remove('pulse-animation'), 3000);
    }
    
    // Smooth scroll to payouts section
    const payoutsSection = document.getElementById('payouts');
    if (payoutsSection) {
        payoutsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Reset game functionality
function resetGame() {
    // Save the current theme before resetting
    const currentTheme = gameState.theme || 'classic-green';
    
    // Clear localStorage but keep theme
    localStorage.removeItem('pokerGameState');
    localStorage.removeItem('pokerPlayers');
    // Don't remove theme: localStorage.removeItem('pokerTheme');
    
    // Reset variables
    gameState.players = [];
    gameState.gameInProgress = false;
    gameState.chipRatio = 1.0;
    // Preserve theme
    gameState.theme = currentTheme;
    
    // Reset UI
    const playerTableBody = document.querySelector('#player-table tbody');
    const ratioDisplay = document.getElementById('ratio-display');
    const addPlayerSection = document.getElementById('add-player');
    const endGameBtn = document.getElementById('end-game');
    const startGameBtn = document.getElementById('start-game');
    const animationSection = document.getElementById('animation');
    const payoutList = document.getElementById('payout-list');
    const ratioForm = document.getElementById('ratio-form');
    const playerForm = document.getElementById('player-form');
    
    if (playerTableBody) playerTableBody.innerHTML = '';
    if (ratioDisplay) ratioDisplay.textContent = 'Each chip is worth $1.00';
    if (addPlayerSection) addPlayerSection.style.display = 'block';
    if (endGameBtn) endGameBtn.disabled = true;
    if (startGameBtn) startGameBtn.disabled = true;
    if (animationSection) animationSection.style.display = 'none';
    if (payoutList) payoutList.innerHTML = '';
    if (ratioForm) ratioForm.reset();
    if (playerForm) playerForm.reset();
    
    // Clear hand animation
    const container = document.getElementById('dealer-wheel');
    if (container) {
        container.innerHTML = '';
        initializeDealerWheel();
    }
    
    // Update theme selector to match preserved theme
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = currentTheme;
    }
    
    // Update empty state message
    updateEmptyState();
    
    // Save state to preserve the theme
    PokerApp.Storage.save();
    
    showToast('Game has been reset successfully.');
}

// Calculate and display payouts based on the ratio
function calculatePayouts() {
    // Force read the current input values from the DOM before calculating
    forceUpdateChipValues();
    
    // Calculate total chips in play and money value
    const totalInitialChips = gameState.players.reduce((sum, player) => sum + player.initial_chips, 0);
    const totalCurrentChips = gameState.players.reduce((sum, player) => sum + player.current_chips, 0);
    const totalInitialMoney = totalInitialChips * gameState.chipRatio;
    const totalCurrentMoney = totalCurrentChips * gameState.chipRatio;
    
    console.log('Calculating payouts with:', {
        totalInitialChips,
        totalCurrentChips,
        totalInitialMoney,
        totalCurrentMoney,
        chipRatio: gameState.chipRatio,
        players: gameState.players
    });
    
    // Get the payout display element
    const payoutList = document.getElementById('payout-list');
    if (!payoutList) {
        console.error('Payout list element not found');
        return;
    }
    
    // Force a thorough check for changes in each player's chips
    let winners = [];
    let losers = [];
    let anyChanges = false;
    
    // Calculate net changes for each player to identify winners and losers
    for (const player of gameState.players) {
        player.net_change = player.current_chips - player.initial_chips;
        
        // Log for debugging
        console.log(`Player ${player.name}: Initial ${player.initial_chips}, Current ${player.current_chips}, Diff ${player.net_change}`);
        
        // Any non-zero difference means we have changes
        if (player.net_change !== 0) {
            anyChanges = true;
            
            // Calculate dollar amount
            let netDollars = player.net_change * gameState.chipRatio;
            // Round to exactly 2 decimal places
            netDollars = Math.round(netDollars * 100) / 100;
            
            console.log(`${player.name} change: ${player.net_change} chips = $${netDollars}`);
            
            if (netDollars > 0) {
                winners.push({ name: player.name, owed: netDollars });
                console.log(`${player.name} is a winner, owed: $${netDollars}`);
            } else if (netDollars < 0) {
                losers.push({ name: player.name, debt: -netDollars });
                console.log(`${player.name} is a loser, owes: $${-netDollars}`);
            }
        }
    }
    
    console.log('Any changes detected:', anyChanges);
    console.log('Winners:', winners.length, 'Losers:', losers.length);
    
    if (!anyChanges || (winners.length === 0 && losers.length === 0)) {
        showToast('No chip differences to calculate.', 'info');
        payoutList.innerHTML = `
            <div class="payout-summary">
                <h3>Game Summary</h3>
                <p>No payments needed. Everyone has the same amount of chips they started with.</p>
                <div class="prize-pool">
                    <p><strong>Total Prize Pool: $${totalInitialMoney.toFixed(2)}</strong></p>
                    <p>Total Chips in Play: ${totalInitialChips}</p>
                    <p>Chip Value: $${gameState.chipRatio.toFixed(2)} each</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Sort winners and losers by amount
    winners.sort((a, b) => b.owed - a.owed);
    losers.sort((a, b) => a.debt - b.debt);
    
    // Calculate transfers
    let payments = [];
    
    // Balance check
    const totalWinnings = winners.reduce((sum, w) => sum + w.owed, 0);
    const totalLosses = losers.reduce((sum, l) => sum + l.debt, 0);
    
    // Round to 2 decimal places for comparison
    const roundedWinnings = Math.round(totalWinnings * 100) / 100;
    const roundedLosses = Math.round(totalLosses * 100) / 100;
    
    console.log('Payout balance check:', { 
        totalWinnings: roundedWinnings.toFixed(2), 
        totalLosses: roundedLosses.toFixed(2) 
    });
    
    if (Math.abs(roundedWinnings - roundedLosses) > 0.01) {
        showToast('Warning: Total winnings and losses don\'t match exactly. This might be due to rounding.', 'error');
        console.warn('Balance mismatch:', { totalWinnings, totalLosses });
    }
    
    // Algorithm to calculate minimal payments
    while (winners.length > 0 && losers.length > 0) {
        const winner = winners[0];
        const loser = losers[0];
        
        const amount = Math.min(winner.owed, loser.debt);
        
        // Round to 2 decimal places
        const roundedAmount = Math.round(amount * 100) / 100;
        
        if (roundedAmount > 0) {
            payments.push({
                from: loser.name,
                to: winner.name,
                amount: roundedAmount
            });
        }
        
        winner.owed -= amount;
        loser.debt -= amount;
        
        if (winner.owed <= 0.01) winners.shift();
        if (loser.debt <= 0.01) losers.shift();
    }
    
    // Display the payments
    displayPayments(payments, totalInitialChips, totalCurrentChips, totalInitialMoney, totalCurrentMoney);
    
    // Show toast with summary
    showToast(`Payouts calculated. ${payments.length} payments needed.`, 'success');
}

// Function to display the payment instructions
function displayPayments(payments, totalInitialChips, totalCurrentChips, totalInitialMoney, totalCurrentMoney) {
    const payoutList = document.getElementById('payout-list');
    if (!payoutList) {
        console.error('Payout list element not found');
        return;
    }
    
    // Verify we have all the data we need
    console.log('Display payments with:', {
        totalInitialChips,
        totalCurrentChips,
        totalInitialMoney,
        totalCurrentMoney,
        paymentsCount: payments.length
    });
    
    // Calculate fun statistics
    const playerStats = calculateGameStatistics();
    
    if (!payments || payments.length === 0) {
        payoutList.innerHTML = `
            <div class="payout-summary">
                <h3>Game Summary</h3>
                <p class="no-payments">No payments needed.</p>
                <div class="prize-pool">
                    <p><strong>Total Prize Pool: $${totalInitialMoney.toFixed(2)}</strong></p>
                    <p>Total Initial Chips: ${totalInitialChips}</p>
                    <p>Total Final Chips: ${totalCurrentChips}</p>
                    <p>Chip Value: $${gameState.chipRatio.toFixed(2)} each</p>
                </div>
                
                ${playerStats ? `
                <div class="game-stats">
                    <h4>Game Statistics</h4>
                    ${playerStats}
                </div>` : ''}
            </div>
        `;
        return;
    }
    
    // Build payment instructions
    let html = `
        <div class="payout-summary">
            <h3>Game Summary</h3>
            <div class="prize-pool">
                <p><strong>Total Prize Pool: $${totalInitialMoney.toFixed(2)}</strong></p>
                <p>Total Initial Chips: ${totalInitialChips}</p>
                <p>Total Final Chips: ${totalCurrentChips}</p>
                <p>Chip Value: $${gameState.chipRatio.toFixed(2)} each</p>
            </div>
            
            ${playerStats ? `
            <div class="game-stats">
                <h4>Game Statistics</h4>
                ${playerStats}
            </div>` : ''}
        </div>
        <div class="payment-list">
            <h3>Payment Instructions</h3>
            <ul>
    `;
    
    payments.forEach(payment => {
        html += `
            <li>
                <span class="from">${payment.from}</span>
                <span class="arrow">→</span>
                <span class="to">${payment.to}</span>
                <span class="amount">$${payment.amount.toFixed(2)}</span>
            </li>
        `;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    payoutList.innerHTML = html;
    
    // Animate the payment list items one by one for a nice effect
    setTimeout(() => {
        const items = payoutList.querySelectorAll('.payment-list li');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('fade-in');
            }, index * 100);
        });
    }, 100);
}

// Calculate fun game statistics
function calculateGameStatistics() {
    if (!gameState.players || gameState.players.length === 0) {
        return null;
    }
    
    // Calculate player performance stats
    const playersWithStats = gameState.players.map(player => {
        const netChips = player.current_chips - player.initial_chips;
        const netMoney = netChips * gameState.chipRatio;
        const percentChange = (player.current_chips / player.initial_chips) * 100 - 100;
        
        return {
            name: player.name,
            initial: player.initial_chips,
            current: player.current_chips,
            netChips: netChips,
            netMoney: netMoney,
            percentChange: percentChange
        };
    });
    
    // Sort players by various metrics
    const sortedByNet = [...playersWithStats].sort((a, b) => b.netChips - a.netChips);
    const sortedByPercent = [...playersWithStats].sort((a, b) => b.percentChange - a.percentChange);
    
    // Get session duration if it was tracked
    const sessionDuration = gameState.sessionStartTime ? 
        Math.floor((Date.now() - gameState.sessionStartTime) / 60000) : 
        null;
    
    // Calculate interesting stats
    const stats = [];
    
    // Top performer
    if (sortedByNet.length > 0 && sortedByNet[0].netChips > 0) {
        stats.push(`<p>🏆 <strong>Top Performer:</strong> ${sortedByNet[0].name} (+${sortedByNet[0].netChips} chips / $${sortedByNet[0].netMoney.toFixed(2)})</p>`);
    }
    
    // Biggest loser
    if (sortedByNet.length > 1 && sortedByNet[sortedByNet.length-1].netChips < 0) {
        const biggestLoser = sortedByNet[sortedByNet.length-1];
        stats.push(`<p>📉 <strong>Biggest Loser:</strong> ${biggestLoser.name} (${biggestLoser.netChips} chips / $${biggestLoser.netMoney.toFixed(2)})</p>`);
    }
    
    // Highest percentage gain
    if (sortedByPercent.length > 0 && sortedByPercent[0].percentChange > 0) {
        stats.push(`<p>📈 <strong>Highest ROI:</strong> ${sortedByPercent[0].name} (+${sortedByPercent[0].percentChange.toFixed(1)}%)</p>`);
    }
    
    // Most consistent
    let mostConsistent = null;
    let smallestChange = Infinity;
    for (const player of playersWithStats) {
        const absChange = Math.abs(player.percentChange);
        if (absChange < smallestChange) {
            smallestChange = absChange;
            mostConsistent = player;
        }
    }
    if (mostConsistent) {
        stats.push(`<p>🧘 <strong>Most Consistent:</strong> ${mostConsistent.name} (${mostConsistent.percentChange > 0 ? '+' : ''}${mostConsistent.percentChange.toFixed(1)}%)</p>`);
    }
    
    // Big stack
    const biggestStack = [...playersWithStats].sort((a, b) => b.current - a.current)[0];
    stats.push(`<p>💰 <strong>Big Stack:</strong> ${biggestStack.name} with ${biggestStack.current} chips</p>`);
    
    // Session duration
    if (sessionDuration !== null) {
        const hours = Math.floor(sessionDuration / 60);
        const minutes = sessionDuration % 60;
        let duration = '';
        if (hours > 0) {
            duration = `${hours} hour${hours > 1 ? 's' : ''}`;
            if (minutes > 0) duration += ` ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            duration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        stats.push(`<p>⏱️ <strong>Session Duration:</strong> ${duration}</p>`);
    }
    
    // Random fun fact
    const funFacts = [
        `On average, players ${sortedByNet[0].netChips > 0 ? 'won' : 'lost'} ${Math.abs(sortedByNet.reduce((sum, p) => sum + p.netChips, 0) / sortedByNet.length).toFixed(1)} chips each.`,
        `The overall chip redistribution was ${sortedByNet.reduce((sum, p) => sum + Math.abs(p.netChips), 0)} chips.`,
        `The average player's stack ${sortedByNet.reduce((sum, p) => sum + p.percentChange, 0) / sortedByNet.length > 0 ? 'increased' : 'decreased'} by ${Math.abs(sortedByNet.reduce((sum, p) => sum + p.percentChange, 0) / sortedByNet.length).toFixed(1)}%.`
    ];
    stats.push(`<p>🎲 <strong>Fun Fact:</strong> ${funFacts[Math.floor(Math.random() * funFacts.length)]}</p>`);
    
    return stats.join('');
}

// Show/hide empty state message
function updateEmptyState() {
    const noPlayersMessage = document.getElementById('no-players-message');
    const playerTable = document.querySelector('#player-table');
    const payoutInstructions = document.getElementById('payout-instructions');
    
    if (!noPlayersMessage || !playerTable) {
        console.error('Empty state elements not found');
        return;
    }
    
    if (gameState.players.length === 0) {
        // No players case
        noPlayersMessage.style.display = 'block';
        playerTable.style.display = 'none';
        
        if (payoutInstructions) {
            payoutInstructions.textContent = 'Add players to see payout details.';
        }
    } else {
        // Have players case
        noPlayersMessage.style.display = 'none';
        playerTable.style.display = 'table';
        
        // Calculate total prize pool
        const totalChips = gameState.players.reduce((sum, player) => sum + player.initial_chips, 0);
        const totalMoney = totalChips * gameState.chipRatio;
        
        if (payoutInstructions) {
            payoutInstructions.innerHTML = `
                The current prize pool is <strong>$${totalMoney.toFixed(2)}</strong> (${totalChips} chips).<br>
                Update the current chip counts and click 'Calculate Payouts' to see the settlement.
            `;
        }
    }
    
    // Update game control button states
    const startGameBtn = document.getElementById('start-game');
    const simulateHandBtn = document.getElementById('simulate-hand');
    const endGameBtn = document.getElementById('end-game');
    
    if (startGameBtn) {
        startGameBtn.disabled = gameState.players.length < 2 || gameState.gameInProgress;
    }
    
    if (simulateHandBtn) {
        simulateHandBtn.disabled = !gameState.gameInProgress;
    }
    
    if (endGameBtn) {
        endGameBtn.disabled = !gameState.gameInProgress;
    }
}

// Toast notification system
function showToast(message, type = 'success') {
    if (!message) return;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Add toast styles if they don't exist
    const toastStyleId = 'toast-styles';
    if (!document.getElementById(toastStyleId)) {
        const style = document.createElement('style');
        style.id = toastStyleId;
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
            @keyframes slideOut {
                to {
                    opacity: 0;
                    transform: translateX(50px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create the toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Save state to localStorage
function saveState() {
    const state = {
        players: gameState.players,
        gameInProgress: gameState.gameInProgress,
        chipRatio: gameState.chipRatio,
        theme: gameState.theme // Save the current theme
    };
    
    try {
        localStorage.setItem('pokerGameState', JSON.stringify(state));
    } catch (error) {
        console.error('Error saving game state:', error);
        showToast('Error saving game state. Local storage might be full.', 'error');
    }
}

// Load state from localStorage
function loadSavedState() {
    try {
        const savedState = localStorage.getItem('pokerGameState');
        if (!savedState) return;
        
        const state = JSON.parse(savedState);
        
        // Validate state
        if (!state || typeof state !== 'object') {
            console.error('Invalid saved state format');
            return;
        }
        
        gameState.players = Array.isArray(state.players) ? state.players : [];
        gameState.gameInProgress = !!state.gameInProgress;
        gameState.chipRatio = typeof state.chipRatio === 'number' ? state.chipRatio : 1.0;
        
        // Restore theme if saved
        if (state.theme && themes[state.theme]) {
            gameState.theme = state.theme;
            setTheme(state.theme);
            
            // Update theme selector to match
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = state.theme;
            }
        }
        
        // Update UI with saved state
        PokerApp.Players.updateList();
        
        const ratioDisplay = document.getElementById('ratio-display');
        if (ratioDisplay) {
            ratioDisplay.textContent = `Each chip is worth $${gameState.chipRatio.toFixed(2)}`;
        }
        
        if (gameState.gameInProgress) {
            const addPlayerSection = document.getElementById('add-player');
            const endGameBtn = document.getElementById('end-game');
            const startGameBtn = document.getElementById('start-game');
            const animationSection = document.getElementById('animation');
            
            if (addPlayerSection) addPlayerSection.style.display = 'none';
            if (endGameBtn) endGameBtn.disabled = false;
            if (startGameBtn) startGameBtn.disabled = true;
            if (animationSection) animationSection.style.display = 'flex';
            
            // Disable chip inputs
            document.querySelectorAll('.chip-input').forEach(input => {
                input.disabled = true;
            });
            
            // Disable remove player buttons
            document.querySelectorAll('.remove-player').forEach(button => {
                button.disabled = true;
            });
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
        showToast('Error loading saved game. Starting fresh.', 'error');
    }
}

// Theme setting function
function setTheme(themeName) {
    if (!themeName || typeof themeName !== 'string') {
        console.error('Invalid theme name:', themeName);
        return;
    }
    
    const theme = themes[themeName];
    if (!theme) {
        console.error(`Theme "${themeName}" not found!`);
        return;
    }

    // Store the current theme in gameState
    gameState.theme = themeName;
    
    // Remove existing theme classes
    document.body.classList.remove(...Object.keys(themes).map(t => `theme-${t}`));
    
    // Add current theme class to body
    document.body.classList.add(`theme-${themeName}`);

    // Apply theme CSS variables
    Object.entries(theme).forEach(([property, value]) => {
        if (property.startsWith('--')) {
            document.documentElement.style.setProperty(property, value);
            
            // Add RGB versions of colors for transparency effects
            if (property === '--main-color') {
                const rgb = hexToRgb(value);
                if (rgb) {
                    document.documentElement.style.setProperty('--main-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                }
            }
            if (property === '--secondary-color') {
                const rgb = hexToRgb(value);
                if (rgb) {
                    document.documentElement.style.setProperty('--secondary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                }
            }
        }
    });
    
    // Update theme-color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme['--main-color']);
    }

    // Update dealer wheel theme if it exists
    if (handAnimation) {
        handAnimation.setTheme(theme);
    }

    // Update title icons
    updateTitleIcons(themeName, theme);
    
    // Save state to persist theme choice
    saveState();
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : null;
}

// Update title icons based on theme
function updateTitleIcons(themeName, theme) {
    const leftIcon = document.getElementById('left-icon');
    const rightIcon = document.getElementById('right-icon');
    
    if (!leftIcon || !rightIcon) {
        console.error('Title icon elements not found');
        return;
    }
    
    if (themeName === 'rizzler' || themeName === 'doginme') {
        // Use the icon image for both themes
        leftIcon.innerHTML = `<img src="${theme.icon}" alt="${themeName} Icon" class="title-icon-img">`;
        rightIcon.innerHTML = `<img src="${theme.icon}" alt="${themeName} Icon" class="title-icon-img">`;
    } else {
        // Use the theme's icon if available, otherwise default to poker suits
        if (theme.icon) {
            leftIcon.innerHTML = theme.icon;
            rightIcon.innerHTML = theme.icon;
        } else {
            leftIcon.innerHTML = '♠️';
            rightIcon.innerHTML = '♥️';
        }
    }
}