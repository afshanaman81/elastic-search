const documentService = require('../services/dataService');
const fs = require('fs');

/** Data CRUD Operations */
exports.populateIndex = async (indexName) => {
  const jsonData = JSON.parse(
    fs.readFileSync('./data/marvel_movies.json', 'utf8')
  );
  const docArray = jsonData.movies;
  try {
    const response = await documentService.addDocumentsBulk(indexName, docArray);
    const message = `Successfully inserted ${response.items.length} documents into the index '${indexName}'`
    return message;
  } catch (err) {
    return err.message;
  }
};
