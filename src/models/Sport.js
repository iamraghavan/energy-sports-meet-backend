const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sport = sequelize.define('Sport', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('Individual', 'Team'),
        allowNull: false
    },
    max_players: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    timestamps: false,
    tableName: 'sports'
});

module.exports = Sport;
