class HandAnimation {
    constructor(container) {
        if (!container || !(container instanceof HTMLElement)) {
            console.error('Invalid container element provided to HandAnimation');
            return;
        }
        
        // Initialize properties
        this.container = null;
        this.players = [];
        this.currentTheme = null;
        this.playerPositions = [];
        this.communityCards = [];
        this.deck = [];
        this.isAnimating = false;
        this.resizeObserver = null;
        this.containerWidth = 0;
        this.containerHeight = 0;
        
        // Bind methods to preserve context
        this.bindMethods();
        
        // Initialize with the provided container
        this.initialize(container);
    }

    initialize(container) {
        if (!container) {
            console.error('No container provided to HandAnimation');
            return;
        }

        this.container = container;
        
        // Set up base container styles
        this.setupContainer();
        
        // Create a loading indicator
        this.container.innerHTML = '<div class="loading-indicator">Initializing poker table...</div>';
        
        // Create a deck of cards
        this.deck = this.createDeck();
        
        // Setup resize observer for responsive layout
        this.setupResizeObserver();
        
        // Initial render
        setTimeout(() => {
            this.updateDimensions();
            this.render();
        }, 100);
    }

    bindMethods() {
        // Bind all methods to preserve 'this' context
        this.initialize = this.initialize.bind(this);
        this.setTheme = this.setTheme.bind(this);
        this.setupContainer = this.setupContainer.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        this.createDeck = this.createDeck.bind(this);
        this.shuffleDeck = this.shuffleDeck.bind(this);
        this.spin = this.spin.bind(this);
        this.revealHoleCards = this.revealHoleCards.bind(this);
        this.dealCommunityCards = this.dealCommunityCards.bind(this);
        this.flipCard = this.flipCard.bind(this);
        this.celebrateWinner = this.celebrateWinner.bind(this);
        this.addConfetti = this.addConfetti.bind(this);
        this.determineWinner = this.determineWinner.bind(this);
        this.evaluateHand = this.evaluateHand.bind(this);
        this.setPlayers = this.setPlayers.bind(this);
        this.positionPlayers = this.positionPlayers.bind(this);
        this.render = this.render.bind(this);
    }

    setTheme(theme) {
        if (!theme) {
            console.error('No theme provided to setTheme');
            return;
        }

        this.currentTheme = theme;
        
        // Apply theme to container
        if (this.container) {
            // Apply theme-based background to the entire dealer selection area
            this.container.style.background = `linear-gradient(135deg, ${theme['--main-color'] || '#1B5E20'}, ${theme['--secondary-color'] || '#388E3C'})`;
            
            // If there's a table image, we'll use it for the center area only
            if (theme.tableImage) {
                // Create or update a center table area
                let tableCenter = this.container.querySelector('.table-center');
                if (!tableCenter) {
                    tableCenter = document.createElement('div');
                    tableCenter.className = 'table-center';
                    tableCenter.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 60%;
                        height: 60%;
                        border-radius: var(--border-radius-lg);
                        z-index: 1;
                        background-image: url(${theme.tableImage});
                        background-size: cover;
                        background-position: center;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    `;
                    this.container.insertBefore(tableCenter, this.container.firstChild);
                } else {
                    tableCenter.style.backgroundImage = `url(${theme.tableImage})`;
                }
            } else {
                // Remove table center if no image is available
                const tableCenter = this.container.querySelector('.table-center');
                if (tableCenter) {
                    tableCenter.remove();
                }
            }
            
            // Update card backs with theme color
            const cardBacks = this.container.querySelectorAll('.card-back');
            cardBacks.forEach(card => {
                card.style.background = `linear-gradient(135deg, ${theme['--main-color']}, ${theme['--secondary-color']})`;
            });
        }
        
        // Re-render with new theme
        this.render();
    }

    setupContainer() {
        if (!this.container) return;

        // Set basic styles for the container
        this.container.style.position = 'relative';
        this.container.style.background = 'linear-gradient(135deg, #1B5E20, #388E3C)';
        this.container.style.borderRadius = 'var(--border-radius-lg)';
        this.container.style.overflow = 'hidden';
        this.container.style.boxShadow = 'var(--card-shadow)';
        
        // Add loading animation
        const loadingStyle = document.createElement('style');
        loadingStyle.textContent = `
                .loading-indicator {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                font-size: 1.2rem;
                    text-align: center;
                animation: pulse 1.5s infinite ease-in-out;
            }
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(loadingStyle);
    }

    setupResizeObserver() {
        if (!this.container || typeof ResizeObserver === 'undefined') return;
        
        // Create a resize observer to update dimensions when container size changes
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                this.updateDimensions();
                    this.positionPlayers();
                    this.render();
                }
            }
            });
        
