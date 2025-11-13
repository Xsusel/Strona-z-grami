const socket = io(window.location.host);

// --- Elementy DOM ---
const mainMenuContainer = document.getElementById('main-menu-container');
const nicknameForm = document.getElementById('nickname-form');
const nicknameInput = document.getElementById('nickname-input');
const menuButtons = document.getElementById('menu-buttons');
const createGameButton = document.getElementById('create-game-button');

const inviteLinkContainer = document.getElementById('invite-link-container');
const inviteLinkInput = document.getElementById('invite-link-input');
const startGameButton = document.getElementById('start-game-button');

const gameContainer = document.getElementById('game-container');
const monopolyBoard = document.getElementById('monopoly-board');
const playerPanel = document.getElementById('player-panel');

// --- Stan gry ---
let nickname = '';
let roomId = '';
let myPlayerId = '';
let gameState = null;
const playerColors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00'];

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalButtons = document.getElementById('modal-buttons');

// --- Dźwięki ---
const sounds = {
    diceRoll: new Audio('/sounds/dice-roll.mp3'),
    buyProperty: new Audio('/sounds/buy-property.mp3'),
    passGo: new Audio('/sounds/pass-go.mp3'),
    cardDraw: new Audio('/sounds/card-draw.mp3'),
    playerMove: new Audio('/sounds/player-move.mp3'),
    payRent: new Audio('/sounds/pay-rent.mp3'),
};

function playSound(sound) {
    if (sound && typeof sound.play === 'function') {
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Błąd odtwarzania dźwięku:", e));
    }
}


function showContainer(containerId) {
    const containers = ['main-menu-container', 'invite-link-container', 'game-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (id === containerId) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}


// --- Logika menu ---
nicknameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    nickname = nicknameInput.value;
    if (nickname) {
        socket.emit('set-nickname', nickname);
        nicknameForm.style.display = 'none';
        menuButtons.style.display = 'block';
    }
});

createGameButton.addEventListener('click', () => {
    socket.emit('create-room');
});

socket.on('room-created', (newRoomId) => {
    roomId = newRoomId;
    myPlayerId = socket.id;
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    inviteLinkInput.value = inviteLink;
    showContainer('invite-link-container');
    history.pushState(null, '', `/room/${roomId}`);
    socket.emit('join-room', roomId);
});

const pathRoomId = window.location.pathname.split('/').pop();
if (pathRoomId && pathRoomId.length > 1) {
    roomId = pathRoomId;
    showContainer('main-menu-container');
}

socket.on('nickname-set', () => {
    if (roomId) {
        socket.emit('join-room', roomId);
    }
});

socket.on('room-joined', (joinedRoomId, room) => {
    if (window.location.pathname.includes(joinedRoomId)) {
        myPlayerId = socket.id;
        showContainer('invite-link-container');
        updateLobbyPlayers(room.players);
    }
});


socket.on('update-players', (players) => {
    updateLobbyPlayers(players);
});


function updateLobbyPlayers(players) {
    console.log("Gracze w lobby:", players);
}


startGameButton.addEventListener('click', () => {
    socket.emit('start-game', roomId);
});


// --- Logika gry ---
socket.on('game-started', (newGameState) => {
    gameState = newGameState;
    showContainer('game-container');
    renderBoard();
    updatePlayerPanel();
});

socket.on('game-state-update', async (newGameState) => {
    const oldGameState = gameState;
    const oldPlayers = oldGameState ? { ...oldGameState.players } : null;
    gameState = newGameState;

    // Check for pass Go
    const myPlayer = gameState.players[myPlayerId];
    const oldPlayer = oldGameState ? oldGameState.players[myPlayerId] : null;
    if (oldPlayer && myPlayer.position < oldPlayer.position) {
        playSound(sounds.passGo);
    }

    updatePlayerPanel();
    await animatePawnMoves(oldPlayers, gameState.players);
    renderBoard();
    updateGameLog();
});

socket.on('dice-rolled', async (data) => {
    await showDiceAnimation(data.dice, data.nickname);
});

