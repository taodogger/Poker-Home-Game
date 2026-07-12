// results.js — standalone read-only settlement page for Kapoker.
//
// Boots Firebase the same way buy-in.js does (reuses window.database created by
// firebase-config.js, or initializes from window.firebaseConfig as a fallback),
// reads gameId from the URL, and live-subscribes to:
//   games/{gameId}/payoutInfo  — { gameName, transactions[], netSummary[],
//                                  calculatedAt, status, paidStatus{} }
//   games/{gameId}/name        — canonical game name (fallback for title)
//
// Anyone with the link can tick a payment as settled; toggling writes
// games/{gameId}/payoutInfo/paidStatus/{index} directly and every viewer sees
// it update live. This is intentionally trust-based — it's a home game.

(function () {
    'use strict';

    // --- Firebase bootstrap (mirrors buy-in.js) ---
    let resultsDatabase;
    try {
        if (window.database) {
            resultsDatabase = window.database;
            console.log('[RESULTS] Using existing window.database reference');
        } else if (window.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
            }
            resultsDatabase = firebase.database();
            console.log('[RESULTS] Created database connection from window.firebaseConfig');
        } else {
            throw new Error('Firebase configuration not found');
        }
    } catch (error) {
        console.error('[RESULTS] Error initializing database:', error);
    }

    // --- URL params ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId') || urlParams.get('game-id');

    // --- DOM handles ---
    const els = {
        gameName: document.getElementById('game-name'),
        gameDate: document.getElementById('game-date'),
        progressSection: document.getElementById('progress-section'),
        progressText: document.getElementById('progress-text'),
        progressPercent: document.getElementById('progress-percent'),
        progressBar: document.getElementById('progress-bar'),
        remittanceSection: document.getElementById('remittance-section'),
        remittanceList: document.getElementById('remittance-list'),
        summarySection: document.getElementById('summary-section'),
        summaryList: document.getElementById('summary-list'),
        emptyState: document.getElementById('empty-state'),
        emptyMessage: document.getElementById('empty-message')
    };

    // --- Helpers ---
    function fmtMoney(value) {
        const n = Number(value);
        return (isNaN(n) ? 0 : n).toFixed(2);
    }

    function fmtDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    // RTDB hands arrays back as arrays or index-keyed objects; normalize to array.
    function toArray(raw) {
        if (!raw) return [];
        return Array.isArray(raw) ? raw : Object.values(raw);
    }

    // paidStatus may be an object keyed by index string, or a sparse array.
    function isPaid(paidStatus, index) {
        if (!paidStatus) return false;
        return paidStatus[index] === true || paidStatus[String(index)] === true;
    }

    function showToast(message, type) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }

    function setSectionsVisible(hasPayouts) {
        els.progressSection.hidden = !hasPayouts;
        els.remittanceSection.hidden = !hasPayouts;
        els.summarySection.hidden = !hasPayouts;
        els.emptyState.hidden = hasPayouts;
    }

    function renderEmpty(message) {
        els.emptyMessage.textContent = message;
        setSectionsVisible(false);
        // Progress/remittance/summary already hidden by setSectionsVisible(false).
    }

    // --- Paid toggle write ---
    function togglePaid(index, paid) {
        if (!resultsDatabase || !gameId) return;
        resultsDatabase
            .ref(`games/${gameId}/payoutInfo/paidStatus/${index}`)
            .set(paid)
            .catch(err => {
                console.error('[RESULTS] Failed to update paid status:', err);
                showToast('Could not save — check your connection', 'error');
            });
    }

    // --- Render remittance rows ---
    function renderRemittance(transactions, paidStatus) {
        els.remittanceList.innerHTML = '';

        if (transactions.length === 0) {
            const li = document.createElement('li');
            li.className = 'remittance-empty';
            li.textContent = 'Everyone is even — no payments needed. 🎉';
            els.remittanceList.appendChild(li);
            els.progressSection.hidden = true;
            return;
        }

        transactions.forEach((t, index) => {
            if (!t) return;
            const paid = isPaid(paidStatus, index);

            const li = document.createElement('li');
            li.className = 'remittance-row' + (paid ? ' is-paid' : '');

            const checkbox = document.createElement('button');
            checkbox.type = 'button';
            checkbox.className = 'pay-check';
            checkbox.setAttribute('role', 'checkbox');
            checkbox.setAttribute('aria-checked', paid ? 'true' : 'false');
            checkbox.setAttribute('aria-label',
                `Mark ${t.from} pays ${t.to} $${fmtMoney(t.cash)} as ${paid ? 'unsettled' : 'settled'}`);
            checkbox.addEventListener('click', () => togglePaid(index, !paid));

            const body = document.createElement('div');
            body.className = 'remittance-body';

            const line = document.createElement('div');
            line.className = 'remittance-line';
            line.innerHTML =
                `<span class="pay-from">${escapeHtml(t.from)}</span>` +
                `<span class="pay-arrow">pays</span>` +
                `<span class="pay-to">${escapeHtml(t.to)}</span>`;

            const amount = document.createElement('div');
            amount.className = 'remittance-amount';
            amount.textContent = '$' + fmtMoney(t.cash);

            body.appendChild(line);
            body.appendChild(amount);

            li.appendChild(checkbox);
            li.appendChild(body);
            els.remittanceList.appendChild(li);
        });
    }

    // --- Render net summary ---
    function renderSummary(netSummary) {
        els.summaryList.innerHTML = '';
        if (netSummary.length === 0) {
            els.summarySection.hidden = true;
            return;
        }
        els.summarySection.hidden = false;

        // Winners first, then by magnitude.
        const sorted = [...netSummary].sort((a, b) => (Number(b.net) || 0) - (Number(a.net) || 0));
        sorted.forEach(p => {
            if (!p || !p.name) return;
            const net = Number(p.net) || 0;
            const li = document.createElement('li');
            li.className = 'summary-row ' + (net > 0 ? 'is-up' : net < 0 ? 'is-down' : 'is-even');

            const name = document.createElement('span');
            name.className = 'summary-name';
            name.textContent = p.name;

            const value = document.createElement('span');
            value.className = 'summary-value';
            const sign = net > 0 ? '+' : net < 0 ? '−' : '';
            value.textContent = `${sign}$${fmtMoney(Math.abs(net))}`;

            li.appendChild(name);
            li.appendChild(value);
            els.summaryList.appendChild(li);
        });
    }

    // --- Render progress ---
    function renderProgress(transactions, paidStatus) {
        const total = transactions.filter(Boolean).length;
        if (total === 0) {
            els.progressSection.hidden = true;
            return;
        }
        let settled = 0;
        transactions.forEach((t, i) => { if (t && isPaid(paidStatus, i)) settled++; });
        const pct = Math.round((settled / total) * 100);

        els.progressSection.hidden = false;
        els.progressText.textContent = `${settled} of ${total} payment${total === 1 ? '' : 's'} settled`;
        els.progressPercent.textContent = `${pct}%`;
        els.progressBar.style.width = `${pct}%`;
        els.progressSection.classList.toggle('is-complete', settled === total);
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // --- Main render from a payoutInfo snapshot ---
    let fallbackName = null;

    function renderPayoutInfo(payoutInfo) {
        const name = (payoutInfo && payoutInfo.gameName) || fallbackName || 'Poker Game';
        els.gameName.textContent = name;
        document.title = `Payouts — ${name} | Kapoker`;

        if (!payoutInfo || !payoutInfo.transactions && !payoutInfo.netSummary) {
            els.gameDate.textContent = '';
            renderEmpty('No payouts have been calculated for this game yet.');
            return;
        }

        const transactions = toArray(payoutInfo.transactions);
        const netSummary = toArray(payoutInfo.netSummary);
        const paidStatus = payoutInfo.paidStatus || null;

        els.gameDate.textContent = fmtDate(payoutInfo.calculatedAt);

        setSectionsVisible(true);
        renderRemittance(transactions, paidStatus);
        renderSummary(netSummary);
        renderProgress(transactions, paidStatus);
    }

    // --- Boot ---
    if (!gameId) {
        els.gameName.textContent = 'No game selected';
        renderEmpty('This link is missing a game id. Ask the host to reshare the results link.');
        return;
    }

    if (!resultsDatabase) {
        els.gameName.textContent = 'Connection error';
        renderEmpty('Could not connect to the game database. Please try again later.');
        return;
    }

    // Canonical game name (fallback if payoutInfo has none yet).
    resultsDatabase.ref(`games/${gameId}/name`).on('value', snapshot => {
        const n = snapshot.val();
        if (n) {
            fallbackName = n;
            if (els.gameName.textContent === 'Loading payouts…' ||
                els.gameName.textContent === 'Poker Game') {
                els.gameName.textContent = n;
            }
        }
    }, err => console.warn('[RESULTS] name listener error:', err));

    // Live payout info.
    resultsDatabase.ref(`games/${gameId}/payoutInfo`).on('value', snapshot => {
        renderPayoutInfo(snapshot.val());
    }, err => {
        console.error('[RESULTS] payoutInfo listener error:', err);
        renderEmpty('Could not load payouts. Please refresh and try again.');
    });
})();
