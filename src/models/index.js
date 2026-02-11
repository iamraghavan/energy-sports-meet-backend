const sequelize = require('../config/database');
const Student = require('./Student');
const College = require('./College');
const Sport = require('./Sport');
const Team = require('./Team');
const Registration = require('./Registration');
const Payment = require('./Payment');

// Associations

// Student - College
College.hasMany(Student, { foreignKey: 'college_id' });
Student.belongsTo(College, { foreignKey: 'college_id' });

// Team - Sport
Sport.hasMany(Team, { foreignKey: 'sport_id' });
Team.belongsTo(Sport, { foreignKey: 'sport_id' });

// Team - Student (Captain)
Student.hasMany(Team, { foreignKey: 'captain_id' });
Team.belongsTo(Student, { foreignKey: 'captain_id', as: 'Captain' });

// Registration - Student
Student.hasMany(Registration, { foreignKey: 'student_id' });
Registration.belongsTo(Student, { foreignKey: 'student_id' });

// Registration - Sport
Sport.hasMany(Registration, { foreignKey: 'sport_id' });
Registration.belongsTo(Sport, { foreignKey: 'sport_id' });

// Registration - Team
Team.hasMany(Registration, { foreignKey: 'team_id' });
Registration.belongsTo(Team, { foreignKey: 'team_id' });

// Payment - Registration
Registration.hasOne(Payment, { foreignKey: 'registration_id' });
Payment.belongsTo(Registration, { foreignKey: 'registration_id' });

module.exports = {
    sequelize,
    Student,
    College,
    Sport,
    Team,
    Registration,
    Payment
};