function showDiceAnimation(dice, nickname) {
    return new Promise(resolve => {
        const diceContainer = document.createElement('div');
        diceContainer.id = 'dice-animation-container';

        const diceWrapper = document.createElement('div');
        diceWrapper.className = 'dice-wrapper';

        const nicknameDiv = document.createElement('div');
        nicknameDiv.className = 'dice-nickname';
        nicknameDiv.textContent = `${nickname} rolls...`;
        diceWrapper.appendChild(nicknameDiv);

        const diceInner = document.createElement('div');
        diceInner.className = 'dice-inner';

        const die1 = document.createElement('div');
        die1.className = 'die';
        die1.textContent = dice[0];
        diceInner.appendChild(die1);

        const die2 = document.createElement('div');
        die2.className = 'die';
        die2.textContent = dice[1];
        diceInner.appendChild(die2);

        diceWrapper.appendChild(diceInner);
        diceContainer.appendChild(diceWrapper);
        document.body.appendChild(diceContainer);

        setTimeout(() => {
            document.body.removeChild(diceContainer);
            resolve();
        } , 2000);
    });
}

async function animatePawnMoves(oldPlayers, newPlayers) {
    if (!oldPlayers) return;

    for (const playerId in newPlayers) {
        const oldPlayer = oldPlayers[playerId];
        const newPlayer = newPlayers[playerId];

        if (oldPlayer && oldPlayer.position !== newPlayer.position) {
            let pawn = document.getElementById(`pawn-${playerId}`);
            if (!pawn) continue;

            let currentPos = oldPlayer.position;
            const targetPos = newPlayer.position;
            const isPassingGo = targetPos < currentPos;

            const pathLength = isPassingGo ? (40 - currentPos) + targetPos : targetPos - currentPos;

            for (let i = 0; i < pathLength; i++) {
                playSound(sounds.playerMove);
                currentPos = (currentPos + 1) % 40;
                const tileElement = document.querySelector(`.space[data-position="${currentPos}"]`);
                if (tileElement) {
                    const rect = tileElement.getBoundingClientRect();
                    pawn.style.top = `${rect.top}px`;
                    pawn.style.left = `${rect.left}px`;
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }
    }
}

function updateGameLog() {
    const gameLog = document.getElementById('game-log');
    gameLog.innerHTML = '';
    gameState.log.forEach(message => {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        gameLog.appendChild(logEntry);
    });
    gameLog.scrollTop = gameLog.scrollHeight;
}

// In the 'roll-dice' button onclick handler:
// playSound(sounds.diceRoll);

// In the 'buy-property' callback:
// playSound(sounds.buyProperty);

const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value) {
        socket.emit('send-chat-message', roomId, chatInput.value);
        addChatMessage({ message: chatInput.value, nickname: 'Ty' });
        chatInput.value = '';
    }
});

socket.on('chat-message', (data) => {
    addChatMessage(data);
});

function addChatMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.nickname}: ${data.message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('offer-purchase', (data) => {
    showModal('Oferta zakupu', `Czy chcesz kupić ${data.tileName} za $${data.price}?`, [
        { text: 'Kup', callback: () => {
            playSound(sounds.buyProperty);
            socket.emit('game-action', 'buy-property', { roomId });
        } },
        { text: 'Ignoruj', callback: () => {} }
    ]);
});

socket.on('card-drawn', (data) => {
    playSound(sounds.cardDraw);
    showModal('Wylosowano kartę', data.cardText, [{ text: 'OK', callback: () => {} }]);
});

socket.on('rent-paid', () => {
    playSound(sounds.payRent);
});

socket.on('notification', (data) => {
    showNotification(data.text);
});

function showNotification(text) {
    const notificationBar = document.getElementById('notification-bar');
    notificationBar.textContent = text;
    notificationBar.classList.add('show');
    setTimeout(() => {
        notificationBar.classList.remove('show');
    }, 3000);
}

socket.on('auction-started', (data) => {
    showAuctionModal(data.tileName);
});

socket.on('auction-update', (data) => {
    const bidInfo = document.getElementById('auction-bid-info');
    bidInfo.textContent = `Najwyższa oferta: $${data.bid} (${data.bidder})`;
});


function showAuctionModal(tileName) {
    const content = `
        <p>Licytacja o: <strong>${tileName}</strong></p>
        <div id="auction-bid-info">Aktualna oferta: $0</div>
        <input type="number" id="bid-input" placeholder="Twoja oferta">
        <button id="place-bid-button">Licytuj</button>
    `;
    showModal('Aukcja', content, []);
    document.getElementById('place-bid-button').onclick = () => {
        const bid = parseInt(document.getElementById('bid-input').value);
        socket.emit('game-action', 'place-bid', { roomId, bid });
    };
}


function showModal(title, text, buttons) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalButtons.innerHTML = '';
    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.onclick = () => {
            hideModal();
            btnInfo.callback();
        };
        modalButtons.appendChild(button);
    });
    modal.style.display = 'flex';
}

