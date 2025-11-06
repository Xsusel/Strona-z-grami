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
const words = {
    "Cukierek": "Słodka przekąska",
    "Plaża": "Miejsce z piaskiem i wodą",
    "Książka": "Przedmiot do czytania",
    "Gitara": "Instrument muzyczny",
    "Kot": "Zwierzę domowe",
    "Samochód": "Pojazd mechaniczny",
    "Komputer": "Urządzenie elektroniczne",
    "Drzewo": "Roślina z pniem i gałęziami",
    "Słońce": "Gwiazda w centrum Układu Słonecznego",
    "Księżyc": "Naturalny satelita Ziemi",
    "Pizza": "Włoskie danie z ciasta i dodatków",
    "Rower": "Jednoślad napędzany siłą mięśni",
    "Telefon": "Urządzenie do komunikacji głosowej",
    "Teleskop": "Przyrząd do obserwacji odległych obiektów",
    "Mikrofon": "Urządzenie do przetwarzania fal dźwiękowych"
};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Nowy użytkownik dołączył');
    socket.emit('update-rooms', rooms);

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        console.log(`Użytkownik ustawił nick: ${nickname}`);
        socket.emit('nickname-set');
    });

    socket.on('create-room', (roomName, password) => {
        if (!rooms[roomName]) {
            rooms[roomName] = {
                players: {},
                password: password,
                host: socket.id,
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

    socket.on('start-game', (roomName) => {
        const room = rooms[roomName];
        if (room && room.host === socket.id) {
            const players = Object.keys(room.players);
            if (players.length >= 4) {
                room.gameStarted = true;
                const wordList = Object.keys(words);
                const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
                const impostorId = players[Math.floor(Math.random() * players.length)];

                room.gameState = {
                    word: randomWord,
                    impostor: impostorId,
                    associations: {},
                    votes: {},
                    continueVotes: {},
                    turn: 0
                };

                players.forEach(playerId => {
                    const playerSocket = io.sockets.sockets.get(playerId);
                    if (playerId === impostorId) {
                        playerSocket.emit('game-started', { hint: words[randomWord] });
                    } else {
                        playerSocket.emit('game-started', { word: randomWord });
                    }
                });
                io.to(roomName).emit('next-turn', room.players[players[0]]);
            } else {
                socket.emit('error-message', 'Za mało graczy, aby rozpocząć grę (min. 4).');
            }
        }
    });

    socket.on('submit-association', (roomName, association) => {
        const room = rooms[roomName];
        if (room && room.gameStarted) {
            room.gameState.associations[socket.id] = association;
            io.to(roomName).emit('new-association', { player: socket.nickname, association });

            room.gameState.turn++;
            const players = Object.keys(room.players);
            if (room.gameState.turn < players.length) {
                const nextPlayerId = players[room.gameState.turn];
                io.to(roomName).emit('next-turn', room.players[nextPlayerId]);
            } else {
                io.to(roomName).emit('vote-to-continue');
            }
        }
    });

    socket.on('vote-continue', (roomName, choice) => {
        const room = rooms[roomName];
        if (room && room.gameStarted) {
            room.gameState.continueVotes[socket.id] = choice;
            const players = Object.keys(room.players);
            if (Object.keys(room.gameState.continueVotes).length === players.length) {
                const voteImpostorCount = Object.values(room.gameState.continueVotes).filter(c => c === 'impostor').length;
                if (voteImpostorCount > players.length / 2) {
                    io.to(roomName).emit('voting-phase', room.players);
                } else {
                    room.gameState.turn = 0;
                    room.gameState.associations = {};
                    room.gameState.continueVotes = {};
                    io.to(roomName).emit('next-turn', room.players[players[0]]);
                }
            }
        }
    });

    socket.on('vote', (roomName, votedPlayerId) => {
        const room = rooms[roomName];
        if (room && room.gameStarted) {
            room.gameState.votes[socket.id] = votedPlayerId;
            const players = Object.keys(room.players);
            if (Object.keys(room.gameState.votes).length === players.length) {
                const voteCounts = {};
                for (const voterId in room.gameState.votes) {
                    const votedId = room.gameState.votes[voterId];
                    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
                }

                let maxVotes = 0;
                let playerOutId = null;
                for (const playerId in voteCounts) {
                    if (voteCounts[playerId] > maxVotes) {
                        maxVotes = voteCounts[playerId];
                        playerOutId = playerId;
                    }
                }

                if (maxVotes > players.length / 2) {
                    if (playerOutId === room.gameState.impostor) {
                        io.to(roomName).emit('game-over', { winner: 'Gracze', reason: `Impostor został zdemaskowany! Słowo to: ${room.gameState.word}` });
                    } else {
                        io.to(roomName).emit('game-over', { winner: 'Impostor', reason: `Gracze wyrzucili niewinną osobę! Słowo to: ${room.gameState.word}` });
                    }
                } else {
                    room.gameState.turn = 0;
                    room.gameState.associations = {};
                    room.gameState.votes = {};
                    io.to(roomName).emit('next-turn', room.players[players[0]]);
                }
            }
        }
    });

    socket.on('guess-word', (roomName, guess) => {
        const room = rooms[roomName];
        if (room && room.gameStarted && socket.id === room.gameState.impostor) {
            if (guess.toLowerCase() === room.gameState.word.toLowerCase()) {
                io.to(roomName).emit('game-over', { winner: 'Impostor', reason: `Impostor odgadł hasło! Słowo to: ${room.gameState.word}` });
            } else {
                io.to(roomName).emit('game-over', { winner: 'Gracze', reason: `Impostor nie odgadł hasła! Słowo to: ${room.gameState.word}` });
            }
        }
    });

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
                if (room.gameStarted) {
                    io.to(roomName).emit('game-over', { winner: 'Nikt', reason: 'Gracz opuścił grę.' });
                    room.gameStarted = false;
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
