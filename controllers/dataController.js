const documentService = require('../services/dataService');
const fs = require('fs');

/** Data CRUD Operations */
exports.populateIndex = async () => {
  const jsonData = JSON.parse(
    fs.readFileSync('./data/marvel_movies.json', 'utf8')
  );
  const docArray = jsonData.movies;
  try {
    const response = await documentService.addDocumentsBulk('movies', docArray);
    return response;
  } catch (err) {
    return err.message;
  }
};
