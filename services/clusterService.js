const esClient = require('../clients/elasticsearchClient');
const ElasticSearchError = require('../errors/esError');

/** * INDEX OPERATIONS ** */
module.exports = {
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
        console.log(
          `deleteIndex Error:\n ${JSON.stringify(err.body, null, 2)}`
        );

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
        console.log(
          `deleteIndex Error:\n ${JSON.stringify(err.body, null, 2)}`
        );

        throw new ElasticSearchError(
          'Failed To Delete All Indices',
          err.body.error,
          err.body.status
        );
      }
    }
  },
  createMapping: async (indexName, mapping) => {
    const mappingParams = {
      index: indexName,
      type: '_doc',
      body: mapping
    };
    try {
      const response = await esClient.indices.putMapping(mappingParams);
      console.log(response);
      return response;
    } catch (err) {
      console.log(
        `createMapping Error:\n ${JSON.stringify(err.body, null, 2)}`
      );

      throw new ElasticSearchError(
        'Invalid Mapping Argument',
        err.body.error,
        err.body.status
      );
    }
  }
};
