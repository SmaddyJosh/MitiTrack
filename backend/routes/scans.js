const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ScanResult = require('../models/ScanResult');




router.post('/', auth, async (req, res) => {
    const {
        locationName,
        coordinates,
        deforestationRiskScore,
        forestCoveragePct,
        deforestedPct,
        totalDetections,
        classCounts,
        carbon,
        suitability,
        annotatedImage
    } = req.body;

    try {
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        
        if (user.credits <= 0) {
            return res.status(400).json({ error: 'Insufficient credits. Please upgrade your plan to run more scans.' });
        }

        user.credits -= 1;

        
        const earnedCredits = carbon && carbon.estimated_carbon_credits ? Number(carbon.estimated_carbon_credits) : 0;
        user.totalCreditsEarned += earnedCredits;
        await user.save();

        
        
        const formattedCarbon = carbon ? {
            canopyAreaHectares: carbon.canopy_area_hectares || 0,
            estimatedCarbonTonnes: carbon.estimated_carbon_tonnes || 0,
            estimatedCarbonCredits: carbon.estimated_carbon_credits || 0,
            creditValueUsd: carbon.credit_value_usd || 0
        } : null;

        const formattedSuitability = suitability ? {
            suitability: suitability.suitability || 'Unknown',
            soilType: suitability.soil_type || 'Unknown',
            reason: suitability.reason || ''
        } : null;

        const scan = new ScanResult({
            user: req.user.id,
            locationName,
            coordinates,
            deforestationRiskScore: deforestationRiskScore || 0,
            forestCoveragePct: forestCoveragePct || 0,
            deforestedPct: deforestedPct || 0,
            totalDetections: totalDetections || 0,
            classCounts: classCounts || {},
            carbon: formattedCarbon,
            suitability: formattedSuitability,
            annotatedImage
        });

        await scan.save();

        res.status(201).json({
            message: 'Scan saved successfully',
            scan,
            user: {
                id: user.id,
                credits: user.credits,
                totalCreditsEarned: user.totalCreditsEarned
            }
        });

    } catch (err) {
        console.error('Save scan error:', err.message);
        res.status(500).json({ error: 'Server error saving scan result.' });
    }
});




router.get('/', auth, async (req, res) => {
    try {
        const scans = await ScanResult.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select('-annotatedImage'); 
        res.json(scans);
    } catch (err) {
        console.error('Fetch scans error:', err.message);
        res.status(500).json({ error: 'Server error fetching scans.' });
    }
});




router.get('/scan/:id', auth, async (req, res) => {
    try {
        const scan = await ScanResult.findOne({ _id: req.params.id, user: req.user.id });
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found or unauthorized' });
        }
        res.json(scan);
    } catch (err) {
        console.error('Fetch single scan error:', err.message);
        res.status(500).json({ error: 'Server error fetching scan details.' });
    }
});




router.delete('/:id', auth, async (req, res) => {
    try {
        const scan = await ScanResult.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found or unauthorized' });
        }
        res.json({ message: 'Scan deleted successfully' });
    } catch (err) {
        console.error('Delete scan error:', err.message);
        res.status(500).json({ error: 'Server error deleting scan.' });
    }
});




router.get('/stats', auth, async (req, res) => {
    try {
        const userIdObj = new mongoose.Types.ObjectId(req.user.id);
        
        
        const user = await User.findById(req.user.id).select('credits totalCreditsEarned');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        
        const aggregateStats = await ScanResult.aggregate([
            { $match: { user: userIdObj } },
            {
                $group: {
                    _id: null,
                    totalAreaHectares: { $sum: '$carbon.canopyAreaHectares' },
                    totalCarbonTonnes: { $sum: '$carbon.estimatedCarbonTonnes' },
                    totalCredits: { $sum: '$carbon.estimatedCarbonCredits' },
                    totalValueUsd: { $sum: '$carbon.creditValueUsd' },
                    avgRiskScore: { $avg: '$deforestationRiskScore' },
                    totalScans: { $sum: 1 }
                }
            }
        ]);

        const stats = aggregateStats[0] || {
            totalAreaHectares: 0,
            totalCarbonTonnes: 0,
            totalCredits: 0,
            totalValueUsd: 0,
            avgRiskScore: 0,
            totalScans: 0
        };

        
        const trendData = await ScanResult.find({ user: req.user.id })
            .sort({ createdAt: 1 })
            .limit(10)
            .select('createdAt forestCoveragePct deforestationRiskScore locationName');

        res.json({
            credits: user.credits,
            totalCreditsEarned: user.totalCreditsEarned,
            stats: {
                totalAreaHectares: Math.round((stats.totalAreaHectares || 0) * 100) / 100,
                totalCarbonTonnes: Math.round((stats.totalCarbonTonnes || 0) * 100) / 100,
                totalCredits: Math.round((stats.totalCredits || 0) * 100) / 100,
                totalValueUsd: Math.round((stats.totalValueUsd || 0) * 100) / 100,
                avgRiskScore: Math.round(stats.avgRiskScore || 0),
                totalScans: stats.totalScans || 0
            },
            trend: trendData
        });

    } catch (err) {
        console.error('Fetch stats error:', err.message);
        res.status(500).json({ error: 'Server error calculating statistics.' });
    }
});

module.exports = router;
