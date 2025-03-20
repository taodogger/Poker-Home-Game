// Initialize Firebase database reference
let buyInDatabase;
try {
    if (window.database) {
        buyInDatabase = window.database;
        console.log('[FIREBASE] Using existing database reference');
    } else if (window.firebaseConfig) {
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        buyInDatabase = firebase.database();
        console.log('[FIREBASE] Created new database connection');
    } else {
        throw new Error('Firebase configuration not found');
    }
} catch (error) {
    console.error('[FIREBASE] Error initializing database:', error);
    showError('Could not connect to the game database. Please try again later.');
}

// Get game ID and name from URL
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId') || urlParams.get('game-id');
const gameName = urlParams.get('game-name');

console.log('[BUY-IN] Starting buy-in page with gameId:', gameId);
console.log('[BUY-IN] Game name from URL:', gameName);

// Theme configuration
const themes = {
    'Classic': {
        '--main-color': '#ff4757',
        '--main-color-rgb': '255, 71, 87',
        '--secondary-color': '#ff6b81',
        '--secondary-color-rgb': '255, 107, 129',
        '--body-background': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff4757, #ff6b81)'
    },
    'Ocean': {
        '--main-color': '#2ed3ff',
        '--main-color-rgb': '46, 211, 255',
        '--secondary-color': '#1e90ff',
        '--secondary-color-rgb': '30, 144, 255',
        '--body-background': 'linear-gradient(135deg, #0a192f, #112240)',
        '--vibrant-gradient': 'linear-gradient(45deg, #2ed3ff, #1e90ff)'
    },
    'Forest': {
        '--main-color': '#2ed573',
        '--main-color-rgb': '46, 213, 115',
        '--secondary-color': '#7bed9f',
        '--secondary-color-rgb': '123, 237, 159',
        '--body-background': 'linear-gradient(135deg, #1a2f1a, #2d4a2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #2ed573, #7bed9f)'
    },
    'Sunset': {
        '--main-color': '#ffa502',
        '--main-color-rgb': '255, 165, 2',
        '--secondary-color': '#ff6b81',
        '--secondary-color-rgb': '255, 107, 129',
        '--body-background': 'linear-gradient(135deg, #2d1a1a, #4a2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ffa502, #ff6b81)'
    },
    'Fire': {
        '--main-color': '#ff6347',
        '--main-color-rgb': '255, 99, 71',
        '--secondary-color': '#ff4500',
        '--secondary-color-rgb': '255, 69, 0',
        '--body-background': 'linear-gradient(135deg, #2d1a1a, #4a2d2d)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff6347, #ff4500)'
    },
    'Purple': {
        '--main-color': '#9370db',
        '--main-color-rgb': '147, 112, 219',
        '--secondary-color': '#8a2be2',
        '--secondary-color-rgb': '138, 43, 226',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #9370db, #8a2be2)'
    },
    'Neon': {
        '--main-color': '#00ffff',
        '--main-color-rgb': '0, 255, 255',
        '--secondary-color': '#00ced1',
        '--secondary-color-rgb': '0, 206, 209',
        '--body-background': 'linear-gradient(135deg, #0a1a2d, #1a2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #00ffff, #00ced1)'
    },
    'Rizzler': {
        '--main-color': '#ff00ff',
        '--main-color-rgb': '255, 0, 255',
        '--secondary-color': '#bf00ff',
        '--secondary-color-rgb': '191, 0, 255',
        '--body-background': 'linear-gradient(135deg, #2d1a2d, #4a2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #ff00ff, #bf00ff)'
    },
    'Doginme': {
        '--main-color': '#1e90ff',
        '--main-color-rgb': '30, 144, 255',
        '--secondary-color': '#4169e1',
        '--secondary-color-rgb': '65, 105, 225',
        '--body-background': 'linear-gradient(135deg, #1a1a2d, #2d2d4a)',
        '--vibrant-gradient': 'linear-gradient(45deg, #1e90ff, #4169e1)'
    }
};

