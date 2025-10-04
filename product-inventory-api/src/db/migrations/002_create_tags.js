// Migration for creating the 'tags' table
exports.up = function(knex) {
    return knex.schema.createTable('tags', table => {
      table.increments('id').primary(); // Primary key: auto-incrementing integer
      table.string('name').notNullable().unique(); // Tag name, required, must be unique
      table.timestamps(true, true); // created_at and updated_at timestamps, with defaults
    });
  };
  
  // Rollback: drops the 'tags' table if it exists
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('tags');
  };