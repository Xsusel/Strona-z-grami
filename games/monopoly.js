
const boardLayout = [
    { name: "Start", type: "corner" },
    { name: "Kondek", price: 60, color: "#a52a2a", type: "property", housePrice: 50, rent: [2, 10, 30, 90, 160, 250] },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Wiejska", price: 60, color: "#a52a2a", type: "property", housePrice: 50, rent: [4, 20, 60, 180, 320, 450] },
    { name: "Podatek Dochodowy", type: "tax", amount: 200 },
    { name: "Kolej Południowa", price: 200, type: "railroad" },
    { name: "Szewska", price: 100, color: "#87ceeb", type: "property", housePrice: 50, rent: [6, 30, 90, 270, 400, 550] },
    { name: "Szansa", type: "chance" },
    { name: "Dluga", price: 100, color: "#87ceeb", type: "property", housePrice: 50, rent: [6, 30, 90, 270, 400, 550] },
    { name: "Slawkowska", price: 120, color: "#87ceeb", type: "property", housePrice: 50, rent: [8, 40, 100, 300, 450, 600] },
    { name: "Więzienie", type: "corner" },
    { name: "Miodowa", price: 140, color: "#da70d6", type: "property", housePrice: 100, rent: [10, 50, 150, 450, 625, 750] },
    { name: "Elektrownia", price: 150, type: "utility" },
    { name: "Stradom", price: 140, color: "#da70d6", type: "property", housePrice: 100, rent: [10, 50, 150, 450, 625, 750] },
    { name: "Podwale", price: 160, color: "#da70d6", type: "property", housePrice: 100, rent: [12, 60, 180, 500, 700, 900] },
    { name: "Kolej Zachodnia", price: 200, type: "railroad" },
    { name: "Rynek Główny", price: 180, color: "#ffa500", type: "property", housePrice: 100, rent: [14, 70, 200, 550, 750, 950] },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Plac Wszystkich Swietych", price: 180, color: "#ffa500", type: "property", housePrice: 100, rent: [14, 70, 200, 550, 750, 950] },
    { name: "Bulwary", price: 200, color: "#ffa500", type: "property", housePrice: 100, rent: [16, 80, 220, 600, 800, 1000] },
    { name: "Bezpłatny Parking", type: "corner" },
    { name: "Karmelicka", price: 220, color: "#ff0000", type: "property", housePrice: 150, rent: [18, 90, 250, 700, 875, 1050] },
    { name: "Szansa", type: "chance" },
    { name: "Aleje Trzech Wieszczów", price: 220, color: "#ff0000", type: "property", housePrice: 150, rent: [18, 90, 250, 700, 875, 1050] },
    { name: "Plac Sikorskiego", price: 240, color: "#ff0000", type: "property", housePrice: 150, rent: [20, 100, 300, 750, 925, 1100] },
    { name: "Kolej Północna", price: 200, type: "railroad" },
    { name: "Ulica 1 Maja", price: 260, color: "#ffff00", type: "property", housePrice: 150, rent: [22, 110, 330, 800, 975, 1150] },
    { name: "Wodociągi", price: 150, type: "utility" },
    { name: "Ulica 3 Maja", price: 260, color: "#ffff00", type: "property", housePrice: 150, rent: [22, 110, 330, 800, 975, 1150] },
    { name: "Ulica Piłsudskiego", price: 280, color: "#ffff00", type: "property", housePrice: 150, rent: [24, 120, 360, 850, 1025, 1200] },
    { name: "Idziesz do Więzienia", type: "corner" },
    { name: "Aleja Waszyngtona", price: 300, color: "#008000", type: "property", housePrice: 200, rent: [26, 130, 390, 900, 1100, 1275] },
    { name: "Plac Inwalidów", price: 300, color: "#008000", type: "property", housePrice: 200, rent: [26, 130, 390, 900, 1100, 1275] },
    { name: "Kasa Społeczna", type: "community-chest" },
    { name: "Ulica Focha", price: 320, color: "#008000", type: "property", housePrice: 200, rent: [28, 150, 450, 1000, 1200, 1400] },
    { name: "Kolej Wschodnia", price: 200, type: "railroad" },
    { name: "Szansa", type: "chance" },
    { name: "Ulica Reymonta", price: 350, color: "#0000ff", type: "property", housePrice: 200, rent: [35, 175, 500, 1100, 1300, 1500] },
    { name: "Podatek od Luksusu", type: "tax", amount: 100 },
    { name: "Aleja Mickiewicza", price: 400, color: "#0000ff", type: "property", housePrice: 200, rent: [50, 200, 600, 1400, 1700, 2000] }
];

