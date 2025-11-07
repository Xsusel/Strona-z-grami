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

function startGame(io, socket, room) {
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
        io.to(room.name).emit('next-turn', room.players[players[0]]);
    } else {
        socket.emit('error-message', 'Za mało graczy, aby rozpocząć grę (min. 4).');
    }
}

function handleAction(io, socket, room, action, data) {
    switch (action) {
        case 'submit-association':
            handleSubmitAssociation(io, socket, room, data.association);
            break;
        case 'vote-continue':
            handleVoteContinue(io, socket, room, data.choice);
            break;
        case 'vote':
            handleVote(io, socket, room, data.votedPlayerId);
            break;
        case 'guess-word':
            handleGuessWord(io, socket, room, data.guess);
            break;
    }
}

function handleDisconnect(io, room) {
    io.to(room.name).emit('game-over', { winner: 'Nikt', reason: 'Gracz opuścił grę.' });
    room.gameStarted = false;
}

// Helper functions for game logic
function handleSubmitAssociation(io, socket, room, association) {
    if (room && room.gameStarted) {
        room.gameState.associations[socket.id] = association;
        io.to(room.name).emit('new-association', { player: socket.nickname, association });

        room.gameState.turn++;
        const players = Object.keys(room.players);
        if (room.gameState.turn < players.length) {
            const nextPlayerId = players[room.gameState.turn];
            io.to(room.name).emit('next-turn', room.players[nextPlayerId]);
        } else {
            io.to(room.name).emit('vote-to-continue');
        }
    }
}

function handleVoteContinue(io, socket, room, choice) {
    if (room && room.gameStarted) {
        room.gameState.continueVotes[socket.id] = choice;
        const players = Object.keys(room.players);
        if (Object.keys(room.gameState.continueVotes).length === players.length) {
            const voteImpostorCount = Object.values(room.gameState.continueVotes).filter(c => c === 'impostor').length;
            if (voteImpostorCount > players.length / 2) {
                io.to(room.name).emit('voting-phase', room.players);
            } else {
                room.gameState.turn = 0;
                room.gameState.associations = {};
                room.gameState.continueVotes = {};
                io.to(room.name).emit('next-turn', room.players[players[0]]);
            }
        }
    }
}

function handleVote(io, socket, room, votedPlayerId) {
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
                        io.to(room.name).emit('game-over', { winner: 'Gracze', reason: `Impostor został zdemaskowany! Słowo to: ${room.gameState.word}` });
                    } else {
                        io.to(room.name).emit('game-over', { winner: 'Impostor', reason: `Gracze wyrzucili niewinną osobę! Słowo to: ${room.gameState.word}` });
                    }
                } else {
                    room.gameState.turn = 0;
                    room.gameState.associations = {};
                    room.gameState.votes = {};
                    io.to(room.name).emit('next-turn', room.players[players[0]]);
                }
            }
        }
}

function handleGuessWord(io, socket, room, guess) {
    if (room && room.gameStarted && socket.id === room.gameState.impostor) {
        if (guess.toLowerCase() === room.gameState.word.toLowerCase()) {
            io.to(room.name).emit('game-over', { winner: 'Impostor', reason: `Impostor odgadł hasło! Słowo to: ${room.gameState.word}` });
        } else {
            io.to(room.name).emit('game-over', { winner: 'Gracze', reason: `Impostor nie odgadł hasła! Słowo to: ${room.gameState.word}` });
        }
    }
}


module.exports = {
    startGame,
    handleAction,
    handleDisconnect
};
