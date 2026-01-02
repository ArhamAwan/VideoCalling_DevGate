const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const signaling = require('./signaling');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.send('WebRTC Signaling Server is running');
});

signaling(io);

const PORT = 5000;
server.listen(PORT, () => 
    console.log(`Server is running on http://localhost:${PORT}`));
