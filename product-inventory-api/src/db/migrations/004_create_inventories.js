// Migration for creating the 'inventories' table (tracks stock changes for products)
exports.up = function(knex) {
    return knex.schema.createTable('inventories', table => {
      table.increments('id').primary(); // Primary key: auto-incrementing integer
      table.integer('product_id').unsigned().notNullable() // Foreign key to products.id
           .references('id').inTable('products').onDelete('CASCADE');
      table.enu('type', ['in', 'out']).notNullable(); // Type of inventory movement: 'in' (stock in) or 'out' (stock out)
      table.integer('quantity').notNullable(); // Quantity of stock moved (must be positive)
      table.text('note'); // Optional note for the inventory record
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable(); // Timestamp of inventory event, defaults to now
  
      // Index for efficient queries by product and date
      table.index(['product_id', 'created_at']);
    });
  };
  
  // Rollback: drops the 'inventories' table if it exists
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('inventories');
  };