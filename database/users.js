import mongoose from "mongoose";

const usersField = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    id: {type: Number, required: true, unique: true},
    password: {type: String, required: true, unique: false},
    color: {type: String, required: true, unique: false},
    status: {type: String, required: true, unique: false},
    friends: {type: Object, required: true, unique: false},
    requests: {type: Object, required: true, unique: false}
})

export default mongoose.model('Users', usersField)
