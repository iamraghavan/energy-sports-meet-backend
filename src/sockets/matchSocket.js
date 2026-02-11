const { Match } = require('../models');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // 1. Join Specific Match Room (Detailed View)
        socket.on('join_match', (matchId) => {
            socket.join(matchId);
            console.log(`Socket ${socket.id} joined match room: ${matchId}`);
        });

        // 2. Join Overview Room (Dashboard View)
        // Client should emit 'join_overview' when on the main list page
        socket.on('join_overview', () => {
            socket.join('live_overview');
            console.log(`Socket ${socket.id} joined live_overview`);
        });

        socket.on('leave_match', (matchId) => {
            socket.leave(matchId);
            console.log(`Socket ${socket.id} left match room: ${matchId}`);
        });

        socket.on('leave_overview', () => {
            socket.leave('live_overview');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
