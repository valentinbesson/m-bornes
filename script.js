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

        // Progress Bubble : déplacement instantané si changement de joueur
        if (typeof slideDirection === 'string') {
            progressBubble.classList.add('no-anim');
        } else {
            progressBubble.classList.remove('no-anim');
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
            let maxPossible;
            if (player.isWinner) {
                maxPossible = 0;
            } else if (cardInfo.km === 200) {
                // Pour les 200, il faut aussi vérifier que le score restant permet d'en ajouter
                const maxByScore = Math.floor((1000 - player.score) / 200);
                maxPossible = Math.max(0, Math.min((cardInfo.max || 10) - cardCount, maxByScore));
            } else {
                maxPossible = cardInfo.max ? cardInfo.max - cardCount : Math.floor((1000 - player.score) / cardInfo.km);
            }

            for (let i = 0; i < 10; i++) {
                if (i < cardCount) {
                    cardsHtml += `
                        <div class="card">
                            <img src="assets/images/km-${cardInfo.km}.svg" class="km-value" alt="${cardInfo.km}">
                            <img src="assets/images/${cardInfo.animal}" class="animal" alt="${cardInfo.animal}">
                        </div>
                    `;
                } else {
                    // Placeholders visibles uniquement si on peut encore ajouter une carte à cet emplacement
                    const placeholderOpacity = (i - cardCount < maxPossible) ? '' : ' style="opacity:0;"';
                    cardsHtml += `<div class="card-placeholder"${placeholderOpacity}><img class="km-bg" src="assets/distance/distance-${cardInfo.km}.svg" alt="${cardInfo.km} km"></div>`;
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

        // Génération dynamique de la tab-barre joueurs
        const tabBarList = document.getElementById('tab-bar-list');
        if (tabBarList) {
            tabBarList.innerHTML = '';
            for (let i = 0; i < playerCount; i++) {
                const playerData = players[i];
                const isActive = i === currentPlayerIndex;
                let percent, dasharray, dashoffset, svg, circleClass, labelClass;
                if (isActive) {
                    percent = Math.min(playerData.score / 1000, 1);
                    dasharray = 44;
                    dashoffset = 44 - Math.round(44 * percent);
                    svg = `<svg width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="7" stroke="#2a2a2a" stroke-width="2" fill="none" />
                        <circle class="progress" cx="8" cy="8" r="7" stroke="#07a240" stroke-width="2" fill="none" stroke-dasharray="44" stroke-dashoffset="${dashoffset}" />
                    </svg>`;
                    circleClass = 'progress-circle active';
                    labelClass = 'tab-bar-label active';
                } else {
                    percent = Math.min(playerData.score / 1000, 1);
                    dasharray = 25;
                    dashoffset = 25 - Math.round(25 * percent);
                    svg = `<svg width="14" height="14" viewBox="0 0 10 10">
                        <circle cx="5" cy="5" r="4" stroke="#2a2a2a" stroke-width="1" fill="none" />
                        <circle class="progress" cx="5" cy="5" r="4" stroke="#72C4FE" stroke-width="1" fill="none" stroke-dasharray="25" stroke-dashoffset="${dashoffset}" />
                    </svg>`;
                    circleClass = 'progress-circle';
                    labelClass = 'tab-bar-label';
                }
                const li = document.createElement('li');
                li.className = 'tab-bar-item' + (isActive ? ' active' : '');
                li.innerHTML = `
                    <div class="${circleClass}">${svg}</div>
                    <span class="${labelClass}">${playerData.name}</span>
                `;
                tabBarList.appendChild(li);
            }
        }

        // Ancienne navigation (masquée)
        if (playerCount > 1) {
            playerNav.style.display = 'flex';
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
                // Suppression du passage automatique au joueur suivant
                updateUI();
                return;
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
            }, 400);
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
    
// Permet l’ajout d’une carte en cliquant sur un placeholder ou une carte (si possible)
gameBoard.addEventListener('click', function(e) {
    // Cible le placeholder ou la carte
    const placeholder = e.target.closest('.card-placeholder');
    const card = e.target.closest('.card');
    let row, addBtn;

    if (placeholder && placeholder.style.opacity !== '0') {
        row = placeholder.closest('.card-row');
    } else if (card) {
        row = card.closest('.card-row');
    } else {
        return;
    }

    if (!row) return;
    addBtn = row.querySelector('button[data-action="add"]');
    if (!addBtn || addBtn.disabled) return;
    addBtn.click();
});



    // Navigation par clic sur la tab-barre
    const tabBarList = document.querySelector('.tab-bar-list');
    if (tabBarList) {
        tabBarList.addEventListener('click', (e) => {
            const li = e.target.closest('.tab-bar-item');
            if (!li) return;
            const index = Array.from(tabBarList.children).indexOf(li);
            if (index !== -1 && index < playerCount) {
                currentPlayerIndex = index;
                updateUI();
            }
        });
    }
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