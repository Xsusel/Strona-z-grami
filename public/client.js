const socket = io(window.location.host);

// Containers
const containers = {
    login: document.getElementById('login-container'),
    gameSelection: document.getElementById('game-selection-container'),
    lobby: document.getElementById('lobby-container'),
    room: document.getElementById('room-container'),
    game: document.getElementById('game-container'),
    drawingGame: document.getElementById('drawing-game-container'),
    gameOver: document.getElementById('game-over-container')
};

// Modals
const customAlert = document.getElementById('custom-alert');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertOk = document.getElementById('custom-alert-ok');
const customPrompt = document.getElementById('custom-prompt');
const customPromptMessage = document.getElementById('custom-prompt-message');
const customPromptInput = document.getElementById('custom-prompt-input');
const customPromptOk = document.getElementById('custom-prompt-ok');
const customPromptCancel = document.getElementById('custom-prompt-cancel');

// Login
const loginForm = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname-input');

// Game Selection
const gameSelectButtons = document.querySelectorAll('.game-select-button');

// Lobby
const roomsList = document.getElementById('rooms-list');
const createRoomForm = document.getElementById('create-room-form');
const roomNameInput = document.getElementById('room-name-input');
const roomPasswordInput = document.getElementById('room-password-input');
const backToGameSelectionButton = document.getElementById('back-to-game-selection');

// Room
const roomNameHeader = document.getElementById('room-name-header');
const playersList = document.getElementById('players-list');
const startGameButton = document.getElementById('start-game-button');
const leaveRoomButton = document.getElementById('leave-room-button');

// Word Game
const gameWordHeader = document.getElementById('game-word-header');
const gameInfo = document.getElementById('game-info');
const associationsList = document.getElementById('associations-list');
const associationForm = document.getElementById('association-form');
const associationInput = document.getElementById('association-input');
const continueVotingContainer = document.getElementById('continue-voting-container');
const wordContinueButton = document.querySelector('#game-container .continue-button');
const wordVoteImpostorButton = document.querySelector('#game-container .vote-impostor-button');
const wordVotingContainer = document.querySelector('#game-container .voting-container');
const wordVotingOptions = document.querySelector('#game-container .voting-options');
const guessWordButton = document.getElementById('guess-word-button');

// Drawing Game
const drawingGameWordHeader = document.getElementById('drawing-game-word-header');
const drawingGameInfo = document.getElementById('drawing-game-info');
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const drawingNextTurnButton = document.getElementById('drawing-next-turn-button');
const drawingContinueVotingContainer = document.getElementById('drawing-continue-voting-container');
const drawingContinueButton = document.querySelector('#drawing-game-container .continue-button');
const drawingVoteImpostorButton = document.querySelector('#drawing-game-container .vote-impostor-button');
const drawingVotingContainer = document.querySelector('#drawing-game-container .voting-container');
const drawingVotingOptions = document.querySelector('#drawing-game-container .voting-options');
const drawingGuessWordButton = document.getElementById('drawing-guess-word-button');
let drawing = false;

// Game Over
const gameOverWinner = document.getElementById('game-over-winner');
const gameOverReason = document.getElementById('game-over-reason');
const backToLobbyButton = document.getElementById('back-to-lobby-button');

let currentRoom = null;
let currentGameType = null;

// --- Animation and Display Logic ---
function showContainer(containerName) {
    Object.values(containers).forEach(container => {
        container.style.display = 'none';
    });
    containers[containerName].style.display = 'block';
}

// Modal Logic
function showAlert(message) {
    customAlertMessage.innerText = message;
    customAlert.style.display = 'flex';
}

customAlertOk.addEventListener('click', () => {
    customAlert.style.display = 'none';
});

function showPrompt(message, callback) {
    customPromptMessage.innerText = message;
    customPrompt.style.display = 'flex';

    const okListener = () => {
        callback(customPromptInput.value);
        cleanup();
    };

    const cancelListener = () => {
        callback(null);
        cleanup();
    };

    const cleanup = () => {
        customPrompt.style.display = 'none';
        customPromptOk.removeEventListener('click', okListener);
        customPromptCancel.removeEventListener('click', cancelListener);
    };

    customPromptOk.addEventListener('click', okListener);
    customPromptCancel.addEventListener('click', cancelListener);
}

// Login Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = nicknameInput.value;
    if (nickname) {
        socket.emit('set-nickname', nickname);
    }
});

socket.on('nickname-set', () => {
    showContainer('gameSelection');
});

// Game Selection Logic
gameSelectButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentGameType = button.dataset.game;
        showContainer('lobby');
    });
});

backToGameSelectionButton.addEventListener('click', () => {
    showContainer('gameSelection');
});

// Lobby Logic
createRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomName = roomNameInput.value;
    const password = roomPasswordInput.value;
    if (roomName && currentGameType) {
        socket.emit('create-room', roomName, password, currentGameType);
    }
});

