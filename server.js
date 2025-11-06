const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

// --- Game Logic Handlers ---
const wordImpostorGame = require('./games/wordImpostor');
const drawingImpostorGame = require('./games/drawingImpostor');

const gameHandlers = {
    wordImpostor: wordImpostorGame,
    drawingImpostor: drawingImpostorGame
};
// -------------------------

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Nowy użytkownik dołączył');
    socket.emit('update-rooms', rooms);

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        console.log(`Użytkownik ustawił nick: ${nickname}`);
        socket.emit('nickname-set');
    });

    socket.on('create-room', (roomName, password, gameType) => {
        if (!rooms[roomName]) {
            if (!gameHandlers[gameType]) {
                socket.emit('error-message', 'Nieznany typ gry.');
                return;
            }
            rooms[roomName] = {
                players: {},
                password: password,
                host: socket.id,
                gameType: gameType,
                gameStarted: false,
                gameState: {}
            };
            socket.join(roomName);
            rooms[roomName].players[socket.id] = socket.nickname;
            io.emit('update-rooms', rooms);
            socket.emit('room-joined', roomName, rooms[roomName]);
        } else {
            socket.emit('error-message', 'Pokój o tej nazwie już istnieje.');
        }
    });

    socket.on('join-room', (roomName, password) => {
        const room = rooms[roomName];
        if (room && room.password === password) {
            socket.join(roomName);
            room.players[socket.id] = socket.nickname;
            io.emit('update-rooms', rooms);
            io.to(roomName).emit('update-players', room.players);
            socket.emit('room-joined', roomName, room);
        } else {
            socket.emit('error-message', 'Nieprawidłowe hasło lub pokój nie istnieje.');
        }
    });

    socket.on('leave-room', (roomName) => {
        handleLeaveRoom(socket, roomName);
    });

    // --- Game Event Delegation ---
    socket.on('start-game', (roomName) => {
        const room = rooms[roomName];
        if (room && gameHandlers[room.gameType]) {
            gameHandlers[room.gameType].startGame(io, socket, room);
        }
    });

    socket.on('game-action', (action, data) => {
        const { roomName } = data;
        const room = rooms[roomName];
        if (room && gameHandlers[room.gameType]) {
            gameHandlers[room.gameType].handleAction(io, socket, room, action, data);
        }
    });
    // ---------------------------

    socket.on('disconnect', () => {
        console.log('Użytkownik opuścił grę');
        for (const roomName in rooms) {
            if (rooms[roomName].players[socket.id]) {
                handleLeaveRoom(socket, roomName);
            }
        }
    });

    function handleLeaveRoom(socket, roomName) {
        const room = rooms[roomName];
        if (room) {
            socket.leave(roomName);
            delete room.players[socket.id];
            if (Object.keys(room.players).length === 0) {
                delete rooms[roomName];
            } else {
                if (room.host === socket.id) {
                    room.host = Object.keys(room.players)[0];
                }
                if (room.gameStarted && gameHandlers[room.gameType]) {
                     gameHandlers[room.gameType].handleDisconnect(io, room);
                }
            }
            io.emit('update-rooms', rooms);
            io.to(roomName).emit('update-players', room.players);
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});
