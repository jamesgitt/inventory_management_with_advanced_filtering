// Load environment variables from .env file
require('dotenv').config();

// Import Express framework
const express = require('express');

// Import the products router
const productsRouter = require('./db/routes/products');

// Create an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the products router at /api/products
app.use('/api/products', productsRouter);

// Health check endpoint
app.get('/', (req, res) => res.json({ ok: true }));

// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
