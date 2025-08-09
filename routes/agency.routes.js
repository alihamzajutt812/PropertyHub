const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agency.controller');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const upload = require('../utils/multer');

// Agency dashboard
router.get(
  '/dashboard',
  requireAuth,
  requireRole('agency'),
  agencyController.getAgencyDashboard
);
router.get('/properties/new', requireAuth, requireRole('agency'), agencyController.getAddAgencyPropertyForm);
router.post('/properties/new', requireAuth, requireRole('agency'), upload.array('images', 5), agencyController.postAddAgencyProperty);
router.get('/properties/edit/:id', requireAuth, requireRole('agency'), agencyController.getEditAgencyPropertyForm);
router.post('/properties/edit/:id', requireAuth, requireRole('agency'), upload.array('images', 10), agencyController.postEditAgencyProperty);

router.get(
  '/projects/new',
  requireAuth,
  requireRole('agency'),
  agencyController.getAddAgencyProjectForm
);

// Handle project creation
router.post(
  '/projects',
  requireAuth,
  requireRole('agency'),
  upload.array('images', 5),
  agencyController.postAddAgencyProject
);

router.get(
  '/projects/edit/:slug',
  requireAuth,
  requireRole('agency'),
  agencyController.getEditAgencyProjectForm
);

// Handle edit form submission
router.post(
  '/projects/edit/:slug',
  requireAuth,
  requireRole('agency'),
  upload.array('images', 10),
  agencyController.postEditAgencyProject
);

router.post(
  '/projects/delete/:slug',
  requireAuth,
  requireRole('agency'),
  agencyController.deleteAgencyProject
);
router.post(
  '/properties/delete/:id',
  requireAuth,
  requireRole('agency'),
  agencyController.deleteAgencyProperty
);
// Show edit profile form
router.get(
  '/edit-profile',
  requireAuth,
  requireRole('agency'),
  agencyController.getEditAgencyProfile
);

// Handle profile update
router.post(
  '/edit-profile',
  requireAuth,
  requireRole('agency'),
  upload.single('agencyLogo'),
  agencyController.updateAgencyProfile
);
router.get('/my-profile', requireAuth, requireRole('agency'), agencyController.showAgencyProfile);


module.exports = router;