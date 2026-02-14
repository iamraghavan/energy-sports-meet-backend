const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Registration = sequelize.define('Registration', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    registration_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: true // Optional if PD is registering only college details first
    },
    college_id: {
        type: DataTypes.INTEGER,
        allowNull: true // references Colleges table
    },
    college_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    college_city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    college_state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pd_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pd_whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    college_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    college_contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    team_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    is_captain: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    accommodation_needed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'registrations'
});

module.exports = Registration;
