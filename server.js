const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/disconnect') {
        const ip = req.socket.remoteAddress;
        const client = [...clients.entries()].find(([ws, { ipAddress }]) => ipAddress === ip);

        if (client) {
            const [ws, userData] = client;

            broadcast(`${userData.nickname} залишив чат.`, userData.nickname, userData.color);

            ws.close();
            clients.delete(ws); 

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Відключення успішне');
            console.log(`${userData.nickname} відключився через HTTP-запит`);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Користувач не знайдений');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Маршрут не знайдений');
    }
});

const wsServer = new WebSocket.Server({ server });
const clients = new Map();
let userCount = 0;

wsServer.on('connection', (ws, req) => {
    userCount++;
    const nickname = `user#${String(userCount).padStart(4, '0')}`;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const ipAddress = req.socket.remoteAddress;

    clients.set(ws, { nickname, color, ipAddress });

    console.log(`${nickname} приєднався до чату`);
    broadcast(`${nickname} приєднався до чату.`, nickname, color);

    ws.on('message', (data) => {
        const message = JSON.parse(data).message;
        console.log(`[${nickname}]: ${message}`);
        broadcast(message, nickname, color);
    });

    ws.on('close', () => {
        const user = clients.get(ws);
        if (user) {
            console.log(`${user.nickname} залишив чат`);
            broadcast(`${user.nickname} залишив чат.`, user.nickname, user.color);
            clients.delete(ws);
        }
    });

    ws.on('error', (error) => {
        console.error('Помилка WebSocket:', error);
    });
});

function broadcast(message, nickname, color) {
    const data = JSON.stringify({ message, nickname, color });
    clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

server.listen(3000, () => {
    console.log('Сервер чату запущений на http://localhost:3000');
});
