const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true,
        trim: true
    },
    orgType: {
        type: String,
        required: true,
        enum: ['ngo', 'government', 'corporate', 'research', 'individual', 'other']
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    credits: {
        type: Number,
        default: 100
    },
    totalCreditsEarned: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
