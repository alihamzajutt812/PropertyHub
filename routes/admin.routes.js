// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const upload = require('../utils/multer')

// Create admin manually
router.get('/create', adminController.createAdmin);
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/properties/edit/:id', requireAuth, requireRole('admin'), adminController.getEditPropertyForm);
router.post(
  '/properties/edit/:id',
  requireAuth,
  requireRole('admin'),
  upload.array('images', 10),
  adminController.updatePropertyByAdmin
);
router.post('/agents', requireAuth, requireRole('admin'), adminController.createAgent);
router.get('/agents', requireAuth, requireRole('admin'), adminController.getAdminAgentsPage);
router.post('/agents/delete/:id', requireAuth, requireRole('admin'), adminController.deleteAgent);
router.get('/agents/edit/:id', requireAuth, requireRole('admin'), adminController.getEditAgentForm);

// Handle update
router.post('/agents/edit/:id', requireAuth, requireRole('admin'), adminController.updateAgent);
router.post('/properties/delete/:id', requireAuth, requireRole('admin'), adminController.deleteProperty);
// Show edit project form
router.get('/projects/edit/:slug', requireAuth, requireRole('admin'), adminController.getEditProjectForm);

// Handle project update
router.post(
  '/projects/edit/:slug',
  requireAuth,
  requireRole('admin'),
  upload.array('images', 10),
  adminController.updateProject
);

router.post(
  '/projects/delete/:slug',
  requireAuth,
  requireRole('admin'),
  adminController.deleteProject
);


module.exports = router;