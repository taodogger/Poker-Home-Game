class DealerWheel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.players = [];
        this.isSpinning = false;
    }

    setPlayers(players) {
        if (!Array.isArray(players) || players.length === 0) {
            console.error('Invalid players array');
            return;
        }
        this.players = players;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        const centerX = 200;
        const centerY = 200;
        const radius = 150;

        // Create player markers
        this.players.forEach((player, index) => {
            const angle = (360 / this.players.length) * index;
            const x = centerX + radius * Math.cos(angle * Math.PI / 180);
            const y = centerY + radius * Math.sin(angle * Math.PI / 180);
            
            const marker = document.createElement('div');
            marker.className = 'player-marker';
            marker.textContent = player;
            marker.style.left = `${x - 20}px`;
            marker.style.top = `${y - 20}px`;
            this.container.appendChild(marker);
        });
    }

    spin() {
        if (this.isSpinning) return;
        if (this.players.length === 0) {
            console.error('No players to select from');
            return;
        }
        
        this.isSpinning = true;
        const dealerIndex = Math.floor(Math.random() * this.players.length);
        const angle = (360 / this.players.length) * dealerIndex;
        
        // Create dealer marker
        const dealerMarker = document.createElement('div');
        dealerMarker.className = 'dealer-marker';
        dealerMarker.textContent = 'D';
        dealerMarker.style.left = '170px';
        dealerMarker.style.top = '170px';
        this.container.appendChild(dealerMarker);

        // Add spinning animation
        dealerMarker.classList.add('spinning');
        
        // After animation, show result
        setTimeout(() => {
            dealerMarker.style.transform = `rotate(${angle}deg)`;
            this.isSpinning = false;
            window.setDealer(this.players[dealerIndex]);
        }, 2000);
    }
}

// Create global instance
const dealerWheel = new DealerWheel('dealer-wheel'); 