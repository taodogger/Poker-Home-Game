let players = [];
let gameStarted = false;
let dollarsPerChip = 1; // Default: $1 per chip

// Load saved state when page loads
document.addEventListener('DOMContentLoaded', function() {
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

// Handle setting the money-to-chip ratio
document.getElementById('ratio-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let realMoney = parseFloat(document.getElementById('real_money').value);
    let chips = parseInt(document.getElementById('chips').value);
    if (realMoney > 0 && chips > 0) {
        dollarsPerChip = realMoney / chips;
        document.getElementById('ratio-display').textContent = `Each chip is worth $${dollarsPerChip.toFixed(2)}`;
        saveState();
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