const esClient = require('../clients/elasticsearchClient');
const bulkUtils = require('../util/esBulkUtils');

const ElasticSearchError = require('../errors/esError');

module.exports = {
  /** * INDEX OPERATIONS ** */
  createIndex: async indexName => {
    const index = { index: indexName };
    try {
      const response = await esClient.indices.create(index);
      return response;
    } catch (err) {
      console.log(`createIndex Error:\n ${JSON.stringify(err.body, null, 2)}`);
      throw new ElasticSearchError(
        'Invalid Index Name',
        err.body.error,
        err.body.status
      );
    }
  },
  deleteIndex: async indexName => {
    const index = { index: indexName };
    try {
      const indexExists = await esClient.indices.exists(index);
      if (!indexExists) {
        throw new ElasticSearchError('Index Not Found', {}, 404);
      }
      const response = await esClient.indices.delete(index);
      return response;
    } catch (err) {
      if (err.name === 'ElasticSearchError') {
        throw err;
      } else {
        console.log(`deleteIndex Error:\n ${JSON.stringify(err.body, null, 2)}`);

        throw new ElasticSearchError(
          'Invalid Index Name',
          err.body.error,
          err.body.status
        );
      }
    }
  },
  deleteAllIndices: async () => {
    try {
      const response = await esClient.indices.delete({ index: '_all' });
      return response;
    } catch (err) {
      if (err.name === 'ElasticSearchError') {
        throw err;
      } else {
        console.log(`deleteIndex Error:\n ${JSON.stringify(err.body, null, 2)}`);

        throw new ElasticSearchError(
          'Failed To Delete All Indices',
          err.body.error,
          err.body.status
        );
      }
    }
  },

  /** * DOCUMENT OPERATIONS ** */
  /** ADD */
  addOrUpdateDocument: async (index, doc) => {
    const createParams = {
      index,
      id: doc.id,
      type: '_doc',
      body: doc
    };

    try {
      const response = await esClient.index(createParams);
      return response;
    } catch (err) {
      console.log(`addDocument Error: ${JSON.stringify(err.body, null, 2)}`);

      throw new ElasticSearchError(
        'Failed to Add or Update Document',
        err.body.error,
        err.body.status
      );
    }
  },

  addDocumentsBulk: async (index, docArray, strict = false) => {
    const action = 'index'; // possible actions are 'index', 'create', 'update', 'delete'
    const bulkActionsBody = await bulkUtils.bulkEditBody(
      index,
      action,
      docArray
    );

    try {
      const response = await esClient.bulk({
        body: bulkActionsBody
      });

      // https://stackoverflow.com/questions/37728650/nodejs-elasticsearch-bulk-api-error-handling
      if (strict && response.errors) {
        throw new ElasticSearchError('Failed To Index All Documents');
      }
      return response;
    } catch (err) {
      if (err.name === 'ElasticSearchError') {
        throw err;
      } else {
        console.log(
          `addDocumentsBulk Error:\n ${JSON.stringify(err.body, null, 2)}`
        );

        throw new ElasticSearchError(
          'Unknown Error',
          err.body.error,
          err.body.status
        );
      }
    }
  },

  /** * DELETE ** */
  deleteDocument: async (index, docId) => {
    const deleteParams = {
      index,
      id: docId,
      type: '_doc'
    };

    try {
      const response = await esClient.delete(deleteParams);
      return response;
    } catch (err) {
      console.log(`deleteDocument Error:\n ${JSON.stringify(err.body, null, 2)}`);

      if (
        err.body.error &&
        err.body.error.type === 'index_not_found_exception'
      ) {
        throw new ElasticSearchError(
          'Index Not Found',
          err.body.error,
          err.body.status
        );
      } else if (err.body.result === 'not_found') {
        throw new ElasticSearchError('Document Not Found', err.body.error, 404);
      }
    }
  },

  deleteDocumentsBulk: async (index, docIds, strict = false) => {
    const bulkActionsBody = await bulkUtils.bulkDeleteBody(index, docIds);

    try {
      const response = await esClient.bulk({
        body: bulkActionsBody
      });

      if (strict && response.errors) {
        throw new ElasticSearchError('Failed To Delete All Documents');
      }
      return response;
    } catch (err) {
      if (err.body) {
        console.log(
          `deleteDocumentsBulk Error:\n ${JSON.stringify(err.body, null, 2)}`
        );
        throw new ElasticSearchError(
          'Unknown Error',
          err.body.error,
          err.body.status
        );
      } else {
        console.log(`deleteDocumentsBulk Error:\n ${JSON.stringify(err, null, 2)}`);
        throw err;
      }
    }
  }
};