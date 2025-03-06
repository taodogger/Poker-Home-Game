// Define themes with main colors and gradients
const themes = {
    'classic-green': {
        '--main-color': '#2E8B57',
        '--secondary-color': '#3CB371',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'royal-blue': {
        '--main-color': '#4169E1',
        '--secondary-color': '#1E90FF',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'crimson-red': {
        '--main-color': '#DC143C',
        '--secondary-color': '#FF4500',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'midnight-black': {
        '--main-color': '#2F4F4F',
        '--secondary-color': '#696969',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'ocean-breeze': {
        '--main-color': '#00CED1',
        '--secondary-color': '#20B2AA',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'firestorm': {
        '--main-color': '#FF4500',
        '--secondary-color': '#FF6347',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'purple-haze': {
        '--main-color': '#9370DB',
        '--secondary-color': '#BA55D3',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'neon-nights': {
        '--main-color': '#32CD32',
        '--secondary-color': '#00FF00',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)'
    },
    'rizzler': {
        '--main-color': '#6A0DAD',
        '--secondary-color': '#DAA520',
        'tableImage': './images/rizzler-board.jpg',
        'icon': '💪',
        '--body-background': 'url("./images/rizzler-background.jpg")'
    },
    'doginme': {
        '--main-color': '#1E90FF',
        '--secondary-color': '#104E8B',
        'tableImage': './images/doginme-board.jpg',
        'icon': './images/doginme-icon.png',
        '--body-background': 'url("./images/doginme-background.jpg")'
    }
};

// Initialize state management
let players = [];
let gameStarted = false;
let dealerWheel = null;
let dollarsPerChip = 1; // Default: $1 per chip

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI first
    initializeUI();
    
    // Load saved state and update UI accordingly
    loadSavedState();
    
    // Check for saved players if not loaded from state
    if (players.length === 0) {
    const savedPlayers = localStorage.getItem('pokerPlayers');
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
        updatePlayerList();
        }
    }
    
    // Initialize hand animation after loading state
    initializeDealerWheel();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update empty state message
    updateEmptyState();
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
        ratioDisplay.textContent = `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
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
        dealerWheel = new HandAnimation(container);
        
        // Load saved theme
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

        // Set up players if they exist
        if (players.length > 0) {
            dealerWheel.setPlayers(players);
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
        themeSelector.addEventListener('change', (e) => {
            setTheme(e.target.value);
            localStorage.setItem('pokerTheme', e.target.value);
            
            // Add animation class
            document.body.classList.add('theme-changing');
            setTimeout(() => {
                document.body.classList.remove('theme-changing');
            }, 500);
            
            showToast(`Theme changed to ${e.target.value.replace(/-/g, ' ')}`, 'info');
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
            
                dollarsPerChip = realMoney / chips;
            const ratioDisplay = document.getElementById('ratio-display');
            if (ratioDisplay) {
                ratioDisplay.textContent = `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
                ratioDisplay.classList.add('highlight');
                setTimeout(() => {
                    ratioDisplay.classList.remove('highlight');
                }, 1500);
            }
            
                saveState();
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

    // Player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('player-name');
            const chipsInput = document.getElementById('initial-chips');
            
            if (!nameInput || !chipsInput) {
                console.error('Player form inputs not found');
                return;
            }
            
                const name = nameInput.value.trim();
                const chips = parseInt(chipsInput.value) || 0;
                
            if (!name) {
                showToast('Please enter a valid player name.', 'error');
                return;
            }
            
            if (isNaN(chips) || chips <= 0) {
                showToast('Please enter a valid chip amount.', 'error');
                return;
            }
            
                    addPlayer(name, chips);
                    this.reset();
            nameInput.focus();
            
            showToast(`Player ${name} added successfully!`);
            updateEmptyState();
        });
    }

    // Game control buttons with improved functionality and feedback
    const startGameBtn = document.getElementById('start-game');
    const endGameBtn = document.getElementById('end-game');
    const resetGameBtn = document.getElementById('reset-game');
    const simulateHandBtn = document.getElementById('simulate-hand');  // New button for clarity
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            if (players.length < 2) {
                showToast('Need at least 2 players to start a game', 'error');
                startGameBtn.classList.add('invalid-action');
                setTimeout(() => startGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            startGame();
        });
    }
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', function() {
            if (!gameStarted) {
                showToast('No active game to end', 'error');
                endGameBtn.classList.add('invalid-action');
                setTimeout(() => endGameBtn.classList.remove('invalid-action'), 500);
                return;
            }
            endGame();
        });
    }
    
    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', function() {
            // Make reset require confirmation
            if (confirm('Are you sure you want to reset the game? This will clear all players and settings.')) {
                resetGame();
            }
        });
    }
    
    // Add a new button specifically for simulating hands
    if (simulateHandBtn) {
        simulateHandBtn.addEventListener('click', function() {
            if (!gameStarted) {
                showToast('Start the game first to simulate hands', 'error');
                simulateHandBtn.classList.add('invalid-action');
                setTimeout(() => simulateHandBtn.classList.remove('invalid-action'), 500);
                return;
            }
            
            if (dealerWheel && dealerWheel.isAnimating) {
                showToast('Animation already in progress', 'error');
                return;
            }
            
            // Spin the dealer wheel to simulate a hand
            if (dealerWheel) {
                try {
                    dealerWheel.spin();
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
        calculatePayoutsBtn.addEventListener('click', calculatePayouts);
    }
}

// Add player function
function addPlayer(name, chips) {
    if (!name || isNaN(chips) || chips <= 0) {
        console.error('Invalid player data:', { name, chips });
        return;
    }
    
    // Check if player with this name already exists
    if (players.some(p => p.name === name)) {
        showToast(`Player ${name} already exists.`, 'error');
        return;
    }
    
    // Check for maximum players (9 is a good limit for poker)
    if (players.length >= 9) {
        showToast('Maximum number of players reached (9).', 'error');
        return;
    }
    
    const player = {
        name: name,
        initial_chips: chips,
        current_chips: chips,
        id: Date.now() // Unique identifier
    };
    
    players.push(player);
    savePlayers();
    updatePlayerList();
    
    // Update dealer wheel if it exists
    if (dealerWheel) {
        dealerWheel.setPlayers(players);
    }
}

// Save players to localStorage
function savePlayers() {
    localStorage.setItem('pokerPlayers', JSON.stringify(players));
}

// Update player list in UI
function updatePlayerList() {
    const playerList = document.querySelector('#player-table tbody');
    if (!playerList) {
        console.error('Player table not found');
        return;
    }

    playerList.innerHTML = '';
    
    players.forEach(player => {
        const row = document.createElement('tr');
        
        // Make sure we have the current_chips value
        if (player.current_chips === undefined) {
            player.current_chips = player.initial_chips;
        }
        
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.initial_chips}</td>
            <td>
                <input
                    type="number"
                    class="chip-input"
                    value="${player.current_chips}"
                    min="0"
                    ${gameStarted ? 'disabled' : ''}
                    data-player-id="${player.id}"
                >
            </td>
            <td>
                <button class="remove-player" data-player-id="${player.id}" ${gameStarted ? 'disabled' : ''}>
                    Remove
                </button>
            </td>
        `;
        playerList.appendChild(row);
    });
    
    // Add event listeners to the newly created remove buttons
    document.querySelectorAll('.remove-player').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                console.error('Invalid player ID for removal');
                return;
            }
            removePlayer(playerId);
        });
    });
    
    // Add event listeners to chip inputs for realtime updates
    document.querySelectorAll('.chip-input').forEach(input => {
        input.addEventListener('change', function() {
            const playerId = parseInt(this.getAttribute('data-player-id'));
            if (!playerId) {
                console.error('Invalid player ID for chip update');
                return;
            }
            
            const newChips = parseInt(this.value);
            if (isNaN(newChips) || newChips < 0) {
                showToast('Please enter a valid chip amount.', 'error');
                // Reset to previous value
                const playerIndex = players.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    this.value = players[playerIndex].current_chips;
                }
                return;
            }
            
            // Update player's current chips
            const playerIndex = players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                players[playerIndex].current_chips = newChips;
                savePlayers();
                showToast(`Updated ${players[playerIndex].name}'s chips to ${newChips}`, 'info');
            }
        });
    });
    
    // Update empty state
    updateEmptyState();
    
    // Update start game button state
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.disabled = players.length < 2 || gameStarted;
    }
}

