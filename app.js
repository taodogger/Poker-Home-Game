// Define themes with main colors and gradients
const themes = {
    'classic-green': {
        '--main-color': '#2E8B57',
        '--secondary-color': '#3CB371'
    },
    'royal-blue': {
        '--main-color': '#4169E1',
        '--secondary-color': '#1E90FF'
    },
    'crimson-red': {
        '--main-color': '#DC143C',
        '--secondary-color': '#FF4500'
    },
    'midnight-black': {
        '--main-color': '#2F4F4F',
        '--secondary-color': '#696969'
    },
    'ocean-breeze': {
        '--main-color': '#00CED1',
        '--secondary-color': '#20B2AA'
    },
    'firestorm': {
        '--main-color': '#FF4500',
        '--secondary-color': '#FF6347'
    },
    'purple-haze': {
        '--main-color': '#9370DB',
        '--secondary-color': '#BA55D3'
    },
    'neon-nights': {
        '--main-color': '#32CD32',
        '--secondary-color': '#00FF00'
    },
    'rizzler': {
        '--main-color': '#6A0DAD',
        '--secondary-color': '#DAA520'
    },
    'doginme': {
        '--main-color': '#1E90FF',    // Bright blue
        '--secondary-color': '#104E8B' // Darker blue
    }
};

// Updated theme switching logic
function setTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) {
        console.error(`Theme "${themeName}" not found!`);
        return;
    }

    // Remove existing theme-specific classes
    document.body.classList.remove('theme-rizzler', 'theme-doginme');
    
    // Apply theme colors
    Object.entries(theme).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
    });
    
    // Update icons
    const leftIcon = document.getElementById('left-icon');
    const rightIcon = document.getElementById('right-icon');
    
    if (leftIcon && rightIcon) {
        if (themeName === 'rizzler') {
            leftIcon.innerHTML = '💪';
            rightIcon.innerHTML = '💪';
            document.body.classList.add('theme-rizzler');
        } else if (themeName === 'doginme') {
            leftIcon.innerHTML = '<img src="images/doginme-icon.png" alt="Doginme Icon" class="title-icon-img">';
            rightIcon.innerHTML = '<img src="images/doginme-icon.png" alt="Doginme Icon" class="title-icon-img">';
            document.body.classList.add('theme-doginme');
        } else {
            leftIcon.innerHTML = '♠️';
            rightIcon.innerHTML = '♥️';
        }
    }
    
    localStorage.setItem('pokerTheme', themeName);
}

let players = [];
let gameStarted = false;
let dollarsPerChip = 1; // Default: $1 per chip

// Load saved state when page loads
document.addEventListener('DOMContentLoaded', function() {
    const themeSelector = document.getElementById('theme-selector');
    
    if (!themeSelector) {
        console.error('Theme selector not found! Check if element with id="theme-selector" exists.');
        return;
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('pokerTheme');
    if (savedTheme && themes[savedTheme]) {
        setTheme(savedTheme);
        themeSelector.value = savedTheme;
    } else {
        setTheme('classic-green');
        themeSelector.value = 'classic-green';
    }

    // Add change listener
    themeSelector.addEventListener('change', function() {
        setTheme(this.value);
    });

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

// Add toggle functionality
document.getElementById('toggle-ratio').addEventListener('click', function() {
    const formContainer = document.getElementById('ratio-form-container');
    formContainer.classList.toggle('hidden');
    this.textContent = formContainer.classList.contains('hidden') ? '+' : '−';
});

// Update the ratio form submission to collapse after setting
document.getElementById('ratio-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let realMoney = parseFloat(document.getElementById('real_money').value);
    let chips = parseInt(document.getElementById('chips').value);
    if (realMoney > 0 && chips > 0) {
        dollarsPerChip = realMoney / chips;
        document.getElementById('ratio-display').textContent = 
            `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
        saveState();
        // Collapse the form after setting the ratio
        document.getElementById('ratio-form-container').classList.add('hidden');
        document.getElementById('toggle-ratio').textContent = '+';
    } else {
        alert('Please enter valid numbers for money and chips.');
    }
});

// Handle adding a player
document.getElementById('player-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (players.length >= 9) {
        alert('Maximum of 9 players allowed.');
        return;
    }
    let name = document.getElementById('name').value;
    let initialChips = parseInt(document.getElementById('initial_chips').value);
    players.push({ name, initial_chips: initialChips, current_chips: initialChips });
    updatePlayerTable();
    saveState();
    this.reset();
});

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

// Start the game
document.getElementById('start-game').addEventListener('click', function() {
    if (players.length < 2) {
        alert('Need at least 2 players to start the game.');
        return;
    }
    gameStarted = true;
    document.getElementById('add-player').style.display = 'none';
    document.getElementById('end-game').disabled = false;
    document.getElementById('animation').style.display = 'block';
    
    // Initialize and spin the dealer wheel
    dealerWheel.setPlayers(players.map(p => p.name));
    dealerWheel.spin();
    saveState();
});

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

// Callback to set the dealer
window.setDealer = function(dealer) {
    if (gameStarted) {
        alert(`The dealer is ${dealer}`);
    }
};

// Add event listener for chip input changes
document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'number' && e.target.closest('#player-table')) {
        saveState();
    }
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
        
        // Clear dealer wheel
        document.getElementById('dealer-wheel').innerHTML = '';
        
        alert('Game has been reset successfully.');
    }
});