const router = require('express').Router();
const indexController = require('../controllers/indexController');
const documentController = require('../controllers/dataController');
const searchController = require('../controllers/searchController');


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

router.put('/mapping', async (req, res) => {
  const response = await indexController.createMapping(req.query.indexName);
  res.json(response);
});

/** Populate */
router.put('/document', async (req, res) => {});

router.put('/document/bulk', async (req, res) => {
  const response = documentController.populateIndex();
  res.json(response);
});

/** Search */
router.get('/search/auto-complete/:term/:size', async (req, res) => {
  const { term, size } = req.params;
  const results = await searchController.prefixAutoCompleter(term, size);
  res.json(results);
});

router.get('/search/movie/:id', async (req, res) => {
  const movieId = req.params.id;
  const result = await searchController.searchById(movieId);
  res.json(result);
});

module.exports = router;