// Remove player function
function removePlayer(playerId) {
    // Don't allow removing players if game has started
    if (gameStarted) {
        showToast('Cannot remove players during an active game.', 'error');
        return;
    }
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        console.error('Player not found for removal:', playerId);
        return;
    }
    
    const playerName = players[playerIndex].name;
    players = players.filter(p => p.id !== playerId);
    savePlayers();
    updatePlayerList();
    
    // Update dealer wheel if it exists
    if (dealerWheel) {
        dealerWheel.setPlayers(players);
    }
    
    showToast(`Player ${playerName} removed successfully`);
}

// Start game function
function startGame() {
    if (players.length < 2) {
        showToast('Need at least 2 players to start the game.', 'error');
        return;
    }
    
    if (gameStarted) {
        showToast('Game is already in progress.', 'error');
        return;
    }
    
    gameStarted = true;
    
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
    if (dealerWheel) {
        dealerWheel.setPlayers(players);
        try {
        dealerWheel.spin();
        } catch (error) {
            console.error('Error in initial animation:', error);
            showToast('Error with animation. Please try again.', 'error');
        }
    }
    
    saveState();
    showToast('Game started! Players locked in.');
}

// End game function
function endGame() {
    if (!gameStarted) {
        showToast('No game in progress to end.', 'info');
        return;
    }
    
    gameStarted = false;
    
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
    
    saveState();
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
    // Clear localStorage
    localStorage.removeItem('pokerGameState');
    localStorage.removeItem('pokerPlayers');
    localStorage.removeItem('pokerTheme');
    
    // Reset variables
    players = [];
    gameStarted = false;
    dollarsPerChip = 1;
    
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
    
    // Set default theme
    setTheme('classic-green');
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = 'classic-green';
    }
    
    // Update empty state message
    updateEmptyState();
    
    showToast('Game has been reset successfully.');
}

