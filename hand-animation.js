class HandAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.players = [];
        this.playerCards = []; // Store card element references
        this.isAnimating = false;
        this.positions = [
            'top', 'top-right', 'right', 'bottom-right',
            'bottom', 'bottom-left', 'left', 'top-left'
        ];
        this.suits = ['♠', '♦', '♥', '♣'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        this.radius = 180; // Distance from center for player positions
        
        this.setupContainer();
        this.setupResizeObserver();
        this.handRankings = {
            STRAIGHT_FLUSH: 0,
            FOUR_OF_A_KIND: 1,
            FULL_HOUSE: 2,
            FLUSH: 3,
            STRAIGHT: 4,
            THREE_OF_A_KIND: 5,
            TWO_PAIR: 6,
            ONE_PAIR: 7,
            HIGH_CARD: 8
        };
        
        // Track container dimensions
        this.updateDimensions();
    }

    setupContainer() {
        // Remove fixed dimensions - let CSS handle sizing
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
    }

    setupResizeObserver() {
        // Use ResizeObserver for more reliable size tracking
        this.resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                this.updateDimensions();
            });
        });
        this.resizeObserver.observe(this.container);

        // Handle full-screen changes
        document.addEventListener('fullscreenchange', () => {
            requestAnimationFrame(() => {
                this.updateDimensions();
            });
        });
    }

    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
        this.centerX = this.containerWidth / 2;
        this.centerY = this.containerHeight / 2;

        // Debug logging
        console.log(`Container dimensions: ${this.containerWidth}x${this.containerHeight}`);
        console.log(`Center point: (${this.centerX}, ${this.centerY})`);

        this.positionPlayers();
    }

    calculateContainerSize(playerCount) {
        const minSize = 400;
        const sizeIncrement = 100;
        return Math.max(minSize, 400 + (playerCount - 2) * sizeIncrement);
    }

    createDeck() {
        let deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                deck.push({ rank, suit });
            }
        }
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        return [...deck].sort(() => Math.random() - 0.5);
    }

    async spin() {
        if (this.isAnimating || this.players.length < 2) return;
        this.isAnimating = true;

        // Deal cards and run animation
        const deck = this.createDeck();
        const playersHands = [];
        const communityCards = [];
        
        // Deal hands
        for (let i = 0; i < this.players.length; i++) {
            playersHands.push([deck.pop(), deck.pop()]);
        }

        // Pre-flop
        await this.revealHoleCards(playersHands);
        await new Promise(r => setTimeout(r, 1000));

        // Flop
        communityCards.push(...deck.splice(0, 3));
        await this.dealCommunityCards(communityCards.slice(0, 3));
        await new Promise(r => setTimeout(r, 1000));

        // Turn
        communityCards.push(deck.pop());
        await this.dealCommunityCards([communityCards[3]]);
        await new Promise(r => setTimeout(r, 1000));

        // River
        communityCards.push(deck.pop());
        await this.dealCommunityCards([communityCards[4]]);
        await new Promise(r => setTimeout(r, 1000));

        // Determine and celebrate winner
        const { index: winnerIndex, handName } = this.determineWinner(playersHands, communityCards);
        await this.celebrateWinner(winnerIndex, handName);

        this.isAnimating = false;
        window.setDealer(this.players[winnerIndex]);
    }

    updateEquities(hands, communityCards) {
        const equities = this.calculateEquities(hands, communityCards);
        const playerAreas = this.container.querySelectorAll('.player-area');
        
        playerAreas.forEach((area, index) => {
            const equityDisplay = area.querySelector('.equity-display');
            if (equityDisplay) {
                equityDisplay.textContent = `Equity: ${equities[index].toFixed(1)}%`;
                equityDisplay.style.opacity = '1';
            }
        });
    }

    calculateEquities(hands, communityCards) {
        // Simple Monte Carlo simulation
        const simulations = 1000;
        const wins = new Array(hands.length).fill(0);
        
        for (let i = 0; i < simulations; i++) {
            const remainingCards = this.getRemainingCards(hands, communityCards);
            const simulatedCommunity = [...communityCards];
            
            // Complete community cards if needed
            while (simulatedCommunity.length < 5) {
                const randomIndex = Math.floor(Math.random() * remainingCards.length);
                simulatedCommunity.push(remainingCards.splice(randomIndex, 1)[0]);
            }

            const winner = this.determineWinner(hands, simulatedCommunity);
            wins[winner]++;
        }

        return wins.map(w => (w / simulations) * 100);
    }

    async revealHoleCards(hands) {
        for (let i = 0; i < this.playerCards.length; i++) {
            if (!this.playerCards[i] || !hands[i]) {
                console.error('Missing cards or hands for player', i);
                return;
            }
            const [card1, card2] = this.playerCards[i];
            await this.flipCard(card1, hands[i][0]);
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.flipCard(card2, hands[i][1]);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    async dealCommunityCards(cards) {
        const communityArea = this.container.querySelector('.community-cards');
        for (let card of cards) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.textContent = `${card.rank}${card.suit}`;
            cardEl.setAttribute('data-suit', card.suit);
            communityArea.appendChild(cardEl);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    async flipCard(cardElement, cardData) {
        if (!cardElement || !cardData) {
            console.error('Missing card element or data:', { cardElement, cardData });
            return;
        }

        cardElement.classList.remove('face-down');
        cardElement.textContent = `${cardData.rank}${cardData.suit}`;
        cardElement.setAttribute('data-suit', cardData.suit);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    setPlayers(players) {
        if (!Array.isArray(players) || players.length < 2) {
            console.error('Need at least 2 players');
            return;
        }
        this.players = players;
        this.render();
    }

    positionPlayers() {
        if (!this.players || this.players.length === 0) return;

        const playerAreas = this.container.querySelectorAll('.player-area');
        if (playerAreas.length === 0) return;

        // Measure actual player size
        const firstPlayer = playerAreas[0];
        const playerRect = firstPlayer.getBoundingClientRect();
        const playerWidth = playerRect.width;
        const playerHeight = playerRect.height;

        // Calculate elliptical radii with margin
        const margin = 20;
        const radiusX = (this.containerWidth - playerWidth - margin) / 2;
        const radiusY = (this.containerHeight - playerHeight - margin) / 2;

        const numPlayers = this.players.length;
        const angleStep = (2 * Math.PI) / numPlayers;
        const startAngle = Math.PI / 2; // Start at bottom

        playerAreas.forEach((playerDiv, index) => {
            const angle = startAngle + (angleStep * index);
            const x = this.centerX + radiusX * Math.cos(angle);
            const y = this.centerY + radiusY * Math.sin(angle);

            // Position player with transform
            playerDiv.style.position = 'absolute';
            playerDiv.style.left = `${x}px`;
            playerDiv.style.top = `${y}px`;
            playerDiv.style.transform = 'translate(-50%, -50%)';

            // Debug logging
            console.log(`Player ${index} at (${x}, ${y})`);
        });
    }

    async celebrateWinner(winnerIndex, handName) {
        const playerAreas = this.container.querySelectorAll('.player-area');
        const winnerArea = playerAreas[winnerIndex];

        // Clear previous celebrations
        playerAreas.forEach(area => {
            area.classList.remove('winner');
            const oldMessage = area.querySelector('.winning-message');
            if (oldMessage) oldMessage.remove();
        });

        // Add winner styling
        winnerArea.classList.add('winner');
        
        // Add winning message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'winning-message';
        messageDiv.innerHTML = `
            <div class="winner-title">WINNER!</div>
            <div class="hand-name">${handName}</div>
        `;
        winnerArea.appendChild(messageDiv);

        // Ensure winner is visible
        winnerArea.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    determineWinner(hands, communityCards) {
        let bestRank = 9;
        let winnerIndex = 0;

        hands.forEach((hand, index) => {
            const allCards = [...hand, ...communityCards];
            const evaluation = this.evaluateHand(allCards);
            if (evaluation.rank < bestRank) {
                bestRank = evaluation.rank;
                winnerIndex = index;
            }
        });

        return {
            index: winnerIndex,
            handName: this.evaluateHand([...hands[winnerIndex], ...communityCards]).name
        };
    }

    evaluateHand(cards) {
        // Ensure we have exactly 7 cards (2 hole + 5 community)
        if (!cards || cards.length !== 7) {
            console.error('Invalid number of cards for evaluation:', cards?.length);
            return { rank: this.handRankings.HIGH_CARD, name: 'Invalid Hand' };
        }

        // Get all possible 5-card combinations
        const fiveCardCombos = this.combinations(cards, 5);
        let bestHand = {
            rank: this.handRankings.HIGH_CARD,
            cards: [],
            name: 'High Card'
        };

        for (const combo of fiveCardCombos) {
            const currentHand = this.evaluateFiveCardHand(combo);
            if (currentHand.rank < bestHand.rank) {
                bestHand = currentHand;
            }
        }

        return bestHand;
    }

    evaluateFiveCardHand(cards) {
        // Sort cards by rank for easier evaluation
        cards.sort((a, b) => this.rankValues[b.rank] - this.rankValues[a.rank]);

        // Check each hand type from best to worst
        if (this.isStraightFlush(cards)) {
            return { rank: this.handRankings.STRAIGHT_FLUSH, cards, name: 'Straight Flush' };
        }
        if (this.isFourOfAKind(cards)) {
            return { rank: this.handRankings.FOUR_OF_A_KIND, cards, name: 'Four of a Kind' };
        }
        if (this.isFullHouse(cards)) {
            return { rank: this.handRankings.FULL_HOUSE, cards, name: 'Full House' };
        }
        if (this.isFlush(cards)) {
            return { rank: this.handRankings.FLUSH, cards, name: 'Flush' };
        }
        if (this.isStraight(cards)) {
            return { rank: this.handRankings.STRAIGHT, cards, name: 'Straight' };
        }
        if (this.isThreeOfAKind(cards)) {
            return { rank: this.handRankings.THREE_OF_A_KIND, cards, name: 'Three of a Kind' };
        }
        if (this.isTwoPair(cards)) {
            return { rank: this.handRankings.TWO_PAIR, cards, name: 'Two Pair' };
        }
        if (this.isOnePair(cards)) {
            return { rank: this.handRankings.ONE_PAIR, cards, name: 'One Pair' };
        }

        return { rank: this.handRankings.HIGH_CARD, cards, name: 'High Card' };
    }

    // Hand type checking methods
    isStraightFlush(cards) {
        return this.isFlush(cards) && this.isStraight(cards);
    }

    isFourOfAKind(cards) {
        const ranks = cards.map(card => card.rank);
        return new Set(ranks).size === 2 && 
               ranks.filter(r => ranks.filter(x => x === r).length === 4).length > 0;
    }

    isFullHouse(cards) {
        const ranks = cards.map(card => card.rank);
        const rankCounts = {};
        ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
        return Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2);
    }

    isFlush(cards) {
        return new Set(cards.map(card => card.suit)).size === 1;
    }

    isStraight(cards) {
        const values = cards.map(card => this.rankValues[card.rank]).sort((a, b) => a - b);
        // Check regular straight
        if (values[4] - values[0] === 4 && new Set(values).size === 5) {
            return true;
        }
        // Check wheel straight (A,2,3,4,5)
        return values.join(',') === '2,3,4,5,14';
    }

    isThreeOfAKind(cards) {
        const ranks = cards.map(card => card.rank);
        return new Set(ranks).size === 3 && 
               ranks.some(r => ranks.filter(x => x === r).length === 3);
    }

    isTwoPair(cards) {
        const ranks = cards.map(card => card.rank);
        const rankCounts = {};
        ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
        return Object.values(rankCounts).filter(count => count === 2).length === 2;
    }

    isOnePair(cards) {
        const ranks = cards.map(card => card.rank);
        return new Set(ranks).size === 4;
    }

    combinations(array, k) {
        const result = [];
        function combine(arr, start, chosen) {
            if (chosen.length === k) {
                result.push([...chosen]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                chosen.push(arr[i]);
                combine(arr, i + 1, chosen);
                chosen.pop();
            }
        }
        combine(array, 0, []);
        return result;
    }

    getCardCounts(cards) {
        const counts = new Map();
        cards.forEach(card => {
            counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
        });
        return counts;
    }

    getRemainingCards(hands, communityCards) {
        const usedCards = [...communityCards];
        hands.forEach(hand => usedCards.push(...hand));
        
        return this.createDeck().filter(card => 
            !usedCards.some(used => 
                used.rank === card.rank && used.suit === card.suit
            )
        );
    }

    render() {
        this.container.innerHTML = '';
        this.playerCards = []; // Reset card references
        
        // Add table center area
        const tableCenter = document.createElement('div');
        tableCenter.className = 'table-center';
        
        // Add community cards
        const communityCards = document.createElement('div');
        communityCards.className = 'community-cards';
        tableCenter.appendChild(communityCards);
        
        this.container.appendChild(tableCenter);

        // Create and add player areas
        this.players.forEach(player => {
            const playerArea = document.createElement('div');
            playerArea.className = 'player-area';
            playerArea.setAttribute('data-player', player);
            
            playerArea.innerHTML = `
                <div class="player-info">
                    <div class="player-name">${player}</div>
                    <div class="equity-display">Equity: 0%</div>
                    <div class="hole-cards">
                        <div class="card face-down"></div>
                        <div class="card face-down"></div>
                    </div>
                </div>
            `;
            
            this.playerCards.push([playerArea.querySelector('.card:nth-child(1)'), playerArea.querySelector('.card:nth-child(2)')]);
            this.container.appendChild(playerArea);
        });

        // Position players after creation
        this.positionPlayers();
    }
}

// Create global instance
const dealerWheel = new HandAnimation('dealer-wheel'); 