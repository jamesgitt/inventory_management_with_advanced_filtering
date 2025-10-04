const db = require('../knex');

module.exports = {
  // POST /api/tags
  // Create a new tag
  async createTag(req, res) {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required and must be a non-empty string' });
    }
    try {
      // Insert tag, handle unique constraint
      const [tag] = await db('tags')
        .insert({ name: name.trim() })
        .returning('*');
      res.status(201).json(tag);
    } catch (err) {
      if (err.code === '23505') { // unique_violation in Postgres
        return res.status(409).json({ error: 'Tag name already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
};
