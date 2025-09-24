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
    // Ajout de la classe secondary pour le danger secondaire
    resetButton.classList.add('secondary');

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
        loadSettings();
        if (!players.length) {
            players = Array.from({ length: 4 }, (_, i) => createPlayer(i + 1));
        }
        currentPlayerIndex = 0;
        updateUI();
    }

    // --- UI UPDATE ---
    function updateUI(slideDirection) {
        const player = players[currentPlayerIndex];

        // Animation carrousel si multijoueur
        if (playerCount > 1 && typeof slideDirection === 'string') {
            [gameBoard, playerNav, document.querySelector('.progress-section')].forEach(el => {
                if (!el) return;
                el.classList.remove('slide-left', 'slide-right', 'slide-reset');
                void el.offsetWidth;
                if (slideDirection === 'left') {
                    el.classList.add('slide-left');
                } else if (slideDirection === 'right') {
                    el.classList.add('slide-right');
                }
                setTimeout(() => {
                    el.classList.remove('slide-left', 'slide-right');
                    el.classList.add('slide-reset');
                }, 500);
            });
        }

        // Update Progress Bar
        const progressPercent = Math.min(player.score / 1000, 1) * 100;
        progressBubble.style.left = `calc(${progressPercent}% - ${progressPercent / 100 * 40}px)`;
        progressBubble.textContent = player.score;
        progressBubble.style.borderColor = player.isWinner ? '#4CAF50' : 'white';

        // Ajout/Retrait de la classe d'arrivée (vert + glow)
        if (player.isWinner) {
            progressBubble.classList.add('arrival');
            // Confettis à l'arrivée (une seule fois)
            if (!progressBubble._confettiDone) {
                if (window.confetti) {
                    window.confetti({
                        particleCount: 120,
                        spread: 90,
                        origin: { y: 0.5 },
                        zIndex: 9999
                    });
                }
                progressBubble._confettiDone = true;
            }
        } else {
            progressBubble.classList.remove('arrival');
            progressBubble._confettiDone = false;
        }

        // Update Game Board for the current player
        gameBoard.innerHTML = '';
        CARD_DATA.forEach(cardInfo => {
            const cardCount = player.cards[cardInfo.km];
            const canAdd = !player.isWinner && (player.score + cardInfo.km <= 1000) && (!cardInfo.max || cardCount < cardInfo.max);

            const row = document.createElement('div');
            row.className = 'card-row';

            // Générer 10 emplacements (cartes ou placeholders)
            let cardsHtml = '';
            for (let i = 0; i < 10; i++) {
                if (i < cardCount) {
                    cardsHtml += `
                        <div class="card">
                            <img src="assets/images/km-${cardInfo.km}.svg" class="km-value" alt="${cardInfo.km}">
                            <img src="assets/images/${cardInfo.animal}" class="animal" alt="${cardInfo.animal}">
                        </div>
                    `;
                } else {
                    // Utilise le SVG du répertoire distance
                    cardsHtml += `<div class="card-placeholder"><img class="km-bg" src="assets/distance/distance-${cardInfo.km}.svg" alt="${cardInfo.km} km"></div>`;
                }
            }

            row.innerHTML = `
                <button class="card-row-btn" data-action="remove" data-km="${cardInfo.km}" ${cardCount === 0 ? 'disabled' : ''}>-</button>
                <div class="card-track">
                    ${cardsHtml}
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
            prevPlayerBtn.disabled = false;
            nextPlayerBtn.disabled = false;
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
                // Passe au joueur suivant après ajout de carte avec un délai de 2 secondes
                if (playerCount > 1 && !player.isWinner) {
                    setTimeout(() => {
                        const prevIndex = currentPlayerIndex;
                        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
                        updateUI('left'); // Toujours slide gauche
                    }, 2000);
                    updateUI(); // Affiche d'abord la carte ajoutée
                    return;
                }
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
        const prevIndex = currentPlayerIndex;
        const nextIndex = (currentPlayerIndex + direction + playerCount) % playerCount;
        // Slide toujours de droite à gauche (le nouveau pousse l'ancien)
        [gameBoard, playerNav, document.querySelector('.progress-section')].forEach(el => {
            if (!el) return;
            el.classList.remove('slide-left', 'slide-right', 'slide-reset');
            void el.offsetWidth;
            el.classList.add('slide-left');
            setTimeout(() => {
                el.classList.remove('slide-left', 'slide-right');
                el.classList.add('slide-reset');
                currentPlayerIndex = nextIndex;
                updateUI();
            }, 500);
        });
    }

    function setPlayerCount(count) {
        playerCount = count;
        playerCountText.textContent = `${count} joueur${count > 1 ? 's' : ''}`;
        if (currentPlayerIndex >= count) {
            currentPlayerIndex = count - 1;
        }
        showPlayerNameModal();
        saveSettings(); // Sauvegarde le nombre de joueurs
    }

    // --- LOCAL STORAGE ---
    function saveSettings() {
        const settings = {
            playerCount,
            playerNames: players.map(p => p.name)
        };
        localStorage.setItem('mbornes-settings', JSON.stringify(settings));
    }
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('mbornes-settings'));
        if (settings) {
            playerCount = settings.playerCount;
            players = Array.from({ length: 4 }, (_, i) => createPlayer(i + 1));
            for (let i = 0; i < playerCount; i++) {
                players[i].name = settings.playerNames[i] || `Joueur ${i + 1}`;
            }
        }
    }

    // --- MODAL LOGIC ---
    function showPlayerNameModal() {
        modalContent.innerHTML = `
            <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span>Noms des joueurs</span>
                <button id="reset-names-btn" title="Réinitialiser les noms" style="font-size:13px;padding:4px 10px;border-radius:6px;border:1px solid #D1D5DB;background:#F3F4F6;cursor:pointer;">Reset</button>
            </h3>
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
        // Ajout : vider le champ si la valeur est la valeur par défaut au focus ou au clic
        setTimeout(() => {
            const inputs = modalContent.querySelectorAll('.player-name-inputs input');
            inputs.forEach((input, i) => {
                function clearIfDefault() {
                    if (this.value === `Joueur ${i + 1}`) {
                        this.value = '';
                    }
                }
                input.addEventListener('focus', clearIfDefault);
                input.addEventListener('click', clearIfDefault);
            });
            // Ajout du bouton reset noms
            const resetBtn = document.getElementById('reset-names-btn');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    inputs.forEach((input, i) => {
                        input.value = `Joueur ${i + 1}`;
                    });
                };
            }
        }, 0);
        document.getElementById('save-names-btn').onclick = () => {
            for (let i = 0; i < playerCount; i++) {
                const input = document.getElementById(`player-name-${i}`);
                players[i].name = input.value || `Joueur ${i + 1}`;
            }
            modalBackdrop.style.display = 'none';
            updateUI();
            saveSettings(); // Sauvegarde les noms
        };
    }
    
    function showResetModal() {
        modalContent.innerHTML = `
            <h3>Recommencer ?</h3>
            <p>Cela remettra tous les scores à zéro.</p>
            <div class="modal-buttons">
                <button id="cancel-reset-btn" class="modal-btn">Annuler</button>
                <button id="confirm-reset-btn" class="modal-btn primary">Reset</button>
            </div>
        `;
        modalBackdrop.style.display = 'flex';
        document.getElementById('confirm-reset-btn').onclick = () => {
            // On conserve le nombre de joueurs ET les noms
            const count = playerCount;
            const names = players.map(p => p.name);
            players = Array.from({ length: 4 }, (_, i) => createPlayer(i + 1));
            for (let i = 0; i < count; i++) {
                players[i].name = names[i] || `Joueur ${i + 1}`;
            }
            currentPlayerIndex = 0;
            playerCount = count;
            playerCountText.textContent = `${count} joueur${count > 1 ? 's' : ''}`;
            modalBackdrop.style.display = 'none';
            localStorage.removeItem('mbornes-settings');
            updateUI();
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
            dropdown.classList.remove('open'); // Ferme le menu
        }
    });
    // Ajout : ouverture/fermeture du menu au clic
    document.getElementById('player-dropdown-button').addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    // Ferme le menu si clic ailleurs
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });

    // --- START ---
    initGame();

    // Injection dynamique du script confetti si absent
    if (!window.confetti) {
        const confettiScript = document.createElement('script');
        confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        confettiScript.async = true;
        document.head.appendChild(confettiScript);
    }
});