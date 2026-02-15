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
    // Student Profile Data
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: false
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    year_of_study: {
        type: DataTypes.STRING,
        allowNull: true
    },
    other_college: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Authentication Fields
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otp_expiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    college_id: {
        type: DataTypes.INTEGER,
        allowNull: true
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
        allowNull: true
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
    // Check-In Fields
    checked_in: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    checkin_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    kit_delivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    id_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
