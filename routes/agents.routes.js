const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const{ requireRole, requireAuth } = require('../middleware/requireAuth');
const upload = require('../utils/multer');

router.get('/dashboard', requireAuth, requireRole('agent'), agentController.getAgentDashboard);
router.get('/properties/new', requireAuth, requireRole('agent'), agentController.getAddPropertyForm);
router.post(
  '/properties/new',
  requireAuth,
  requireRole('agent'),
  upload.array('images', 5),
  agentController.createNewProperty
);

router.get(
  '/properties/edit/:id',
  requireAuth,
  requireRole('agent'),
  agentController.getEditPropertyForm
);

router.post(
  '/properties/edit/:id',
  requireAuth,
  requireRole('agent'),
  upload.array('images', 10),
  agentController.postUpdateProperty
);
router.post('/properties/delete/:id',  requireAuth,  requireRole('agent'), agentController.deleteAgentProperty);

// GET: Show edit profile form
router.get(
  '/edit-profile',
  requireAuth,
  requireRole('agent'),
  agentController.getEditProfile
);

// POST: Handle profile update
router.post(
  '/edit-profile',
  requireAuth,
  requireRole('agent'),
  upload.single('logo'), // optional single file input
  agentController.updateProfile
);
router.get('/my-profile', requireAuth, requireRole('agent'), agentController.viewAgentProfile);


module.exports = router;

