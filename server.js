import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { serverConnection } from './websocket.js';
import bcrypt from 'bcrypt';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dbConnection from './database/db.js';
import Users from './database/users.js';
import Messages from './database/messages.js';
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const PORT = process.env.PORT;

app.use((req, res, next) => {
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5500')
    res.setHeader('Access-Control-Allow-Origin', 'https://maromaro792009-tech.github.io');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next()
});

const sessionParser = session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
})
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionParser);
server.on('upgrade', (req, socket, head) => {
    sessionParser(req, {}, () => {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        })
    })
})
dbConnection()
wss.on('connection', (socket, req) => {
    serverConnection(socket, req);
})

app.options('/', (req, res) => {
    res.status(204).end();
})

app.post('/api/users', async (req, res) => {
    const { username } = req.body
    const userExists = await Users.findOne({ username: username })
    if (!userExists) {
        return res.status(409).json({ msg: "User does not exist!" });
    }
    res.status(200).json({ msg: "Process succeeded!" });
})

app.get('/api/friends', async (req, res) => {
    const mainUser = await Users.findOne({ id: req.session.userId });
    if (!mainUser) return;
    const neededData = await Users.find({ friends: { $elemMatch: { username: mainUser.username } } }, { username: true, color: true, status: true })
    res.status(200).json(neededData);
})

let profileColors = ['cyan', 'red', 'green', 'lime', 'pink', 'purple', 'yellow', 'gold', 'blue', 'orange', 'brown', 'black', 'gray']
app.post('/api/users/signup', async (req, res) => {
    const { username, password } = req.body;
    if (username.trim() === '' ||  password.trim() === '') { return res.status(409).json({ msg: "There's no username or password" }) }
    if (username.trim().match(/[^\w+]/) || username.trim().includes('+')) { return res.status(409).json({ msg: "Cannot validate special characters" }) }
    if (username.length <= 3) { return res.status(409).json({ msg: "Username is short!" }) }
    if (username.length > 14) { return res.status(409).json({ msg: "Username is too long!" }) }
    if (password.length > 15) { return res.status(409).json({ msg: "Password is too long!" }) }
    if (password.length < 5) { return res.status(409).json({ msg: "Password is short!" }) }
    const usernameExists = await Users.findOne({ username: username })
    if (usernameExists) { return res.status(409).json({ msg: "Username already exists" }); }
    const hash = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
        username: username,
        id: Date.now(),
        password: hash,
        color: profileColors[Math.floor(Math.random() * profileColors.length)],
        status: "online",
        friends: [],
        requests: []
    });
    const specificUser = await Users.findOne({ username: username })
    req.session.userId = specificUser.id
    res.status(200).json(specificUser);
})

app.post('/api/users/login', async (req, res) => {
        const { username, password } = req.body;
        if (username.trim() === '' ||  password.trim() === '') { return res.status(409).json({ msg: "There's no username or password" }) }
        const specificUser = await Users.findOne({ username: username })
        if (!specificUser) { return res.status(409).json({ msg: "Username or password is incorrect" }); }
        const isValid = await bcrypt.compare(password, specificUser.password);
        if (!isValid) { return res.status(409).json({ msg: "Username or password is incorrect" }); }
        req.session.userId = specificUser.id
        res.status(200).json(specificUser)
})

app.get('/api/users/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ msg: "Make an account or log in" });
    }
    const specificUser = await Users.findOne({ id: req.session.userId })
    res.status(200).json(specificUser);
});

app.get('/api/users/remove', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
    })
})

app.delete('/api/users/fullDelete', async (req, res) => {
    const mainUser = await Users.findOne({ id: req.session.userId });
    const deleteUser = await Users.deleteOne({ id: req.session.userId });
    const deleteFriends = await Users.updateMany({}, { $pull: { friends: { id: req.session.userId } } });
    const deleteMessages = await Messages.deleteMany({ $or: [{ from: mainUser.username }, { to: mainUser.username }] });
    const deleteRequests = await Users.updateMany({}, { $pull: { requests: { from: mainUser.username } } })
    req.session.destroy((err) => {
        if (err) throw err;
    })
})

app.get('/api/users/:friend', async (req, res) => {
    let friendUsername = req.params.friend;
    const mainUser = await Users.findOne({ id: req.session.userId });
    const neededMessages = await Messages.find({ $or: [{ from: mainUser.username, to: friendUsername }, { to: mainUser.username, from: friendUsername }] });         
    res.status(200).json(neededMessages);
}) 

server.listen(PORT);
