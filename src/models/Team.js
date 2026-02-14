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
        allowNull: false,
        references: { model: 'sports', key: 'id' }
    },
    registration_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'registrations', key: 'id' },
        onDelete: 'CASCADE'
    },
    college_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'colleges', key: 'id' }
    },
    team_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    captain_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'students', key: 'id' }
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
