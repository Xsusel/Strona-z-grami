const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const monopolyGame = require('./games/monopoly');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const hostname = new URL(origin).hostname;
            if (hostname === "localhost" || hostname.endsWith(".xsus.site")) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"]
    }
});

const rooms = {};

app.use(express.static('public'));

// Serve the game page for a specific room
app.get('/room/:roomId', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


io.on('connection', (socket) => {
    console.log('Nowy użytkownik dołączył');

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        socket.emit('nickname-set');
    });

    socket.on('create-room', () => {
        const roomId = uuidv4();
        rooms[roomId] = {
            players: {},
            host: socket.id,
            gameStarted: false,
            gameState: null
        };
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        const room = rooms[roomId];
        if (room && !room.gameStarted) {
            socket.join(roomId);
            room.players[socket.id] = socket.nickname;
            socket.emit('room-joined', roomId, room);
            io.to(roomId).emit('update-players', room.players);
        } else {
            socket.emit('error-message', 'Pokój nie istnieje lub gra już się rozpoczęła.');
        }
    });

    socket.on('start-game', (roomId) => {
        const room = rooms[roomId];
        if (room && room.host === socket.id) {
            monopolyGame.startGame(io, room, roomId);
        }
    });

    socket.on('game-action', (action, data) => {
        const { roomId } = data;
        const room = rooms[roomId];
        if (room) {
            monopolyGame.handleAction(io, socket, room, roomId, action, data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik opuścił grę');
        // Handle player leaving a room
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});
