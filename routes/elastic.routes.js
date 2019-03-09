const router = require('express').Router();
const indexController = require('../controllers/clusterController');
const documentController = require('../controllers/dataController');
const searchController = require('../controllers/searchController');

/** Search */
router.get('/search', (req, res) => {
  res.json({ message: 'Welcome to the search service' });
});

/** Populate */


/** Index */
router.put('/index', async (req, res) => {
  // todo: validate input
  const response = await indexController.createIndex(req.query.indexName);
  res.json(response);
});

router.delete('/index', async (req, res) => {
  // todo: validate input
  const response = await indexController.deleteIndex(req.query.indexName);
  res.json(response);
});

module.exports = router;
