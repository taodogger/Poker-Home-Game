// Shared data layer for Kapoker (host app.js + player buy-in.js).
//
// Every write to games/{gameId}/state MUST go through GameData.mutateGameState.
// It wraps a Firebase transaction so concurrent writes (host edits vs phone
// rebuys) can never overwrite each other — the exact bug that used to eat
// rebuys when the host page wrote the whole players array from stale local
// state.
//
// Schema (unchanged from the original app): state = { players: [...], nextPlayerId }
// with players carrying { id, name, initial_chips, current_chips, active, ... }.
(function () {
    'use strict';

    // RTDB sometimes hands arrays back as index-keyed objects (and vice
    // versa). Every read — inside or outside a transaction — goes through
    // this so the rest of the code can always assume a dense array.
    function normalizePlayers(raw) {
        if (!raw) return [];
        const list = Array.isArray(raw) ? raw : Object.values(raw);
        return list.filter(p => p && typeof p === 'object' && p.name);
    }

    function maxPlayerId(players) {
        return players.reduce((max, p) => {
            const n = parseInt(p && p.id, 10);
            return isNaN(n) ? max : Math.max(max, n);
        }, 0);
    }

    // mutator receives { players, nextPlayerId } (players already normalized)
    // and returns the same shape, or undefined to abort (true no-op: nothing
    // is written and no listeners fire).
    // Resolves with { committed, snapshot } from the compat SDK.
    function mutateGameState(gameId, mutator) {
        if (!gameId) return Promise.reject(new Error('mutateGameState: no gameId'));
        if (!window.database) return Promise.reject(new Error('mutateGameState: Firebase not ready'));

        return window.database.ref(`games/${gameId}/state`).transaction(function (current) {
            const players = normalizePlayers(current && current.players);
            const stored = current && typeof current.nextPlayerId === 'number' ? current.nextPlayerId : 0;
            const nextPlayerId = Math.max(stored, maxPlayerId(players) + 1);

            const result = mutator({ players: players, nextPlayerId: nextPlayerId });
            if (!result) return undefined; // abort

            return Object.assign({}, current || {}, {
                players: result.players,
                nextPlayerId: result.nextPlayerId
            });
        }, undefined, /* applyLocally */ false);
    }

    window.GameData = {
        normalizePlayers: normalizePlayers,
        maxPlayerId: maxPlayerId,
        mutateGameState: mutateGameState
    };
})();