const chanceCards = [
    { text: "Idź na Start (Pobierz $200)", action: "move", position: 0 },
    { text: "Idź do Więzienia. Nie przechodź przez Start, nie pobieraj $200.", action: "move", position: 10, jail: true },
    { text: "Idź na Pola Elizejskie.", action: "move", position: 39 },
    { text: "Idź do Kolei Zachodnich. Jeśli przejdziesz przez Start, pobierz $200.", action: "move", position: 15 },
    { text: "Bank płaci Ci dywidendę w wysokości $50.", action: "money", amount: 50 },
    { text: "Wychodzisz z więzienia za darmo. Tę kartę można zachować do późniejszego użycia lub sprzedać.", action: "get-out-of-jail" },
    { text: "Cofnij się o 3 pola.", action: "move_relative", amount: -3 },
    { text: "Zapłać grzywnę za przekroczenie prędkości w wysokości $15.", action: "money", amount: -15 },
    { text: "Twoja pożyczka budowlana dojrzewa. Pobierz $150.", action: "money", amount: 150 },
    { text: "Zostałeś wybrany na przewodniczącego zarządu. Zapłać każdemu graczowi $50.", action: "pay_players", amount: 50 }
];

const communityChestCards = [
    { text: "Idź na Start (Pobierz $200)", action: "move", position: 0 },
    { text: "Błąd banku na Twoją korzyść. Pobierz $200.", action: "money", amount: 200 },
    { text: "Opłata lekarska. Zapłać $50.", action: "money", amount: -50 },
    { text: "Ze sprzedaży akcji otrzymujesz $50.", action: "money", amount: 50 },
    { text: "Wychodzisz z więzienia za darmo. Tę kartę można zachować do późniejszego użycia lub sprzedać.", action: "get-out-of-jail" },
    { text: "Idź do Więzienia. Nie przechodź przez Start, nie pobieraj $200.", action: "move", position: 10, jail: true },
    { text: "Zwrot podatku dochodowego. Pobierz $20.", action: "money", amount: 20 },
    { text: "Masz urodziny. Pobierz $10 od każdego gracza.", action: "collect_from_players", amount: 10 },
    { text: "Zajmujesz drugie miejsce w konkursie piękności. Pobierz $10.", action: "money", amount: 10 },
    { text: "Otrzymujesz spadek w wysokości $100.", action: "money", amount: 100 }
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
        auction: null,
        log: []
    };
}

