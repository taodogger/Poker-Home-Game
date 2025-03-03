class HandAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.players = [];
        this.isAnimating = false;
        this.lastDealerIndex = -1; // Track last dealer
        this.dealerHistory = []; // Track dealer history
        this.positions = [
            'top', 'top-right', 'right', 'bottom-right',
            'bottom', 'bottom-left', 'left', 'top-left'
        ];
        
        // Define exciting cooler scenarios
        this.scenarios = [
            {
                name: "Quads over Full Houses",
                communityCards: [
                    { rank: '10', suit: '♠' },
                    { rank: '10', suit: '♦' },
                    { rank: '10', suit: '♥' },
                    { rank: 'J', suit: '♠' },
                    { rank: 'Q', suit: '♦' }
                ],
                dealerHand: [{ rank: '10', suit: '♣' }, { rank: 'A', suit: '♠' }],
                otherHands: [
                    [{ rank: 'A', suit: '♦' }, { rank: 'A', suit: '♣' }],
                    [{ rank: 'K', suit: '♠' }, { rank: 'K', suit: '♦' }],
                    [{ rank: 'Q', suit: '♠' }, { rank: 'Q', suit: '♣' }]
                ]
            },
            {
                name: "Quads over Quads",
                communityCards: [
                    { rank: 'K', suit: '♠' },
                    { rank: 'K', suit: '♦' },
                    { rank: 'K', suit: '♥' },
                    { rank: 'Q', suit: '♠' },
                    { rank: 'Q', suit: '♦' }
                ],
                dealerHand: [{ rank: 'K', suit: '♣' }, { rank: 'A', suit: '♠' }],
                otherHands: [
                    [{ rank: 'Q', suit: '♣' }, { rank: 'Q', suit: '♥' }],
                    [{ rank: 'A', suit: '♦' }, { rank: 'A', suit: '♣' }],
                    [{ rank: 'J', suit: '♠' }, { rank: 'J', suit: '♦' }]
                ]
            },
            {
                name: "Sneaky Straight Flush",
                communityCards: [
                    { rank: '6', suit: '♥' },
                    { rank: '7', suit: '♥' },
                    { rank: '8', suit: '♥' },
                    { rank: '9', suit: '♠' },
                    { rank: '10', suit: '♦' }
                ],
                dealerHand: [{ rank: '5', suit: '♥' }, { rank: '4', suit: '♥' }],
                otherHands: [
                    [{ rank: '9', suit: '♣' }, { rank: '9', suit: '♥' }],
                    [{ rank: '8', suit: '♠' }, { rank: '8', suit: '♣' }],
                    [{ rank: '10', suit: '♠' }, { rank: '10', suit: '♣' }]
                ]
            }
        ];
    }

    setPlayers(players) {
        if (!Array.isArray(players) || players.length < 2) {
            console.error('Need at least 2 players');
            return;
        }
        this.players = players;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        // Community cards area (empty initially)
        const communityDiv = document.createElement('div');
        communityDiv.className = 'community-cards';
        this.container.appendChild(communityDiv);

        // Player areas with face-down cards
        this.players.forEach((player, index) => {
            const position = this.positions[index % this.positions.length];
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-area';
            playerDiv.setAttribute('data-position', position);
            playerDiv.innerHTML = `
                <div class="player-name">${player}</div>
                <div class="hole-cards">
                    <div class="card face-down"></div>
                    <div class="card face-down"></div>
                </div>
            `;
            this.container.appendChild(playerDiv);
        });
    }

    // Add method to generate better random selection
    getNextDealer() {
        if (this.players.length <= 1) return 0;
        
        let availableIndices = [];
        
        // If we've dealt to everyone, reset the history
        if (this.dealerHistory.length >= this.players.length - 1) {
            this.dealerHistory = [this.lastDealerIndex];
        }

        // Get indices of players who haven't been dealer recently
        for (let i = 0; i < this.players.length; i++) {
            if (!this.dealerHistory.includes(i)) {
                availableIndices.push(i);
            }
        }

        // Select random index from available players
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const selectedIndex = availableIndices[randomIndex];
        
        // Update history
        this.lastDealerIndex = selectedIndex;
        this.dealerHistory.push(selectedIndex);

        return selectedIndex;
    }

    async spin() {
        if (this.isAnimating || this.players.length < 2) return;
        this.isAnimating = true;

        // Use new dealer selection method
        const dealerIndex = this.getNextDealer();
        const dealer = this.players[dealerIndex];

        // Select random scenario
        const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
        
        // Assign hands
        const hands = Array(this.players.length).fill(null);
        hands[dealerIndex] = scenario.dealerHand;
        
        // Distribute other hands randomly but ensure variety
        let usedHandIndices = new Set();
        for (let i = 0; i < this.players.length; i++) {
            if (i !== dealerIndex) {
                let handIndex;
                do {
                    handIndex = Math.floor(Math.random() * scenario.otherHands.length);
                } while (usedHandIndices.has(handIndex) && usedHandIndices.size < scenario.otherHands.length);
                
                usedHandIndices.add(handIndex);
                hands[i] = scenario.otherHands[handIndex];
            }
        }

        // Animation sequence
        await this.revealHoleCards(hands);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.dealCommunityCards(scenario.communityCards);
        await this.highlightWinner(dealerIndex, scenario.name);
        
        this.isAnimating = false;
        window.setDealer(dealer);
    }

    async revealHoleCards(hands) {
        const playerAreas = this.container.querySelectorAll('.player-area');
        for (let i = 0; i < playerAreas.length; i++) {
            const area = playerAreas[i];
            const cards = area.querySelectorAll('.card');
            
            // Flip animation for each card
            await this.flipCard(cards[0], hands[i][0]);
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.flipCard(cards[1], hands[i][1]);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    async flipCard(cardElement, cardData) {
        cardElement.classList.add('flipping');
        await new Promise(resolve => setTimeout(resolve, 150));
        cardElement.classList.remove('face-down');
        cardElement.textContent = `${cardData.rank}${cardData.suit}`;
        cardElement.setAttribute('data-suit', cardData.suit);
        cardElement.classList.remove('flipping');
    }

    async dealCommunityCards(cards) {
        const communityDiv = this.container.querySelector('.community-cards');
        
        // Deal flop
        for (let i = 0; i < 3; i++) {
            await this.dealCard(communityDiv, cards[i]);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Deal turn
        await this.dealCard(communityDiv, cards[3]);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Deal river
        await this.dealCard(communityDiv, cards[4]);
    }

    async dealCard(container, cardData) {
        const card = document.createElement('div');
        card.className = 'card dealing';
        card.textContent = `${cardData.rank}${cardData.suit}`;
        card.setAttribute('data-suit', cardData.suit);
        container.appendChild(card);
        await new Promise(resolve => setTimeout(resolve, 500));
        card.classList.remove('dealing');
    }

    async highlightWinner(dealerIndex, scenarioName) {
        const playerAreas = this.container.querySelectorAll('.player-area');
        const winnerArea = playerAreas[dealerIndex];
        
        // Add winning hand description
        const description = document.createElement('div');
        description.className = 'winning-hand';
        description.textContent = scenarioName;
        winnerArea.appendChild(description);
        
        winnerArea.classList.add('winner');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Create global instance
const dealerWheel = new HandAnimation('dealer-wheel'); 