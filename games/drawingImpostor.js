const words = {
    "Dom": "Budynek mieszkalny",
    "Słońce": "Gwiazda",
    "Samochód": "Pojazd",
    "Kwiat": "Roślina",
    "Serce": "Organ lub symbol"
};

function startGame(io, socket, room, roomName) {
    const players = Object.keys(room.players);
    if (players.length >= 2) { // Lower player count for drawing game
        room.gameStarted = true;
        const wordList = Object.keys(words);
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        const impostorId = players[Math.floor(Math.random() * players.length)];

        room.gameState = {
            word: randomWord,
            impostor: impostorId,
            turn: 0,
            canvasState: [],
            votes: {},
            continueVotes: {}
        };

        players.forEach(playerId => {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerId === impostorId) {
                playerSocket.emit('game-started', { game: 'drawingImpostor', hint: words[randomWord] });
            } else {
                playerSocket.emit('game-started', { game: 'drawingImpostor', word: randomWord });
            }
        });
        io.to(roomName).emit('next-turn', room.players[players[0]]);
    } else {
        socket.emit('error-message', 'Za mało graczy, aby rozpocząć grę (min. 2).');
    }
}

function handleAction(io, socket, room, roomName, action, data) {
    switch (action) {
        case 'draw':
            handleDraw(io, room, roomName, data.drawData);
            break;
        case 'next-turn':
            handleNextTurn(io, socket, room, roomName);
            break;
        case 'vote-continue':
            handleVoteContinue(io, socket, room, roomName, data.choice);
            break;
        case 'vote':
            handleVote(io, socket, room, roomName, data.votedPlayerId);
            break;
        case 'guess-word':
            handleGuessWord(io, socket, room, roomName, data.guess);
            break;
    }
}

function handleDisconnect(io, room, roomName) {
    io.to(roomName).emit('game-over', { winner: 'Nikt', reason: 'Gracz opuścił grę.' });
    room.gameStarted = false;
}

function handleDraw(io, room, roomName, drawData) {
    room.gameState.canvasState.push(drawData);
    io.to(roomName).emit('update-canvas', drawData);
}

function handleNextTurn(io, socket, room, roomName) {
    room.gameState.turn++;
    const players = Object.keys(room.players);
    if (room.gameState.turn >= players.length) {
        io.to(roomName).emit('vote-to-continue');
    } else {
        const nextPlayerId = players[room.gameState.turn];
        io.to(roomName).emit('next-turn', room.players[nextPlayerId]);
    }
}

function handleVoteContinue(io, socket, room, roomName, choice) {
    if (room && room.gameStarted) {
        room.gameState.continueVotes[socket.id] = choice;
        const players = Object.keys(room.players);
        if (Object.keys(room.gameState.continueVotes).length === players.length) {
            const voteImpostorCount = Object.values(room.gameState.continueVotes).filter(c => c === 'impostor').length;
            if (voteImpostorCount > players.length / 2) {
                io.to(roomName).emit('voting-phase', room.players);
            } else {
                room.gameState.turn = 0;
                room.gameState.continueVotes = {};
                io.to(roomName).emit('next-turn', room.players[players[0]]);
            }
        }
    }
}

function handleVote(io, socket, room, roomName, votedPlayerId) {
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
                    room.gameState.votes = {};
                    io.to(roomName).emit('next-turn', room.players[players[0]]);
                }
            }
        }
}

function handleGuessWord(io, socket, room, roomName, guess) {
    if (room && room.gameStarted && socket.id === room.gameState.impostor) {
        if (guess.toLowerCase() === room.gameState.word.toLowerCase()) {
            io.to(roomName).emit('game-over', { winner: 'Impostor', reason: `Impostor odgadł hasło! Słowo to: ${room.gameState.word}` });
        } else {
            io.to(roomName).emit('game-over', { winner: 'Gracze', reason: `Impostor nie odgadł hasła! Słowo to: ${room.gameState.word}` });
        }
    }
}


module.exports = {
    startGame,
    handleAction,
    handleDisconnect
};
