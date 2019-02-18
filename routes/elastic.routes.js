const router = require('express').Router();
const esController = require('../controllers/esController');

router.get('/search', (req, res) => {
  res.json({ message: 'Welcome to the search service' });
});

router.post('/index/create', async (req, res) => {
  // todo: validate input
  const response = await esController.createIndex(req.query.indexName);
  res.json(response);
});

router.delete('/index', async (req, res) => {
  // todo: validate input
  const response = await esController.deleteIndex(req.query.indexName);
  res.json(response);
});

module.exports = router;
