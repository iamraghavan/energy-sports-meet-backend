const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sport_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sports', key: 'id' }
    },
    team_a_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' }
    },
    team_b_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' }
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'live', 'completed'),
        defaultValue: 'scheduled'
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Flexible score storage (e.g., { team_a: 10, team_b: 5 } or { team_a: "120/2", team_b: "110/5" })
    score_details: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    // Timeline of events (e.g., ball-by-ball, goal logs)
    match_events: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    // Transient state: { striker_id, non_striker_id, bowler_id, current_innings: 1 }
    match_state: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    winner_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    referee_name: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'matches'
});

module.exports = Match;
