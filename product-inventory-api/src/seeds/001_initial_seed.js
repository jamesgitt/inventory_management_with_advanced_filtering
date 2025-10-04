exports.seed = async function(knex) {
    // Delete all existing records from product_tags, inventories, tags, and products tables
    await knex('product_tags').del();
    await knex('inventories').del();
    await knex('tags').del();
    await knex('products').del();
  
    // Insert two products and get their IDs
    const [p1] = await knex('products').insert({
      name: 'Bluetooth Speaker',
      description: 'Portable speaker',
      price: 49.99,
      current_stock: 10
    }).returning('id');
    const [p2] = await knex('products').insert({
      name: 'Wireless Mouse',
      description: 'Ergonomic mouse',
      price: 19.99,
      current_stock: 5
    }).returning('id');
  
    // Insert two tags and get their IDs
    const [t1] = await knex('tags').insert({ name: 'Electronics' }).returning('id');
    const [t2] = await knex('tags').insert({ name: 'Accessories' }).returning('id');
  
    // Associate products with tags in the product_tags table
    await knex('product_tags').insert([
      { product_id: p1.id || p1, tag_id: t1.id || t1 }, // Bluetooth Speaker -> Electronics
      { product_id: p2.id || p2, tag_id: t1.id || t1 }, // Wireless Mouse -> Electronics
      { product_id: p2.id || p2, tag_id: t2.id || t2 }  // Wireless Mouse -> Accessories
    ]);
  
    // Insert initial inventory records for each product (already reflected in current_stock)
    await knex('inventories').insert([
      { product_id: p1.id || p1, type: 'in', quantity: 10, note: 'initial stock' }, // 10 units in for Bluetooth Speaker
      { product_id: p2.id || p2, type: 'in', quantity: 5, note: 'initial stock' }   // 5 units in for Wireless Mouse
    ]);
  };