// Set theme function
function setTheme(themeName) {
    const theme = themes[themeName] || themes['Classic'];
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
if (gameId && buyInDatabase) {
    console.log('[FIREBASE] Setting up chip ratio listener for game:', gameId);
    try {
        buyInDatabase.ref(`games/${gameId}/ratio`).on('value', (snapshot) => {
            console.log('[FIREBASE] Received chip ratio:', snapshot.val());
            if (snapshot.exists()) {
                chipRatio = snapshot.val();
                document.getElementById('chip-ratio').textContent = chipRatio.toFixed(2);
                updateChipPreview();
            } else {
                console.log('[FIREBASE] No chip ratio found, using default of 1.0');
            }
        });
    } catch (error) {
        console.error('[FIREBASE] Error setting up chip ratio listener:', error);
        showError('Error connecting to the game. Please try again.');
    }
}

// Show game name if available
if (gameName) {
    const gameNameElem = document.querySelector('h1');
    if (gameNameElem) {
        gameNameElem.textContent = `Join ${gameName}`;
    }
}

// Update chip preview when buy-in amount changes
document.getElementById('buy-in-amount')?.addEventListener('input', updateChipPreview);

function updateChipPreview() {
    const buyInAmount = parseFloat(document.getElementById('buy-in-amount')?.value) || 0;
    const chipAmount = Math.floor(buyInAmount / chipRatio);
    const chipAmountElement = document.getElementById('chip-amount');
    if (chipAmountElement) {
        chipAmountElement.textContent = chipAmount;
        // Update the preview text color based on amount
        chipAmountElement.style.color = chipAmount > 0 ? 'var(--main-color)' : '#ff4757';
    }
}

// Load game data and set up form
if (gameId && buyInDatabase) {
    console.log('[FIREBASE] Fetching game data for ID:', gameId);
    try {
        // Clean up any existing listeners first
        buyInDatabase.ref(`games/${gameId}`).off();
        buyInDatabase.ref(`games/${gameId}/state`).off();
        buyInDatabase.ref(`games/${gameId}/state/players`).off();
        buyInDatabase.ref(`games/${gameId}/state/theme`).off();
        
        buyInDatabase.ref(`games/${gameId}`)
            .once('value')
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    console.error('[FIREBASE] Game not found in database');
                    throw new Error('Game not found. It may have been deleted or never existed.');
                }
                
                const game = snapshot.val();
                console.log('[FIREBASE] Retrieved game data:', game);
                
                if (!game || !game.active) {
                    console.error('[FIREBASE] Game not active:', game);
                    throw new Error('Game not found or no longer active');
                }

                // Update theme from game state
                if (game.state && game.state.theme) {
                    console.log('[THEME] Setting theme to:', game.state.theme);
                    setTheme(game.state.theme);
                }

                // Show game info
                const gameInfo = document.getElementById('game-info');
                if (gameInfo) {
                    gameInfo.innerHTML = `
                        <h2>${game.name}</h2>
                        <p>$${game.ratio || '1.00'} per chip</p>
                    `;
                    console.log('[UI] Updated game info display');
                }

                // Update chip ratio
                chipRatio = game.ratio || 1.0;
                const chipRatioElement = document.getElementById('chip-ratio');
                if (chipRatioElement) {
                    chipRatioElement.textContent = chipRatio.toFixed(2);
                }
                updateChipPreview();

                // Handle form submission
                const form = document.getElementById('buy-in-form');
                if (!form) {
                    console.error('[ERROR] Buy-in form not found');
                    return;
                }

                // Remove any existing listeners and create fresh form
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);

                // Set up form submission handler
                newForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const submitButton = newForm.querySelector('button');
                    if (submitButton) submitButton.disabled = true;
                    
                    const playerName = document.getElementById('player-name')?.value.trim();
                    const buyInAmount = parseFloat(document.getElementById('buy-in-amount')?.value);
                    
                    if (!playerName) {
                        updateStatus('Please enter your name', 'error');
                        if (submitButton) submitButton.disabled = false;
                        return;
                    }
                    
                    if (isNaN(buyInAmount) || buyInAmount <= 0) {
                        updateStatus('Please enter a valid buy-in amount', 'error');
                        if (submitButton) submitButton.disabled = false;
                        return;
                    }
                    
                    const chips = Math.floor(buyInAmount / chipRatio);
                    if (chips <= 0) {
                        updateStatus('Buy-in amount too low for minimum chips', 'error');
                        if (submitButton) submitButton.disabled = false;
                        return;
                    }
                    
                    updateStatus('Processing buy-in...', 'pending');
                    
                    try {
                        // Re-check game status
                        const gameSnapshot = await buyInDatabase.ref(`games/${gameId}`).once('value');
                        const gameData = gameSnapshot.val();

                        if (!gameData || !gameData.active) {
                            throw new Error('Game is no longer active');
                        }

                        // Get current players with validation
                        const stateSnapshot = await buyInDatabase.ref(`games/${gameId}/state`).once('value');
                        const gameState = stateSnapshot.val() || {};
                        
                        let players = [];
                        if (gameState.players) {
                            players = Array.isArray(gameState.players) ? gameState.players : Object.values(gameState.players);
                            players = players.filter(p => p && p.id && p.name);
                        }

                        // Check for duplicate name
                        const normalizedNewName = playerName.toLowerCase().trim();
                        if (players.some(p => p.name.toLowerCase().trim() === normalizedNewName)) {
                            throw new Error('This name is already taken. Please choose a different name.');
                        }

                        // Create new player
                        const nextId = Math.max(...players.map(p => p.id || 0), 0) + 1;
                        const newPlayer = {
                            id: nextId,
                            name: playerName,
                            initial_chips: chips,
                            current_chips: chips,
                            joinedAt: Date.now(),
                            active: true
                        };

                        // Update game state with transaction
                        await buyInDatabase.ref(`games/${gameId}/state`).transaction((currentState) => {
                            if (!currentState) return null;
                            
                            const currentPlayers = currentState.players || [];
                            // Double-check name isn't taken
                            if (currentPlayers.some(p => p && p.name && p.name.toLowerCase().trim() === normalizedNewName)) {
                                return; // Abort transaction
                            }
                            
                            return {
                                ...currentState,
                                players: [...currentPlayers, newPlayer],
                                nextPlayerId: nextId + 1,
                                lastUpdate: Date.now(),
                                lastPlayer: newPlayer
                            };
                        });

                        // Show success message
                        const container = document.querySelector('.container');
                        if (container) {
                            container.innerHTML = `
                                <div class="welcome-container">
                                    <div class="welcome-content">
                                        <h2>🎉 Welcome to ${gameData.name}!</h2>
                                        <p>You've successfully joined with ${chips} chips.</p>
                                        <p>The host will start the game shortly.</p>
                                        <p class="close-instruction">You can close this window now.</p>
                                    </div>
                                </div>
                            `;
                        }

                        // Clean up listeners
                        buyInDatabase.ref(`games/${gameId}`).off();
                        buyInDatabase.ref(`games/${gameId}/state`).off();
                        buyInDatabase.ref(`games/${gameId}/state/players`).off();
                        buyInDatabase.ref(`games/${gameId}/state/theme`).off();

                    } catch (error) {
                        console.error('[BUY-IN] Error:', error);
                        updateStatus(error.message, 'error');
                        if (submitButton) submitButton.disabled = false;
                    }
                });
            })
            .catch(error => {
                console.error('[FIREBASE] Error:', error);
                showError(error.message);
            });
    } catch (error) {
        console.error('[FIREBASE] Error:', error);
        showError('Could not connect to the game. Please try again.');
    }
} else {
    showError('Invalid game link. Please use the QR code or link from the host.');
}

// Listen for theme changes from host
if (gameId && buyInDatabase) {
    try {
        buyInDatabase.ref(`games/${gameId}/state/theme`).on('value', snapshot => {
            const theme = snapshot.val();
            if (theme) {
                console.log('[THEME] Theme updated from host to:', theme);
                setTheme(theme);
            }
        });
    } catch (error) {
        console.error('[FIREBASE] Error setting up theme listener:', error);
    }
}

// Update status display
function updateStatus(message, type = 'pending') {
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
    }
}

// Show error message
function showError(message) {
    console.error('[ERROR]', message);
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <h1>Error</h1>
                <div class="error-message">${message}</div>
                <button onclick="window.location.reload()" class="poker-button">
                    Try Again
                </button>
                <button onclick="window.location.href = '/'" class="poker-button" style="margin-top: 10px; background: linear-gradient(45deg, #555, #777);">
                    Back to Home
                </button>
            </div>
        `;
    }
}

// Toast notification system
function showToast(message, type = 'success') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 