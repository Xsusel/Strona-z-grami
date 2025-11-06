const socket = io();

const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const loginForm = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname-input');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = nicknameInput.value;
    if (nickname) {
        socket.emit('set-nickname', nickname);
    }
});

socket.on('nickname-set', () => {
    loginContainer.style.display = 'none';
    gameContainer.style.display = 'block';
});
