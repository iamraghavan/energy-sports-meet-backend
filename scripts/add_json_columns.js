const { sequelize } = require('../src/models');

async function addColumns() {
    try {
        const queryInterface = sequelize.getQueryInterface();

        // Add match_events to Matches table
        await queryInterface.addColumn('matches', 'match_events', {
            type: 'JSON',
            defaultValue: [],
            allowNull: true
        });
        console.log('Added match_events to matches table');

        // Add performance_stats to MatchPlayers table
        await queryInterface.addColumn('match_players', 'performance_stats', {
            type: 'JSON',
            defaultValue: {},
            allowNull: true
        });
        console.log('Added performance_stats to match_players table');

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
}

addColumns();
