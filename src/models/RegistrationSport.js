const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistrationSport = sequelize.define('RegistrationSport', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    registration_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    sport_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'registration_sports'
});

module.exports = RegistrationSport;
