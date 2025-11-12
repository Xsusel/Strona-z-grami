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

socket.on('game-state-update', (newGameState) => {
    gameState = newGameState;
    updatePlayerPanel();
    renderBoard();
});

socket.on('offer-purchase', (data) => {
    showModal('Oferta zakupu', `Czy chcesz kupić ${data.tileName} za $${data.price}?`, [
        { text: 'Kup', callback: () => socket.emit('game-action', 'buy-property', { roomId }) },
        { text: 'Ignoruj', callback: () => {} }
    ]);
});

socket.on('card-drawn', (data) => {
    showModal('Wylosowano kartę', data.cardText, [{ text: 'OK', callback: () => {} }]);
});

socket.on('notification', (data) => {
    // Prosty alert, do rozbudowy na ładniejszy system notyfikacji
    alert(data.text);
});


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

    playerIds.forEach((id, index) => {
        const player = gameState.players[id];
        const playerDiv = document.createElement('div');
        playerDiv.style.borderLeft = `5px solid ${playerColors[index]}`;
        playerDiv.style.paddingLeft = '10px';
        playerDiv.innerHTML = `
            <strong>${player.nickname}</strong>: $${player.money}
            <small>(Poz: ${player.position})</small>
        `;
        if (id === currentPlayerId) {
            playerDiv.style.fontWeight = 'bold';
        }
        playerPanel.appendChild(playerDiv);
    });

    if (myPlayerId === currentPlayerId) {
        const rollButton = document.createElement('button');
        rollButton.textContent = 'Rzuć kostką';
        rollButton.onclick = () => {
            socket.emit('game-action', 'roll-dice', { roomId });
        };
        playerPanel.appendChild(rollButton);
    }
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

function renderBoard() {
    monopolyBoard.innerHTML = '';
    const playerIds = Object.keys(gameState.players);

    boardLayout.forEach((tileData, i) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');

        let row, col;
        if (i < 10) {
            row = 11; col = 11 - i;
            tile.classList.add('bottom-row');
        } else if (i < 20) {
            row = 11 - (i - 10); col = 1;
            tile.classList.add('left-row');
        } else if (i < 30) {
            row = 1; col = 1 + (i - 20);
            tile.classList.add('top-row');
        } else {
            row = 1 + (i - 30); col = 11;
            tile.classList.add('right-row');
        }

        tile.style.gridRow = row;
        tile.style.gridColumn = col;

        if (tileData.type === 'property') {
            tile.innerHTML = `
                <div class="color-bar" style="background-color: ${tileData.color};"></div>
                <div class="name">${tileData.name}</div>
                <div class="price">$${tileData.price}</div>
            `;
        } else {
            tile.innerHTML = `<div class="name">${tileData.name}</div>`;
        }

        if (tileData.type === 'corner') {
            tile.classList.add('corner');
        }

        const tileState = gameState.boardState[i];
        if (tileState.owner) {
            const ownerIndex = playerIds.indexOf(tileState.owner);
            tile.style.borderColor = playerColors[ownerIndex];
            tile.style.borderWidth = '3px';
        }

        monopolyBoard.appendChild(tile);
    });
}