        // Start observing the container
        this.resizeObserver.observe(this.container);
    }

    updateDimensions() {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;

        // Calculate player positions based on new dimensions
            this.positionPlayers();
    }

    calculateContainerSize(playerCount) {
        // Calculate optimal container size based on player count
        const minSize = Math.min(this.containerWidth, this.containerHeight);
        return Math.max(minSize, 300); // Minimum size of 300px
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        const deck = [];
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ suit, value });
            }
        }
        
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async spin() {
        if (this.isAnimating) {
            console.warn('Animation already in progress');
            return;
        }
        
        if (!this.players || this.players.length < 2) {
            showToast('Need at least 2 players to start', 'error');
            return;
        }
        
        this.isAnimating = true;

        try {
            // Create a fresh deck
            this.deck = this.createDeck();
            
            // Clear previous state
            this.container.innerHTML = '';
            
            // Position players
            this.positionPlayers();
            
            // Create player elements - remove dealer button logic entirely
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                const position = this.playerPositions[i];
                
                const playerEl = document.createElement('div');
                playerEl.className = 'player-area';
                playerEl.setAttribute('data-player-id', player.id);
                playerEl.style.left = position.x + 'px';
                playerEl.style.top = position.y + 'px';
                
                playerEl.innerHTML = `
                    <div class="player-name">${player.name}</div>
                    <div class="player-cards"></div>
                `;
                
                this.container.appendChild(playerEl);
            }
            
            // Wait a short delay before dealing cards
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Deal two cards to each player
            const hands = [];
            for (let i = 0; i < this.players.length; i++) {
                hands[i] = [
                    this.deck.pop(),
                    this.deck.pop()
                ];
            }

            // Reveal hole cards
            await this.revealHoleCards(hands);

            // Deal community cards
            const flopCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
            const turnCard = this.deck.pop();
            const riverCard = this.deck.pop();
            
            // Deal flop
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.dealCommunityCards(flopCards, 'flop');
            
            // Deal turn
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.dealCommunityCards([turnCard], 'turn');
            
            // Deal river
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.dealCommunityCards([riverCard], 'river');
            
            // Determine winner
            const communityCards = [...flopCards, turnCard, riverCard];
            const result = this.determineWinner(hands, communityCards);
            
            if (result) {
                await this.celebrateWinner(result.winnerIndex, result.handName);
            }
            
        } catch (error) {
            console.error('Error during animation:', error);
            showToast('Error during animation', 'error');
        } finally {
            this.isAnimating = false;
        }
    }

    async revealHoleCards(hands) {
        if (!hands || !hands.length || !this.players) return;
        
        const playerEls = this.container.querySelectorAll('.player-area');
        
        for (let i = 0; i < playerEls.length; i++) {
            const playerEl = playerEls[i];
            const cardsContainer = playerEl.querySelector('.player-cards');
            
            if (!cardsContainer) continue;
            
            cardsContainer.innerHTML = '';
            
            // Create card elements
            for (let j = 0; j < Math.min(2, hands[i].length); j++) {
                const card = hands[i][j];
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                
                cardElement.innerHTML = `
                    <div class="card-back"></div>
                    <div class="card-front" data-suit="${card.suit}" data-value="${card.value}">
                        <div class="card-value">${card.value}</div>
                        <div class="card-suit ${card.suit}"></div>
                    </div>
                `;
                
                cardsContainer.appendChild(cardElement);
                
                // Apply theme to card back
                if (this.currentTheme) {
                    const cardBack = cardElement.querySelector('.card-back');
                    cardBack.style.background = `linear-gradient(135deg, ${this.currentTheme['--main-color'] || '#388E3C'}, ${this.currentTheme['--secondary-color'] || '#1B5E20'})`;
                }
            }
            
            // Arrange cards side by side
            cardsContainer.style.display = 'flex';
            cardsContainer.style.gap = '5px';
            cardsContainer.style.justifyContent = 'center';
        }
        
        // Wait a moment before revealing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Flip cards with a delay between players
        for (let i = 0; i < playerEls.length; i++) {
            const playerEl = playerEls[i];
            const cardElements = playerEl.querySelectorAll('.card');
            
            for (let card of cardElements) {
            await new Promise(resolve => setTimeout(resolve, 200));
                card.classList.add('flipped');
            }
        }
    }

    async dealCommunityCards(cards, stage) {
        if (!cards || !cards.length) return;
        
        // Create or get community area
        let communityArea = this.container.querySelector('.community-area');
        if (!communityArea) {
            communityArea = document.createElement('div');
            communityArea.className = 'community-area';
            communityArea.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                gap: 10px;
                padding: 10px;
                border-radius: var(--border-radius-md);
                background: rgba(0, 0, 0, 0.2);
                z-index: 5;
            `;
            this.container.appendChild(communityArea);
        }
        
        // Add stage indicator
        const stageIndicator = document.createElement('div');
        stageIndicator.className = 'stage-indicator';
        stageIndicator.textContent = stage.toUpperCase();
        stageIndicator.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 0.9rem;
            font-weight: 600;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            background: var(--main-color);
            padding: 2px 8px;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        communityArea.appendChild(stageIndicator);
        
        // Show stage indicator
        setTimeout(() => {
            stageIndicator.style.opacity = '1';
        }, 100);
        
        // Flip each card with a small delay
        for (const card of cards) {
            // Add card to community cards array
            this.communityCards.push(card);
            
            // Create card element
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            cardElement.innerHTML = `
                <div class="card-back"></div>
                <div class="card-front" data-suit="${card.suit}" data-value="${card.value}">
                    <div class="card-value">${card.value}</div>
                    <div class="card-suit ${card.suit}"></div>
                </div>
            `;
            
            // Apply theme to card back
            if (this.currentTheme) {
                const cardBack = cardElement.querySelector('.card-back');
                cardBack.style.background = `linear-gradient(135deg, ${this.currentTheme['--main-color'] || '#388E3C'}, ${this.currentTheme['--secondary-color'] || '#1B5E20'})`;
            }
            
            communityArea.appendChild(cardElement);
            
            // Flip after a small delay
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.flipCard(cardElement, card);
        }
    }

    async flipCard(cardElement, cardData) {
        return new Promise(resolve => {
            // Add flipped class to start animation
            cardElement.classList.add('flipped');
            
            // Wait for animation to complete
            setTimeout(() => {
                resolve();
            }, 600);
        });
    }

    async celebrateWinner(winnerIndex, handName) {
        const playerEls = this.container.querySelectorAll('.player-area');
        if (!playerEls.length || winnerIndex >= playerEls.length) return;
        
        const winnerEl = playerEls[winnerIndex];
        if (!winnerEl) return;
        
        // Add winner class for highlight effect
        winnerEl.classList.add('winner');
        
        // Create winner overlay
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.innerHTML = `
            <div class="winner-message">
                <div class="winner-title">WINNER!</div>
                <div class="hand-name">${handName}</div>
                <div class="winner-name">${this.players[winnerIndex]?.name || 'Player'}</div>
            </div>
        `;
        
        this.container.appendChild(overlay);

        // Add confetti effect
        this.addConfetti();

        // Remove overlay after 5 seconds
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            
        setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                winnerEl.classList.remove('winner');
            }, 500);
        }, 5000);
    }

    addConfetti() {
        // Simple confetti effect
        const confettiCount = 150;
        const colors = ['#ff5252', '#ffbd59', '#66bb6a', '#42a5f5', '#ab47bc', '#ec407a', '#26c6da'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.cssText = `
                    position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                top: -20px;
                left: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.5};
                transform: rotate(${Math.random() * 360}deg);
                z-index: 999;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            this.container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
        
        // Add the animation style
        const styleId = 'confetti-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes fall {
                    0% { 
                        transform: translateY(0) rotate(0deg); 
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${this.containerHeight}px) rotate(360deg); 
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Proper hand evaluation function
    determineWinner(hands, communityCards) {
        if (!hands || !hands.length || !communityCards || communityCards.length !== 5) {
            return null;
        }
        
        let bestHandResult = null;
        let winnerIndex = -1;
        
        // Evaluate each player's hand
        for (let i = 0; i < hands.length; i++) {
            // Consider all 7 cards (2 hole + 5 community)
            const playerCards = [...hands[i], ...communityCards];
            const result = this.evaluateHand(playerCards);
            
            if (!bestHandResult || this.isHandBetter(result, bestHandResult)) {
                bestHandResult = result;
                winnerIndex = i;
            }
        }
        
        if (winnerIndex >= 0 && bestHandResult) {
            return {
                winnerIndex,
                handName: this.getHandName(bestHandResult.rank)
            };
        }
        
        return null;
    }

    isHandBetter(hand1, hand2) {
        // Higher rank always wins
        if (hand1.rank !== hand2.rank) {
            return hand1.rank > hand2.rank;
        }
        
        // If same rank, compare high cards
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // Compare kickers in descending order
        for (let i = 0; i < hand1.kickers.length && i < hand2.kickers.length; i++) {
            const value1Index = values.indexOf(hand1.kickers[i]);
            const value2Index = values.indexOf(hand2.kickers[i]);
            
            if (value1Index !== value2Index) {
                return value1Index > value2Index;
            }
        }
        
        // Complete tie
        return false;
    }

    evaluateHand(cards) {
        if (!cards || cards.length < 5) {
            return { rank: 0, kickers: [] };
        }
        
        // Convert card values to numbers for easier comparison
        const valueMap = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        // Get all possible 5-card combinations
        const combinations = this.getAllFiveCardCombinations(cards);
        
        // Evaluate each combination and find the best one
        let bestHand = { rank: 0, kickers: [] };
        
        for (const combo of combinations) {
            const result = this.evaluateFiveCardHand(combo);
            if (this.isHandBetter(result, bestHand)) {
                bestHand = result;
            }
        }
        
        return bestHand;
    }

    evaluateFiveCardHand(cards) {
        // Map the cards for easier evaluation
        const values = cards.map(card => card.value);
        const suits = cards.map(card => card.suit);
        
        // Count frequencies of each value
        const valueCounts = {};
        for (const value of values) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
        
        // Check for flush
        const isFlush = suits.every(suit => suit === suits[0]);
        
        // Check for straight
        const valueMap = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        
        // Special case for A-5 straight
        let numericValues = values.map(v => valueMap[v]).sort((a, b) => a - b);
        
        if (numericValues.includes(14)) { // If we have an Ace
            // Create a copy with Ace as 1 for A-5 straight check
            const withAceAsOne = [...numericValues.filter(v => v !== 14), 1].sort((a, b) => a - b);
            
            // Check if it makes a straight
            const isAceLowStraight = withAceAsOne.every((v, i, arr) => 
                i === 0 || v === arr[i-1] + 1
            );
            
            if (isAceLowStraight) {
                numericValues = withAceAsOne;
            }
        }
        
        const isStraight = numericValues.every((v, i, arr) => 
            i === 0 || v === arr[i-1] + 1
        );
        
        // Royal flush
        if (isFlush && isStraight && numericValues.includes(14) && !numericValues.includes(1)) {
            return { rank: 9, kickers: values };
        }
        
        // Straight flush
        if (isFlush && isStraight) {
            return { rank: 8, kickers: values };
        }
        
        // Four of a kind
        const hasFourOfAKind = Object.values(valueCounts).includes(4);
        if (hasFourOfAKind) {
            const fourValue = Object.keys(valueCounts).find(v => valueCounts[v] === 4);
            const kicker = Object.keys(valueCounts).find(v => valueCounts[v] === 1);
            return { rank: 7, kickers: [fourValue, kicker] };
        }
        
        // Full house
        const hasThreeOfAKind = Object.values(valueCounts).includes(3);
        const hasOnePair = Object.values(valueCounts).includes(2);
        if (hasThreeOfAKind && hasOnePair) {
            const threeValue = Object.keys(valueCounts).find(v => valueCounts[v] === 3);
            const pairValue = Object.keys(valueCounts).find(v => valueCounts[v] === 2);
            return { rank: 6, kickers: [threeValue, pairValue] };
        }
        
        // Flush
        if (isFlush) {
            return { rank: 5, kickers: values.sort((a, b) => valueMap[b] - valueMap[a]) };
        }
        
        // Straight
        if (isStraight) {
            return { rank: 4, kickers: values };
        }
        
        // Three of a kind
        if (hasThreeOfAKind) {
            const threeValue = Object.keys(valueCounts).find(v => valueCounts[v] === 3);
            const kickers = Object.keys(valueCounts)
                .filter(v => valueCounts[v] === 1)
                .sort((a, b) => valueMap[b] - valueMap[a]);
            return { rank: 3, kickers: [threeValue, ...kickers] };
        }
        
        // Two pair
        const pairs = Object.keys(valueCounts).filter(v => valueCounts[v] === 2);
        if (pairs.length === 2) {
            const kicker = Object.keys(valueCounts).find(v => valueCounts[v] === 1);
            pairs.sort((a, b) => valueMap[b] - valueMap[a]);
            return { rank: 2, kickers: [...pairs, kicker] };
        }
        
        // One pair
        if (hasOnePair) {
            const pairValue = Object.keys(valueCounts).find(v => valueCounts[v] === 2);
            const kickers = Object.keys(valueCounts)
                .filter(v => valueCounts[v] === 1)
                .sort((a, b) => valueMap[b] - valueMap[a]);
            return { rank: 1, kickers: [pairValue, ...kickers] };
        }
        
        // High card
        return { 
            rank: 0, 
            kickers: values.sort((a, b) => valueMap[b] - valueMap[a]) 
        };
    }

    getAllFiveCardCombinations(cards) {
        const result = [];
        
        const generateCombinations = (start, current) => {
            if (current.length === 5) {
                result.push([...current]);
                return;
            }
            
            for (let i = start; i < cards.length; i++) {
                current.push(cards[i]);
                generateCombinations(i + 1, current);
                current.pop();
            }
        };
        
        generateCombinations(0, []);
        return result;
    }

    // Get the name of the hand based on rank
    getHandName(rank) {
        const handNames = [
            'High Card',
            'Pair',
            'Two Pair',
            'Three of a Kind',
            'Straight',
            'Flush',
            'Full House',
            'Four of a Kind',
            'Straight Flush',
            'Royal Flush'
        ];
        
        return handNames[rank] || 'Unknown Hand';
    }

    // Set players for the animation
    setPlayers(players) {
        if (!players || !Array.isArray(players)) {
            console.error('Invalid players data provided to setPlayers');
            return;
        }
        
        this.players = players.map(p => ({
            id: p.id,
            name: p.name,
            initial_chips: p.initial_chips,
            current_chips: p.current_chips || p.initial_chips
        }));
        
        // Recalculate player positions
        this.positionPlayers();
        
        // Re-render with new players
        this.render();
    }

    // Calculate positions for players around the table
    positionPlayers() {
        if (!this.container || !this.players || !this.players.length) return;
        
        const centerX = this.containerWidth / 2;
        const centerY = this.containerHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        this.playerPositions = [];
        
        const count = this.players.length;
        for (let i = 0; i < count; i++) {
            // Calculate position on a circle
            // Starting from the bottom and going clockwise
            const angle = (Math.PI * 2 * i / count) + Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            this.playerPositions.push({ x, y });
        }
    }
    
    // Render the current state
    render() {
        if (!this.container) return;
        
        // If no players, show message
        if (!this.players || this.players.length === 0) {
            this.container.innerHTML = '<div class="empty-message">Add players to start the game</div>';
                return;
            }

        // For existing players, update positions
        const playerEls = this.container.querySelectorAll('.player-area');
        if (playerEls.length > 0) {
            playerEls.forEach((el, i) => {
                if (this.playerPositions[i]) {
                    el.style.left = this.playerPositions[i].x + 'px';
                    el.style.top = this.playerPositions[i].y + 'px';
                }
            });
        }
    }
} 