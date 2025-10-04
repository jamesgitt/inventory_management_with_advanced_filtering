// Migration for creating the 'product_tags' join table (many-to-many between products and tags)
exports.up = function(knex) {
    return knex.schema.createTable('product_tags', table => {
      table.increments('id').primary(); // Primary key: auto-incrementing integer
      table.integer('product_id').unsigned().notNullable() // Foreign key to products.id
           .references('id').inTable('products').onDelete('CASCADE');
      table.integer('tag_id').unsigned().notNullable() // Foreign key to tags.id
           .references('id').inTable('tags').onDelete('CASCADE');
      table.unique(['product_id','tag_id']); // Ensure each product-tag pair is unique
    });
  };
  
  // Rollback: drops the 'product_tags' table if it exists
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('product_tags');
  };