// Core game functionality
// Use PokerApp.state instead of creating a new gameState
// gameState references will be replaced with PokerApp.state

// Game management functions
function startGame() {
    if (PokerApp.state.players.length < 2) {
        PokerApp.UI.showToast('Need at least 2 players to start the game.', 'error');
        return;
    }
    
    PokerApp.state.gameInProgress = true;
    updateEmptyState();
    
    // Initialize dealer selection if not already done
    if (!PokerApp.state.dealerId) {
        simulateHand();
    }
    
    // Update UI elements
    document.getElementById('start-game').disabled = true;
    document.getElementById('simulate-hand').disabled = false;
    document.getElementById('end-game').disabled = false;
    document.getElementById('game-status').textContent = 'Game in progress';
    document.getElementById('game-status').classList.add('active');
    
    // Save state
    saveState();
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
        database.ref(`games/${PokerApp.state.sessionId}`).update({
            status: 'ended',
            active: false
        });
        database.ref(`games/${PokerApp.state.sessionId}`).off();
        PokerApp.state.sessionId = null;
        PokerApp.state.gameName = null;
        PokerApp.state.lobbyActive = false;
    }
    
    // Update lobby UI
    updateLobbyUI(false);
    
    // Save state
    saveState();
}

function resetGame() {
    // End current game if in progress
    if (PokerApp.state.gameInProgress) {
        endGame();
    }
    
    // Reset game state
    PokerApp.state.players = [];
    PokerApp.state.dealerId = null;
    PokerApp.state.nextPlayerId = 1;
    PokerApp.state.gameInProgress = false;
    
    // Update UI
    updatePlayerList();
    updateEmptyState();
    
    // Save state
    saveState();
    
    PokerApp.UI.showToast('Game reset successfully', 'success');
}

// Export game functions
window.startGame = startGame;
window.endGame = endGame;
window.resetGame = resetGame; 