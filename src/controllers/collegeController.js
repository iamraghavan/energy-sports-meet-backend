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

exports.bulkCreateColleges = async (req, res) => {
    try {
        const colleges = req.body; // Expecting an array of objects
        if (!Array.isArray(colleges)) {
            return res.status(400).json({ error: 'Request body must be an array of colleges' });
        }
        const createdColleges = await College.bulkCreate(colleges);
        res.status(201).json({
            message: `${createdColleges.length} colleges added successfully`,
            colleges: createdColleges
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