socket.on('update-rooms', (rooms) => {
    roomsList.innerHTML = '';
    for (const roomName in rooms) {
        const room = rooms[roomName];
        if (room.gameType === currentGameType) {
            const roomElement = document.createElement('div');
            roomElement.className = 'room';
            roomElement.innerHTML = `
                <span>${roomName} (${Object.keys(room.players).length}/10)</span>
            `;
            const joinButton = document.createElement('button');
            joinButton.innerText = 'Dołącz';
            joinButton.onclick = () => {
                if (room.password) {
                    showPrompt('Podaj hasło:', (password) => {
                        if (password) {
                            socket.emit('join-room', roomName, password);
                        }
                    });
                } else {
                    socket.emit('join-room', roomName, '');
                }
            };
            roomElement.appendChild(joinButton);
            roomsList.appendChild(roomElement);
        }
    }
});

// Room Logic
socket.on('room-joined', (roomName, room) => {
    currentRoom = roomName;
    showContainer('room');
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
        showContainer('lobby');
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
    if (data.game === 'drawingImpostor') {
        showContainer('drawingGame');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.word) {
            drawingGameWordHeader.innerText = `Twoje słowo to: ${data.word}`;
        } else {
            drawingGameWordHeader.innerText = 'Jesteś impostorem!';
            drawingGuessWordButton.style.display = 'block';
        }
    } else {
        showContainer('game');
        associationsList.innerHTML = '';

        if (data.word) {
            gameWordHeader.innerText = `Twoje słowo to: ${data.word}`;
            gameInfo.innerText = 'Wpisz skojarzenie z tym słowem.';
        } else {
            gameWordHeader.innerText = 'Jesteś impostorem!';
            gameInfo.innerText = `Twoja podpowiedź to: ${data.hint}`;
            guessWordButton.style.display = 'block';
        }
    }
});

socket.on('next-turn', (playerName) => {
    if (currentGameType === 'drawingImpostor') {
        drawingGameInfo.innerText = `Ruch gracza: ${playerName}`;
    } else {
        gameInfo.innerText = `Ruch gracza: ${playerName}`;
        associationInput.disabled = playerName !== nicknameInput.value;
    }
});

// Word Game Logic
associationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const association = associationInput.value;
    if (association && currentRoom) {
        socket.emit('game-action', 'submit-association', { roomName: currentRoom, association });
        associationInput.value = '';
    }
});

socket.on('new-association', (data) => {
    const associationElement = document.createElement('div');
    associationElement.innerText = `${data.player}: ${data.association}`;
    associationsList.appendChild(associationElement);
});

socket.on('vote-to-continue', () => {
    if (currentGameType === 'drawingImpostor') {
        drawingContinueVotingContainer.style.display = 'block';
    } else {
        continueVotingContainer.style.display = 'block';
    }
});

wordContinueButton.addEventListener('click', () => {
    socket.emit('game-action', 'vote-continue', { roomName: currentRoom, choice: 'continue' });
    continueVotingContainer.style.display = 'none';
});

wordVoteImpostorButton.addEventListener('click', () => {
    socket.emit('game-action', 'vote-continue', { roomName: currentRoom, choice: 'impostor' });
    continueVotingContainer.style.display = 'none';
});

socket.on('voting-phase', (players) => {
    const [container, options] = currentGameType === 'drawingImpostor'
        ? [drawingVotingContainer, drawingVotingOptions]
        : [wordVotingContainer, wordVotingOptions];

    container.style.display = 'block';
    options.innerHTML = '';
    for (const playerId in players) {
        const voteButton = document.createElement('button');
        voteButton.innerText = players[playerId];
        voteButton.onclick = () => {
            socket.emit('game-action', 'vote', { roomName: currentRoom, votedPlayerId: playerId });
            container.style.display = 'none';
        };
        options.appendChild(voteButton);
    }
});

guessWordButton.addEventListener('click', () => {
    showPrompt('Jakie jest hasło?', (guess) => {
        if (guess && currentRoom) {
            socket.emit('game-action', 'guess-word', { roomName: currentRoom, guess });
        }
    });
});

// Drawing Game Logic
drawingContinueButton.addEventListener('click', () => {
    socket.emit('game-action', 'vote-continue', { roomName: currentRoom, choice: 'continue' });
    drawingContinueVotingContainer.style.display = 'none';
});

drawingVoteImpostorButton.addEventListener('click', () => {
    socket.emit('game-action', 'vote-continue', { roomName: currentRoom, choice: 'impostor' });
    drawingContinueVotingContainer.style.display = 'none';
});

drawingGuessWordButton.addEventListener('click', () => {
    showPrompt('Jakie jest hasło?', (guess) => {
        if (guess && currentRoom) {
            socket.emit('game-action', 'guess-word', { roomName: currentRoom, guess });
        }
    });
});

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    draw(e);
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener('mousemove', draw);

function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const drawData = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        type: e.type
    };
    socket.emit('game-action', 'draw', { roomName: currentRoom, drawData });
}

socket.on('update-canvas', (data) => {
    if (data.type === 'mousedown') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.type === 'mousemove') {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
    }
});

drawingNextTurnButton.addEventListener('click', () => {
    socket.emit('game-action', 'next-turn', { roomName: currentRoom });
});


socket.on('game-over', (data) => {
    showContainer('gameOver');
    gameOverWinner.innerText = `Zwycięzca: ${data.winner}`;
    gameOverReason.innerText = data.reason;
});

backToLobbyButton.addEventListener('click', () => {
    showContainer('lobby');
});

// Error Handling
socket.on('error-message', (message) => {
    showAlert(message);
});

// Initial setup
showContainer('login');
