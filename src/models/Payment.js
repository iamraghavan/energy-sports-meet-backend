const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    registration_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    txn_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    screenshot_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    verified_by: {
        type: DataTypes.STRING,
        allowNull: true // Admin ID
    },
    verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'payments'
});

module.exports = Payment;
