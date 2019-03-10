const router = require('express').Router();
const indexController = require('../controllers/clusterController');
const indexService = require('../services/clusterService');
const documentController = require('../controllers/dataController');
const documentService = require('../services/dataService'); // remove it when I decide what to do with controllers and services
const searchController = require('../controllers/searchController');
const fs = require('fs');

/** Index */
router.put('/index', async (req, res) => {
  // todo: validate input
  console.log(req.query.indexName);
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

router.put('/bulk', async (req, res) => {
  const jsonData = JSON.parse(
    fs.readFileSync('./data/marvel_movies.json', 'utf8')
  );
  const docArray = jsonData.movies;
  //console.log(docArray);
  const response = await documentService.addDocumentsBulk('movies', docArray);
  res.json(response);
});

/** Search */
router.get('/search', (req, res) => {
  res.json({ message: 'Welcome to the search service' });
});

module.exports = router;
