class HandAnimation {
    constructor(container) {
        this.players = [];
        this.initialize(container);
    }

    initialize(container) {
        // Check if container is provided
        if (!container) {
            console.error('No container element provided to HandAnimation');
            return;
        }

        this.container = container;
        
        // Initialize properties
        this.currentTheme = null;
        this.playerPositions = [];
        this.playerCards = [];
        this.communityCards = [];
        this.isAnimating = false;
        this.currentStep = 0;
        this.totalSteps = 5;
        this.animationDuration = 2000;
        this.stepDuration = this.animationDuration / this.totalSteps;
        this.handRankings = {
            STRAIGHT_FLUSH: 1,
            FOUR_OF_A_KIND: 2,
            FULL_HOUSE: 3,
            FLUSH: 4,
            STRAIGHT: 5,
            THREE_OF_A_KIND: 6,
            TWO_PAIR: 7,
            ONE_PAIR: 8,
            HIGH_CARD: 9
        };
        this.rankValues = {
            'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
            '9': 9, '8': 8, '7': 7, '6': 6, '5': 5,
            '4': 4, '3': 3, '2': 2
        };
        
        this.suits = ['♠', '♦', '♥', '♣'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        // Setup container and bind methods
        this.setupContainer();
        this.setupResizeObserver();
        this.bindMethods();
    }

    bindMethods() {
        // Bind all methods that need 'this' context
        this.spin = this.spin.bind(this);
        this.render = this.render.bind(this);
        this.setupContainer = this.setupContainer.bind(this);
        this.positionPlayers = this.positionPlayers.bind(this);
        this.setTheme = this.setTheme.bind(this);
        this.setPlayers = this.setPlayers.bind(this);
        this.calculateContainerSize = this.calculateContainerSize.bind(this);
        this.createDeck = this.createDeck.bind(this);
        this.shuffleDeck = this.shuffleDeck.bind(this);
        this.evaluateHand = this.evaluateHand.bind(this);
        this.evaluateFiveCardHand = this.evaluateFiveCardHand.bind(this);
        this.determineWinner = this.determineWinner.bind(this);
        this.revealHoleCards = this.revealHoleCards.bind(this);
        this.dealCommunityCards = this.dealCommunityCards.bind(this);
        this.flipCard = this.flipCard.bind(this);
    }

    setTheme(theme) {
        if (!this.container) {
            console.warn('Cannot set theme: container not initialized');
            return;
        }

        this.currentTheme = theme;
        const boardBackground = this.container.querySelector('.board-background');
        if (boardBackground && theme.tableImage) {
            boardBackground.style.backgroundImage = `url('${theme.tableImage}')`;
            boardBackground.style.backgroundSize = 'cover';
            boardBackground.style.backgroundPosition = 'center';
            boardBackground.style.backgroundRepeat = 'no-repeat';
        }
    }

    setupContainer() {
        if (!this.container) return;

        this.container.style.width = '100%';
        this.container.style.height = '70vh';
        this.container.style.position = 'relative';
        this.container.style.margin = '0';
        this.container.style.padding = '0';
        this.container.style.border = '2px solid var(--main-color)';
        this.container.style.overflow = 'hidden';
        this.container.style.boxSizing = 'border-box';
        
        this.container.offsetHeight;
        
        this.updateDimensions();
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                this.updateDimensions();
            });
        });
        this.resizeObserver.observe(this.container);

        document.addEventListener('fullscreenchange', () => {
            requestAnimationFrame(() => {
                this.updateDimensions();
            });
        });
    }

    updateDimensions() {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
        this.centerX = this.containerWidth / 2;
        this.centerY = this.containerHeight / 2;

        if (this.containerWidth > 0 && this.containerHeight > 0) {
            console.log(`Container dimensions: ${this.containerWidth}x${this.containerHeight}`);
            console.log(`Center point: (${this.centerX}, ${this.centerY})`);
        }

        if (this.containerWidth > 0 && this.containerHeight > 0) {
            this.positionPlayers();
        }
    }

    calculateContainerSize(playerCount) {
        const minSize = 600;
        const sizeIncrement = 100;
        return Math.max(minSize, 600 + (playerCount - 2) * sizeIncrement);
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
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    async spin() {
        if (this.isAnimating || this.players.length < 2) return;
        this.isAnimating = true;

        // Clear any previous game state
        const communityArea = this.container.querySelector('.community-cards');
        if (communityArea) {
            communityArea.innerHTML = '';
        }
        
        // Remove any previous winner
        const existingWinners = this.container.querySelectorAll('.winner');
        existingWinners.forEach(el => {
            el.classList.remove('winner');
            const msg = el.querySelector('.winning-message');
            if (msg) msg.remove();
        });

        // Create and shuffle deck
        const deck = this.createDeck();
        const playersHands = [];
        const communityCards = [];
        
        // Deal cards to all players
        for (let i = 0; i < this.players.length; i++) {
            playersHands[i] = [deck.pop()];
        }
        
        // Second round of dealing
        for (let i = 0; i < this.players.length; i++) {
            playersHands[i].push(deck.pop());
        }

        // Reveal cards
        await this.revealHoleCards(playersHands);
        await new Promise(r => setTimeout(r, 1000));

        // Deal community cards
        communityCards.push(...deck.splice(0, 3));
        await this.dealCommunityCards(communityCards.slice(0, 3));
        await new Promise(r => setTimeout(r, 1000));

        communityCards.push(deck.pop());
        await this.dealCommunityCards([communityCards[3]]);
        await new Promise(r => setTimeout(r, 1000));

        communityCards.push(deck.pop());
        await this.dealCommunityCards([communityCards[4]]);
        await new Promise(r => setTimeout(r, 1000));

        // Determine winner
        const { index: winnerIndex, handName } = this.determineWinner(playersHands, communityCards);
        await this.celebrateWinner(winnerIndex, handName);

        this.isAnimating = false;
    }

    async revealHoleCards(hands) {
        // Reset all cards to initial state first
        for (let i = 0; i < this.playerCards.length; i++) {
            const [card1, card2] = this.playerCards[i];
            if (card1) {
                card1.classList.remove('flipped');
                const card1Front = card1.querySelector('.card-front');
                if (card1Front && hands[i] && hands[i][0]) {
                    card1Front.textContent = `${hands[i][0].rank}${hands[i][0].suit}`;
                    card1Front.setAttribute('data-suit', hands[i][0].suit);
                }
            }
            if (card2) {
                card2.classList.remove('flipped');
                const card2Front = card2.querySelector('.card-front');
                if (card2Front && hands[i] && hands[i][1]) {
                    card2Front.textContent = `${hands[i][1].rank}${hands[i][1].suit}`;
                    card2Front.setAttribute('data-suit', hands[i][1].suit);
                }
            }
        }

        // Now reveal each player's cards with proper timing
        for (let i = 0; i < this.playerCards.length; i++) {
            if (!this.playerCards[i] || !hands[i]) {
                console.error('Missing cards or hands for player', i);
                continue;
            }

            const [card1, card2] = this.playerCards[i];
            
            // Add a delay before starting each player's cards
            await new Promise(resolve => setTimeout(resolve, 200));

            // Flip first card
            if (card1) {
                card1.classList.add('flipped');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Flip second card
            if (card2) {
                card2.classList.add('flipped');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
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
        const simulations = 1000;
        const wins = new Array(hands.length).fill(0);
        
        for (let i = 0; i < simulations; i++) {
            const remainingCards = this.getRemainingCards(hands, communityCards);
            const simulatedCommunity = [...communityCards];
            
            while (simulatedCommunity.length < 5) {
                const randomIndex = Math.floor(Math.random() * remainingCards.length);
                simulatedCommunity.push(remainingCards.splice(randomIndex, 1)[0]);
            }

            const winner = this.determineWinner(hands, simulatedCommunity);
            wins[winner]++;
        }

        return wins.map(w => (w / simulations) * 100);
    }

    async dealCommunityCards(cards) {
        const communityArea = this.container.querySelector('.community-cards');
        if (!communityArea) {
            console.error('Community cards container not found');
            return;
        }
        for (let card of cards) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            // Create card back
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardEl.appendChild(cardBack);
            
            // Create card front
            const cardFront = document.createElement('div');
            cardFront.className = 'card-front';
            cardFront.textContent = `${card.rank}${card.suit}`;
            cardFront.setAttribute('data-suit', card.suit);
            cardEl.appendChild(cardFront);
            
            communityArea.appendChild(cardEl);
            await new Promise(resolve => setTimeout(resolve, 100));
            cardEl.classList.add('flipped');
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }

    async flipCard(cardElement, cardData) {
        if (!cardElement || !cardData) {
            console.error('Missing card element or data:', { cardElement, cardData });
            return;
        }

        cardElement.classList.remove('face-down');
        cardElement.classList.add('face-up');
        cardElement.textContent = `${cardData.rank}${cardData.suit}`;
        cardElement.setAttribute('data-suit', cardData.suit);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async celebrateWinner(winnerIndex, handName) {
        if (winnerIndex === undefined || winnerIndex < 0 || winnerIndex >= this.players.length) {
            console.error('Invalid winner index:', winnerIndex);
            return;
        }

        // Remove any existing winner classes and messages
        const existingWinners = this.container.querySelectorAll('.winner');
        existingWinners.forEach(el => {
            el.classList.remove('winner');
            const msg = el.querySelector('.winning-message');
            if (msg) msg.remove();
        });

        // Find the winner's player area
        const playerAreas = this.container.querySelectorAll('.player-area');
        const winnerArea = playerAreas[winnerIndex];
        
        if (!winnerArea) {
            console.error('Winner area not found for index:', winnerIndex);
            return;
        }

        // Add winner class and create message
        winnerArea.classList.add('winner');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'winning-message';
        messageDiv.innerHTML = `
            <div class="winner-title">WINNER!</div>
            <div class="hand-name">${handName}</div>
        `;
        
        // Remove any existing winning message before adding new one
        const existingMessage = winnerArea.querySelector('.winning-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        winnerArea.appendChild(messageDiv);

        // Ensure the winner is visible
        setTimeout(() => {
            winnerArea.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
        }, 500);
    }

    determineWinner(hands, communityCards) {
        let bestHandInfo = {
            rank: Number.MAX_VALUE,
            highCard: -1,
            secondaryRanks: [],
            index: -1
        };

        hands.forEach((hand, playerIndex) => {
            const allCards = [...hand, ...communityCards];
            const evaluation = this.evaluateHand(allCards);
            
            const currentHandInfo = {
                rank: evaluation.rank,
                highCard: evaluation.highCard,
                secondaryRanks: evaluation.secondaryRanks,
                index: playerIndex
            };

            if (this.isHandBetter(currentHandInfo, bestHandInfo)) {
                bestHandInfo = currentHandInfo;
            }
        });

        return {
            index: bestHandInfo.index,
            handName: this.getHandName(bestHandInfo.rank)
        };
    }

    isHandBetter(hand1, hand2) {
        // Lower rank is better (e.g., STRAIGHT_FLUSH = 1 is best)
        if (hand1.rank !== hand2.rank) {
            return hand1.rank < hand2.rank;
        }

        // If ranks are equal, compare high cards
        if (hand1.highCard !== hand2.highCard) {
            return hand1.highCard > hand2.highCard;
        }

        // If high cards are equal, compare secondary ranks
        for (let i = 0; i < Math.min(hand1.secondaryRanks.length, hand2.secondaryRanks.length); i++) {
            if (hand1.secondaryRanks[i] !== hand2.secondaryRanks[i]) {
                return hand1.secondaryRanks[i] > hand2.secondaryRanks[i];
            }
        }

        return false; // Hands are equal
    }

    getHandName(rank) {
        const handNames = {
            1: 'Straight Flush',
            2: 'Four of a Kind',
            3: 'Full House',
            4: 'Flush',
            5: 'Straight',
            6: 'Three of a Kind',
            7: 'Two Pair',
            8: 'One Pair',
            9: 'High Card'
        };
        return handNames[rank] || 'Unknown Hand';
    }

    evaluateHand(cards) {
        if (!cards || cards.length !== 7) {
            console.error('Invalid number of cards for evaluation:', cards?.length);
            return { rank: this.handRankings.HIGH_CARD, name: 'Invalid Hand', highCard: 0, secondaryRanks: [] };
        }

        const fiveCardCombos = this.combinations(cards, 5);
        let bestHand = {
            rank: this.handRankings.HIGH_CARD,
            highCard: 0,
            secondaryRanks: [],
            cards: []
        };

        for (const combo of fiveCardCombos) {
            const currentHand = this.evaluateFiveCardHand(combo);
            if (this.isHandBetter({
                rank: currentHand.rank,
                highCard: currentHand.highCard,
                secondaryRanks: currentHand.secondaryRanks
            }, {
                rank: bestHand.rank,
                highCard: bestHand.highCard,
                secondaryRanks: bestHand.secondaryRanks
            })) {
                bestHand = currentHand;
            }
        }

        return bestHand;
    }

    evaluateFiveCardHand(cards) {
        const values = cards.map(card => this.rankValues[card.rank]).sort((a, b) => b - a);
        const suits = cards.map(card => card.suit);
        const valueCounts = this.getValueCounts(values);
        const isFlush = new Set(suits).size === 1;
        const straightHighCard = this.getStraightHighCard(values);
        const isStraight = straightHighCard > 0;

        // Log hand evaluation for debugging
        console.log('Evaluating hand:', {
            cards: cards.map(c => `${c.rank}${c.suit}`),
            values,
            straightHighCard,
            isStraight
        });

        // Straight Flush
        if (isFlush && isStraight) {
            return {
                rank: this.handRankings.STRAIGHT_FLUSH,
                highCard: straightHighCard,
                secondaryRanks: [],
                cards
            };
        }

        // Four of a Kind
        const fourOfAKind = valueCounts.find(count => count.count === 4);
        if (fourOfAKind) {
            const kicker = values.find(v => v !== fourOfAKind.value);
            return {
                rank: this.handRankings.FOUR_OF_A_KIND,
                highCard: fourOfAKind.value,
                secondaryRanks: [kicker],
                cards
            };
        }

        // Full House
        const threeOfAKind = valueCounts.find(count => count.count === 3);
        const pair = valueCounts.find(count => count.count === 2);
        if (threeOfAKind && pair) {
            return {
                rank: this.handRankings.FULL_HOUSE,
                highCard: threeOfAKind.value,
                secondaryRanks: [pair.value],
                cards
            };
        }

        // Flush
        if (isFlush) {
            return {
                rank: this.handRankings.FLUSH,
                highCard: values[0],
                secondaryRanks: values.slice(1),
                cards
            };
        }

        // Straight
        if (isStraight) {
            return {
                rank: this.handRankings.STRAIGHT,
                highCard: straightHighCard,
                secondaryRanks: values.filter(v => v <= straightHighCard && v > straightHighCard - 5),
                cards
            };
        }

        // Three of a Kind
        if (threeOfAKind) {
            const kickers = values.filter(v => v !== threeOfAKind.value).slice(0, 2);
            return {
                rank: this.handRankings.THREE_OF_A_KIND,
                highCard: threeOfAKind.value,
                secondaryRanks: kickers,
                cards
            };
        }

        // Two Pair
        const pairs = valueCounts.filter(count => count.count === 2);
        if (pairs.length === 2) {
            const kicker = values.find(v => !pairs.some(p => p.value === v));
            return {
                rank: this.handRankings.TWO_PAIR,
                highCard: Math.max(pairs[0].value, pairs[1].value),
                secondaryRanks: [Math.min(pairs[0].value, pairs[1].value), kicker],
                cards
            };
        }

        // One Pair
        if (pair) {
            const kickers = values.filter(v => v !== pair.value).slice(0, 3);
            return {
                rank: this.handRankings.ONE_PAIR,
                highCard: pair.value,
                secondaryRanks: kickers,
                cards
            };
        }

        // High Card
        return {
            rank: this.handRankings.HIGH_CARD,
            highCard: values[0],
            secondaryRanks: values.slice(1),
            cards
        };
    }

    getValueCounts(values) {
        const counts = new Map();
        values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
        return Array.from(counts.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count || b.value - a.value);
    }

    getStraightHighCard(values) {
        // Sort values in descending order
        const sortedValues = [...new Set(values)].sort((a, b) => b - a);
        
        // Check for regular straights
        for (let i = 0; i <= sortedValues.length - 5; i++) {
            let isSequential = true;
            for (let j = 0; j < 4; j++) {
                if (sortedValues[i + j] !== sortedValues[i + j + 1] + 1) {
                    isSequential = false;
                    break;
                }
            }
            if (isSequential) {
                return sortedValues[i]; // Return highest card of the straight
            }
        }
        
        // Special check for Ace-low straight (A,2,3,4,5)
        if (sortedValues.includes(14) && // Ace
            sortedValues.includes(2) &&
            sortedValues.includes(3) &&
            sortedValues.includes(4) &&
            sortedValues.includes(5)) {
            return 5; // In A-5 straight, 5 is the highest card
        }
        
        return 0; // No straight found
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

    setPlayers(players) {
        if (!Array.isArray(players)) {
            console.error('Players must be an array');
            return;
        }
        
        this.players = players.map(player => ({
            name: player.name,
            chips: player.chips || 0
        }));
        
        // Calculate player positions
        const numPlayers = this.players.length;
        this.playerPositions = [];
        
        const centerX = this.container.offsetWidth / 2;
        const centerY = this.container.offsetHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        for (let i = 0; i < numPlayers; i++) {
            const angle = (i * (2 * Math.PI / numPlayers)) - (Math.PI / 2);
            this.playerPositions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        this.render();
    }

    positionPlayers() {
        if (!this.container || !this.players.length) return;

        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        if (containerWidth === 0 || containerHeight === 0) {
            console.warn('Container has zero dimensions, skipping player positioning');
            return;
        }

        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const radius = Math.min(containerWidth, containerHeight) * 0.35; // Reduced from 0.45 for better positioning
        
        this.playerPositions = this.players.map((_, index) => {
            // Start from -90 degrees (top) and distribute players clockwise
            const angle = (-Math.PI / 2) + (index * 2 * Math.PI / this.players.length);
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        console.log('Player positions updated:', this.playerPositions);
    }

    render() {
        if (!this.container) {
            console.error('Cannot render: container is null');
            return;
        }

        this.container.innerHTML = '';
        this.playerCards = [];

        // Create table center
        const tableCenter = document.createElement('div');
        tableCenter.className = 'table-center';

        // Create board background
        const boardBackground = document.createElement('div');
        boardBackground.className = 'board-background';
        if (this.currentTheme && this.currentTheme.tableImage) {
            boardBackground.style.backgroundImage = `url('${this.currentTheme.tableImage}')`;
        }
        tableCenter.appendChild(boardBackground);

        // Create community cards container
        const communityCards = document.createElement('div');
        communityCards.className = 'community-cards';
        tableCenter.appendChild(communityCards);

        this.container.appendChild(tableCenter);

        // Render player areas
        this.players.forEach((player, index) => {
            if (!player || !this.playerPositions[index]) {
                console.warn(`Missing player or position data for index ${index}`);
                return;
            }

            const playerArea = document.createElement('div');
            playerArea.className = 'player-area';
            playerArea.style.position = 'absolute';
            playerArea.style.left = `${this.playerPositions[index].x}px`;
            playerArea.style.top = `${this.playerPositions[index].y}px`;
            playerArea.style.transform = 'translate(-50%, -50%)';

            // Add player name
            const playerName = document.createElement('div');
            playerName.className = 'player-name';
            playerName.textContent = player.name || `Player ${index + 1}`;
            playerArea.appendChild(playerName);

            // Add player cards
            const playerCardsContainer = document.createElement('div');
            playerCardsContainer.className = 'player-cards';

            for (let i = 0; i < 2; i++) {
                const card = document.createElement('div');
                card.className = 'card';
                
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back';
                card.appendChild(cardBack);
                
                const cardFront = document.createElement('div');
                cardFront.className = 'card-front';
                card.appendChild(cardFront);
                
                playerCardsContainer.appendChild(card);
            }

            this.playerCards.push(playerCardsContainer.children);
            playerArea.appendChild(playerCardsContainer);
            this.container.appendChild(playerArea);
        });
    }
} 