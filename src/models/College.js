const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const College = sequelize.define('College', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'colleges'
});

module.exports = College;
