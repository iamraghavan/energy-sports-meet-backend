const { College } = require('../models');

exports.createCollege = async (req, res) => {
    try {
        const { name, city, state } = req.body;
        const college = await College.create({ name, city, state });
        res.status(201).json(college);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllColleges = async (req, res) => {
    try {
        const colleges = await College.findAll();
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
