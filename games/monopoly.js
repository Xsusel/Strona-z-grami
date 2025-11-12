
const boardLayout = [
    { name: "Start", type: "corner" },
    { name: "Kondek", price: 60, color: "#a52a2a", type: "property" },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Wiejska", price: 60, color: "#a52a2a", type: "property" },
    { name: "Podatek Dochodowy", type: "tax", amount: 200 },
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
    { name: "Podatek od Luksusu", type: "tax", amount: 100 },
    { name: "Aleja Mickiewicza", price: 400, color: "#0000ff", type: "property" }
];

const chanceCards = [
    { text: "Idź na Start (Pobierz $200)", action: "move", position: 0 },
    { text: "Idź do Więzienia", action: "move", position: 10, jail: true },
    { text: "Bank płaci Ci dywidendę w wysokości $50", action: "money", amount: 50 },
    { text: "Wychodzisz z więzienia za darmo", action: "get-out-of-jail" }
];

const communityChestCards = [
    { text: "Błąd banku na Twoją korzyść. Pobierz $200", action: "money", amount: 200 },
    { text: "Płacisz opłatę za szkołę $50", action: "money", amount: -50 },
    { text: "Idź do Więzienia", action: "move", position: 10, jail: true }
];

function createGameState(playerIds, nicknames) {
    const players = {};
    playerIds.forEach((id, index) => {
        players[id] = {
            nickname: nicknames[id],
            money: 1500,
            position: 0,
            properties: [],
            inJail: false,
            jailTurns: 0,
            doublesCount: 0,
            getOutOfJailFreeCards: 0
        };
    });

    return {
        players,
        boardState: boardLayout.map(() => ({ owner: null, houses: 0 })),
        chanceDeck: [...chanceCards].sort(() => Math.random() - 0.5),
        communityChestDeck: [...communityChestCards].sort(() => Math.random() - 0.5),
        currentPlayerIndex: 0,
        dice: [0, 0],
        turnInProgress: false,
        auction: null
    };
}

function startGame(io, room, roomName) {
    room.gameStarted = true;
    const playerIds = Object.keys(room.players);
    const nicknames = room.players;
    room.gameState = createGameState(playerIds, nicknames);
    io.to(roomName).emit('game-started', room.gameState);
}

function handleAction(io, socket, room, roomName, action, data) {
    const { gameState } = room;
    if (!gameState || gameState.turnInProgress) return;

    const playerIds = Object.keys(gameState.players);
    const currentPlayerId = playerIds[gameState.currentPlayerIndex];
    if (socket.id !== currentPlayerId && action !== 'buy-property') return;

    if (action === 'roll-dice') {
        if (gameState.turnInProgress) return;
        gameState.turnInProgress = true;
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        gameState.dice = [die1, die2];

        const currentPlayer = gameState.players[currentPlayerId];
        const oldPosition = currentPlayer.position;
        currentPlayer.position = (currentPlayer.position + die1 + die2) % 40;

        // Sprawdzenie przejścia przez START
        if (currentPlayer.position < oldPosition) {
            currentPlayer.money += 200;
        }

        const currentTile = boardLayout[currentPlayer.position];
        handleTileLanding(io, socket, room, roomName, currentTile, currentPlayerId);

        if (currentPlayer.inJail) {
            if (die1 === die2) {
                currentPlayer.inJail = false;
                currentPlayer.jailTurns = 0;
            } else {
                currentPlayer.jailTurns++;
                if (currentPlayer.jailTurns >= 3) {
                    currentPlayer.money -= 50; // Zapłać kaucję
                    currentPlayer.inJail = false;
                    currentPlayer.jailTurns = 0;
                }
            }
        }

        if (!currentPlayer.inJail) {
            const oldPosition = currentPlayer.position;
            currentPlayer.position = (currentPlayer.position + die1 + die2) % 40;
            if (currentPlayer.position < oldPosition) {
                currentPlayer.money += 200;
            }
            const currentTile = boardLayout[currentPlayer.position];
            handleTileLanding(io, socket, room, roomName, currentTile, currentPlayerId);
        }

        if (die1 === die2) {
            currentPlayer.doublesCount++;
            if (currentPlayer.doublesCount === 3) {
                currentPlayer.position = 10;
                currentPlayer.inJail = true;
                currentPlayer.doublesCount = 0;
            }
        } else {
            currentPlayer.doublesCount = 0;
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerIds.length;
        }

        gameState.turnInProgress = false;

        io.to(roomName).emit('game-state-update', gameState);
    } else if (action === 'buy-property') {
        const player = gameState.players[socket.id];
        const tile = boardLayout[player.position];
        const tileState = gameState.boardState[player.position];

        if (tile.price && !tileState.owner && player.money >= tile.price) {
            player.money -= tile.price;
            tileState.owner = socket.id;
            player.properties.push(player.position);
            io.to(roomName).emit('game-state-update', gameState);
        }
    } else if (action === 'build-house') {
        const { tilePosition } = data;
        const player = gameState.players[socket.id];
        const tile = boardLayout[tilePosition];
        const tileState = gameState.boardState[tilePosition];
        const housePrice = 50; // Uproszczona cena

        const hasMonopoly = boardLayout
            .filter(t => t.color === tile.color)
            .every(t => gameState.boardState[boardLayout.indexOf(t)].owner === socket.id);

        if (hasMonopoly && player.money >= housePrice && tileState.houses < 5) {
            player.money -= housePrice;
            tileState.houses++;
            io.to(roomName).emit('game-state-update', gameState);
        }
    } else if (action === 'decline-purchase') {
        const player = gameState.players[socket.id];
        const tile = boardLayout[player.position];
        gameState.auction = {
            tilePosition: player.position,
            currentBid: 0,
            highestBidder: null,
            participants: Object.keys(gameState.players)
        };
        io.to(roomName).emit('auction-started', { tileName: tile.name });
    } else if (action === 'place-bid') {
        const { bid } = data;
        const { auction } = gameState;
        if (auction && bid > auction.currentBid && gameState.players[socket.id].money >= bid) {
            auction.currentBid = bid;
            auction.highestBidder = socket.id;
            io.to(roomName).emit('auction-update', { bidder: gameState.players[socket.id].nickname, bid });
        }
    }
}

