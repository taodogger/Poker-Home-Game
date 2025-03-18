// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBOrgiU5qkneWp8Flgbrx2eTPYLoTi7Uhc",
    authDomain: "poker-home-game-699e7.firebaseapp.com",
    databaseURL: "https://poker-home-game-699e7-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "poker-home-game-699e7",
    storageBucket: "poker-home-game-699e7.firebasestorage.app",
    messagingSenderId: "192105659517",
    appId: "1:192105659517:web:cc9da7339c2098dd09c514",
    measurementId: "G-6WT21VPL0S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Get game session ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');

if (!gameId) {
    showError('Invalid game link. Please scan the QR code again.');
}

// Get game ratio from Firebase
let chipRatio = 1.0;
database.ref(`games/${gameId}/ratio`).on('value', (snapshot) => {
    if (snapshot.exists()) {
        chipRatio = snapshot.val();
        document.getElementById('chip-ratio').textContent = chipRatio.toFixed(2);
        updateChipPreview();
    }
});

// Update chip preview when buy-in amount changes
document.getElementById('buy-in-amount').addEventListener('input', updateChipPreview);

function updateChipPreview() {
    const buyInAmount = parseFloat(document.getElementById('buy-in-amount').value) || 0;
    const chipAmount = Math.floor(buyInAmount / chipRatio);
    document.getElementById('chip-amount').textContent = chipAmount;
}

// Handle buy-in form submission
document.getElementById('player-buy-in-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const playerName = document.getElementById('player-name').value.trim();
    const buyInAmount = parseFloat(document.getElementById('buy-in-amount').value);
    const chipAmount = Math.floor(buyInAmount / chipRatio);
    
    if (!playerName || isNaN(buyInAmount) || buyInAmount <= 0) {
        showError('Please enter valid name and buy-in amount.');
        return;
    }
    
    // Create buy-in request in Firebase
    const requestRef = database.ref(`games/${gameId}/requests`).push();
    
    try {
        await requestRef.set({
            name: playerName,
            buyInAmount: buyInAmount,
            chipAmount: chipAmount,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Show waiting status
        document.getElementById('buy-in-form').style.display = 'none';
        document.getElementById('request-status').style.display = 'block';
        
        // Listen for status updates
        requestRef.on('value', (snapshot) => {
            const request = snapshot.val();
            if (request.status === 'approved') {
                showSuccess('Your buy-in has been approved! You can collect your chips from the admin.');
            } else if (request.status === 'rejected') {
                showError('Your buy-in request was rejected. Please try again or speak with the admin.');
                // Reset form
                document.getElementById('buy-in-form').style.display = 'block';
                document.getElementById('request-status').style.display = 'none';
                document.getElementById('player-buy-in-form').reset();
            }
        });
    } catch (error) {
        console.error('Error submitting buy-in request:', error);
        showError('Error submitting request. Please try again.');
    }
});

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

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
} 