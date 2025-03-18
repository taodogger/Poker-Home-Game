import { ref, set, get, push, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';

class DatabaseService {
    static async createGameSession(gameData) {
        try {
            const gameRef = ref(database, `games/${gameData.id}`);
            await set(gameRef, {
                ...gameData,
                createdAt: Date.now(),
                status: 'active'
            });
            return gameData.id;
        } catch (error) {
            console.error('Error creating game session:', error);
            throw new Error('Failed to create game session');
        }
    }

    static async getBuyInRequests(gameId) {
        try {
            const requestsRef = ref(database, `games/${gameId}/requests`);
            const snapshot = await get(requestsRef);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting buy-in requests:', error);
            throw new Error('Failed to get buy-in requests');
        }
    }

    static async createBuyInRequest(gameId, requestData) {
        try {
            const requestsRef = ref(database, `games/${gameId}/requests`);
            const newRequestRef = push(requestsRef);
            await set(newRequestRef, {
                ...requestData,
                status: 'pending',
                timestamp: Date.now()
            });
            return newRequestRef.key;
        } catch (error) {
            console.error('Error creating buy-in request:', error);
            throw new Error('Failed to create buy-in request');
        }
    }

    static async updateBuyInRequest(gameId, requestId, status) {
        try {
            const requestRef = ref(database, `games/${gameId}/requests/${requestId}`);
            await set(requestRef, {
                status,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error updating buy-in request:', error);
            throw new Error('Failed to update buy-in request');
        }
    }

    static listenToGameUpdates(gameId, callback) {
        const gameRef = ref(database, `games/${gameId}`);
        onValue(gameRef, (snapshot) => {
            callback(snapshot.val());
        });

        // Return unsubscribe function
        return () => off(gameRef);
    }

    static async updateGameState(gameId, gameState) {
        try {
            const gameRef = ref(database, `games/${gameId}`);
            await set(gameRef, {
                ...gameState,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error updating game state:', error);
            throw new Error('Failed to update game state');
        }
    }

    static async getGameState(gameId) {
        try {
            const gameRef = ref(database, `games/${gameId}`);
            const snapshot = await get(gameRef);
            return snapshot.val();
        } catch (error) {
            console.error('Error getting game state:', error);
            throw new Error('Failed to get game state');
        }
    }
}

export default DatabaseService; 