function handleTileLanding(io, socket, room, roomName, tile, playerId) {
    const { gameState } = room;
    const player = gameState.players[playerId];

    switch (tile.type) {
        case 'property':
        case 'railroad':
        case 'utility':
            const tileState = gameState.boardState[player.position];
            if (!tileState.owner) {
                // Daj opcję zakupu
                socket.emit('offer-purchase', { tileName: tile.name, price: tile.price });
            } else if (tileState.owner !== playerId) {
                // Pobierz czynsz
                const ownerId = tileState.owner;
                const owner = gameState.players[ownerId];
                const rent = calculateRent(tile, tileState, owner, gameState);
                player.money -= rent;
                owner.money += rent;
                io.to(roomName).emit('notification', { text: `${player.nickname} zapłacił $${rent} czynszu dla ${owner.nickname}` });
            }
            break;
        case 'tax':
            player.money -= tile.amount;
            break;
        case 'corner':
            if (tile.name === "Idziesz do Więzienia") {
                player.position = 10;
                player.inJail = true;
            }
            break;
        case 'chance':
            drawCard(gameState.chanceDeck, player, io, roomName);
            break;
        case 'community-chest':
            drawCard(gameState.communityChestDeck, player, io, roomName);
            break;
    }
}

function drawCard(deck, player, io, roomName) {
    const card = deck.shift();
    deck.push(card); // Wraca na spód talii

    io.to(roomName).emit('card-drawn', { cardText: card.text });

    switch (card.action) {
        case 'move':
            player.position = card.position;
            if (card.jail) player.inJail = true;
            break;
        case 'money':
            player.money += card.amount;
            break;
        case 'get-out-of-jail':
            player.getOutOfJailFreeCards++;
            break;
    }
}

function calculateRent(tile, tileState, owner, gameState) {
    if (tile.type === 'property') {
        const monopoly = boardLayout
            .filter(t => t.color === tile.color)
            .every(t => gameState.boardState[boardLayout.indexOf(t)].owner === tileState.owner);

        // Na razie uproszczony czynsz, bez domów
        return tile.price / 10 * (monopoly ? 2 : 1);
    }
    // ... logika dla kolei i utility
    return 0;
}

function handleDisconnect(io, room, roomName) {
    // Logika rozłączenia
}

module.exports = {
    startGame,
    handleAction,
    handleDisconnect
};
