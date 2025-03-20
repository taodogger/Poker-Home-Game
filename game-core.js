// Core game functionality
// Use PokerApp.state instead of creating a new gameState
// gameState references will be replaced with PokerApp.state

// Ensure we have access to Firebase database
// Use window.gameDatabase to avoid conflicts with global database variable
let gameDatabase;
try {
    // Try to get database from window.firebase first (from firebase-config.js)
    if (window.firebase && window.firebase.database) {
        gameDatabase = window.firebase.database();
        console.log('[FIREBASE] Using firebase.database() reference in game-core.js');
    } 
    // Fall back to window.database (exported from firebase-config.js)
    else if (window.database) {
        gameDatabase = window.database;
        console.log('[FIREBASE] Using window.database reference in game-core.js');
    } else {
        console.warn('[FIREBASE] Firebase database reference not available in game-core.js!');
    }
} catch (error) {
    console.error('[FIREBASE] Error initializing database reference in game-core.js:', error);
}

// Function to simulate a poker hand (dealer selection)
function simulateHand() {
    if (!PokerApp.state.gameInProgress) {
        PokerApp.UI.showToast('Game is not in progress', 'error');
        return;
    }
    
    if (PokerApp.state.players.length < 2) {
        PokerApp.UI.showToast('Need at least 2 players to simulate a hand', 'error');
        return;
    }
    
    console.log('[GAME] Simulating a new hand');
    
    try {
        // Select a new dealer (next player in sequence or random if current dealer not found)
        const currentDealerIndex = PokerApp.state.players.findIndex(p => p.id === PokerApp.state.dealerId);
        let newDealerIndex;
        
        if (currentDealerIndex >= 0 && currentDealerIndex < PokerApp.state.players.length - 1) {
            // Move to next player
            newDealerIndex = currentDealerIndex + 1;
        } else {
            // Wrap around to first player or choose random if dealer not found
            newDealerIndex = 0;
        }
        
        // Update dealer ID
        PokerApp.state.dealerId = PokerApp.state.players[newDealerIndex].id;
        
        // Run the hand animation if available
        if (window.handAnimation) {
            // Update players in the animation
            window.handAnimation.setPlayers(PokerApp.state.players);
            
            // Run the spin animation
            window.handAnimation.spin().then(() => {
                console.log('[ANIMATION] Hand animation completed');
                
                // Update UI after animation
                highlightDealer(PokerApp.state.dealerId);
                
                // Save state after dealer update
                saveState();
            }).catch(error => {
                console.error('[ANIMATION] Error during hand animation:', error);
            });
        } else {
            // No animation available, just update UI
            console.log('[GAME] No animation available, updating dealer to:', PokerApp.state.dealerId);
            highlightDealer(PokerApp.state.dealerId);
            saveState();
        }
    } catch (error) {
        console.error('[GAME] Error simulating hand:', error);
        PokerApp.UI.showToast('Error simulating hand', 'error');
    }
}

// Helper function to highlight the current dealer
function highlightDealer(dealerId) {
    // Remove all dealer highlights first
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('dealer');
    });
    
    // Add highlight to the new dealer
    if (dealerId) {
        const dealerCard = document.querySelector(`.player-card[data-player-id="${dealerId}"]`);
        if (dealerCard) {
            dealerCard.classList.add('dealer');
        }
    }
}

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
    
    // Update game status with the new status function
    PokerApp.UI.updateGameStatus('Game in progress', true);
    
    // Show animation section
    const animationSection = document.getElementById('animation');
    if (animationSection) {
        animationSection.style.display = 'block';
        // Scroll to the animation section
        animationSection.scrollIntoView({ behavior: 'smooth' });
    }
    
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
    
    // Update game status with the new status function
    PokerApp.UI.updateGameStatus('Game ended', false);
    
    // Clean up Firebase
    if (PokerApp.state.sessionId && gameDatabase) {
        try {
            // Update game status to ended
            gameDatabase.ref(`games/${PokerApp.state.sessionId}`).update({
                status: 'ended',
                active: false
            });
            
            // Remove all listeners
            gameDatabase.ref(`games/${PokerApp.state.sessionId}`).off();
            gameDatabase.ref(`games/${PokerApp.state.sessionId}/state/players`).off();
        } catch (error) {
            console.error('[FIREBASE] Error cleaning up Firebase in endGame:', error);
        }
        
        // Reset session info
        PokerApp.state.sessionId = null;
        PokerApp.state.gameName = null;
        PokerApp.state.lobbyActive = false;
    }
    
    // Update lobby UI
    PokerApp.UI.updateLobbyUI(false);
    
    // Save state
    saveState();
}

// Helper function to save state
function saveState() {
    if (typeof window.saveState === 'function') {
        window.saveState();
    }
}

// Helper function for updateEmptyState
function updateEmptyState() {
    if (typeof window.updateEmptyState === 'function') {
        window.updateEmptyState();
    }
}

// Export game functions
window.startGame = startGame;
window.endGame = endGame;
// window.resetGame = resetGame; // Removed to prevent duplicate function calls

// Add the missing export for simulateHand
// This is needed by app.js
window.simulateHand = simulateHand;