function hideModal() {
    modal.style.display = 'none';
}


function updatePlayerPanel() {
    playerPanel.innerHTML = '<h3>Gracze</h3>';
    const playerIds = Object.keys(gameState.players);
    const currentPlayerId = playerIds[gameState.currentPlayerIndex];

    const playersContainer = document.createElement('div');
    playersContainer.classList.add('players-container');

    playerIds.forEach((id, index) => {
        const player = gameState.players[id];
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-info');
        if (id === currentPlayerId) {
            playerDiv.classList.add('active-player');
        }

        playerDiv.style.borderColor = playerColors[index];

        const playerName = document.createElement('div');
        playerName.classList.add('player-name');
        playerName.textContent = player.nickname;
        playerDiv.appendChild(playerName);

        const playerMoney = document.createElement('div');
        playerMoney.classList.add('player-money');
        playerMoney.textContent = `$${player.money}`;
        playerDiv.appendChild(playerMoney);

        const propertiesDiv = document.createElement('div');
        propertiesDiv.classList.add('properties-list');

        const groupedProperties = {};
        player.properties.forEach(propIndex => {
            const prop = boardLayout[propIndex];
            if (!groupedProperties[prop.color]) {
                groupedProperties[prop.color] = [];
            }
            groupedProperties[prop.color].push(propIndex);
        });

        for (const color in groupedProperties) {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('property-group');
            groupDiv.style.borderColor = color;

            const groupHeader = document.createElement('div');
            groupHeader.classList.add('property-group-header');
            groupHeader.style.backgroundColor = color;
            groupHeader.textContent = color;
            groupDiv.appendChild(groupHeader);

            groupedProperties[color].forEach(propIndex => {
                const prop = boardLayout[propIndex];
                const propState = gameState.boardState[propIndex];
                const propEl = document.createElement('div');
                propEl.classList.add('property-item');

                let houseText = '';
                if (propState.houses > 0) {
                    houseText = ` (${propState.houses} 🏠)`;
                }
                if (propState.houses === 5) {
                    houseText = ' (🏨)';
                }

                propEl.textContent = prop.name + houseText;

                if (id === myPlayerId) {
                    if (propState.mortgaged) {
                        const unmortgageButton = document.createElement('button');
                        unmortgageButton.textContent = 'Odkup';
                        unmortgageButton.onclick = () => {
                            socket.emit('game-action', 'unmortgage-property', { roomId, tilePosition: propIndex });
                        };
                        propEl.appendChild(unmortgageButton);
                    } else {
                        const mortgageButton = document.createElement('button');
                        mortgageButton.textContent = 'Zastaw';
                        mortgageButton.onclick = () => {
                            socket.emit('game-action', 'mortgage-property', { roomId, tilePosition: propIndex });
                        };
                        propEl.appendChild(mortgageButton);
                    }

                    const colorGroup = boardLayout.filter(t => t.color === prop.color);
                    const hasMonopoly = colorGroup.every(t => {
                        const tIndex = boardLayout.indexOf(t);
                        return gameState.boardState[tIndex].owner === id;
                    });

                    if (hasMonopoly) {
                        const buyHouseButton = document.createElement('button');
                        buyHouseButton.textContent = 'Kup dom';
                        buyHouseButton.onclick = () => {
                            socket.emit('game-action', 'build-house', { roomId, tilePosition: propIndex });
                        };
                        propEl.appendChild(buyHouseButton);
                    }
                }

                groupDiv.appendChild(propEl);
            });
            propertiesDiv.appendChild(groupDiv);
        }

        playerDiv.appendChild(propertiesDiv);
        playersContainer.appendChild(playerDiv);
    });

    playerPanel.appendChild(playersContainer);

    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');

    if (myPlayerId === currentPlayerId) {
        const rollButton = document.createElement('button');
        rollButton.textContent = 'Rzuć kostką';
        rollButton.onclick = () => {
            playSound(sounds.diceRoll);
            socket.emit('game-action', 'roll-dice', { roomId });
        };
        actionButtons.appendChild(rollButton);
    }

    const tradeButton = document.createElement('button');
    tradeButton.textContent = 'Zaproponuj wymianę';
    tradeButton.onclick = showTradeModal;
    actionButtons.appendChild(tradeButton);

    playerPanel.appendChild(actionButtons);
}

