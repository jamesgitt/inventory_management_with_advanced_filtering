# inventory_management_with_advanced_filtering

A robust, production-grade CRUD (Create, Read, Update, Delete) REST API using Node.js, Express, Knex.js, and PostgreSQL. The primary focus is on database design (normalization), advanced querying, transaction management, and clean, layered architecture.

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd inventory_management_with_advanced_filtering
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your PostgreSQL connection details.
   - Example:
     ```
     DATABASE_URL=postgres://username:password@localhost:5432/inventory_db
     ```

4. **Run database migrations:**
   ```bash
   npx knex migrate:latest --knexfile knexfile.js
   ```
   This will create all necessary tables in your database.

5. **Seed the database (optional):**
   ```bash
   npx knex seed:run --knexfile knexfile.js
   ```
   This will populate the database with sample data.

## Running the API

**Start the server with:**
   ```bash
   npm start
   ```
   By default, the server will run on `http://localhost:3000` (or the port specified in your environment variables).

---

## Testing Endpoints with Postman

You can use [Postman](https://www.postman.com/) or any API client to test the endpoints. Below are example requests for each main endpoint:

### Products

- **Get all products (with optional filters):**
  - `GET http://localhost:3000/api/products`
  - Query params: `?tag=Electronics&min_stock=5&name=phone` (all optional)

- **Get a product by ID:**
  - `GET http://localhost:3000/api/products/1`

- **Create a new product:**
  - `POST http://localhost:3000/api/products`
  - Body (JSON):
    ```json
    {
      "name": "New Product",
      "description": "A description",
      "price": 99.99,
      "tags": ["Electronics", "Gadgets"]
    }
    ```

- **Update a product (name/description):**
  - `PATCH http://localhost:3000/api/products/1`
  - Body (JSON):
    ```json
    {
      "name": "Updated Name",
      "description": "Updated description"
    }
    ```

- **Delete a product:**
  - `DELETE http://localhost:3000/api/products/1`

- **Adjust product stock (in/out):**
  - `POST http://localhost:3000/api/products/1/stock`
  - Body (JSON):
    ```json
    {
      "type": "in",
      "quantity": 10,
      "note": "Restocking"
    }
    ```

### Tags

- **Create a new tag:**
  - `POST http://localhost:3000/api/tags`
  - Body (JSON):
    ```json
    {
      "name": "NewTag"
    }
    ```

---

**Do this:**  
For all POST/PATCH requests, set the `Content-Type` header to `application/json` in Postman.