// Calculate and display payouts based on the ratio
function calculatePayouts() {
    // Update players data from chip inputs
    document.querySelectorAll('.chip-input').forEach(input => {
        const playerId = parseInt(input.getAttribute('data-player-id'));
        if (!playerId) return;
        
        const newChips = parseInt(input.value);
        if (isNaN(newChips)) return;
        
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            players[playerIndex].current_chips = newChips;
        }
    });
    
    savePlayers();
    
    // Check if there are any chip differences
    const anyChanges = players.some(player => 
        player.current_chips !== player.initial_chips
    );
    
    if (!anyChanges) {
        showToast('No chip differences to calculate.', 'info');
        const payoutList = document.getElementById('payout-list');
        if (payoutList) {
            payoutList.innerHTML = '<p class="no-payments">No payments needed. Everyone has the same amount of chips they started with.</p>';
        }
        return;
    }
    
    let winners = [];
    let losers = [];
    
    players.forEach(player => {
        player.net_change = player.current_chips - player.initial_chips;
        let netDollars = player.net_change * dollarsPerChip;
        netDollars = Math.round(netDollars * 100) / 100; // Round to 2 decimal places
        
        if (netDollars > 0) {
            winners.push({ name: player.name, owed: netDollars });
        } else if (netDollars < 0) {
            losers.push({ name: player.name, debt: -netDollars });
        }
    });
    
    // Sort winners and losers
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
    
    if (Math.abs(roundedWinnings - roundedLosses) > 0.01) {
        showToast('Warning: Total winnings and losses don\'t match exactly. This might be due to rounding.', 'error');
        console.warn('Balance mismatch:', { totalWinnings, totalLosses });
    }
    
    while (losers.length > 0 && winners.length > 0) {
        let loser = losers[0];
        let winner = winners[0];
        let amount = Math.min(loser.debt, winner.owed);
        
        // Round to 2 decimal places
        amount = Math.round(amount * 100) / 100;
        
        if (amount > 0) {
            payments.push({
                from: loser.name,
                to: winner.name,
                amount: amount
            });
        }
        
        loser.debt = Math.round((loser.debt - amount) * 100) / 100;
        winner.owed = Math.round((winner.owed - amount) * 100) / 100;
        
        if (loser.debt <= 0.01) losers.shift();
        if (winner.owed <= 0.01) winners.shift();
    }
    
    // Display the payments
    displayPayments(payments);
    saveState();
    
    // Show toast with summary
    if (payments.length > 0) {
        showToast(`Calculated ${payments.length} payment${payments.length > 1 ? 's' : ''}.`);
    } else {
        showToast('No payments needed.', 'info');
    }
}

