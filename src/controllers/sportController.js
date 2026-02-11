const { Sport } = require('../models');

exports.createSport = async (req, res) => {
    try {
        const { name, type, max_players, amount } = req.body;
        const sport = await Sport.create({ name, type, max_players, amount });
        res.status(201).json(sport);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllSports = async (req, res) => {
    try {
        const sports = await Sport.findAll();
        res.json(sports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
