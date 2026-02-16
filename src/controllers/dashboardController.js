const { Registration, Payment, Team, Match, Sport, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get Role-Based Dashboard Statistics
 * @route   GET /api/v1/overview/stats
 * @access  Private (All Console Roles)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const { role, assigned_sport_id } = req.user;
        let stats = {};

        // ------------------------------------
        // SUPER ADMIN DASHBOARD
        // ------------------------------------
        if (role === 'super_admin') {
            const totalRegistrations = await Registration.count();
            const verifiedRegistrations = await Registration.count({ where: { status: 'approved' } });
            
            // Payment Stats (Source: Registration table)
            const totalPayments = await Registration.sum('total_amount', { where: { payment_status: 'paid' } }) || 0;
            const pendingPayments = await Registration.count({ where: { payment_status: 'pending' } });

            // Sport Breakdown
            const sports = await Sport.findAll({
                attributes: ['name'],
                include: [{
                    model: Registration,
                    attributes: ['id'], // minimal
                    through: { attributes: [] }
                }]
            });
            // Note: Efficient counting might require group by, but for now this works
            const sportCounts = sports.map(s => ({
                name: s.name,
                count: s.Registrations.length
            }));

            stats = {
                title: 'Super Admin Overview',
                kpi: [
                    { label: 'Total Registrations', value: totalRegistrations, icon: 'users' },
                    { label: 'Verified Registrations', value: verifiedRegistrations, icon: 'user-check' },
                    { label: 'Total Revenue', value: `₹${totalPayments}`, icon: 'dollar-sign' },
                    { label: 'Pending Payments', value: pendingPayments, icon: 'clock', alert: pendingPayments > 0 }
                ],
                charts: {
                    registrationsBySport: sportCounts
                }
            };
        }

        // ------------------------------------
        // SPORTS HEAD DASHBOARD
        // ------------------------------------
        else if (role === 'sports_head') {
            if (!assigned_sport_id) return res.status(400).json({ error: 'No sport assigned to this Sports Head' });

            const sport = await Sport.findByPk(assigned_sport_id);
            if (!sport) return res.status(404).json({ error: 'Assigned Sport not found' });
            
            // Count Teams
            const teamCount = await Team.count({ where: { sport_id: assigned_sport_id } });
            
            // Count Players (Approximated by Registrations for that sport)
            const playerCount = await Registration.count({
                include: [{
                    model: Sport,
                    where: { id: assigned_sport_id }
                }],
                where: { status: 'approved' }
            });

            // Matches
            const upcomingMatches = await Match.count({
                where: {
                    sport_id: assigned_sport_id,
                    start_time: { [Op.gt]: new Date() },
                    status: 'scheduled'
                }
            });
            const completedMatches = await Match.count({
                where: {
                    sport_id: assigned_sport_id,
                    status: 'completed'
                }
            });

             // Recent Activity
             const recentRegistrations = await Registration.findAll({
                include: [{ model: Sport, where: { id: assigned_sport_id }, attributes: [] }],
                where: { status: 'approved' },
                limit: 5,
                order: [['updated_at', 'DESC']],
                attributes: ['id', 'name', 'registration_code', 'updated_at']
            });

            stats = {
                title: `${sport.name} Overview`,
                kpi: [
                    { label: 'Total Teams', value: teamCount, icon: 'shield' },
                    { label: 'Registered Players', value: playerCount, icon: 'users' },
                    { label: 'Upcoming Matches', value: upcomingMatches, icon: 'calendar' },
                    { label: 'Completed Matches', value: completedMatches, icon: 'check-circle' }
                ],
                recent_activity: recentRegistrations, // Added this field
                actions: [
                    { label: 'Create Team', link: '/dashboard/teams/new' },
                    { label: 'Schedule Match', link: '/dashboard/matches/new' }
                ]
            };
        }

        // ------------------------------------
        // REGISTRATION COMMITTEE DASHBOARD
        // ------------------------------------
        else if (role === 'committee') {
            const totalReg = await Registration.count();
            const checkedIn = await Registration.count({ where: { checked_in: true } });
            const kitsDelivered = await Registration.count({ where: { kit_delivered: true } });
            const todayCheckins = await Registration.count({
                where: {
                    checked_in: true,
                    checkin_time: {
                        [Op.gte]: new Date(new Date().setHours(0,0,0,0)) // Today start
                    }
                }
            });

            stats = {
                title: 'Registration Committee',
                kpi: [
                    { label: 'Total Registrations', value: totalReg, icon: 'users' },
                    { label: 'Total Checked In', value: checkedIn, icon: 'check-square' },
                    { label: 'Kits Delivered', value: kitsDelivered, icon: 'package' },
                    { label: 'Checked In Today', value: todayCheckins, icon: 'clock' }
                ]
            };
        }

        // ------------------------------------
        // SCORER DASHBOARD
        // ------------------------------------
        else if (role === 'scorer') {
            const assigned_sport_id = req.user.assigned_sport_id;
            let whereMatch = {};
            if (assigned_sport_id) whereMatch.sport_id = assigned_sport_id;

            const liveMatches = await Match.count({ where: { ...whereMatch, status: 'live' } });
            const scheduledMatches = await Match.count({ where: { ...whereMatch, status: 'scheduled' } });
            
            stats = {
                title: 'Scorer Dashboard',
                kpi: [
                    { label: 'Live Matches', value: liveMatches, icon: 'activity', color: 'red', animate: true },
                    { label: 'Scheduled Matches', value: scheduledMatches, icon: 'calendar' }
                ]
            };
        }

        res.json(stats);

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};