// Display payment instructions in a nice format
function displayPayments(payments) {
    const payoutList = document.getElementById('payout-list');
    if (!payoutList) {
        console.error('Payout list container not found');
        return;
    }
    
    if (payments.length === 0) {
        payoutList.innerHTML = '<p class="no-payments">No payments needed. The game is already settled!</p>';
        return;
    }
    
    // Create a nice looking payment list
    let html = '<div class="payment-list">';
    
    payments.forEach(payment => {
        html += `
            <div class="payment-item">
                <div class="payment-from">${payment.from}</div>
                <div class="payment-arrow">→</div>
                <div class="payment-to">${payment.to}</div>
                <div class="payment-amount">$${payment.amount.toFixed(2)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    payoutList.innerHTML = html;
    
    // Add the CSS for these payment items
    const styleId = 'payment-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .payment-list {
                margin-top: var(--spacing-md);
            }
            .payment-item {
                display: grid;
                grid-template-columns: 1fr auto 1fr auto;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm);
                margin-bottom: var(--spacing-sm);
                background: rgba(0, 0, 0, 0.2);
                border-radius: var(--border-radius-sm);
                transition: transform var(--transition-standard);
            }
            .payment-item:hover {
                transform: translateY(-2px);
                background: rgba(0, 0, 0, 0.3);
            }
            .payment-from {
                font-weight: 500;
                color: #ff7675;
                text-align: right;
            }
            .payment-arrow {
                font-weight: bold;
                color: var(--main-color);
            }
            .payment-to {
                font-weight: 500;
                color: #55efc4;
            }
            .payment-amount {
                font-weight: 700;
                color: white;
                background: var(--main-color);
                padding: 4px 8px;
                border-radius: 4px;
            }
            .no-payments {
                text-align: center;
                padding: var(--spacing-md);
                font-style: italic;
                color: rgba(255, 255, 255, 0.7);
            }
        `;
        document.head.appendChild(style);
    }
}

// Show/hide empty state message
function updateEmptyState() {
    const noPlayersMessage = document.getElementById('no-players-message');
    const playerTable = document.querySelector('#player-table');
    
    if (!noPlayersMessage || !playerTable) {
        console.error('Empty state elements not found');
        return;
    }
    
    if (players.length === 0) {
        noPlayersMessage.style.display = 'block';
        playerTable.style.display = 'none';
    } else {
        noPlayersMessage.style.display = 'none';
        playerTable.style.display = 'table';
    }
    
    // Update start game button state
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.disabled = players.length < 2 || gameStarted;
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
        players: players,
        gameStarted: gameStarted,
        dollarsPerChip: dollarsPerChip
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
        
        players = Array.isArray(state.players) ? state.players : [];
        gameStarted = !!state.gameStarted;
        dollarsPerChip = typeof state.dollarsPerChip === 'number' ? state.dollarsPerChip : 1;
        
        // Update UI with saved state
        updatePlayerList();
        
        const ratioDisplay = document.getElementById('ratio-display');
        if (ratioDisplay) {
            ratioDisplay.textContent = `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
        }
        
        if (gameStarted) {
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

    // Remove existing theme classes
    document.body.classList.remove(...Object.keys(themes).map(t => `theme-${t}`));

    // Apply theme colors
    Object.entries(theme).forEach(([property, value]) => {
        if (property !== 'tableImage' && property !== 'icon') {
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

    // Add theme-specific class
    document.body.classList.add(`theme-${themeName}`);

    // Update dealer wheel theme if it exists
    if (dealerWheel) {
        dealerWheel.setTheme(theme);
    }

    // Update title icons
    updateTitleIcons(themeName, theme);

    // Save theme preference
    localStorage.setItem('pokerTheme', themeName);
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
    
            if (themeName === 'rizzler') {
        leftIcon.innerHTML = theme.icon || '💪';
        rightIcon.innerHTML = theme.icon || '💪';
    } else if (themeName === 'doginme') {
        // Force fixed size for doginme icon
        leftIcon.innerHTML = `<span style="font-size:24px;line-height:1;height:24px;display:inline-block;">🐶</span>`;
        rightIcon.innerHTML = `<span style="font-size:24px;line-height:1;height:24px;display:inline-block;">🐶</span>`;
        
        // Only use image if available
        if (theme.icon && theme.icon.endsWith('.png')) {
            leftIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" style="height:24px;width:24px;vertical-align:middle;">`;
            rightIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" style="height:24px;width:24px;vertical-align:middle;">`;
        }
        } else {
            leftIcon.innerHTML = '♠️';
            rightIcon.innerHTML = '♥️';
        }
}