function logEvent(gameState, message) {
    gameState.log.push(message);
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
        logEvent(gameState, `${currentPlayer.nickname} wyrzucił ${die1} i ${die2}`);

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
            logEvent(gameState, `${player.nickname} kupił ${tile.name}`);
            io.to(roomName).emit('game-state-update', gameState);
        }
    } else if (action === 'build-house') {
        const { tilePosition } = data;
        const player = gameState.players[socket.id];
        const tile = boardLayout[tilePosition];
        const tileState = gameState.boardState[tilePosition];
        const housePrice = tile.housePrice;

        const colorGroup = boardLayout.filter(t => t.color === tile.color);
        const hasMonopoly = colorGroup.every(t => gameState.boardState[boardLayout.indexOf(t)].owner === socket.id);

        const housesInGroup = colorGroup.map(t => gameState.boardState[boardLayout.indexOf(t)].houses);
        const minHouses = Math.min(...housesInGroup);

        const canBuild = tileState.houses === minHouses;

        if (hasMonopoly && player.money >= housePrice && tileState.houses < 5 && canBuild) {
            player.money -= housePrice;
            tileState.houses++;
            io.to(roomName).emit('game-state-update', gameState);
        }
    } else if (action === 'propose-trade') {
        const { targetId, offer } = data;
        io.to(targetId).emit('trade-offer', { fromId: socket.id, fromNickname: gameState.players[socket.id].nickname, offer });
    } else if (action === 'accept-trade') {
        const { fromId, offer } = data;
        const player1 = gameState.players[socket.id];
        const player2 = gameState.players[fromId];

        // Transfer money
        player1.money += offer.moneyFrom2;
        player2.money -= offer.moneyFrom2;
        player2.money += offer.moneyFrom1;
        player1.money -= offer.moneyFrom1;

        // Transfer properties
        offer.propertiesFrom1.forEach(propIndex => {
            player1.properties = player1.properties.filter(p => p !== propIndex);
            player2.properties.push(propIndex);
            gameState.boardState[propIndex].owner = fromId;
        });
        offer.propertiesFrom2.forEach(propIndex => {
            player2.properties = player2.properties.filter(p => p !== propIndex);
            player1.properties.push(propIndex);
            gameState.boardState[propIndex].owner = socket.id;
        });

        io.to(roomName).emit('game-state-update', gameState);
    } else if (action === 'decline-trade') {
        const { fromId } = data;
        io.to(fromId).emit('notification', { text: 'Trade offer declined.' });
    } else if (action === 'mortgage-property') {
        const { tilePosition } = data;
        const player = gameState.players[socket.id];
        const tile = boardLayout[tilePosition];
        const tileState = gameState.boardState[tilePosition];

        if (tileState.owner === socket.id && !tileState.mortgaged) {
            tileState.mortgaged = true;
            player.money += tile.price / 2;
            io.to(roomName).emit('game-state-update', gameState);
        }
    } else if (action === 'unmortgage-property') {
        const { tilePosition } = data;
        const player = gameState.players[socket.id];
        const tile = boardLayout[tilePosition];
        const tileState = gameState.boardState[tilePosition];
        const unmortgageCost = (tile.price / 2) * 1.1;

        if (tileState.owner === socket.id && tileState.mortgaged && player.money >= unmortgageCost) {
            tileState.mortgaged = false;
            player.money -= unmortgageCost;
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
                const message = `${player.nickname} zapłacił $${rent} czynszu dla ${owner.nickname}`;
                logEvent(gameState, message);
                io.to(roomName).emit('notification', { text: message });
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
            drawCard(gameState.chanceDeck, player, io, room, roomName);
            break;
        case 'community-chest':
            drawCard(gameState.communityChestDeck, player, io, room, roomName);
            break;
    }
}

function drawCard(deck, player, io, room, roomName) {
    const card = deck.shift();
    deck.push(card); // Wraca na spód talii

    logEvent(room.gameState, `${player.nickname} wylosował kartę: ${card.text}`);
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
        case 'move_relative':
            player.position = (player.position + card.amount + 40) % 40;
            break;
        case 'pay_players':
            for (const otherPlayerId in room.gameState.players) {
                if (otherPlayerId !== player.id) {
                    player.money -= card.amount;
                    room.gameState.players[otherPlayerId].money += card.amount;
                }
            }
            break;
        case 'collect_from_players':
            for (const otherPlayerId in room.gameState.players) {
                if (otherPlayerId !== player.id) {
                    player.money += card.amount;
                    room.gameState.players[otherPlayerId].money -= card.amount;
                }
            }
            break;
    }
}

function calculateRent(tile, tileState, owner, gameState) {
    if (tile.type === 'property') {
        const rentIndex = tileState.houses;
        return tile.rent[rentIndex];
    } else if (tile.type === 'railroad') {
        const railroadCount = owner.properties.filter(p => boardLayout[p].type === 'railroad').length;
        return 25 * Math.pow(2, railroadCount - 1);
    } else if (tile.type === 'utility') {
        const utilityCount = owner.properties.filter(p => boardLayout[p].type === 'utility').length;
        const diceRoll = gameState.dice[0] + gameState.dice[1];
        return utilityCount === 1 ? diceRoll * 4 : diceRoll * 10;
    }
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
