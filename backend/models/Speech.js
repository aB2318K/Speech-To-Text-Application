const mongoose = require('mongoose');

const speechModel = new mongoose.Schema({
    title: { type: String, required: true },
    data: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
}, { timestamps: true });

module.exports = mongoose.model('Speech', speechModel);