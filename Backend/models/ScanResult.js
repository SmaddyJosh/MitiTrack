const mongoose = require('mongoose');

const ScanResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    locationName: {
        type: String,
        required: true
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    deforestationRiskScore: {
        type: Number,
        required: true
    },
    forestCoveragePct: {
        type: Number,
        required: true
    },
    deforestedPct: {
        type: Number,
        required: true
    },
    totalDetections: {
        type: Number,
        default: 0
    },
    classCounts: {
        type: Map,
        of: Number
    },
    carbon: {
        canopyAreaHectares: Number,
        estimatedCarbonTonnes: Number,
        estimatedCarbonCredits: Number,
        creditValueUsd: Number
    },
    suitability: {
        suitability: String,
        soilType: String,
        reason: String
    },
    annotatedImage: {
        type: String 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ScanResult', ScanResultSchema);
