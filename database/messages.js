import mongoose from "mongoose";

const messagesField = new mongoose.Schema({
    type: {type: String, required: true, unique: false},
    from: {type: String, required: true, unique: false},
    id: {type: Number, required: true, unique: false},
    to: {type: String, required: true, unique: false},
    date: {type: String, required: true, unique: false},
    color: {type: String, required: true, unique: false},
    text: {type: String, required: true, unique: false}
})

/* type: 'direct-message',
                from: mainUser.username,
                to: requestedUser.username,
                date: dateCreated(),
                color: mainUser.color,
                text: message.text */


export default mongoose.model('Messages', messagesField)
