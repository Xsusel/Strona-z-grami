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

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Nowy użytkownik dołączył');

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        console.log(`Użytkownik ustawił nick: ${nickname}`);
        socket.emit('nickname-set');
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik opuścił grę');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});
