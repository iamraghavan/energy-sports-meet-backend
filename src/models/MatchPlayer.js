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
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onDelete: 'CASCADE'
    },
    team_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' }
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' }
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