socket.on('trade-offer', (data) => {
    const { fromNickname, offer } = data;
    const offerText = `
        ${fromNickname} proponuje wymianę:
        Ty dajesz: ${offer.propertiesFrom2.map(p => boardLayout[p].name).join(', ')} i $${offer.moneyFrom2}
        Otrzymujesz: ${offer.propertiesFrom1.map(p => boardLayout[p].name).join(', ')} i $${offer.moneyFrom1}
    `;
    showModal('Oferta wymiany', offerText, [
        { text: 'Akceptuj', callback: () => socket.emit('game-action', 'accept-trade', { roomId, fromId: data.fromId, offer }) },
        { text: 'Odrzuć', callback: () => socket.emit('game-action', 'decline-trade', { roomId, fromId: data.fromId }) }
    ]);
});

function showTradeModal() {
    const tradeModalContent = document.createElement('div');
    tradeModalContent.className = 'trade-modal-content';

    const playerSelectContainer = document.createElement('div');
    playerSelectContainer.className = 'trade-player-select';

    const playerSelectLabel = document.createElement('label');
    playerSelectLabel.textContent = 'Wymień się z: ';
    playerSelectContainer.appendChild(playerSelectLabel);

    const playerSelect = document.createElement('select');
    const otherPlayers = Object.keys(gameState.players).filter(id => id !== myPlayerId);
    otherPlayers.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = gameState.players[id].nickname;
        playerSelect.appendChild(option);
    });
    playerSelectContainer.appendChild(playerSelect);
    tradeModalContent.appendChild(playerSelectContainer);

    const tradeGrid = document.createElement('div');
    tradeGrid.className = 'trade-grid';

    const myOfferContainer = document.createElement('div');
    myOfferContainer.className = 'trade-offer-container';
    myOfferContainer.innerHTML = '<h4>Ty Dajesz</h4>';

    const theirOfferContainer = document.createElement('div');
    theirOfferContainer.className = 'trade-offer-container';
    theirOfferContainer.innerHTML = '<h4>Ty Otrzymujesz</h4>';

    const myPlayer = gameState.players[myPlayerId];
    const myPropertiesContainer = document.createElement('div');
    myPropertiesContainer.className = 'trade-properties';
    myPlayer.properties.forEach(propIndex => {
        const prop = boardLayout[propIndex];
        const propLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = propIndex;
        checkbox.id = `my-prop-${propIndex}`;
        propLabel.htmlFor = checkbox.id;
        propLabel.textContent = prop.name;
        myPropertiesContainer.appendChild(checkbox);
        myPropertiesContainer.appendChild(propLabel);
    });
    myOfferContainer.appendChild(myPropertiesContainer);

    const myMoneyContainer = document.createElement('div');
    myMoneyContainer.className = 'trade-money';
    const myMoneyLabel = document.createElement('label');
    myMoneyLabel.textContent = 'Pieniądze: $';
    const myMoneyInput = document.createElement('input');
    myMoneyInput.type = 'number';
    myMoneyInput.value = 0;
    myMoneyInput.min = 0;
    myMoneyContainer.appendChild(myMoneyLabel);
    myMoneyContainer.appendChild(myMoneyInput);
    myOfferContainer.appendChild(myMoneyContainer);

    const theirPropertiesContainer = document.createElement('div');
    theirPropertiesContainer.className = 'trade-properties';

    const theirMoneyContainer = document.createElement('div');
    theirMoneyContainer.className = 'trade-money';
    const theirMoneyLabel = document.createElement('label');
    theirMoneyLabel.textContent = 'Pieniądze: $';
    const theirMoneyInput = document.createElement('input');
    theirMoneyInput.type = 'number';
    theirMoneyInput.value = 0;
    theirMoneyInput.min = 0;
    theirMoneyContainer.appendChild(theirMoneyLabel);
    theirMoneyContainer.appendChild(theirMoneyInput);

    function populateTheirProperties() {
        theirPropertiesContainer.innerHTML = '';
        const theirPlayerId = playerSelect.value;
        if (theirPlayerId) {
            const theirPlayer = gameState.players[theirPlayerId];
            theirPlayer.properties.forEach(propIndex => {
                const prop = boardLayout[propIndex];
                const propLabel = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = propIndex;
                checkbox.id = `their-prop-${propIndex}`;
                propLabel.htmlFor = checkbox.id;
                propLabel.textContent = prop.name;
                theirPropertiesContainer.appendChild(checkbox);
                theirPropertiesContainer.appendChild(propLabel);
            });
        }
    }

    populateTheirProperties();
    playerSelect.addEventListener('change', populateTheirProperties);

    theirOfferContainer.appendChild(theirPropertiesContainer);
    theirOfferContainer.appendChild(theirMoneyContainer);

    tradeGrid.appendChild(myOfferContainer);
    tradeGrid.appendChild(theirOfferContainer);
    tradeModalContent.appendChild(tradeGrid);

    const proposeButton = document.createElement('button');
    proposeButton.textContent = 'Zaproponuj';
    proposeButton.onclick = () => {
        const offer = {
            propertiesFrom1: Array.from(myPropertiesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value)),
            moneyFrom1: parseInt(myMoneyInput.value) || 0,
            propertiesFrom2: Array.from(theirPropertiesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value)),
            moneyFrom2: parseInt(theirMoneyInput.value) || 0,
        };
        socket.emit('game-action', 'propose-trade', { roomId, targetId: playerSelect.value, offer });
        hideModal();
    };

    modalTitle.textContent = 'Propozycja wymiany';
    modalText.innerHTML = '';
    modalText.appendChild(tradeModalContent);
    modalButtons.innerHTML = '';
    modalButtons.appendChild(proposeButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Anuluj';
    closeButton.onclick = hideModal;
    modalButtons.appendChild(closeButton);

    modal.style.display = 'flex';
}


