document.addEventListener('DOMContentLoaded', () => {
    console.log('DevTools Ready');

    const testConnectionBtn = document.getElementById('test-connection-btn');
    const forceMobileLayoutBtn = document.getElementById('force-mobile-layout-btn');
    const debugLog = document.getElementById('debug-log');

    const now = () => new Date().toISOString().split('T')[1].split('.')[0];

    const logMessage = (message, type = 'info') => {
        if (debugLog) {
            const color = type === 'error' ? '#f44336' : '#fff';
            debugLog.innerHTML += `<div style="color: ${color};">[${now()}] ${message}</div>`;
            debugLog.scrollTop = debugLog.scrollHeight;
        }
        console.log(`[DevTools] ${message}`);
    };

    // --- Firebase Connection Test ---
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', () => {
            logMessage('Testing Firebase connection...');
            if (window.database && typeof window.database.ref === 'function') {
                const connectedRef = window.database.ref('.info/connected');
                connectedRef.once('value', (snapshot) => {
                    if (snapshot.val() === true) {
                        logMessage('✅ Firebase connection is active.');
                        // Perform a test write
                        window.database.ref('_connection_test').set({ timestamp: Date.now() })
                            .then(() => logMessage('✅ Test write to database successful.'))
                            .catch(err => logMessage(`❌ Test write failed: ${err.message}`, 'error'));
                    } else {
                        logMessage('❌ Firebase is not connected.', 'error');
                    }
                });
            } else {
                logMessage('Firebase database object not found on window. Ensure firebase-config.js is loaded.', 'error');
            }
        });
    }

    // --- Force Mobile Layout ---
    // This button is a placeholder for now, as the function it calls
    // (forceUpdateMobileLayout) is part of the main app's context.
    // To make this work, we would need to load the main app script here as well,
    // which might be complex. For now, it will just log a message.
    if (forceMobileLayoutBtn) {
        forceMobileLayoutBtn.addEventListener('click', () => {
            logMessage('Attempting to force mobile layout...');
            if (typeof window.forceUpdateMobileLayout === 'function') {
                window.forceUpdateMobileLayout();
                logMessage('`forceUpdateMobileLayout` function was called.');
            } else {
                logMessage('`forceUpdateMobileLayout` function not found. This tool requires the main `app.js` to be loaded and the function exposed globally.', 'error');
            }
        });
    }
}); 