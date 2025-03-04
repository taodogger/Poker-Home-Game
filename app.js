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

document.addEventListener('DOMContentLoaded', function() {
    // Load saved players
    const savedPlayers = localStorage.getItem('pokerPlayers');
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
        updatePlayerList();
    }

    // Initialize hand animation
    const container = document.getElementById('dealer-wheel');
    if (container) {
        dealerWheel = new HandAnimation(container);
        
        // Load saved theme
        const savedTheme = localStorage.getItem('pokerTheme');
        if (savedTheme && themes[savedTheme]) {
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
    } else {
        console.error('Dealer wheel container not found');
    }

    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            setTheme(e.target.value);
            localStorage.setItem('pokerTheme', e.target.value);
        });
    }

    // Ratio form handler
    const ratioForm = document.getElementById('ratio-form');
    if (ratioForm) {
        ratioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let realMoney = parseFloat(document.getElementById('money-amount').value);
            let chips = parseInt(document.getElementById('chip-amount').value);
            
            if (realMoney > 0 && chips > 0) {
                dollarsPerChip = realMoney / chips;
                document.getElementById('ratio-display').textContent = 
                    `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
                saveState();
                document.getElementById('ratio-content').classList.add('hidden');
                document.getElementById('minimize-button').textContent = '+';
            } else {
                alert('Please enter valid numbers for money and chips.');
            }
        });
    }

    // Minimize button handler
    const minimizeButton = document.getElementById('minimize-button');
    const ratioContent = document.getElementById('ratio-content');
    if (minimizeButton && ratioContent) {
        // Set initial state
        ratioContent.classList.remove('hidden');
        minimizeButton.textContent = '−';
        
        // Add click event listener
        minimizeButton.addEventListener('click', function() {
            ratioContent.classList.toggle('hidden');
            this.textContent = ratioContent.classList.contains('hidden') ? '+' : '−';
        });
    }

    // Player form
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('name');
            const chipsInput = document.getElementById('chips');
            
            if (nameInput && chipsInput) {
                const name = nameInput.value.trim();
                const chips = parseInt(chipsInput.value) || 0;
                
                if (name) {
                    addPlayer(name, chips);
                    this.reset();
                }
            }
        });
    }

    // Start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
}

// Add player function
function addPlayer(name, chips) {
    const player = {
        name: name,
        chips: chips,
        id: Date.now() // Unique identifier
    };
    
    players.push(player);
    savePlayers();
    updatePlayerList();
}

// Save players to localStorage
function savePlayers() {
    localStorage.setItem('pokerPlayers', JSON.stringify(players));
}

// Update player list in UI
function updatePlayerList() {
    const playerList = document.getElementById('player-list');
    if (!playerList) return;

    playerList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${player.name}</span>
            <span>${player.chips} chips</span>
            <button onclick="removePlayer(${player.id})">Remove</button>
        `;
        playerList.appendChild(li);
    });
}

// Remove player function
function removePlayer(playerId) {
    players = players.filter(p => p.id !== playerId);
    savePlayers();
    updatePlayerList();
}

// Start game function
function startGame() {
    if (players.length < 2) {
        alert('Need at least 2 players to start the game.');
        return;
    }
    
    gameStarted = true;
    document.getElementById('add-player').style.display = 'none';
    document.getElementById('end-game').disabled = false;
    document.getElementById('animation').style.display = 'flex';
    
    // Initialize and spin the dealer wheel with full player objects
    if (dealerWheel) {
        dealerWheel.setPlayers(players);
        dealerWheel.spin();
    }
    
    saveState();
}

// Theme setting function
function setTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) {
        console.error(`Theme "${themeName}" not found!`);
        return;
    }

    // Remove existing theme classes
    document.body.classList.remove('theme-rizzler', 'theme-doginme');

    // Apply theme colors
    Object.entries(theme).forEach(([property, value]) => {
        if (property !== 'tableImage' && property !== 'icon') {
            document.documentElement.style.setProperty(property, value);
        }
    });

    // Update dealer wheel theme if it exists
    if (dealerWheel) {
        dealerWheel.setTheme(theme);
    }

    // Update title icons
    updateTitleIcons(themeName, theme);

    // Save theme preference
    localStorage.setItem('pokerTheme', themeName);
}

// Update title icons based on theme
function updateTitleIcons(themeName, theme) {
    const leftIcon = document.getElementById('left-icon');
    const rightIcon = document.getElementById('right-icon');
    
    if (leftIcon && rightIcon) {
        if (themeName === 'rizzler' || themeName === 'doginme') {
            if (themeName === 'rizzler') {
                leftIcon.innerHTML = theme.icon;
                rightIcon.innerHTML = theme.icon;
            } else { // doginme
                const testIcon = new Image();
                testIcon.onload = () => {
                    leftIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" class="title-icon-img">`;
                    rightIcon.innerHTML = `<img src="${theme.icon}" alt="Theme Icon" class="title-icon-img">`;
                };
                testIcon.onerror = () => {
                    console.error(`Failed to load theme icon: ${theme.icon}`);
                    leftIcon.innerHTML = '🐶';
                    rightIcon.innerHTML = '🐶';
                };
                testIcon.src = theme.icon;
            }
            document.body.classList.add(`theme-${themeName}`);
        } else {
            leftIcon.innerHTML = '♠️';
            rightIcon.innerHTML = '♥️';
        }
    }
}

