'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('students', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true // Keep unique constraint for non-null values
    });

    await queryInterface.changeColumn('students', 'mobile', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert to non-null (Warning: will fail if null values exist)
    await queryInterface.changeColumn('students', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });

    await queryInterface.changeColumn('students', 'mobile', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
};
