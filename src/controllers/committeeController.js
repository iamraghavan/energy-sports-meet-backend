const { Registration, Student, College, Sport } = require('../models');

// @desc    List registrations for Committee
// @access  Private (Committee/Admin)
exports.getRegistrations = async (req, res) => {
    try {
        const { search, sport_id, status } = req.query;
        let where = {};

        if (sport_id) where.sport_id = sport_id;
        if (status) where.status = status;

        const registrations = await Registration.findAll({
            where,
            include: [
                { model: Student, where: search ? { name: { [require('sequelize').Op.like]: `%${search}%` } } : {} },
                { model: Sport }
            ],
            limit: 50,
            order: [['createdAt', 'DESC']]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Toggle student check-in
// @access  Private (Committee/Admin)
exports.updateCheckIn = async (req, res) => {
    try {
        const registration = await Registration.findByPk(req.params.id);
        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        registration.checked_in = !registration.checked_in;
        registration.checkin_time = registration.checked_in ? new Date() : null;
        await registration.save();

        res.json({
            message: `Student ${registration.checked_in ? 'checked in' : 'unchecked'} successfully`,
            checked_in: registration.checked_in
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
