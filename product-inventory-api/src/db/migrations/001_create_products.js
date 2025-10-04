// Migration for creating the 'products' table
exports.up = function(knex) {
    return knex.schema.createTable('products', table => {
      table.increments('id').primary(); // Primary key: auto-incrementing integer
      table.string('name').notNullable().index(); // Product name, required, indexed for fast lookup
      table.text('description'); // Optional product description
      table.decimal('price', 12, 2).notNullable().defaultTo(0); // Product price, required, defaults to 0
      table.integer('current_stock').notNullable().defaultTo(0); // Current stock, maintained by inventory transactions, defaults to 0
      table.timestamps(true, true); // created_at and updated_at timestamps, with defaults
    });
  };
  
  // Rollback: drops the 'products' table if it exists
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('products');
  };