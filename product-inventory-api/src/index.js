// Load environment variables from .env file
require('dotenv').config();

// Import Express framework
const express = require('express');

// Import the routers
const productsRouter = require('./db/routes/products');
const tagsRouter = require('./db/routes/tags');

// Create an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the routers
app.use('/api/products', productsRouter);
app.use('/api/tags', tagsRouter);

// Health check endpoint
app.get('/', (req, res) => res.json({ ok: true }));

// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
