const esClient = require('../clients/elasticsearchClient')
const bulkUtils = require('../util/esBulkUtils');

const {
  ES_INDEX_NOT_FOUND,
  ES_GENERAL_ERROR
} = require('../errors/messages');

module.exports = {
  /** * INDEX OPERATIONS ** */
  createIndex: async indexName => {
    let success = false;
    let results = false;
    const index = { index: indexName };
    try {
      const response = await esClient.indices.create(index);
      // console.log('TCL: createIndex response:\n', response);
      success = true;
      results = response;
    } catch (err) {
      console.log(`createIndex Error:\n ${JSON.stringify(err, null, 2)}`);
      results = err;
    }

    return { success, results };
  },
  deleteIndex: async indexName => {
    let success = false;
    let results = false;
    const index = { index: indexName };
    try {
      const indexExists = await esClient.indices.exists(index);

      if (indexExists) {
        try {
          const response = await esClient.indices.delete(index);
          // console.log('TCL: deleteIndex response:\n', response);
          success = true;
          results = response;
        } catch (err) {
          results = ES_GENERAL_ERROR;
        }
      } else {
        results = ES_INDEX_NOT_FOUND;
      }
    } catch (err) {
      console.log(`deleteIndex Error:\n ${JSON.stringify(err, null, 2)}`);
      results = err;
    }

    return { success, results };
  },
  deleteAllIndices: async () => {
    let success = false;
    let results = false;

    try {
      const response = await esClient.indices.delete({ index: '_all' });
      // console.log('TCL: deleteAllIndices response:\n', response);
      success = true;
      results = response;
    } catch (err) {
      console.log(`deleteAllIndices Error:\n ${JSON.stringify(err, null, 2)}`);
      results = err;
    }

    return { success, results };
  },

  /** * DOCUMENT OPERATIONS ** */
  /** ADD */
  // its the indexItem in v1
  addOrUpdateDocument: async (index, doc) => {
    let success = false;
    let results = false;

    const createParams = {
      index,
      id: doc.guid,
      type: '_doc',
      body: doc
    };

    try {
      const response = await esClient.index(createParams);
      // console.log('TCL: addDocument response:\n', response);
      success = true;
      results = response;
    } catch (err) {
      console.log(`addDocument Error: ${JSON.stringify(err, null, 2)}`);
      results = err;
      // throw new Error('version_conflict_engine_exception');
      // https://stackoverflow.com/questions/45466040/verify-that-an-exception-is-thrown-using-mocha-chai-and-async-await
    }

    return { success, results };
  },

  // its the indexItems in v1  > work on this
  addDocumentsBulk: async (index, docArray) => {
    let success = false;
    let results = false;
    const action = 'index'; // possible actions are 'index', 'create', 'update', 'delete'
    const bulkActionsBody = await bulkUtils.bulkEditBody(
      index,
      action,
      docArray
    );
    // console.log('TCL: bulkActionsBody:\n', bulkActionsBody);
    try {
      const response = await esClient.bulk({
        body: bulkActionsBody
      });
      // console.log('TCL: addDocumentsBulk response:\n', response);
      success = true;
      results = response;
    } catch (err) {
      console.log(`addDocumentsBulk Error: ${JSON.stringify(err, null, 2)}`);
      results = err;
    }

    return { success, results };
  },

  /** * DELETE ** */
  deleteDocument: async (index, docId) => {
    let success = false;
    let results = false;
    const deleteParams = {
      index,
      id: docId,
      type: '_doc'
    };

    try {
      const response = await esClient.delete(deleteParams);
      // console.log('TCL: deleteDocument response:\n', response);
      success = true;
      results = response;
    } catch (err) {
      success = false;
      results = err;
    }

    return { success, results };
  },

  // its the deleteItemsFromIndex in v1
  deleteDocumentsBulk: async (index, docIds) => {
    let success = false;
    let results = false;
    const bulkActionsBody = bulkUtils.bulkDeleteBody(index, docIds);

    try {
      const response = await esClient.bulk({
        body: bulkActionsBody
      });
      success = true;
      results = response;
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
      results = err;
    }

    return { success, results };
  }
};
