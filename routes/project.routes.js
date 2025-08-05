const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');


// View single project details by slug
router.get('/:slug', projectController.viewProjectDetails);
// Show all projects
router.get('/', projectController.getAllProjects);

module.exports = router;