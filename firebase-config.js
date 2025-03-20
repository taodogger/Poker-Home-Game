// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyp6V7w0G-zWfLsb6E_F4OL2aeekC8Qgw",
    authDomain: "poker-home-game-699e7.firebaseapp.com",
    databaseURL: "https://poker-home-game-699e7-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "poker-home-game-699e7",
    storageBucket: "poker-home-game-699e7.appspot.com",
    messagingSenderId: "582822571483",
    appId: "1:582822571483:web:3a7e7e74e6fded762fd45f"
};

// IMPORTANT: Make the config globally available first
window.firebaseConfig = firebaseConfig;

// Safe initialization - check if firebase exists first
if (typeof firebase !== 'undefined') {
    // Cleanup any existing Firebase apps to avoid conflicts
    if (firebase.apps && firebase.apps.length) {
        console.log('[FIREBASE] Cleaning up existing Firebase apps');
        firebase.apps.forEach(app => app.delete());
    }

    // Initialize Firebase
    try {
        console.log('[FIREBASE] Initializing Firebase with configuration');
        const app = firebase.initializeApp(firebaseConfig);
        console.log('[FIREBASE] Firebase app initialized successfully');
        
        // Create database reference and make it globally available
        window.database = firebase.database();
        window.firebase = firebase; // Make firebase object also globally available
        
        console.log('[FIREBASE] Database reference created');
        console.log('[FIREBASE] Database URL:', firebaseConfig.databaseURL);
        
        // Test connection and log status changes
        window.database.ref('.info/connected').on('value', (snapshot) => {
            const connected = snapshot.val();
            if (connected) {
                console.log('[FIREBASE] ✅ Connected to database!');
            } else {
                console.log('[FIREBASE] ❌ Disconnected from database');
            }
        });
        
        // Set log level based on URL params
        const urlParams = new URLSearchParams(window.location.search);
        const debug = urlParams.get('debug');
        if (debug === 'true' || debug === '1') {
            firebase.database.enableLogging(true);
            console.log('[FIREBASE] Verbose logging enabled');
        }
        
        console.log('[FIREBASE] Initialization complete');
    } catch (error) {
        console.error('[FIREBASE] Initialization error:', error);
        // Show an error message on the page
        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.bottom = '10px';
            errorDiv.style.left = '10px';
            errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '10px';
            errorDiv.style.borderRadius = '5px';
            errorDiv.style.zIndex = '9999';
            errorDiv.textContent = 'Firebase Error: ' + error.message;
            document.body.appendChild(errorDiv);
        });
    }
} else {
    console.error('[FIREBASE] Firebase SDK not loaded yet. Initialization delayed.');
    
    // Set up a retry mechanism to initialize once Firebase is loaded
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            console.log('[FIREBASE] Firebase SDK now available, initializing...');
            clearInterval(checkFirebase);
            
            // Initialize Firebase (same code as above)
            try {
                if (firebase.apps && firebase.apps.length) {
                    console.log('[FIREBASE] Cleaning up existing Firebase apps');
                    firebase.apps.forEach(app => app.delete());
                }
                
                const app = firebase.initializeApp(firebaseConfig);
                window.database = firebase.database();
                window.firebase = firebase;
                
                console.log('[FIREBASE] Firebase initialized successfully (delayed)');
                
                // Dispatch an event that other scripts can listen for
                const event = new CustomEvent('firebase-ready');
                window.dispatchEvent(event);
            } catch (error) {
                console.error('[FIREBASE] Delayed initialization error:', error);
            }
        }
    }, 100);
    
    // Stop checking after 10 seconds to avoid endless loop
    setTimeout(() => {
        clearInterval(checkFirebase);
        console.error('[FIREBASE] Timed out waiting for Firebase SDK');
    }, 10000);
} 