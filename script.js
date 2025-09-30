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

    // --- PLAYER CREATION ---
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

    // --- INITIALIZATION ---
    function init() {
        players = [createPlayer(1), createPlayer(2), createPlayer(3), createPlayer(4)];
        
        const gameContainers = document.getElementById('game-containers');
        
        if (gameContainers) {
            gameContainers.innerHTML = '';
            
            // Créer un container pour chaque joueur (max 4)
            for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
                const containerDiv = document.createElement('div');
                containerDiv.className = 'game-container';
                containerDiv.id = `game-container-${playerIndex}`;
                
                containerDiv.innerHTML = `
                    <section class="progress-section">
                        <div class="progress-track">
                            <div id="progress-bubble-${playerIndex}" class="progress-bubble">0</div>
                            <img src="assets/images/arrival.svg" class="progress-arrival-flag" alt="Arrivée">
                        </div>
                    </section>
                    <main class="game-board-slider">
                        <div id="game-board-${playerIndex}" class="game-board">
                            ${CARD_DATA.map(card => `
                                <div class="card-row">
                                    <div class="controls-left">
                                        <button class="card-row-btn" data-km="${card.km}" data-player="${playerIndex}" disabled>-</button>
                                    </div>
                                    <div class="card-track">
                                        ${Array(10).fill().map((_, i) => `
                                            <div class="card-placeholder" style="z-index: ${1 - (i * 0.1)};">
                                                <img class="km-bg" src="assets/distance/distance-${card.km}.svg" alt="${card.km} km">
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="controls">
                                        <span class="count">0</span>
                                        <button class="card-row-btn add" data-km="${card.km}" data-player="${playerIndex}">+</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </main>
                `;
                
                gameContainers.appendChild(containerDiv);
            }
        }
    }

    // --- GAME LOGIC ---
    function addCard(km) {
        const player = players[currentPlayerIndex];
        const cardInfo = CARD_DATA.find(card => card.km === km);
        
        if (!player || !cardInfo) return;
        
        const canAdd = player.score + km <= 1000 && 
                      (!cardInfo.max || player.cards[km] < cardInfo.max);
        
        if (canAdd) {
            player.cards[km]++;
            player.score += km;
            
            // Check if player wins
            if (player.score >= 1000) {
                player.isWinner = true;
            }
            
            updateUI();
        }
    }
    
    function removeCard(km) {
        const player = players[currentPlayerIndex];
        
        if (!player || player.cards[km] <= 0) return;
        
        player.cards[km]--;
        player.score -= km;
        
        // Reset winner status if score drops below 1000
        if (player.score < 1000) {
            player.isWinner = false;
        }
        
        updateUI();
    }

    // --- UI UPDATE ---
    function updateUI() {
        // Update all active players
        for (let i = 0; i < playerCount; i++) {
            updatePlayerContainer(i);
        }
        
        // Apply carousel animation
        const gameContainers = document.getElementById('game-containers');
        if (gameContainers) {
            gameContainers.className = 'game-containers';
            gameContainers.classList.add(`slide-to-player-${currentPlayerIndex}`);
        }
        
        updateTabBar();
    }
    
    function updatePlayerContainer(playerIndex) {
        const player = players[playerIndex];
        const progressBubble = document.getElementById(`progress-bubble-${playerIndex}`);
        const gameBoard = document.getElementById(`game-board-${playerIndex}`);
        
        if (!player || !progressBubble || !gameBoard) return;
        
        // Update progress
        const progressPercent = Math.min(player.score / 1000, 1) * 100;
        progressBubble.style.left = `calc(${progressPercent}% - ${progressPercent / 100 * 40}px)`;
        progressBubble.textContent = player.score;
        progressBubble.style.borderColor = player.isWinner ? '#4CAF50' : 'white';
        
        // Winner styling
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
        
        // Update cards
        const cardRows = gameBoard.querySelectorAll('.card-row');
        CARD_DATA.forEach((cardInfo, index) => {
            const row = cardRows[index];
            if (!row) return;
            
            const cardCount = player.cards[cardInfo.km];
            const canAdd = !player.isWinner && 
                          player.score + cardInfo.km <= 1000 && 
                          (!cardInfo.max || cardCount < cardInfo.max);
            
            // Update count
            const countSpan = row.querySelector('.count');
            if (countSpan) countSpan.textContent = cardCount;
            
            // Update buttons
            const removeBtn = row.querySelector('.card-row-btn:not(.add)');
            const addBtn = row.querySelector('.card-row-btn.add');
            
            if (removeBtn) removeBtn.disabled = cardCount === 0;
            if (addBtn) addBtn.disabled = !canAdd;
            
            // Update cards display
            const cardTrack = row.querySelector('.card-track');
            if (cardTrack) {
                cardTrack.innerHTML = '';
                for (let i = 0; i < 10; i++) {
                    if (i < cardCount) {
                        cardTrack.innerHTML += `
                            <div class="card">
                                <img src="assets/images/km-${cardInfo.km}.svg" class="km-value" alt="${cardInfo.km}">
                                <img src="assets/images/${cardInfo.animal}" class="animal" alt="${cardInfo.animal}">
                            </div>
                        `;
                    } else {
                        const maxPossible = cardInfo.max ? cardInfo.max - cardCount : Math.floor((1000 - player.score) / cardInfo.km);
                        const placeholderOpacity = (i - cardCount < maxPossible) ? '' : ' style="opacity:0;"';
                        const zIndex = 1 - (i * 0.1); // Z-index décroissant mais inférieur aux cartes (z-index: 2)
                        const styles = `z-index: ${zIndex};${placeholderOpacity ? placeholderOpacity.replace(' style="', '').replace('"', '') : ''}`;
                        cardTrack.innerHTML += `
                            <div class="card-placeholder" style="${styles}">
                                <img class="km-bg" src="assets/distance/distance-${cardInfo.km}.svg" alt="${cardInfo.km} km">
                            </div>
                        `;
                    }
                }
            }
        });
    }

    // --- TAB BAR ---
    function updateTabBar() {
        const tabBarList = document.getElementById('tab-bar-list');
        if (!tabBarList) return;
        
        tabBarList.innerHTML = '';
        for (let i = 0; i < playerCount; i++) {
            const player = players[i];
            const isActive = i === currentPlayerIndex;
            
            // Calculate progress
            const percent = Math.min(player.score / 1000, 1);
            let dasharray, dashoffset, svg, circleClass, labelClass;
            
            if (isActive) {
                dasharray = 44;
                dashoffset = 44 - Math.round(44 * percent);
                svg = `<svg width="18" height="18" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="7" stroke="#000" stroke-width="3" fill="none" />
                    <circle class="progress" cx="8" cy="8" r="7" stroke="#07a240" stroke-width="1.5" fill="none" stroke-dasharray="44" stroke-dashoffset="${dashoffset}" />
                </svg>`;
                circleClass = 'progress-circle active';
                labelClass = 'tab-bar-label active';
            } else {
                dasharray = 25;
                dashoffset = 25 - Math.round(25 * percent);
                svg = `<svg width="18" height="18" viewBox="0 0 10 10">
                    <circle cx="5" cy="5" r="4" stroke="#000" stroke-width="2" fill="none" />
                    <circle class="progress" cx="5" cy="5" r="4" stroke="#72C4FE" stroke-width="1" fill="none" stroke-dasharray="25" stroke-dashoffset="${dashoffset}" />
                </svg>`;
                circleClass = 'progress-circle';
                labelClass = 'tab-bar-label';
            }
            
            const li = document.createElement('li');
            li.className = 'tab-bar-item' + (isActive ? ' active' : '');
            li.innerHTML = `
                <div class="${circleClass}">
                    ${svg}
                </div>
                <span class="${labelClass}">${player.name}</span>
            `;
            
            tabBarList.appendChild(li);
        }
    }

    // --- NAVIGATION ---
    function changePlayer(newIndex) {
        if (newIndex === currentPlayerIndex || isAnimating) return;
        
        // Gestion des boucles avec approche simple
        if (newIndex < 0) {
            newIndex = playerCount - 1; // Aller au dernier joueur
        } else if (newIndex >= playerCount) {
            newIndex = 0; // Aller au premier joueur
        }
        
        // Changement normal pour tous les cas (y compris les boucles)
        isAnimating = true;
        const gameContainers = document.querySelector('.game-containers');
        if (gameContainers) {
            gameContainers.classList.add('animating');
        }
        
        currentPlayerIndex = newIndex;
        updateUI();
        
        // Délai court pour permettre l'animation CSS
        setTimeout(() => {
            if (gameContainers) {
                gameContainers.classList.remove('animating');
            }
            isAnimating = false;
            resetSwipeValues();
        }, 450); // Correspond à la durée CSS (0.4s) + marge
    }
    
    
    // --- SWIPE FUNCTIONALITY ---
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeEndX = 0;
    let swipeEndY = 0;
    let isSwipeInProgress = false;
    let isAnimating = false;
    let swipeStartTime = 0;
    
    function addSwipeListeners() {
        const gameContainersWrapper = document.querySelector('.game-containers-wrapper');
        if (!gameContainersWrapper) return;

        // Étendre la zone de swipe à tout le game-board
        const gameContainers = document.getElementById('game-containers');
        if (!gameContainers) return;

        // Touch events avec debouncing - maintenant sur tout le game-containers
        gameContainers.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameContainers.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainers.addEventListener('touchend', handleTouchEnd, { passive: true });
        gameContainers.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        // Mouse events pour desktop avec debouncing
        let mouseDown = false;
        let lastMouseAction = 0;
        let swipeStartTarget = null;

        gameContainers.addEventListener('mousedown', (e) => {
            const now = Date.now();
            if (now - lastMouseAction < 150) return; // Debouncing 150ms

            if (isAnimating || isSwipeInProgress) {
                return;
            }

            lastMouseAction = now;
            mouseDown = true;
            swipeStartTarget = e.target;
            swipeStartX = e.clientX;
            swipeStartY = e.clientY;
            swipeEndX = swipeStartX;
            swipeEndY = swipeStartY;
            swipeStartTime = now;
            isSwipeInProgress = true;
        });

        gameContainers.addEventListener('mousemove', (e) => {
            if (!mouseDown || !isSwipeInProgress || isAnimating) return;
            swipeEndX = e.clientX;
            swipeEndY = e.clientY;
        });

        gameContainers.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;

            // Si le target a changé ou s'il y a eu un mouvement significatif, traiter comme swipe
            const targetChanged = swipeStartTarget !== e.target;
            const hasSignificantMovement = Math.abs(swipeEndX - swipeStartX) > 15 || Math.abs(swipeEndY - swipeStartY) > 15;

            if (isSwipeInProgress && !isAnimating && (targetChanged || hasSignificantMovement)) {
                handleSwipeEnd();
            } else {
                resetSwipeValues();
            }
        });

        gameContainers.addEventListener('mouseleave', () => {
            mouseDown = false;
            resetSwipeValues();
        });
    }
    
    function handleTouchStart(e) {
        // Ignorer si animation en cours ou swipe déjà actif
        if (isAnimating || isSwipeInProgress) return;

        // Empêcher les multiples touches
        if (e.touches.length > 1) {
            resetSwipeValues();
            return;
        }

        const touch = e.touches[0];
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;
        swipeEndX = swipeStartX;
        swipeEndY = swipeStartY;
        swipeStartTime = Date.now();
        isSwipeInProgress = true;
    }
    
    function handleTouchMove(e) {
        if (!isSwipeInProgress || isAnimating || e.touches.length > 1) {
            resetSwipeValues();
            return;
        }
        
        const touch = e.touches[0];
        swipeEndX = touch.clientX;
        swipeEndY = touch.clientY;
        
        const deltaX = Math.abs(swipeEndX - swipeStartX);
        const deltaY = Math.abs(swipeEndY - swipeStartY);
        
        // Prévenir le scroll si c'est un swipe horizontal significatif
        if (deltaX > deltaY && deltaX > 15) {
            e.preventDefault();
        }
        
        // Annuler si le mouvement vertical est trop important
        if (deltaY > 50 && deltaY > deltaX * 1.5) {
            resetSwipeValues();
        }
    }
    
    function handleTouchEnd(e) {
        if (!isSwipeInProgress) return;
        
        // Si animation en cours, annuler
        if (isAnimating) {
            resetSwipeValues();
            return;
        }
        
        handleSwipeEnd();
    }
    
    function handleSwipeEnd() {
        if (!isSwipeInProgress || isAnimating) {
            resetSwipeValues();
            return;
        }

        const deltaX = swipeEndX - swipeStartX;
        const deltaY = swipeEndY - swipeStartY;
        const swipeTime = Date.now() - swipeStartTime;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Conditions pour un swipe valide
        const minSwipeDistance = 40; // Distance minimum réduite pour plus de sensibilité
        const maxSwipeTime = 1000; // Temps maximum
        const isHorizontal = absX > absY * 1.2; // Ratio moins strict
        const isValidDistance = absX >= minSwipeDistance;
        const isValidTime = swipeTime <= maxSwipeTime;
        const isValidVelocity = (absX / swipeTime) > 0.08; // Vélocité minimum réduite

        // Multi-joueurs uniquement
        const hasMultiplePlayers = playerCount > 1;

        if (hasMultiplePlayers && isHorizontal && isValidDistance && isValidTime && isValidVelocity) {
            // Débouncer les swipes rapides successifs
            const now = Date.now();
            if (now - (window.lastSwipeTime || 0) < 500) {
                resetSwipeValues();
                return;
            }
            window.lastSwipeTime = now;

            if (deltaX > 0) {
                // Swipe vers la droite = joueur précédent
                changePlayer(currentPlayerIndex - 1);
            } else {
                // Swipe vers la gauche = joueur suivant
                changePlayer(currentPlayerIndex + 1);
            }
        }

        resetSwipeValues();
    }
    
    function resetSwipeValues() {
        swipeStartX = 0;
        swipeStartY = 0;
        swipeEndX = 0;
        swipeEndY = 0;
        swipeStartTime = 0;
        isSwipeInProgress = false;
    }
    
    function setPlayerCount(count) {
        playerCount = count;
        const playerCountText = document.getElementById('player-count-text');
        if (playerCountText) {
            playerCountText.textContent = `${count} joueur${count > 1 ? 's' : ''}`;
        }
        
        if (currentPlayerIndex >= count) {
            currentPlayerIndex = count - 1;
        }
        
        updateTabBar();
        
        // Show/hide tab bar
        const playerNav = document.getElementById('player-nav');
        if (playerNav) {
            playerNav.style.display = count > 1 ? 'flex' : 'none';
        }
        
        const dropdown = document.getElementById('player-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        
        // Show player name modal for multi-player games
        if (count > 1) {
            setTimeout(() => showPlayerNameModal(), 100);
        }
        
        saveSettings();
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        const gameContainers = document.getElementById('game-containers');
        if (!gameContainers) return;
        
        let lastClickTime = 0;
        let isProcessingClick = false;
        
        gameContainers.addEventListener('click', (e) => {
            // Debouncing des clics rapides
            const now = Date.now();
            if (now - lastClickTime < 150 || isProcessingClick || isAnimating) {
                return;
            }

            lastClickTime = now;
            isProcessingClick = true;

            // Timeout de sécurité pour débloquer les clics
            setTimeout(() => {
                isProcessingClick = false;
            }, 200);

            // Gestion des boutons +/-
            const button = e.target.closest('.card-row-btn');
            if (button && !button.disabled) {
                const km = parseInt(button.dataset.km);
                const playerIndex = parseInt(button.dataset.player);

                // Vérifier que c'est le joueur actuel
                if (playerIndex !== currentPlayerIndex) {
                    isProcessingClick = false;
                    return;
                }

                if (button.classList.contains('add')) {
                    addCard(km);
                } else {
                    removeCard(km);
                }

                isProcessingClick = false;
                return;
            }

            // Gestion des clics sur cartes et placeholders (pour ajouter)
            const card = e.target.closest('.card');
            const placeholder = e.target.closest('.card-placeholder');

            if (card || placeholder) {
                const cardRow = e.target.closest('.card-row');
                if (!cardRow) {
                    isProcessingClick = false;
                    return;
                }

                const addButton = cardRow.querySelector('.card-row-btn.add');
                if (addButton && !addButton.disabled) {
                    const km = parseInt(addButton.dataset.km);
                    const playerIndex = parseInt(addButton.dataset.player);

                    // Vérifier que c'est le joueur actuel
                    if (playerIndex !== currentPlayerIndex) {
                        isProcessingClick = false;
                        return;
                    }

                    addCard(km);
                }

                isProcessingClick = false;
                return;
            }

            // Si ce n'est pas un élément cliquable, permettre le swipe
            isProcessingClick = false;
        });
        
        // Prévenir les événements parasites pendant les animations
        gameContainers.addEventListener('touchstart', (e) => {
            if (isAnimating) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        gameContainers.addEventListener('mousedown', (e) => {
            if (isAnimating && e.target.closest('.card-row-btn, .card, .card-placeholder')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    function addTabBarEventListeners() {
        const tabBarList = document.getElementById('tab-bar-list');
        if (tabBarList) {
            tabBarList.addEventListener('click', (e) => {
                const li = e.target.closest('.tab-bar-item');
                if (!li) return;
                
                const index = Array.from(tabBarList.children).indexOf(li);
                if (index !== -1 && index < playerCount) {
                    changePlayer(index);
                }
            });
        }
        
        // Player count dropdown
        const dropdownContent = document.getElementById('player-dropdown-content');
        if (dropdownContent) {
            dropdownContent.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.target.tagName === 'A') {
                    const count = parseInt(e.target.dataset.players);
                    setPlayerCount(count);
                }
            });
        }
        
        // Dropdown toggle
        const dropdownButton = document.getElementById('player-dropdown-button');
        const dropdown = document.getElementById('player-dropdown');
        if (dropdownButton && dropdown) {
            dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });
        }
        
        // Reset button
        const resetButton = document.getElementById('reset-btn');
        if (resetButton) {
            resetButton.addEventListener('click', showResetModal);
        }
        
        // Modal backdrop click to close
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    closeModal();
                }
            });
        }
        
        // Escape key to close modal + Navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
            // Navigation avec les flèches (pour tester la boucle)
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                changePlayer(currentPlayerIndex - 1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                changePlayer(currentPlayerIndex + 1);
            }
        });
        
        // Initialize swipe functionality
        addSwipeListeners();
    }

    // --- RESET FUNCTIONALITY ---
    function resetGame() {
        // Reset all players
        players.forEach(player => {
            player.score = 0;
            player.isWinner = false;
            CARD_DATA.forEach(card => player.cards[card.km] = 0);
        });
        
        // Reset to player 1
        currentPlayerIndex = 0;
        updateUI();
    }
    
    function showResetModal() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalBackdrop || !modalContent) return;
        
        modalContent.innerHTML = `
            <h3>Réinitialiser le jeu</h3>
            <p>Êtes-vous sûr de vouloir remettre à zéro tous les scores ?</p>
            <div class="modal-buttons">
                <button id="cancel-reset" class="modal-btn secondary">Annuler</button>
                <button id="confirm-reset" class="modal-btn primary alert">Réinitialiser</button>
            </div>
        `;
        
        // Add event listeners for modal buttons
        modalContent.querySelector('#cancel-reset').addEventListener('click', closeModal);
        modalContent.querySelector('#confirm-reset').addEventListener('click', () => {
            resetGame();
            closeModal();
        });
        
        modalBackdrop.style.display = 'flex';
    }
    
    function closeModal() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.style.display = 'none';
        }
    }

    // --- PLAYER NAME MANAGEMENT ---
    function showPlayerNameModal() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalBackdrop || !modalContent) return;
        
        modalContent.innerHTML = `
            <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span>Noms des joueurs</span>
                <button id="reset-names-btn" class="modal-btn secondary alert" title="Réinitialiser les noms">Reset</button>
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
        
        // Add event listeners
        modalContent.querySelector('#save-names-btn').addEventListener('click', savePlayerNames);
        modalContent.querySelector('#reset-names-btn').addEventListener('click', resetPlayerNames);
        
        // Add click/focus listeners to inputs for clearing default values
        for (let i = 0; i < playerCount; i++) {
            const input = modalContent.querySelector(`#player-name-${i}`);
            if (input) {
                const defaultValue = `Joueur ${i + 1}`;
                
                // Clear default value on focus if it hasn't been changed
                const clearIfDefault = () => {
                    if (input.value === defaultValue) {
                        input.value = '';
                        input.style.color = ''; // Reset color to normal
                    }
                };
                
                // Restore default value on blur if empty
                const restoreIfEmpty = () => {
                    if (input.value.trim() === '') {
                        input.value = defaultValue;
                        input.style.color = '#999'; // Make it look like placeholder
                    } else {
                        input.style.color = ''; // Normal color for custom text
                    }
                };
                
                // Set initial styling for default values
                if (input.value === defaultValue) {
                    input.style.color = '#999';
                }
                
                input.addEventListener('focus', clearIfDefault);
                input.addEventListener('click', clearIfDefault);
                input.addEventListener('blur', restoreIfEmpty);
                
                // Also clear on first keypress if it's the default value
                input.addEventListener('keydown', (e) => {
                    if (input.value === defaultValue) {
                        // Small delay to ensure the key is processed
                        setTimeout(() => {
                            if (input.value !== defaultValue) {
                                input.style.color = '';
                            }
                        }, 0);
                    }
                });
            }
        }
        
        // Focus on first input
        const firstInput = modalContent.querySelector('#player-name-0');
        if (firstInput) firstInput.focus();
        
        modalBackdrop.style.display = 'flex';
    }
    
    function savePlayerNames() {
        for (let i = 0; i < playerCount; i++) {
            const input = document.getElementById(`player-name-${i}`);
            if (input) {
                const value = input.value.trim();
                const defaultValue = `Joueur ${i + 1}`;
                
                // Use custom name if provided and different from default, otherwise use default
                if (value && value !== defaultValue) {
                    players[i].name = value;
                } else {
                    players[i].name = defaultValue;
                }
            }
        }
        updateTabBar();
        saveSettings();
        closeModal();
    }
    
    function resetPlayerNames() {
        for (let i = 0; i < playerCount; i++) {
            const input = document.getElementById(`player-name-${i}`);
            if (input) {
                input.value = `Joueur ${i + 1}`;
                input.style.color = '#999'; // Style par défaut
                players[i].name = `Joueur ${i + 1}`;
            }
        }
    }

    // --- SETTINGS MANAGEMENT ---
    function saveSettings() {
        const settings = {
            playerCount: playerCount,
            playerNames: players.slice(0, playerCount).map(p => p.name)
        };
        localStorage.setItem('mbornes-settings', JSON.stringify(settings));
    }
    
    function loadSettings() {
        try {
            const settingsJson = localStorage.getItem('mbornes-settings');
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                if (settings && settings.playerCount) {
                    playerCount = settings.playerCount;
                    
                    if (settings.playerNames) {
                        for (let i = 0; i < Math.min(playerCount, players.length); i++) {
                            if (players[i]) {
                                players[i].name = settings.playerNames[i] || `Joueur ${i + 1}`;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Erreur lors du chargement des settings:', e);
        }
    }

    // --- START ---
    init();
    loadSettings(); // Load saved settings first
    addEventListeners();
    addTabBarEventListeners();
    updateUI();
    updateTabBar();
    
    // Update UI with loaded settings
    const playerCountText = document.getElementById('player-count-text');
    if (playerCountText) {
        playerCountText.textContent = `${playerCount} joueur${playerCount > 1 ? 's' : ''}`;
    }
    
    const playerNav = document.getElementById('player-nav');
    if (playerNav) {
        playerNav.style.display = playerCount > 1 ? 'flex' : 'none';
    }
    
    // Load confetti library if not present
    if (!window.confetti) {
        const confettiScript = document.createElement('script');
        confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        confettiScript.async = true;
        document.head.appendChild(confettiScript);
    }
});

// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
                
                // Vérifier les mises à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] Nouvelle version disponible!');
                                // Optionnel : afficher une notification de mise à jour
                                if (confirm('Une nouvelle version de l\'application est disponible. Voulez-vous la charger ?')) {
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            })
            .catch((error) => {
                console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
            });
    });

    // Recharger la page quand un nouveau service worker prend le contrôle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}