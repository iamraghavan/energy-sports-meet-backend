const sequelize = require('../config/database');
const Student = require('./Student');
const College = require('./College');
const Sport = require('./Sport');
const Team = require('./Team');
const Registration = require('./Registration');
const Payment = require('./Payment');
const User = require('./User');

const Match = require('./Match');
const MatchPlayer = require('./MatchPlayer');
const RegistrationSport = require('./RegistrationSport');

// Associations

// Student - College
College.hasMany(Student, { foreignKey: 'college_id' });
Student.belongsTo(College, { foreignKey: 'college_id' });

// Registration - College
College.hasMany(Registration, { foreignKey: 'college_id' });
Registration.belongsTo(College, { foreignKey: 'college_id' });

// Team - Sport
Sport.hasMany(Team, { foreignKey: 'sport_id' });
Team.belongsTo(Sport, { foreignKey: 'sport_id' });

// Team - Student (Captain)
Student.hasMany(Team, { foreignKey: 'captain_id' });
Team.belongsTo(Student, { foreignKey: 'captain_id', as: 'Captain' });

// Registration - Student
Student.hasMany(Registration, { foreignKey: 'student_id' });
Registration.belongsTo(Student, { foreignKey: 'student_id' });

// Registration <-> Sport (Many-to-Many via RegistrationSport)
Registration.belongsToMany(Sport, { through: RegistrationSport, foreignKey: 'registration_id' });
Sport.belongsToMany(Registration, { through: RegistrationSport, foreignKey: 'sport_id' });

// Direct access for join table
Registration.hasMany(RegistrationSport, { foreignKey: 'registration_id' });
RegistrationSport.belongsTo(Registration, { foreignKey: 'registration_id' });

Sport.hasMany(RegistrationSport, { foreignKey: 'sport_id' });
RegistrationSport.belongsTo(Sport, { foreignKey: 'sport_id' });

// ... (Match Associations etc)

// Registration - Team
Team.hasMany(Registration, { foreignKey: 'team_id' });
Registration.belongsTo(Team, { foreignKey: 'team_id' });

// Payment - Registration
Registration.hasOne(Payment, { foreignKey: 'registration_id' });
Payment.belongsTo(Registration, { foreignKey: 'registration_id' });

// Match Associations
Sport.hasMany(Match, { foreignKey: 'sport_id' });
Match.belongsTo(Sport, { foreignKey: 'sport_id' });

Team.hasMany(Match, { foreignKey: 'team_a_id', as: 'HomeMatches' });
Match.belongsTo(Team, { foreignKey: 'team_a_id', as: 'TeamA' });

Team.hasMany(Match, { foreignKey: 'team_b_id', as: 'AwayMatches' });
Match.belongsTo(Team, { foreignKey: 'team_b_id', as: 'TeamB' });

Match.hasMany(MatchPlayer, { foreignKey: 'match_id' });
MatchPlayer.belongsTo(Match, { foreignKey: 'match_id' });

Student.hasMany(MatchPlayer, { foreignKey: 'student_id' });
MatchPlayer.belongsTo(Student, { foreignKey: 'student_id' });

module.exports = {
    sequelize,
    Student,
    College,
    Sport,
    Team,
    Registration,
    Payment,
    User,
    Match,
    MatchPlayer,
    RegistrationSport
};