let dollarsPerChip = 1; // Default: $1 per chip

// Safe player form handling
document.addEventListener('DOMContentLoaded', function() {
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('name');
            if (nameInput) {
                let name = nameInput.value;
                // Process player name...
            } else {
                console.error('Player name input not found');
            }
        });
    }

    // Initialize dealerWheel
    window.dealerWheel = new HandAnimation();

    // Set initial theme
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        const savedTheme = localStorage.getItem('pokerTheme');
        if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
            themeSelector.value = savedTheme;
        } else {
            setTheme('classic-green');
            themeSelector.value = 'classic-green';
        }

        themeSelector.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });
    }

    loadSavedState();
});

// Save state to localStorage
function saveState() {
    const state = {
        players: players,
        gameStarted: gameStarted,
        dollarsPerChip: dollarsPerChip
    };
    localStorage.setItem('pokerGameState', JSON.stringify(state));
}

// Load state from localStorage
function loadSavedState() {
    const savedState = localStorage.getItem('pokerGameState');
    if (savedState) {
        const state = JSON.parse(savedState);
        players = state.players;
        gameStarted = state.gameStarted;
        dollarsPerChip = state.dollarsPerChip;
        
        // Update UI with saved state
        updatePlayerTable();
        document.getElementById('ratio-display').textContent = `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
        
        if (gameStarted) {
            document.getElementById('add-player').style.display = 'none';
            document.getElementById('end-game').disabled = false;
            document.getElementById('animation').style.display = 'block';
        }
    }
}

// Update the player table dynamically
function updatePlayerTable() {
    let tbody = document.querySelector('#player-table tbody');
    tbody.innerHTML = '';
    players.forEach((player, index) => {
        let row = `<tr>
            <td>${player.name}</td>
            <td>${player.initial_chips}</td>
            <td><input type="number" value="${player.current_chips}" disabled></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// End the game and enable chip input
document.getElementById('end-game').addEventListener('click', function() {
    if (!gameStarted) return;
    gameStarted = false;
    document.querySelectorAll('#player-table input').forEach(input => input.disabled = false);
    saveState();
});

// Calculate and display payouts based on the ratio
document.getElementById('calculate-payouts').addEventListener('click', function() {
    let winners = [];
    let losers = [];
    players.forEach((player, index) => {
        let input = document.querySelector(`#player-table tbody tr:nth-child(${index + 1}) input`);
        player.current_chips = parseInt(input.value);
        player.net_change = player.current_chips - player.initial_chips;
        let netDollars = player.net_change * dollarsPerChip;
        if (netDollars > 0) {
            winners.push({ name: player.name, owed: netDollars });
        } else if (netDollars < 0) {
            losers.push({ name: player.name, debt: -netDollars });
        }
    });
    winners.sort((a, b) => b.owed - a.owed);
    losers.sort((a, b) => a.debt - b.debt);
    let payments = [];
    while (losers.length > 0 && winners.length > 0) {
        let loser = losers[0];
        let winner = winners[0];
        let amount = Math.min(loser.debt, winner.owed);
        payments.push(`${loser.name} → ${winner.name}: $${amount.toFixed(2)}`);
        loser.debt -= amount;
        winner.owed -= amount;
        if (loser.debt <= 0.01) losers.shift();
        if (winner.owed <= 0.01) winners.shift();
    }
    document.getElementById('payout-list').innerHTML = payments.join('<br>');
    saveState();
});

// Reset game functionality
document.getElementById('reset-game').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the game? This will clear all players and settings.')) {
        // Clear localStorage
        localStorage.removeItem('pokerGameState');
        
        // Reset variables
        players = [];
        gameStarted = false;
        dollarsPerChip = 1;
        
        // Reset UI
        document.getElementById('player-table').querySelector('tbody').innerHTML = '';
        document.getElementById('ratio-display').textContent = 'Each chip is worth $1.00';
        document.getElementById('add-player').style.display = 'block';
        document.getElementById('end-game').disabled = true;
        document.getElementById('animation').style.display = 'none';
        document.getElementById('payout-list').innerHTML = '';
        document.getElementById('ratio-form').reset();
        document.getElementById('player-form').reset();
        
        // Clear hand animation
        const container = document.getElementById('dealer-wheel');
        if (container) {
            container.innerHTML = '';
        }
        
        alert('Game has been reset successfully.');
    }
});

// Update the revealHoleCards method in HandAnimation class
window.revealHoleCards = function() {
    this.players.forEach((player, playerIndex) => {
        if (!player.cards || player.cards.length === 0) {
            console.warn(`No cards found for player ${playerIndex + 1}`);
            return;
        }

        player.cards.forEach((card, cardIndex) => {
            const cardEl = document.querySelector(`.player-${playerIndex + 1} .card-${cardIndex + 1}`);
            if (!cardEl) {
                console.error(`Card element not found for player ${playerIndex + 1}, card ${cardIndex + 1}`);
                return;
            }

            // Set card content
            cardEl.textContent = `${card.rank}${card.suit}`;
            
            // Add face-up class with delay for animation
            setTimeout(() => {
                cardEl.classList.add('face-up');
            }, cardIndex * 200); // Stagger the card reveals
        });
    });
}