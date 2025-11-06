const socket = io();

// Containers
const loginContainer = document.getElementById('login-container');
const lobbyContainer = document.getElementById('lobby-container');
const roomContainer = document.getElementById('room-container');
const gameContainer = document.getElementById('game-container');
const gameOverContainer = document.getElementById('game-over-container');

// Login
const loginForm = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname-input');

// Lobby
const roomsList = document.getElementById('rooms-list');
const createRoomForm = document.getElementById('create-room-form');
const roomNameInput = document.getElementById('room-name-input');
const roomPasswordInput = document.getElementById('room-password-input');

// Room
const roomNameHeader = document.getElementById('room-name-header');
const playersList = document.getElementById('players-list');
const startGameButton = document.getElementById('start-game-button');
const leaveRoomButton = document.getElementById('leave-room-button');

// Game
const gameWordHeader = document.getElementById('game-word-header');
const gameInfo = document.getElementById('game-info');
const associationsList = document.getElementById('associations-list');
const associationForm = document.getElementById('association-form');
const associationInput = document.getElementById('association-input');
const continueVotingContainer = document.getElementById('continue-voting-container');
const continueButton = document.getElementById('continue-button');
const voteImpostorButton = document.getElementById('vote-impostor-button');
const votingContainer = document.getElementById('voting-container');
const votingOptions = document.getElementById('voting-options');
const guessWordButton = document.getElementById('guess-word-button');

// Game Over
const gameOverWinner = document.getElementById('game-over-winner');
const gameOverReason = document.getElementById('game-over-reason');
const backToLobbyButton = document.getElementById('back-to-lobby-button');


let currentRoom = null;

// Login Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = nicknameInput.value;
    if (nickname) {
        socket.emit('set-nickname', nickname);
    }
});

socket.on('nickname-set', () => {
    loginContainer.style.display = 'none';
    lobbyContainer.style.display = 'block';
});

// Lobby Logic
createRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomName = roomNameInput.value;
    const password = roomPasswordInput.value;
    if (roomName) {
        socket.emit('create-room', roomName, password);
    }
});

socket.on('update-rooms', (rooms) => {
    roomsList.innerHTML = '';
    for (const roomName in rooms) {
        const room = rooms[roomName];
        const roomElement = document.createElement('div');
        roomElement.innerText = `${roomName} (${Object.keys(room.players).length}/10)`;
        const joinButton = document.createElement('button');
        joinButton.innerText = 'Dołącz';
        joinButton.onclick = () => {
            const password = room.password ? prompt('Podaj hasło:') : '';
            socket.emit('join-room', roomName, password);
        };
        roomElement.appendChild(joinButton);
        roomsList.appendChild(roomElement);
    }
});

// Room Logic
socket.on('room-joined', (roomName, room) => {
    currentRoom = roomName;
    lobbyContainer.style.display = 'none';
    roomContainer.style.display = 'block';
    roomNameHeader.innerText = roomName;
    updatePlayersList(room.players);
    if (socket.id === room.host) {
        startGameButton.style.display = 'block';
    }
});

startGameButton.addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('start-game', currentRoom);
    }
});

socket.on('update-players', (players) => {
    updatePlayersList(players);
});

leaveRoomButton.addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('leave-room', currentRoom);
        currentRoom = null;
        roomContainer.style.display = 'none';
        lobbyContainer.style.display = 'block';
    }
});

function updatePlayersList(players) {
    playersList.innerHTML = '';
    for (const playerId in players) {
        const playerElement = document.createElement('div');
        playerElement.innerText = players[playerId];
        playersList.appendChild(playerElement);
    }
}

// Game Logic
socket.on('game-started', (data) => {
    roomContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    associationsList.innerHTML = '';

    if (data.word) {
        gameWordHeader.innerText = `Twoje słowo to: ${data.word}`;
        gameInfo.innerText = 'Wpisz skojarzenie z tym słowem.';
    } else {
        gameWordHeader.innerText = 'Jesteś impostorem!';
        gameInfo.innerText = `Twoja podpowiedź to: ${data.hint}`;
        guessWordButton.style.display = 'block';
    }
});

socket.on('next-turn', (playerName) => {
    gameInfo.innerText = `Ruch gracza: ${playerName}`;
    associationInput.disabled = playerName !== nicknameInput.value;
});

associationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const association = associationInput.value;
    if (association && currentRoom) {
        socket.emit('submit-association', currentRoom, association);
        associationInput.value = '';
    }
});

socket.on('new-association', (data) => {
    const associationElement = document.createElement('div');
    associationElement.innerText = `${data.player}: ${data.association}`;
    associationsList.appendChild(associationElement);
});

socket.on('vote-to-continue', () => {
    continueVotingContainer.style.display = 'block';
});

continueButton.addEventListener('click', () => {
    socket.emit('vote-continue', currentRoom, 'continue');
    continueVotingContainer.style.display = 'none';
});

voteImpostorButton.addEventListener('click', () => {
    socket.emit('vote-continue', currentRoom, 'impostor');
    continueVotingContainer.style.display = 'none';
});

socket.on('voting-phase', (players) => {
    votingContainer.style.display = 'block';
    votingOptions.innerHTML = '';
    for (const playerId in players) {
        const voteButton = document.createElement('button');
        voteButton.innerText = players[playerId];
        voteButton.onclick = () => {
            socket.emit('vote', currentRoom, playerId);
            votingContainer.style.display = 'none';
        };
        votingOptions.appendChild(voteButton);
    }
});

guessWordButton.addEventListener('click', () => {
    const guess = prompt('Jakie jest hasło?');
    if (guess && currentRoom) {
        socket.emit('guess-word', currentRoom, guess);
    }
});

socket.on('game-over', (data) => {
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    gameOverWinner.innerText = `Zwycięzca: ${data.winner}`;
    gameOverReason.innerText = data.reason;
});

backToLobbyButton.addEventListener('click', () => {
    gameOverContainer.style.display = 'none';
    lobbyContainer.style.display = 'block';
});

// Error Handling
socket.on('error-message', (message) => {
    alert(message);
});
