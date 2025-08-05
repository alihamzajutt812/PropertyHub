const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');


router.get('/', propertyController.getAllProperties);
router.get('/:slug', propertyController.getPropertyBySlug);

module.exports = router;