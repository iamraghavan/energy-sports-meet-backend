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
    short_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    college_contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    college_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pd_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pd_whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'colleges'
});

module.exports = College;
