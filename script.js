document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let playerCount = 1;
    let currentPlayerIndex = 0;
    let players = [];

    const CARD_DATA = [
        { km: 200, animal: 'swallow-200.png', max: 2 },
        { km: 100, animal: 'hare-100.png' },
        { km: 75,  animal: 'butterfly-75.png' },
        { km: 50,  animal: 'duck-50.png' },
        { km: 25,  animal: 'snail-25.png' }
    ];

    // --- DOM ELEMENTS ---
    const gameBoard = document.getElementById('game-board');
    const playerCountText = document.getElementById('player-count-text');
    const playerNav = document.getElementById('player-nav');
    const currentPlayerInfo = document.getElementById('current-player-info');
    const prevPlayerBtn = document.getElementById('prev-player-btn');
    const nextPlayerBtn = document.getElementById('next-player-btn');
    const progressBubble = document.getElementById('progress-bubble');
    const dropdown = document.getElementById('player-dropdown');
    const dropdownContent = document.getElementById('player-dropdown-content');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');
    const resetButton = document.getElementById('reset-btn');

    // --- INITIALIZATION ---
    function createPlayer(id) {
        const player = {
            id: id,
            name: `Joueur ${id}`,
            score: 0,
            isWinner: false,
            cards: {}
        };
        CARD_DATA.forEach(card => player.cards[card.km] = 0);
        return player;
    }

    function initGame() {
        players = Array.from({ length: 4 }, (_, i) => createPlayer(i + 1));
        currentPlayerIndex = 0;
        updateUI();
    }

    // --- UI UPDATE ---
    function updateUI() {
        const player = players[currentPlayerIndex];

        // Update Progress Bar
        const progressPercent = Math.min(player.score / 1000, 1) * 100;
        progressBubble.style.left = `calc(${progressPercent}% - ${progressPercent / 100 * 40}px)`;
        progressBubble.textContent = player.score;
        progressBubble.style.borderColor = player.isWinner ? '#4CAF50' : 'white';

        // Update Game Board for the current player
        gameBoard.innerHTML = '';
        CARD_DATA.forEach(cardInfo => {
            const cardCount = player.cards[cardInfo.km];
            const canAdd = !player.isWinner && (player.score + cardInfo.km <= 1000) && (!cardInfo.max || cardCount < cardInfo.max);

            const row = document.createElement('div');
            row.className = 'card-row';
            row.innerHTML = `
                <button class="card-row-btn" data-action="remove" data-km="${cardInfo.km}" ${cardCount === 0 ? 'disabled' : ''}>-</button>
                <div class="card-track">
                    ${cardCount > 0 
                        ? Array.from({ length: cardCount }).map(() => `
                            <div class="card">
                                <img src="assets/images/km-${cardInfo.km}.svg" class="km-value" alt="${cardInfo.km}">
                                <img src="assets/images/${cardInfo.animal}" class="animal" alt="${cardInfo.animal}">
                            </div>
                          `).join('')
                        : '<div class="card-placeholder"></div>'
                    }
                </div>
                <div class="controls">
                    <span class="count">${cardCount}</span>
                    <button class="card-row-btn add" data-action="add" data-km="${cardInfo.km}" ${!canAdd ? 'disabled' : ''}>+</button>
                </div>
            `;
            gameBoard.appendChild(row);
        });

        // Update Player Navigation
        if (playerCount > 1) {
            playerNav.style.display = 'flex';
            currentPlayerInfo.textContent = player.name;
            prevPlayerBtn.disabled = currentPlayerIndex === 0;
            nextPlayerBtn.disabled = currentPlayerIndex === playerCount - 1;
        } else {
            playerNav.style.display = 'none';
        }
    }

    // --- GAME LOGIC ---
    function handleCardAction(e) {
        const action = e.target.dataset.action;
        const km = parseInt(e.target.dataset.km);

        if (!action || !km) return;

        const player = players[currentPlayerIndex];
        
        if (action === 'add') {
            const cardInfo = CARD_DATA.find(c => c.km === km);
            if (!player.isWinner && (player.score + km <= 1000) && (!cardInfo.max || player.cards[km] < cardInfo.max)) {
                player.score += km;
                player.cards[km]++;
                if (player.score === 1000) player.isWinner = true;
            }
        } else if (action === 'remove') {
            if (player.cards[km] > 0) {
                player.score -= km;
                player.cards[km]--;
                player.isWinner = false;
            }
        }
        updateUI();
    }
    
    // --- PLAYER MANAGEMENT ---
    function changePlayer(direction) {
        currentPlayerIndex = Math.max(0, Math.min(playerCount - 1, currentPlayerIndex + direction));
        updateUI();
    }

    function setPlayerCount(count) {
        playerCount = count;
        playerCountText.textContent = `${count} joueur${count > 1 ? 's' : ''}`;
        if (currentPlayerIndex >= count) {
            currentPlayerIndex = count - 1;
        }
        showPlayerNameModal();
    }

    // --- MODAL LOGIC ---
    function showPlayerNameModal() {
        modalContent.innerHTML = `
            <h3>Noms des joueurs</h3>
            <div class="player-name-inputs">
                ${Array.from({ length: playerCount }, (_, i) => `
                    <input type="text" id="player-name-${i}" placeholder="Joueur ${i + 1}" value="${players[i].name}">
                `).join('')}
            </div>
            <div class="modal-buttons">
                <button id="save-names-btn" class="modal-btn primary">OK</button>
            </div>
        `;
        modalBackdrop.style.display = 'flex';
        document.getElementById('save-names-btn').onclick = () => {
            for (let i = 0; i < playerCount; i++) {
                const input = document.getElementById(`player-name-${i}`);
                players[i].name = input.value || `Joueur ${i + 1}`;
            }
            modalBackdrop.style.display = 'none';
            updateUI();
        };
    }
    
    function showResetModal() {
        modalContent.innerHTML = `
            <h3>Recommencer ?</h3>
            <p>Cela remettra tous les scores et noms à zéro.</p>
            <div class="modal-buttons">
                <button id="cancel-reset-btn" class="modal-btn">Annuler</button>
                <button id="confirm-reset-btn" class="modal-btn primary">Reset</button>
            </div>
        `;
        modalBackdrop.style.display = 'flex';
        document.getElementById('confirm-reset-btn').onclick = () => {
            initGame();
            setPlayerCount(1);
            playerCountText.textContent = '1 joueur';
            modalBackdrop.style.display = 'none';
        };
        document.getElementById('cancel-reset-btn').onclick = () => modalBackdrop.style.display = 'none';
    }

    // --- EVENT LISTENERS ---
    gameBoard.addEventListener('click', handleCardAction);
    prevPlayerBtn.addEventListener('click', () => changePlayer(-1));
    nextPlayerBtn.addEventListener('click', () => changePlayer(1));
    resetButton.addEventListener('click', showResetModal);
    dropdownContent.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            setPlayerCount(parseInt(e.target.dataset.players));
            dropdown.blur(); // Referme le menu
        }
    });

    // --- START ---
    initGame();
});