const express = require('express');
const router = express.Router();
const controller = require('../controllers/tagsController');

// Create a new tag (POST /api/tags)
router.post('/', controller.createTag);

module.exports = router;