const boardLayout = [
    { name: "Start", type: "corner" },
    { name: "Kondek", price: 60, color: "#a52a2a", type: "property" },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Wiejska", price: 60, color: "#a52a2a", type: "property" },
    { name: "Podatek Dochodowy", type: "tax" },
    { name: "Kolej Południowa", price: 200, type: "railroad" },
    { name: "Szewska", price: 100, color: "#87ceeb", type: "property" },
    { name: "Szansa", type: "chance" },
    { name: "Dluga", price: 100, color: "#87ceeb", type: "property" },
    { name: "Slawkowska", price: 120, color: "#87ceeb", type: "property" },
    { name: "Więzienie", type: "corner" },
    { name: "Miodowa", price: 140, color: "#da70d6", type: "property" },
    { name: "Elektrownia", price: 150, type: "utility" },
    { name: "Stradom", price: 140, color: "#da70d6", type: "property" },
    { name: "Podwale", price: 160, color: "#da70d6", type: "property" },
    { name: "Kolej Zachodnia", price: 200, type: "railroad" },
    { name: "Rynek Główny", price: 180, color: "#ffa500", type: "property" },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Plac Wszystkich Swietych", price: 180, color: "#ffa500", type: "property" },
    { name: "Bulwary", price: 200, color: "#ffa500", type: "property" },
    { name: "Bezpłatny Parking", type: "corner" },
    { name: "Karmelicka", price: 220, color: "#ff0000", type: "property" },
    { name: "Szansa", type: "chance" },
    { name: "Aleje Trzech Wieszczów", price: 220, color: "#ff0000", type: "property" },
    { name: "Plac Sikorskiego", price: 240, color: "#ff0000", type: "property" },
    { name: "Kolej Północna", price: 200, type: "railroad" },
    { name: "Ulica 1 Maja", price: 260, color: "#ffff00", type: "property" },
    { name: "Wodociągi", price: 150, type: "utility" },
    { name: "Ulica 3 Maja", price: 260, color: "#ffff00", type: "property" },
    { name: "Ulica Piłsudskiego", price: 280, color: "#ffff00", type: "property" },
    { name: "Idziesz do Więzienia", type: "corner" },
    { name: "Aleja Waszyngtona", price: 300, color: "#008000", type: "property" },
    { name: "Plac Inwalidów", price: 300, color: "#008000", type: "property" },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Ulica Focha", price: 320, color: "#008000", type: "property" },
    { name: "Kolej Wschodnia", price: 200, type: "railroad" },
    { name: "Szansa", type: "chance" },
    { name: "Ulica Reymonta", price: 350, color: "#0000ff", type: "property" },
    { name: "Podatek od Luksusu", type: "tax" },
    { name: "Aleja Mickiewicza", price: 400, color: "#0000ff", type: "property" }
];

