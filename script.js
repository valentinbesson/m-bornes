/**
 * ========================================
 * APPLICATION MILLE BORNES - COMPTEUR
 * ========================================
 * 
 * Application PWA pour compter les points au jeu Mille Bornes
 * Supporte jusqu'à 4 joueurs avec navigation par swipe/clic
 * 
 * @author Votre nom
 * @version 1.0
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ========================================
       CONFIGURATION ET CONSTANTES
       ======================================== */
    
    const CONFIG = {
        MAX_PLAYERS: 4,
        WIN_SCORE: 1000,
        ANIMATION_DURATION: 450,
        SWIPE_MIN_DISTANCE: 40,
        SWIPE_MAX_TIME: 1000,
        DEBOUNCE_TIME: 150
    };

    const CARD_DATA = [
        { km: 200, animal: 'swallow-200.png', max: 2 },
        { km: 100, animal: 'hare-100.png' },
        { km: 75,  animal: 'butterfly-75.png' },
        { km: 50,  animal: 'duck-50.png' },
        { km: 25,  animal: 'snail-25.png' }
    ];

    /* ========================================
       STATE MANAGEMENT
       ======================================== */
    
    let gameState = {
        playerCount: 1,
        currentPlayerIndex: 0,
        players: [],
        isAnimating: false
    };

    let swipeState = {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isInProgress: false,
        startTime: 0,
        startTarget: null
    };

    /* ========================================
       PLAYER MANAGEMENT
       ======================================== */
    
    /**
     * Crée un nouveau joueur avec les données par défaut
     * @param {number} id - ID du joueur (1-4)
     * @returns {Object} Objet joueur
     */
    function createPlayer(id) {
        const player = {
            id: id,
            name: `Joueur ${id}`,
            score: 0,
            isWinner: false,
            cards: {}
        };
        
        // Initialiser le compteur de cartes
        CARD_DATA.forEach(card => player.cards[card.km] = 0);
        return player;
    }

    /**
     * Initialise tous les joueurs
     */
    function initializePlayers() {
        gameState.players = [];
        for (let i = 1; i <= CONFIG.MAX_PLAYERS; i++) {
            gameState.players.push(createPlayer(i));
        }
    }

    /**
     * Change le nombre de joueurs actifs
     * @param {number} count - Nombre de joueurs (1-4)
     */
    function setPlayerCount(count) {
        gameState.playerCount = count;
        
        // Mise à jour de l'affichage
        const playerCountText = document.getElementById('player-count-text');
        if (playerCountText) {
            playerCountText.textContent = `${count} joueur${count > 1 ? 's' : ''}`;
        }
        
        // Ajuster l'index du joueur actuel si nécessaire
        if (gameState.currentPlayerIndex >= count) {
            gameState.currentPlayerIndex = count - 1;
        }
        
        updateTabBar();
        togglePlayerNavigation(count > 1);
        closeDropdown();
        
        // Afficher modal des noms pour multi-joueurs
        if (count > 1) {
            setTimeout(() => showPlayerNameModal(), 100);
        }
        
        saveSettings();
    }

    /**
     * Affiche/masque la navigation entre joueurs
     * @param {boolean} show - True pour afficher
     */
    function togglePlayerNavigation(show) {
        const playerNav = document.getElementById('player-nav');
        if (playerNav) {
            playerNav.style.display = show ? 'flex' : 'none';
        }
    }

    /* ========================================
       GAME LOGIC
       ======================================== */
    
    /**
     * Ajoute une carte au joueur actuel
     * @param {number} km - Valeur de la carte (25, 50, 75, 100, 200)
     */
    function addCard(km) {
        const player = gameState.players[gameState.currentPlayerIndex];
        const cardInfo = CARD_DATA.find(card => card.km === km);
        
        if (!player || !cardInfo) return;
        
        const canAdd = player.score + km <= CONFIG.WIN_SCORE && 
                      (!cardInfo.max || player.cards[km] < cardInfo.max);
        
        if (canAdd) {
            player.cards[km]++;
            player.score += km;
            
            // Vérifier la victoire
            if (player.score >= CONFIG.WIN_SCORE) {
                player.isWinner = true;
            }
            
            updateUI();
        }
    }
    
    /**
     * Retire une carte du joueur actuel
     * @param {number} km - Valeur de la carte à retirer
     */
    function removeCard(km) {
        const player = gameState.players[gameState.currentPlayerIndex];
        
        if (!player || player.cards[km] <= 0) return;
        
        player.cards[km]--;
        player.score -= km;
        
        // Retirer le statut de gagnant si le score descend sous 1000
        if (player.score < CONFIG.WIN_SCORE) {
            player.isWinner = false;
        }
        
        updateUI();
    }

    /**
     * Remet à zéro le jeu
     */
    function resetGame() {
        gameState.players.forEach(player => {
            player.score = 0;
            player.isWinner = false;
            CARD_DATA.forEach(card => player.cards[card.km] = 0);
        });
        
        gameState.currentPlayerIndex = 0;
        updateUI();
    }

    /* ========================================
       UI MANAGEMENT
       ======================================== */
    
    /**
     * Met à jour toute l'interface utilisateur
     */
    function updateUI() {
        // Mettre à jour tous les joueurs actifs
        for (let i = 0; i < gameState.playerCount; i++) {
            updatePlayerContainer(i);
        }
        
        // Appliquer l'animation de carrousel
        updateCarouselPosition();
        updateTabBar();
    }

    /**
     * Met à jour la position du carrousel
     */
    function updateCarouselPosition() {
        const gameContainers = document.getElementById('game-containers');
        if (gameContainers) {
            gameContainers.className = 'game-containers';
            gameContainers.classList.add(`slide-to-player-${gameState.currentPlayerIndex}`);
        }
    }
    
    /**
     * Met à jour le conteneur d'un joueur spécifique
     * @param {number} playerIndex - Index du joueur à mettre à jour
     */
    function updatePlayerContainer(playerIndex) {
        const player = gameState.players[playerIndex];
        const progressBubble = document.getElementById(`progress-bubble-${playerIndex}`);
        const gameBoard = document.getElementById(`game-board-${playerIndex}`);
        
        if (!player || !progressBubble || !gameBoard) return;
        
        updateProgressBar(player, progressBubble);
        updateCardRows(player, gameBoard);
    }

    /**
     * Met à jour la barre de progression d'un joueur
     * @param {Object} player - Données du joueur
     * @param {HTMLElement} progressBubble - Élément de la bulle de progression
     */
    function updateProgressBar(player, progressBubble) {
        const progressPercent = Math.min(player.score / CONFIG.WIN_SCORE, 1) * 100;
        
        // Position de la bulle
        progressBubble.style.left = `calc(${progressPercent}% - ${progressPercent / 100 * 40}px)`;
        progressBubble.textContent = player.score;
        progressBubble.style.borderColor = player.isWinner ? '#4CAF50' : 'white';
        
        // Animation de victoire
        if (player.isWinner) {
            progressBubble.classList.add('arrival');
            triggerVictoryAnimation(progressBubble);
        } else {
            progressBubble.classList.remove('arrival');
            progressBubble._confettiDone = false;
        }
    }

    /**
     * Déclenche l'animation de victoire (confettis)
     * @param {HTMLElement} progressBubble - Élément de la bulle
     */
    function triggerVictoryAnimation(progressBubble) {
        if (!progressBubble._confettiDone && window.confetti) {
            window.confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.5 },
                zIndex: 9999
            });
            progressBubble._confettiDone = true;
        }
    }

    /**
     * Met à jour toutes les rangées de cartes d'un joueur
     * @param {Object} player - Données du joueur
     * @param {HTMLElement} gameBoard - Élément du plateau de jeu
     */
    function updateCardRows(player, gameBoard) {
        const cardRows = gameBoard.querySelectorAll('.card-row');
        
        CARD_DATA.forEach((cardInfo, index) => {
            const row = cardRows[index];
            if (!row) return;
            
            const cardCount = player.cards[cardInfo.km];
            const canAdd = !player.isWinner && 
                          player.score + cardInfo.km <= CONFIG.WIN_SCORE && 
                          (!cardInfo.max || cardCount < cardInfo.max);
            
            updateRowControls(row, cardCount, canAdd);
            updateCardDisplay(row, cardInfo, player, cardCount);
        });
    }

    /**
     * Met à jour les contrôles d'une rangée de cartes
     * @param {HTMLElement} row - Rangée de cartes
     * @param {number} cardCount - Nombre de cartes actuelles
     * @param {boolean} canAdd - Peut-on ajouter des cartes
     */
    function updateRowControls(row, cardCount, canAdd) {
        // Mise à jour du compteur
        const countSpan = row.querySelector('.count');
        if (countSpan) countSpan.textContent = cardCount;
        
        // Mise à jour des boutons
        const removeBtn = row.querySelector('.card-row-btn:not(.add)');
        const addBtn = row.querySelector('.card-row-btn.add');
        
        if (removeBtn) removeBtn.disabled = cardCount === 0;
        if (addBtn) addBtn.disabled = !canAdd;
    }

    /**
     * Met à jour l'affichage des cartes et placeholders
     * @param {HTMLElement} row - Rangée de cartes
     * @param {Object} cardInfo - Informations sur le type de carte
     * @param {Object} player - Données du joueur
     * @param {number} cardCount - Nombre de cartes actuelles
     */
    function updateCardDisplay(row, cardInfo, player, cardCount) {
        const cardTrack = row.querySelector('.card-track');
        if (!cardTrack) return;

        const placeholdersContainer = cardTrack.querySelector('.placeholders-container');
        const cardsContainer = cardTrack.querySelector('.cards-container');
        
        if (!placeholdersContainer || !cardsContainer) return;

        updatePlaceholders(placeholdersContainer, cardInfo, player, cardCount);
        updateCardSlots(cardsContainer, cardInfo, cardCount);
    }

    /**
     * Met à jour la visibilité des placeholders
     * @param {HTMLElement} container - Conteneur des placeholders
     * @param {Object} cardInfo - Informations sur le type de carte
     * @param {Object} player - Données du joueur
     * @param {number} cardCount - Nombre de cartes actuelles
     */
    function updatePlaceholders(container, cardInfo, player, cardCount) {
        const placeholders = container.querySelectorAll('.card-placeholder');
        let visiblePlaceholders = cardInfo.max || 10;
        
        // Calcul du nombre maximum de cartes ajoutables
        let maxPossible;
        if (cardInfo.max) {
            const remainingKm = CONFIG.WIN_SCORE - player.score;
            const maxByLimit = cardInfo.max - cardCount;
            const maxBySpace = Math.floor(remainingKm / cardInfo.km);
            maxPossible = Math.max(0, Math.min(maxByLimit, maxBySpace));
            
            // Ajuster les placeholders visibles selon l'espace disponible
            const totalPossible = cardCount + maxPossible;
            visiblePlaceholders = Math.min(cardInfo.max, totalPossible);
        } else {
            const remainingKm = CONFIG.WIN_SCORE - player.score;
            maxPossible = Math.floor(remainingKm / cardInfo.km);
        }
        
        // Appliquer la visibilité aux placeholders
        placeholders.forEach((placeholder, i) => {
            if (i >= visiblePlaceholders) {
                placeholder.style.visibility = 'hidden';
            } else {
                placeholder.style.visibility = 'visible';
                
                if (maxPossible === 0 && i >= cardCount) {
                    placeholder.style.opacity = '0';
                } else if (i < maxPossible + cardCount) {
                    placeholder.style.opacity = '1';
                } else {
                    placeholder.style.opacity = '0';
                }
            }
        });
    }

    /**
     * Met à jour les slots de cartes
     * @param {HTMLElement} container - Conteneur des cartes
     * @param {Object} cardInfo - Informations sur le type de carte
     * @param {number} cardCount - Nombre de cartes à afficher
     */
    function updateCardSlots(container, cardInfo, cardCount) {
        const cardSlots = container.querySelectorAll('.card-slot');
        
        cardSlots.forEach((slot, i) => {
            if (i < cardCount) {
                // Afficher la carte dans ce slot
                slot.innerHTML = `
                    <div class="card">
                        <img src="assets/images/km-${cardInfo.km}.svg" class="km-value" alt="${cardInfo.km}">
                        <img src="assets/images/${cardInfo.animal}" class="animal" alt="${cardInfo.animal}">
                    </div>
                `;
                slot.style.opacity = '1';
            } else {
                // Slot vide
                slot.innerHTML = '';
                slot.style.opacity = '0';
            }
        });
    }

    /* ========================================
       TAB BAR MANAGEMENT
       ======================================== */
    
    /**
     * Met à jour la barre de navigation des joueurs
     */
    function updateTabBar() {
        const tabBarList = document.getElementById('tab-bar-list');
        if (!tabBarList) return;
        
        tabBarList.innerHTML = '';
        
        for (let i = 0; i < gameState.playerCount; i++) {
            const player = gameState.players[i];
            const isActive = i === gameState.currentPlayerIndex;
            
            const tabItem = createTabBarItem(player, isActive);
            tabBarList.appendChild(tabItem);
        }
    }

    /**
     * Crée un élément de la barre de navigation
     * @param {Object} player - Données du joueur
     * @param {boolean} isActive - Est-ce le joueur actuel
     * @returns {HTMLElement} Élément li de la navigation
     */
    function createTabBarItem(player, isActive) {
        const percent = Math.min(player.score / CONFIG.WIN_SCORE, 1);
        
        const { svg, circleClass, labelClass } = getTabBarStyles(percent, isActive);
        
        const li = document.createElement('li');
        li.className = 'tab-bar-item' + (isActive ? ' active' : '');
        li.innerHTML = `
            <div class="${circleClass}">
                ${svg}
            </div>
            <span class="${labelClass}">${player.name}</span>
        `;
        
        return li;
    }

    /**
     * Génère les styles pour un élément de la barre de navigation
     * @param {number} percent - Pourcentage de progression (0-1)
     * @param {boolean} isActive - Est-ce l'élément actif
     * @returns {Object} Styles SVG et classes CSS
     */
    function getTabBarStyles(percent, isActive) {
        if (isActive) {
            const dasharray = 44;
            const dashoffset = 44 - Math.round(44 * percent);
            return {
                svg: `<svg width="18" height="18" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="7" stroke="#000" stroke-width="3" fill="none" />
                    <circle class="progress" cx="8" cy="8" r="7" stroke="#07a240" stroke-width="1.5" 
                            fill="none" stroke-dasharray="44" stroke-dashoffset="${dashoffset}" />
                </svg>`,
                circleClass: 'progress-circle active',
                labelClass: 'tab-bar-label active'
            };
        } else {
            const dasharray = 25;
            const dashoffset = 25 - Math.round(25 * percent);
            return {
                svg: `<svg width="18" height="18" viewBox="0 0 10 10">
                    <circle cx="5" cy="5" r="4" stroke="#000" stroke-width="2" fill="none" />
                    <circle class="progress" cx="5" cy="5" r="4" stroke="#72C4FE" stroke-width="1" 
                            fill="none" stroke-dasharray="25" stroke-dashoffset="${dashoffset}" />
                </svg>`,
                circleClass: 'progress-circle',
                labelClass: 'tab-bar-label'
            };
        }
    }

    /* ========================================
       NAVIGATION MANAGEMENT
       ======================================== */
    
    /**
     * Change le joueur actuel
     * @param {number} newIndex - Index du nouveau joueur
     */
    function changePlayer(newIndex) {
        if (newIndex === gameState.currentPlayerIndex || gameState.isAnimating) return;
        
        // Gestion des boucles
        if (newIndex < 0) {
            newIndex = gameState.playerCount - 1;
        } else if (newIndex >= gameState.playerCount) {
            newIndex = 0;
        }
        
        // Animation
        gameState.isAnimating = true;
        const gameContainers = document.querySelector('.game-containers');
        if (gameContainers) {
            gameContainers.classList.add('animating');
        }
        
        gameState.currentPlayerIndex = newIndex;
        updateUI();
        
        // Fin d'animation
        setTimeout(() => {
            if (gameContainers) {
                gameContainers.classList.remove('animating');
            }
            gameState.isAnimating = false;
            resetSwipeValues();
        }, CONFIG.ANIMATION_DURATION);
    }

    /* ========================================
       SWIPE FUNCTIONALITY
       ======================================== */
    
    /**
     * Ajoute les écouteurs d'événements pour le swipe
     */
    function addSwipeListeners() {
        const gameContainers = document.getElementById('game-containers');
        if (!gameContainers) return;

        // Touch events
        gameContainers.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameContainers.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainers.addEventListener('touchend', handleTouchEnd, { passive: true });
        gameContainers.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        // Mouse events
        addMouseSwipeListeners(gameContainers);
    }

    /**
     * Ajoute les écouteurs de souris pour le swipe
     * @param {HTMLElement} gameContainers - Élément conteneur
     */
    function addMouseSwipeListeners(gameContainers) {
        let mouseDown = false;
        let lastMouseAction = 0;

        gameContainers.addEventListener('mousedown', (e) => {
            const now = Date.now();
            if (now - lastMouseAction < CONFIG.DEBOUNCE_TIME) return;

            if (gameState.isAnimating || swipeState.isInProgress) return;

            lastMouseAction = now;
            mouseDown = true;
            swipeState.startTarget = e.target;
            initializeSwipe(e.clientX, e.clientY, now);
        });

        gameContainers.addEventListener('mousemove', (e) => {
            if (!mouseDown || !swipeState.isInProgress || gameState.isAnimating) return;
            updateSwipePosition(e.clientX, e.clientY);
        });

        gameContainers.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;

            const targetChanged = swipeState.startTarget !== e.target;
            const hasSignificantMovement = Math.abs(swipeState.endX - swipeState.startX) > 15 || 
                                         Math.abs(swipeState.endY - swipeState.startY) > 15;

            if (swipeState.isInProgress && !gameState.isAnimating && (targetChanged || hasSignificantMovement)) {
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

    /**
     * Initialise les valeurs de swipe
     * @param {number} x - Position X de départ
     * @param {number} y - Position Y de départ
     * @param {number} time - Timestamp de départ
     */
    function initializeSwipe(x, y, time) {
        swipeState.startX = x;
        swipeState.startY = y;
        swipeState.endX = x;
        swipeState.endY = y;
        swipeState.startTime = time;
        swipeState.isInProgress = true;
    }

    /**
     * Met à jour la position du swipe
     * @param {number} x - Position X actuelle
     * @param {number} y - Position Y actuelle
     */
    function updateSwipePosition(x, y) {
        swipeState.endX = x;
        swipeState.endY = y;
    }

    /**
     * Gère le début du touch
     * @param {TouchEvent} e - Événement touch
     */
    function handleTouchStart(e) {
        if (gameState.isAnimating || swipeState.isInProgress) return;
        if (e.touches.length > 1) {
            resetSwipeValues();
            return;
        }

        const touch = e.touches[0];
        initializeSwipe(touch.clientX, touch.clientY, Date.now());
    }
    
    /**
     * Gère le mouvement du touch
     * @param {TouchEvent} e - Événement touch
     */
    function handleTouchMove(e) {
        if (!swipeState.isInProgress || gameState.isAnimating || e.touches.length > 1) {
            resetSwipeValues();
            return;
        }
        
        const touch = e.touches[0];
        updateSwipePosition(touch.clientX, touch.clientY);
        
        const deltaX = Math.abs(swipeState.endX - swipeState.startX);
        const deltaY = Math.abs(swipeState.endY - swipeState.startY);
        
        // Prévenir le scroll pour les swipes horizontaux
        if (deltaX > deltaY && deltaX > 15) {
            e.preventDefault();
        }
        
        // Annuler si mouvement vertical trop important
        if (deltaY > 50 && deltaY > deltaX * 1.5) {
            resetSwipeValues();
        }
    }
    
    /**
     * Gère la fin du touch
     * @param {TouchEvent} e - Événement touch
     */
    function handleTouchEnd(e) {
        if (!swipeState.isInProgress) return;
        
        if (gameState.isAnimating) {
            resetSwipeValues();
            return;
        }
        
        handleSwipeEnd();
    }
    
    /**
     * Traite la fin du swipe et détermine l'action
     */
    function handleSwipeEnd() {
        if (!swipeState.isInProgress || gameState.isAnimating) {
            resetSwipeValues();
            return;
        }

        const deltaX = swipeState.endX - swipeState.startX;
        const deltaY = swipeState.endY - swipeState.startY;
        const swipeTime = Date.now() - swipeState.startTime;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Validation du swipe
        const isValidSwipe = validateSwipe(absX, absY, swipeTime);
        
        if (isValidSwipe && gameState.playerCount > 1) {
            handleValidSwipe(deltaX);
        }

        resetSwipeValues();
    }

    /**
     * Valide si le geste est un swipe valide
     * @param {number} absX - Distance absolue X
     * @param {number} absY - Distance absolue Y
     * @param {number} swipeTime - Durée du swipe
     * @returns {boolean} True si le swipe est valide
     */
    function validateSwipe(absX, absY, swipeTime) {
        const isHorizontal = absX > absY * 1.2;
        const isValidDistance = absX >= CONFIG.SWIPE_MIN_DISTANCE;
        const isValidTime = swipeTime <= CONFIG.SWIPE_MAX_TIME;
        const isValidVelocity = (absX / swipeTime) > 0.08;
        
        return isHorizontal && isValidDistance && isValidTime && isValidVelocity;
    }

    /**
     * Traite un swipe valide
     * @param {number} deltaX - Différence en X
     */
    function handleValidSwipe(deltaX) {
        // Debouncing des swipes rapides
        const now = Date.now();
        if (now - (window.lastSwipeTime || 0) < 500) return;
        window.lastSwipeTime = now;

        if (deltaX > 0) {
            // Swipe vers la droite = joueur précédent
            changePlayer(gameState.currentPlayerIndex - 1);
        } else {
            // Swipe vers la gauche = joueur suivant
            changePlayer(gameState.currentPlayerIndex + 1);
        }
    }
    
    /**
     * Remet à zéro les valeurs de swipe
     */
    function resetSwipeValues() {
        swipeState.startX = 0;
        swipeState.startY = 0;
        swipeState.endX = 0;
        swipeState.endY = 0;
        swipeState.startTime = 0;
        swipeState.isInProgress = false;
        swipeState.startTarget = null;
    }

    /* ========================================
       EVENT LISTENERS
       ======================================== */
    
    /**
     * Ajoute les écouteurs d'événements principaux
     */
    function addEventListeners() {
        const gameContainers = document.getElementById('game-containers');
        if (!gameContainers) return;
        
        addClickListeners(gameContainers);
        addAnimationProtection(gameContainers);
    }

    /**
     * Ajoute les écouteurs de clic
     * @param {HTMLElement} gameContainers - Conteneur principal
     */
    function addClickListeners(gameContainers) {
        let lastClickTime = 0;
        let isProcessingClick = false;
        
        gameContainers.addEventListener('click', (e) => {
            // Debouncing des clics
            const now = Date.now();
            if (now - lastClickTime < CONFIG.DEBOUNCE_TIME || isProcessingClick || gameState.isAnimating) {
                return;
            }

            lastClickTime = now;
            isProcessingClick = true;

            // Timeout de sécurité
            setTimeout(() => { isProcessingClick = false; }, 200);

            // Gestion des différents types de clics
            if (handleButtonClick(e)) {
                isProcessingClick = false;
                return;
            }

            if (handleCardClick(e)) {
                isProcessingClick = false;
                return;
            }

            isProcessingClick = false;
        });
    }

    /**
     * Gère les clics sur les boutons +/-
     * @param {Event} e - Événement de clic
     * @returns {boolean} True si un bouton a été cliqué
     */
    function handleButtonClick(e) {
        const button = e.target.closest('.card-row-btn');
        if (!button || button.disabled) return false;

        const km = parseInt(button.dataset.km);
        const playerIndex = parseInt(button.dataset.player);

        // Vérifier que c'est le joueur actuel
        if (playerIndex !== gameState.currentPlayerIndex) return false;

        if (button.classList.contains('add')) {
            addCard(km);
        } else {
            removeCard(km);
        }

        return true;
    }

    /**
     * Gère les clics sur les cartes et conteneurs
     * @param {Event} e - Événement de clic
     * @returns {boolean} True si un élément de carte a été cliqué
     */
    function handleCardClick(e) {
        const card = e.target.closest('.card');
        const placeholder = e.target.closest('.card-placeholder');
        const cardsContainer = e.target.closest('.cards-container');
        const cardSlot = e.target.closest('.card-slot');

        if (!card && !placeholder && !cardsContainer && !cardSlot) return false;

        const cardRow = e.target.closest('.card-row');
        if (!cardRow) return false;

        const addButton = cardRow.querySelector('.card-row-btn.add');
        if (!addButton || addButton.disabled) return false;

        const km = parseInt(addButton.dataset.km);
        const playerIndex = parseInt(addButton.dataset.player);

        // Vérifier que c'est le joueur actuel
        if (playerIndex !== gameState.currentPlayerIndex) return false;

        addCard(km);
        return true;
    }

    /**
     * Ajoute la protection contre les événements pendant les animations
     * @param {HTMLElement} gameContainers - Conteneur principal
     */
    function addAnimationProtection(gameContainers) {
        gameContainers.addEventListener('touchstart', (e) => {
            if (gameState.isAnimating) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        gameContainers.addEventListener('mousedown', (e) => {
            if (gameState.isAnimating && e.target.closest('.card-row-btn, .card, .card-placeholder')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    /**
     * Ajoute les écouteurs pour la barre de navigation et les modaux
     */
    function addTabBarEventListeners() {
        addTabBarClickListener();
        addPlayerDropdownListeners();
        addResetButtonListener();
        addModalListeners();
        addKeyboardListeners();
        addSwipeListeners();
    }

    /**
     * Ajoute l'écouteur de clic sur la barre de navigation
     */
    function addTabBarClickListener() {
        const tabBarList = document.getElementById('tab-bar-list');
        if (!tabBarList) return;

        tabBarList.addEventListener('click', (e) => {
            const li = e.target.closest('.tab-bar-item');
            if (!li) return;
            
            const index = Array.from(tabBarList.children).indexOf(li);
            if (index !== -1 && index < gameState.playerCount) {
                changePlayer(index);
            }
        });
    }

    /**
     * Ajoute les écouteurs pour le dropdown des joueurs
     */
    function addPlayerDropdownListeners() {
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
    }

    /**
     * Ferme le dropdown des joueurs
     */
    function closeDropdown() {
        const dropdown = document.getElementById('player-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    }

    /**
     * Ajoute l'écouteur pour le bouton de reset
     */
    function addResetButtonListener() {
        const resetButton = document.getElementById('reset-btn');
        if (resetButton) {
            resetButton.addEventListener('click', showResetModal);
        }
    }

    /**
     * Ajoute les écouteurs pour les modaux
     */
    function addModalListeners() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    closeModal();
                }
            });
        }
    }

    /**
     * Ajoute les écouteurs pour le clavier
     */
    function addKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
            
            // Navigation avec les flèches
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                changePlayer(gameState.currentPlayerIndex - 1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                changePlayer(gameState.currentPlayerIndex + 1);
            }
        });
    }

    /* ========================================
       MODAL MANAGEMENT
       ======================================== */
    
    /**
     * Affiche le modal de confirmation de reset
     */
    function showResetModal() {
        const modalContent = document.getElementById('modal-content');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h3>Réinitialiser le jeu</h3>
            <p>Êtes-vous sûr de vouloir remettre à zéro tous les scores ?</p>
            <div class="modal-buttons">
                <button id="cancel-reset" class="modal-btn secondary">Annuler</button>
                <button id="confirm-reset" class="modal-btn primary alert">Réinitialiser</button>
            </div>
        `;
        
        // Ajouter les écouteurs
        modalContent.querySelector('#cancel-reset').addEventListener('click', closeModal);
        modalContent.querySelector('#confirm-reset').addEventListener('click', () => {
            resetGame();
            closeModal();
        });
        
        showModal();
    }

    /**
     * Affiche le modal des noms de joueurs
     */
    function showPlayerNameModal() {
        const modalContent = document.getElementById('modal-content');
        if (!modalContent) return;
        
        modalContent.innerHTML = generatePlayerNameModalHTML();
        
        // Ajouter les écouteurs
        modalContent.querySelector('#save-names-btn').addEventListener('click', savePlayerNames);
        modalContent.querySelector('#reset-names-btn').addEventListener('click', resetPlayerNames);
        
        // Configurer les inputs
        setupPlayerNameInputs(modalContent);
        
        // Focus sur le premier input
        const firstInput = modalContent.querySelector('#player-name-0');
        if (firstInput) firstInput.focus();
        
        showModal();
    }

    /**
     * Génère le HTML pour le modal des noms
     * @returns {string} HTML du modal
     */
    function generatePlayerNameModalHTML() {
        const playerInputs = Array.from({ length: gameState.playerCount }, (_, i) => 
            `<input type="text" id="player-name-${i}" placeholder="Joueur ${i + 1}" value="${gameState.players[i].name}">`
        ).join('');

        return `
            <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span>Noms des joueurs</span>
                <button id="reset-names-btn" class="modal-btn secondary alert" title="Réinitialiser les noms">Reset</button>
            </h3>
            <div class="player-name-inputs">
                ${playerInputs}
            </div>
            <div class="modal-buttons">
                <button id="save-names-btn" class="modal-btn primary">OK</button>
            </div>
        `;
    }

    /**
     * Configure les inputs des noms de joueurs
     * @param {HTMLElement} modalContent - Contenu du modal
     */
    function setupPlayerNameInputs(modalContent) {
        for (let i = 0; i < gameState.playerCount; i++) {
            const input = modalContent.querySelector(`#player-name-${i}`);
            if (!input) continue;

            const defaultValue = `Joueur ${i + 1}`;
            
            // Style initial
            if (input.value === defaultValue) {
                input.style.color = '#999';
            }

            // Fonctions de gestion
            const clearIfDefault = () => {
                if (input.value === defaultValue) {
                    input.value = '';
                    input.style.color = '';
                }
            };
            
            const restoreIfEmpty = () => {
                if (input.value.trim() === '') {
                    input.value = defaultValue;
                    input.style.color = '#999';
                } else {
                    input.style.color = '';
                }
            };

            // Événements
            input.addEventListener('focus', clearIfDefault);
            input.addEventListener('click', clearIfDefault);
            input.addEventListener('blur', restoreIfEmpty);
            
            input.addEventListener('keydown', (e) => {
                if (input.value === defaultValue) {
                    setTimeout(() => {
                        if (input.value !== defaultValue) {
                            input.style.color = '';
                        }
                    }, 0);
                }
            });
        }
    }

    /**
     * Sauvegarde les noms des joueurs
     */
    function savePlayerNames() {
        for (let i = 0; i < gameState.playerCount; i++) {
            const input = document.getElementById(`player-name-${i}`);
            if (!input) continue;

            const value = input.value.trim();
            const defaultValue = `Joueur ${i + 1}`;
            
            gameState.players[i].name = value && value !== defaultValue ? value : defaultValue;
        }
        
        updateTabBar();
        saveSettings();
        closeModal();
    }
    
    /**
     * Remet les noms par défaut
     */
    function resetPlayerNames() {
        for (let i = 0; i < gameState.playerCount; i++) {
            const input = document.getElementById(`player-name-${i}`);
            if (input) {
                input.value = `Joueur ${i + 1}`;
                input.style.color = '#999';
                gameState.players[i].name = `Joueur ${i + 1}`;
            }
        }
    }

    /**
     * Affiche le modal
     */
    function showModal() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.style.display = 'flex';
        }
    }
    
    /**
     * Ferme le modal
     */
    function closeModal() {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.style.display = 'none';
        }
    }

    /* ========================================
       INITIALIZATION & SETUP
       ======================================== */
    
    /**
     * Initialise l'interface du jeu
     */
    function initializeGameInterface() {
        const gameContainers = document.getElementById('game-containers');
        if (!gameContainers) return;

        gameContainers.innerHTML = '';
        
        // Créer un container pour chaque joueur
        for (let playerIndex = 0; playerIndex < CONFIG.MAX_PLAYERS; playerIndex++) {
            const containerDiv = createPlayerContainer(playerIndex);
            gameContainers.appendChild(containerDiv);
        }
    }

    /**
     * Crée le conteneur d'un joueur
     * @param {number} playerIndex - Index du joueur
     * @returns {HTMLElement} Conteneur du joueur
     */
    function createPlayerContainer(playerIndex) {
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
                    ${generateCardRows(playerIndex)}
                </div>
            </main>
        `;
        
        return containerDiv;
    }

    /**
     * Génère le HTML des rangées de cartes
     * @param {number} playerIndex - Index du joueur
     * @returns {string} HTML des rangées
     */
    function generateCardRows(playerIndex) {
        return CARD_DATA.map(card => {
            const visiblePlaceholders = card.max || 10;
            const totalSlots = 10;
            
            return `
                <div class="card-row" data-card-type="${card.km}">
                    <div class="controls-left">
                        <button class="card-row-btn" data-km="${card.km}" data-player="${playerIndex}" disabled>-</button>
                    </div>
                    <div class="card-track">
                        <div class="placeholders-container">
                            ${generatePlaceholders(card, visiblePlaceholders, totalSlots)}
                        </div>
                        <div class="cards-container">
                            ${generateCardSlots(totalSlots)}
                        </div>
                    </div>
                    <div class="controls">
                        <span class="count">0</span>
                        <button class="card-row-btn add" data-km="${card.km}" data-player="${playerIndex}">+</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Génère les placeholders pour une rangée
     * @param {Object} card - Données de la carte
     * @param {number} visiblePlaceholders - Nombre de placeholders visibles
     * @param {number} totalSlots - Nombre total de slots
     * @returns {string} HTML des placeholders
     */
    function generatePlaceholders(card, visiblePlaceholders, totalSlots) {
        return Array(totalSlots).fill().map((_, i) => 
            `<div class="card-placeholder" ${i >= visiblePlaceholders ? 'style="visibility: hidden;"' : ''}>
                <img class="km-bg" src="assets/distance/distance-${card.km}.svg" alt="${card.km} km">
            </div>`
        ).join('');
    }

    /**
     * Génère les slots de cartes
     * @param {number} totalSlots - Nombre total de slots
     * @returns {string} HTML des slots
     */
    function generateCardSlots(totalSlots) {
        return Array(totalSlots).fill().map((_, i) => 
            `<div class="card-slot" data-slot="${i}"></div>`
        ).join('');
    }

    /* ========================================
       SETTINGS MANAGEMENT
       ======================================== */
    
    /**
     * Sauvegarde les paramètres dans le localStorage
     */
    function saveSettings() {
        const settings = {
            playerCount: gameState.playerCount,
            playerNames: gameState.players.slice(0, gameState.playerCount).map(p => p.name)
        };
        localStorage.setItem('mbornes-settings', JSON.stringify(settings));
    }
    
    /**
     * Charge les paramètres depuis le localStorage
     */
    function loadSettings() {
        try {
            const settingsJson = localStorage.getItem('mbornes-settings');
            if (!settingsJson) return;

            const settings = JSON.parse(settingsJson);
            if (!settings || !settings.playerCount) return;

            gameState.playerCount = settings.playerCount;
            
            if (settings.playerNames) {
                for (let i = 0; i < Math.min(gameState.playerCount, gameState.players.length); i++) {
                    if (gameState.players[i]) {
                        gameState.players[i].name = settings.playerNames[i] || `Joueur ${i + 1}`;
                    }
                }
            }
        } catch (e) {
            console.warn('Erreur lors du chargement des settings:', e);
        }
    }

    /**
     * Met à jour l'interface avec les paramètres chargés
     */
    function updateUIWithSettings() {
        const playerCountText = document.getElementById('player-count-text');
        if (playerCountText) {
            playerCountText.textContent = `${gameState.playerCount} joueur${gameState.playerCount > 1 ? 's' : ''}`;
        }
        
        togglePlayerNavigation(gameState.playerCount > 1);
    }

    /**
     * Charge la bibliothèque de confettis si nécessaire
     */
    function loadConfettiLibrary() {
        if (!window.confetti) {
            const confettiScript = document.createElement('script');
            confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            confettiScript.async = true;
            document.head.appendChild(confettiScript);
        }
    }

    /* ========================================
       INITIALIZATION & START
       ======================================== */
    
    /**
     * Point d'entrée principal de l'application
     */
    function initializeApp() {
        // Initialisation des données
        initializePlayers();
        initializeGameInterface();
        
        // Chargement des paramètres
        loadSettings();
        
        // Configuration des événements
        addEventListeners();
        addTabBarEventListeners();
        
        // Mise à jour de l'interface
        updateUI();
        updateTabBar();
        updateUIWithSettings();
        
        // Chargement des dépendances
        loadConfettiLibrary();
    }

    // Démarrage de l'application
    initializeApp();
});

/* ========================================
   PWA SERVICE WORKER REGISTRATION
   ======================================== */

/**
 * Enregistre le service worker pour la fonctionnalité PWA
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
                
                // Vérification des mises à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] Nouvelle version disponible!');
                            
                            if (confirm('Une nouvelle version de l\'application est disponible. Voulez-vous la charger ?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
            });
    });

    // Rechargement automatique lors du changement de service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}