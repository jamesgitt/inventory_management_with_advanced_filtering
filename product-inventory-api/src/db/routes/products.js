const express = require('express');
const router = express.Router();
const controller = require('../controllers/productsController');

// List all products, with optional filters (GET /api/products)
router.get('/', controller.getAllProducts);

// Get a single product by ID (GET /api/products/:id)
router.get('/:id', controller.getProductById);

// Create a new product (POST /api/products)
router.post('/', controller.createProduct);

// Update an existing product by ID (PATCH /api/products/:id)
router.patch('/:id', controller.updateProduct);

// Delete a product by ID (DELETE /api/products/:id)
router.delete('/:id', controller.deleteProduct);

// Adjust stock for a product (POST /api/products/:id/stock)
// This endpoint uses transaction management to ensure atomicity
router.post('/:id/stock', controller.adjustStock);

// Create a new tag (POST /api/tags)
router.post('/tags', controller.createTag);

module.exports = router;