function createTileHTML(tileData) {
    let tileHTML = '';
    if (tileData.type === 'property') {
        tileHTML = `
            <div class="space property" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="color-bar" style="background-color: ${tileData.color};"></div>
                    <div class="name">${tileData.name}</div>
                    <div class="price">Price $${tileData.price}</div>
                </div>
            </div>
        `;
    } else if (tileData.type === 'railroad') {
        tileHTML = `
            <div class="space railroad" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">${tileData.name}</div>
                    <i class="drawing fa fa-subway"></i>
                    <div class="price">Price $${tileData.price}</div>
                </div>
            </div>
        `;
    } else if (tileData.type === 'utility') {
        tileHTML = `
            <div class="space utility" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">${tileData.name}</div>
                    <i class="drawing fa fa-lightbulb-o"></i>
                    <div class="price">Price $${tileData.price}</div>
                </div>
            </div>
        `;
    } else if (tileData.type === 'community-chest') {
        tileHTML = `
            <div class="space community-chest" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">Community Chest</div>
                    <i class="drawing fa fa-cube"></i>
                    <div class="instructions">Follow instructions on top card</div>
                </div>
            </div>
        `;
    } else if (tileData.type === 'chance') {
        tileHTML = `
            <div class="space chance" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">Chance</div>
                    <i class="drawing fa fa-question"></i>
                </div>
            </div>
        `;
    } else if (tileData.type === 'tax') {
        tileHTML = `
            <div class="space fee income-tax" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">${tileData.name}</div>
                    <div class="diamond"></div>
                    <div class="instructions">Pay 10%<br>or<br>$200</div>
                </div>
            </div>
        `;
    } else {
        // For corners and other types
        tileHTML = `
            <div class="space" data-position="${boardLayout.indexOf(tileData)}">
                <div class="container">
                    <div class="name">${tileData.name}</div>
                </div>
            </div>
        `;
    }
    return tileHTML;
}

function renderBoard() {
    const bottomRow = document.querySelector('.bottom-row');
    const leftRow = document.querySelector('.left-row');
    const topRow = document.querySelector('.top-row');
    const rightRow = document.querySelector('.right-row');

    bottomRow.innerHTML = '';
    leftRow.innerHTML = '';
    topRow.innerHTML = '';
    rightRow.innerHTML = '';

    boardLayout.forEach((tileData, i) => {
        const tileHTML = createTileHTML(tileData);
        if (i > 0 && i < 10) {
            bottomRow.innerHTML += tileHTML;
        } else if (i > 10 && i < 20) {
            leftRow.innerHTML += tileHTML;
        } else if (i > 20 && i < 30) {
            topRow.innerHTML += tileHTML;
        } else if (i > 30 && i < 40) {
            rightRow.innerHTML += tileHTML;
        }
    });

    // Update tile ownership and mortgage status
    for (let i = 0; i < gameState.boardState.length; i++) {
        const tileState = gameState.boardState[i];
        if (tileState.owner) {
            const tileElement = document.querySelector(`.space:nth-child(${i + 1})`);
            if (tileElement) {
                tileElement.style.borderColor = playerColors[Object.keys(gameState.players).indexOf(tileState.owner)];
                if (tileState.mortgaged) {
                    tileElement.classList.add('mortgaged');
                }
            }
        }
    }

    // Add player pawns
    const playerIds = Object.keys(gameState.players);
    playerIds.forEach((playerId, index) => {
        const player = gameState.players[playerId];
        let pawn = document.getElementById(`pawn-${playerId}`);
        if (!pawn) {
            pawn = document.createElement('div');
            pawn.id = `pawn-${playerId}`;
            pawn.classList.add('player-pawn');
            pawn.style.backgroundColor = playerColors[index];
            monopolyBoard.appendChild(pawn);
        }

        const tileElement = document.querySelector(`.space[data-position="${player.position}"]`);
        if (tileElement) {
            const rect = tileElement.getBoundingClientRect();
            pawn.style.top = `${rect.top}px`;
            pawn.style.left = `${rect.left}px`;
        }
    });
}


socket.on('prompt-utility-rent', (data) => {
    showModal('Zapłać czynsz', 'Musisz zapłacić czynsz za pole specjalne. Rzuć kostką, aby określić kwotę.', [
        { text: 'Rzuć kostką', callback: () => {
            socket.emit('game-action', 'roll-for-rent', { roomId, position: data.position });
        } }
    ]);
});
