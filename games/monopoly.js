
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
            getOutOfJailFreeCards: 0
        };
    });

    return {
        players,
        boardState: boardLayout.map(() => ({ owner: null, houses: 0 })),
        currentPlayerIndex: 0,
        dice: [0, 0],
        turnInProgress: false
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
    if (socket.id !== currentPlayerId) return; // Nie jest tura tego gracza

    if (action === 'roll-dice') {
        gameState.turnInProgress = true;
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        gameState.dice = [die1, die2];

        const currentPlayer = gameState.players[currentPlayerId];
        currentPlayer.position = (currentPlayer.position + die1 + die2) % 40;

        // Logika po wylądowaniu na polu
        // ... do implementacji

        // Zmiana tury
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerIds.length;
        gameState.turnInProgress = false;

        io.to(roomName).emit('game-state-update', gameState);
    }
}

function handleDisconnect(io, room, roomName) {
    // Logika rozłączenia
}

module.exports = {
    startGame,
    handleAction,
    handleDisconnect
};
