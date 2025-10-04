// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  development: {
    // Specify the database client (PostgreSQL)
    client: 'pg',
    // Use the DATABASE_URL from environment variables for connection
    connection: process.env.DATABASE_URL,
    migrations: {
      // Directory for migration files
      directory: './src/db/migrations'
    },
    seeds: {
      // Directory for seed files
      directory: './src/seeds'
    }
  }
};
