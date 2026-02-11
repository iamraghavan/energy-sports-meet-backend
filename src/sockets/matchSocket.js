const { Match } = require('../models');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join specific match room
        socket.on('join_match', (matchId) => {
            socket.join(matchId);
            console.log(`Socket ${socket.id} joined match room: ${matchId}`);
        });

        // Leave match room
        socket.on('leave_match', (matchId) => {
            socket.leave(matchId);
            console.log(`Socket ${socket.id} left match room: ${matchId}`);
        });

        // Scorer updates score
        // We broadcast this to everyone in the room
        // Note: In a real app, verify the sender is an authorized scorer via middleware/token
        socket.on('update_score', async (data) => {
            const { matchId, scoreDetails, status } = data;

            try {
                // Determine if we need to update DB here or if API endpoint does it.
                // Hybrid: API updates DB -> Emits event -> Server broadcasts.
                // OR: Socket updates DB -> Server broadcasts.

                // Let's assume the scorer dashboard calls an API endpoint to update DB,
                // and the API emits the event. This is cleaner for data integrity.
                // But for pure socket real-time, we can broadcast directly if needed.

                // Here, we listen for 'update_score' from client (scorer) and broadcast to others
                io.to(matchId).emit('score_updated', {
                    matchId,
                    scoreDetails,
                    status,
                    timestamp: new Date()
                });

                console.log(`Score updated for match ${matchId}`);

            } catch (error) {
                console.error('Socket Score Update Error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
