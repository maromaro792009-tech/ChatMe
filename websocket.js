import Users from './database/users.js';
import Messages from './database/messages.js';

function dateCreated() {
    let date = new Date();
    let t = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes()
    }
    let daytime;
    t.month == 0 ? t.month == 12 : t.month;
    t.hour <= 11 && t.hour !== 0 ? daytime = 'AM' : daytime = 'PM';
    t.hour >= 13 ? t.hour -= 12 : t.hour;
    t.hour == 0 ? t.hour = 12 : t.hour;
    t.hour <= 9 ? t.hour = `0${t.hour}` : t.hour;
    t.minute <= 9 ? t.minute = `0${t.minute}` : t.minute;
    return `${t.hour}:${t.minute} ${daytime} ${t.day}/${t.month}/${t.year}`
}

const clients = new Map()
export const serverConnection = (socket, req) => {
    const removeClient = async () => {
        if (req.session.userId !== null && clients.get(req.session.userId) === socket) {
            const user = await Users.findOne({ id: req.session.userId })
            if (user == null) return;
            const updateStatus = await Users.updateOne({ id: req.session.userId }, { $set: { status: 'offline' } })
                for (const client of clients) {
                clients.get(client[0]).send(JSON.stringify({
                    type: "status",
                    user: user.username,
                    state: 'offline'
                }))
                }
                clients.delete(req.session.userId);
        }
        }
    socket.on('message', async (data) => {
        if (typeof (JSON.parse(data)) !== 'object') return;
        const message = JSON.parse(data);
        if (message.type == 'identity') {
           clients.set(req.session.userId, socket)
            const user = await Users.findOne({ id: req.session.userId })
            if (user == null) return;
            const updateStatus = await Users.updateOne({ id: req.session.userId }, { $set: { status: 'online' } })
                for (const client of clients) {
                clients.get(client[0]).send(JSON.stringify({
                    type: "status",
                    user: user.username,
                    state: 'online'
                }))
            }
        };
        if (message.type == 'contact-request') {
            const mainUser = await Users.findOne({ id: req.session.userId })
            const requestedUser = await Users.findOne({ username: message.to })
            if (mainUser == null) return;
            if (requestedUser == null) return;
            const data = {
                type: 'contact-request',
                from: mainUser.username,
                to: requestedUser.username,
                state: 'pending'
            }
            const mainUserRequest = await Users.updateOne({ id: req.session.userId }, { $push: { requests: data } })
            const requestedUserRequest = await Users.updateOne({ username: message.to }, { $push: { requests: data } })
            let neededUser = clients.get(requestedUser.id)
            let user = clients.get(req.session.userId)
            if (neededUser) { neededUser.send(JSON.stringify(data)) }
            if (user) { user.send(JSON.stringify(data)) }
        };
        if (message.type == 'response-to-request') {
            const mainUser = await Users.findOne({ id: req.session.userId })
            const requestedUser = await Users.findOne({ username: message.to })
            if (mainUser == null) return;
            if (requestedUser == null) return;
            let neededUser = clients.get(requestedUser.id)
            let user = clients.get(req.session.userId);
            const userDeleteRequest = await Users.updateOne({ id: req.session.userId }, { $pull: { requests: { $or: [{ to: mainUser.username, from: requestedUser.username }, { from: mainUser.username, to: requestedUser.username }] } } })
            const requestedUserDeleteRequest = await Users.updateOne({ username: requestedUser.username }, { $pull: { requests: { $or: [{ to: mainUser.username, from: requestedUser.username }, { from: mainUser.username, to: requestedUser.username }] } } })
            if (message.state == 'declined') {
                const data = {
                    type: 'response-to-request',
                    from: mainUser.username,
                    to: requestedUser.username,
                    state: "declined"
                }
                if (neededUser) { neededUser.send(JSON.stringify(data)) }
                if (user) { user.send(JSON.stringify(data)) }
            } if (message.state == 'accepted') {
                const userAddFriend = await Users.updateOne({ id: req.session.userId }, { $push: { friends: {
                    username: requestedUser.username,
                    id: requestedUser.id,
                    color: requestedUser.color
                } } });
                const requestedUserAddFriend = await Users.updateOne({ username: requestedUser.username }, { $push: { friends: {
                    username: mainUser.username,
                    id: mainUser.id,
                    color: mainUser.color
                } } });
                if (neededUser) { neededUser.send(JSON.stringify({
                    type: 'response-to-request',
                    state: 'accepted',
                    username: mainUser.username,
                    id: mainUser.id,
                    color: mainUser.color
                })) }
                if (user) { user.send(JSON.stringify({
                    type: 'response-to-request',
                    state: 'accepted',
                    username: requestedUser.username,
                    id: requestedUser.id,
                    color: requestedUser.color
                })) }
            }
        }; if (message.type == 'logout') {
            if (clients.get(req.session.userId) === socket) {
            const user = await Users.findOne({ id: req.session.userId })
            const updateStatus = await Users.updateOne({ id: req.session.userId }, { $set: { status: 'offline' } })
                for (const client of clients) {
                clients.get(client[0]).send(JSON.stringify({
                    type: "status",
                    user: user.username,
                    state: 'offline'
                }))
            }
            clients.delete(req.session.userId);
          }
        }; if (message.type == 'direct-message') {
           const mainUser = await Users.findOne({ id: req.session.userId })
           const requestedUser = await Users.findOne({ username: message.to })
           if (mainUser == null) return;
           if (requestedUser == null) return;
           let neededUser = clients.get(requestedUser.id)
           let user = clients.get(req.session.userId)
           const isFriend = await Users.findOne({ $and: [{friends: { $elemMatch: { username: mainUser.username } } }, { username: requestedUser.username }] })
           if (isFriend.id !== requestedUser.id) return;
           if (message.text.trim() == '' || typeof (message.text) !== 'string' || message.text.length > 2000) return;
           const data = { 
                type: 'direct-message',
                from: mainUser.username,
                id: mainUser.id,
                to: requestedUser.username,
                date: dateCreated(),
                color: mainUser.color,
                text: message.text 
            }
            const newMessage = await Messages.create(data)
           if (neededUser) { neededUser.send(JSON.stringify(data)) }
           if (user) { user.send(JSON.stringify(data)) }
        }; if (message.type == 'end-friendship') {
            const mainUser = await Users.findOne({ id: req.session.userId })
            const friend = await Users.findOne({ username: message.to })
            if (mainUser == null) return;
            if (friend == null) return;
            const deleteFriend1 = await Users.updateOne({ username: mainUser.username }, { $pull: { friends: { username: friend.username } } })
            const deleteFriend2 = await Users.updateOne({ username: friend.username }, { $pull: { friends: { username: mainUser.username } } })
            const removeTheirMessages = await Messages.deleteMany({ $or: [{ from: mainUser.username, to: friend.username}, { from: friend.username, to: mainUser.username }] })
            let neededUser = clients.get(friend.id)
            let user = clients.get(req.session.userId);
            const data = {
                type: "end-friendship",
                from: mainUser.username,
                to: friend.username
            }
            if (neededUser) { neededUser.send(JSON.stringify(data)) }
            if (user) { user.send(JSON.stringify(data)) }
        }
    });
    socket.on('error', async (err) => {
        removeClient()
    })
    socket.on('close', async () => {
        removeClient()
    })
}
