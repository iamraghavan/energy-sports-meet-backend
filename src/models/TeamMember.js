const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    team_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Player', 'Captain', 'Vice-Captain'),
        defaultValue: 'Player'
    },
    // Sport Specific Details (Mainly for Cricket)
    sport_role: {
        type: DataTypes.STRING, // Batsman, Bowler, All-rounder, Wicket Keeper
        allowNull: true
    },
    batting_style: {
        type: DataTypes.STRING, // Right Hand, Left Hand
        allowNull: true
    },
    bowling_style: {
        type: DataTypes.STRING, // Right Arm Fast, Left Arm Spin, etc.
        allowNull: true
    },
    is_wicket_keeper: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    additional_details: {
        type: DataTypes.JSON, // For other sports like position in Football/Kabaddi
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'team_members'
});

module.exports = TeamMember;
