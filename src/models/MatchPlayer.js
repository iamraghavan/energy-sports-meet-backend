const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MatchPlayer = sequelize.define('MatchPlayer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    match_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    team_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    is_substitute: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Dynamic stats: { runs: 50, wickets: 2 } or { goals: 1, assists: 2 }
    performance_stats: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    timestamps: true,
    tableName: 'match_players'
});

module.exports = MatchPlayer;
