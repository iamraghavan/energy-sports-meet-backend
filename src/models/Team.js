const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Team = sequelize.define('Team', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sport_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    registration_id: {
        type: DataTypes.UUID,
        allowNull: false // Linked to the purchase/entry
    },
    college_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    team_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    captain_id: {
        type: DataTypes.UUID,
        allowNull: true // Assigned later when adding members
    },
    locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    tableName: 'teams'
});

module.exports = Team;
