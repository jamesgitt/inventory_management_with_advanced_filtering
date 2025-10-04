const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Example route test
app.get('/', (req, res) => res.send('API running...'));

// Import and use routes
// const productRoutes = require('./routes/productRoutes');
// app.use('/api/products', productRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
