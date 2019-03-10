const router = require('express').Router();
const indexController = require('../controllers/clusterController');
const documentController = require('../controllers/dataController');
const documentService = require('../services/dataService'); // remove it when I decide what to do with controllers and services
const searchController = require('../controllers/searchController');
const fs = require('fs');

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
  const jsonData = JSON.parse(
    fs.readFileSync('./data/marvel_movies.json', 'utf8')
  );
  const docArray = jsonData.movies;
  const response = await documentService.addDocumentsBulk('movies', docArray);
  res.json(response);
});

/** Search */
router.get('/search/auto-complete/:term/:size', async (req, res) => {
  const term = req.params.term;
  const size = req.params.size;
  const results = await searchController.completionSuggester(term, size);
  res.json(results);
});

router.get('/search/movie/:id', async (req, res) => {
  const movieId = req.params.id;
  const result = await searchController.searchById(movieId);
  res.json(result);
});

module.exports = router;
