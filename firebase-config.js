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

    // Initialize Firebase with configuration
    try {
        if (!firebase.apps.length) {
            console.log('[FIREBASE] Initializing Firebase with configuration');
            firebase.initializeApp(firebaseConfig);
            console.log('[FIREBASE] Firebase app initialized successfully');
        }

        // Get database reference
        window.database = firebase.database();
        console.log('[FIREBASE] Database reference created');
        console.log('[FIREBASE] Database URL:', window.database.ref().toString());

        // Set up connection state monitoring
        const connectedRef = window.database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                console.log('[FIREBASE] ✅ Connected to database!');
                // Add connection timestamp for debugging
                console.log('[FIREBASE] Connection established at:', new Date().toISOString());
                
                // Test write to verify connection is working
                window.database.ref('.info/connectionTest').set({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    client: navigator.userAgent
                })
                .then(() => {
                    console.log('[FIREBASE] Test write successful');
                })
                .catch(err => {
                    console.error('[FIREBASE] Test write failed:', err);
                });
                
                // Dispatch connection event
                window.dispatchEvent(new Event('firebase-connected'));
            } else {
                console.log('[FIREBASE] ❌ Disconnected from database');
                console.log('[FIREBASE] Disconnection at:', new Date().toISOString());
                // Attempt reconnection
                window.database.goOnline();
            }
        });

        // Set up reconnection handling
        window.database.ref('.info/connected').on('value', (snap) => {
            if (!snap.val()) {
                // Set up reconnection timeout
                setTimeout(() => {
                    if (!window.database.ref('.info/connected').key) {
                        console.log('[FIREBASE] Attempting to reconnect...');
                        window.database.goOnline();
                    }
                }, 2000);
            }
        });

        // Dispatch ready event
        window.dispatchEvent(new Event('firebase-ready'));
        console.log('[FIREBASE] Initialization complete');

    } catch (error) {
        console.error('[FIREBASE] Initialization error:', error);
        // Attempt recovery
        try {
            if (window.database) {
                window.database.goOnline();
            }
        } catch (e) {
            console.error('[FIREBASE] Recovery failed:', e);
        }
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