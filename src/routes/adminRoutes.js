// User Management
router.get('/users', protect, authorize('super_admin'), adminController.getAllUsers);
router.post('/users', protect, authorize('super_admin'), adminController.createUser);
router.put('/users/:id', protect, authorize('super_admin'), adminController.updateUser);
router.delete('/users/:id', protect, authorize('super_admin'), adminController.deleteUser);

// Registrations
router.get('/registrations', protect, authorize('super_admin'), adminController.getAllRegistrations);

// Verify Payment: accessible by Super Admin and Sports Head
router.post('/verify-payment', protect, authorize('super_admin', 'sports_head'), adminController.verifyPayment);

// Analytics: accessible by Super Admin only
router.get('/analytics', protect, authorize('super_admin'), adminController.getAnalytics);

// Reports: accessible by Super Admin only
router.get('/reports/matches', protect, authorize('super_admin'), adminController.generateMatchReport);

module.exports = router;
