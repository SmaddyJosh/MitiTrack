const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');




router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, organization, orgType, country } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists with this email address.' });
        }

        user = new User({
            firstName,
            lastName,
            email,
            password,
            organization,
            orgType,
            country
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'mititrack_secret_jwt_key_12345';
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        organization: user.organization
                    }
                });
            }
        );
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});




router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'mititrack_secret_jwt_key_12345';
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        organization: user.organization
                    }
                });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

module.exports = router;
