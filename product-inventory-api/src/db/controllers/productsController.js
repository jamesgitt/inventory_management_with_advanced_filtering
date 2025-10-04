const db = require('../knex');

// Helper: build base product query with tags aggregated
function buildProductBaseQuery() {
  // we will left join tags and aggregate names
  return db('products')
    .select(
      'products.id',
      'products.name',
      'products.description',
      'products.price',
      'products.current_stock',
      'products.created_at',
      'products.updated_at'
    )
    .leftJoin('product_tags', 'products.id', 'product_tags.product_id')
    .leftJoin('tags', 'product_tags.tag_id', 'tags.id')
    .groupBy('products.id');
}

module.exports = {
  // GET /api/products?tag=&min_stock=&name=
  // Returns all products, optionally filtered by tag, min_stock, or name (partial, case-insensitive)
  async getAllProducts(req, res) {
    try {
      const { tag, min_stock, name } = req.query;

      // base query returns product rows; we will aggregate tags with array_agg
      let query = db('products')
        .select(
          'products.id',
          'products.name',
          'products.description',
          'products.price',
          'products.current_stock',
          db.raw("COALESCE(json_agg(DISTINCT tags.name) FILTER (WHERE tags.name IS NOT NULL), '[]') AS tags")
        )
        .leftJoin('product_tags', 'products.id', 'product_tags.product_id')
        .leftJoin('tags', 'product_tags.tag_id', 'tags.id')
        .groupBy('products.id');

      // Filter: name partial (case-insensitive)
      if (name) {
        query = query.whereILike('products.name', `%${name}%`);
      }

      // Filter: min_stock
      if (min_stock !== undefined) {
        const min = parseInt(min_stock, 10);
        if (Number.isNaN(min)) {
          return res.status(400).json({ error: 'min_stock must be a number' });
        }
        query = query.where('products.current_stock', '>=', min);
      }

      // Filter: tag name — need to join through tags, but doing an EXISTS subquery avoids messing with aggregation
      if (tag) {
        query = query.whereExists(function() {
          this.select('*')
            .from('product_tags as pt')
            .join('tags as t', 'pt.tag_id', 't.id')
            .whereRaw('pt.product_id = products.id')
            .andWhere('t.name', '=', tag);
        });
      }

      const rows = await query;
      // parse tags from JSON (Postgres returns JSON as string via knex raw in some versions)
      const result = rows.map(r => {
        // ensure tags is an array
        const tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags;
        return { ...r, tags };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // GET /api/products/:id
  async getProductById(req, res) {
    const { id } = req.params;
    try {
      const product = await db('products')
        .select(
          'products.*',
          db.raw("COALESCE(json_agg(DISTINCT tags.name) FILTER (WHERE tags.name IS NOT NULL), '[]') AS tags")
        )
        .leftJoin('product_tags', 'products.id', 'product_tags.product_id')
        .leftJoin('tags', 'product_tags.tag_id', 'tags.id')
        .where('products.id', id)
        .groupBy('products.id')
        .first();

      if (!product) return res.status(404).json({ error: 'Not found' });
      product.tags = typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags;
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // POST /api/products
  async createProduct(req, res) {
    const { name, description, price, tags } = req.body;
    try {
      const trx = await db.transaction();
      try {
        const [inserted] = await trx('products').insert({
          name,
          description,
          price: price || 0,
          current_stock: 0
        }).returning('*');

        // attach tags if provided: tags is array of tag names
        if (Array.isArray(tags) && tags.length) {
          // ensure tags exist or create them
          const tagIds = [];
          for (const tName of tags) {
            const existing = await trx('tags').where({ name: tName }).first();
            let tagId;
            if (existing) {
              tagId = existing.id;
            } else {
              const [newTag] = await trx('tags').insert({ name: tName }).returning('*');
              tagId = newTag.id || newTag;
            }
            tagIds.push(tagId);
          }
          // insert into product_tags
          for (const tagId of tagIds) {
            await trx('product_tags').insert({ product_id: inserted.id || inserted, tag_id: tagId });
          }
        }

        await trx.commit();
        res.status(201).json(inserted);
      } catch (err) {
        await trx.rollback();
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },


  // PATCH /api/products/:id
  async updateProduct(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    // Only allow updating name and description
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    updateFields.updated_at = db.fn.now();

    // If no updatable fields provided
    if (Object.keys(updateFields).length === 1) { // only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    try {
      const updated = await db('products')
        .where({ id })
        .update(updateFields)
        .returning('*');
      if (!updated || updated.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(updated[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // DELETE /api/products/:id
  async deleteProduct(req, res) {
    const { id } = req.params;
    try {
      const cnt = await db('products').where({ id }).del();
      if (!cnt) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  /**
   * POST /api/products/:id/stock
   * Body: { type: 'in' | 'out', quantity: number, note?: string }
   *
   * This MUST be done in a Knex transaction:
   *  1. insert into inventories
   *  2. update products.current_stock atomically
   *  3. rollback if new stock < 0
   */
  async adjustStock(req, res) {
    const { id } = req.params;
    const { type, quantity, note } = req.body;

    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    // Start transaction
    try {
      await db.transaction(async trx => {
        // lock the product row FOR UPDATE to avoid race conditions
        const productRow = await trx('products').where({ id }).forUpdate().first();

        if (!productRow) {
          // throwing will auto rollback
          const err = new Error('Product not found');
          err.status = 404;
          throw err;
        }

        const current = parseInt(productRow.current_stock, 10);

        // compute new stock
        const newStock = (type === 'in') ? current + qty : current - qty;

        // server-side check: can't go below 0
        if (newStock < 0) {
          const err = new Error('Insufficient stock — operation would produce negative stock');
          err.status = 400;
          throw err;
        }

        // 1) create inventory record
        const [inventoryInserted] = await trx('inventories').insert({
          product_id: id,
          type,
          quantity: qty,
          note: note || null
        }).returning('*');

        // 2) atomically update product.current_stock
        await trx('products').where({ id }).update({
          current_stock: newStock,
          updated_at: trx.fn.now()
        });

        // If we reach here without throwing, trx will commit automatically.
        // But to send response from outside, we attach result to the transaction object:
        trx.completedResult = {
          inventory: inventoryInserted,
          newStock
        };
      })
      .then(result => {
        // result is undefined; but our trx block attached completedResult to trx which is not available here
        // so we need to re-query product & last inventory for response
      });

      // After transaction committed, fetch inventory & product to return fresh state
      const [latestInventory] = await db('inventories').where({ product_id: id }).orderBy('created_at', 'desc').limit(1);
      const product = await db('products').where({ id }).first();

      res.status(201).json({
        inventory: latestInventory,
        product
      });
    } catch (err) {
      console.error(err);
      if (err.status === 400 || err.status === 404) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
};
