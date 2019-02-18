const { expect } = require('chai');
const sinon = require('sinon');
const esCrudService = require('../../../services/crudService');
const esClient = require('../../../clients/elasticsearchClient');
const bulkUtils = require('../../../util/esBulkUtils');
const {
  ES_INDEX_NOT_FOUND,
  ES_GENERAL_ERROR,
  ES_NO_CONNECTION
} = require('../../../errors/messages');

const sandbox = sinon.createSandbox();

describe.only('elasticSearch: crudServices', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe.only('INDEX OPERATIONS', () => {
    describe('createIndex', () => {
      it('successfully creates an index when indexName is valid', async () => {
        const indexName = 'es-test-index';
        const esCreateIndexResponse = {
          acknowledged: true,
          shards_acknowledged: true,
          index: 'es-test-index'
        };
        const createIndexStub = sandbox
          .stub(esClient.indices, 'create')
          .resolves(esCreateIndexResponse);

        const results = await esCrudService.createIndex(indexName);

        expect(results).to.be.an('object');
        expect(results)
          .to.have.property('acknowledged')
          .to.be.equal(true);
        expect(results)
          .to.have.property('index')
          .to.be.equal(indexName);
        expect(createIndexStub.getCall(0).args[0]).to.eql({ index: indexName });
      });

      it('gracefully fails to create an index when indexName is invalid', async () => {
        const indexName = '-bad-index-name';
        const esCreateIndexError = {
          body: {
            error: {
              type: 'invalid_index_name_exception',
              reason:
                "Invalid index name [-bad-index-name], must not start with '_', '-', or '+'",
              index: '-bad-index-name'
            },
            status: 400
          }
        };
        const createIndexStub = sandbox
          .stub(esClient.indices, 'create')
          .throws(esCreateIndexError);

        try {
          await esCrudService.createIndex(indexName);
        } catch (err) {
          expect(err.message).to.be.equal('invalid_index_name_exception');
          expect(createIndexStub.getCall(0).args[0]).to.eql({
            index: indexName
          });
        }
      });
    });

    describe('deleteIndex', () => {
      it('successfully deletes an index if it exists', async () => {
        const indexName = 'es-test-index';
        const esDeleteIndexResponse = { acknowledged: true };
        const existsIndexStub = sandbox
          .stub(esClient.indices, 'exists')
          .resolves(true);
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .resolves(esDeleteIndexResponse);

        const results = await esCrudService.deleteIndex(indexName);

        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
        expect(existsIndexStub.getCall(0).args[0]).to.eql({ index: indexName });
        expect(deleteIndexStub.getCall(0).args[0]).to.eql({ index: indexName });
      });

      it('gracefully fails to delete an index if it doesnt exist', async () => {
        const indexName = 'index-not-there';
        const existsIndexStub = sandbox
          .stub(esClient.indices, 'exists')
          .resolves(false);

        try {
          await esCrudService.deleteIndex(indexName);
        } catch (err) {
          expect(err.message).to.be.equal(ES_INDEX_NOT_FOUND);
          expect(existsIndexStub.getCall(0).args[0]).to.eql({
            index: indexName
          });
        }
      });

      it('gracefully exists if Elasticsearch fails to delete an index which exists', async () => {
        const indexName = 'es-test-index';
        const existsIndexStub = sandbox
          .stub(esClient.indices, 'exists')
          .resolves(true);
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .throws(ES_GENERAL_ERROR);

        try {
          await esCrudService.deleteIndex(indexName);
        } catch (err) {
          expect(err.message).to.be.equal(ES_GENERAL_ERROR);
          expect(existsIndexStub.getCall(0).args[0]).to.eql({
            index: indexName
          });
          expect(deleteIndexStub.getCall(0).args[0]).to.eql({
            index: indexName
          });
        }
      });
    });

    describe('deleteAllIndices', () => {
      it('successfully deletes all indices', async () => {
        const esDeleteAllIndicesResponse = { acknowledged: true };
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .resolves(esDeleteAllIndicesResponse);

        const results = await esCrudService.deleteAllIndices();

        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
        expect(deleteIndexStub.getCall(0).args[0]).to.eql({ index: '_all' });
      });

      it('gracefully exits if ElasticSearch fails to delete all indices', async () => {
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .throws(ES_NO_CONNECTION);

        try {
          await esCrudService.deleteAllIndices();
        } catch (err) {
          expect(err.message).to.be.equal(ES_NO_CONNECTION);
          expect(deleteIndexStub.getCall(0).args[0]).to.eql({ index: '_all' });
        }
      });
    });
  });

  describe('DOCUMENT OPERATIONS', () => {
    describe('addOrUpdateDocument', () => {
      it('successfully creates a new document', async () => {
        const indexName = 'es-test-index';
        const doc = { title: 'Document 1 in index es-test-index', guid: 1 };
        const esAddDocumentResponse = {
          _index: indexName,
          _id: doc.guid,
          result: 'created'
        };
        const createParams = {
          index: indexName,
          id: doc.guid,
          type: '_doc',
          body: doc
        };
        const addDocumentStub = sandbox
          .stub(esClient, 'index')
          .resolves(esAddDocumentResponse);

        const { success, results } = await esCrudService.addOrUpdateDocument(
          indexName,
          doc
        );

        expect(success).to.equal(true);
        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('created');
        expect(addDocumentStub.getCall(0).args[0]).to.eql(createParams);
      });

      it('gracefully exits if ElasticSearch fails to create a new document', async () => {
        const indexName = 'es-test-index';
        const doc = { title: 'Document 1 in index es-test-index', guid: 1 };

        const createParams = {
          index: indexName,
          id: doc.guid,
          type: '_doc',
          body: doc
        };
        const addDocumentStub = sandbox.stub(esClient, 'index').throws();

        const { success } = await esCrudService.addOrUpdateDocument(
          indexName,
          doc
        );
        expect(success).to.equal(false);
        expect(addDocumentStub.getCall(0).args[0]).to.eql(createParams);
      });
    });

    describe('addDocumentsBulk', () => {
      it('successfully creates multiple documents using bulk API', async () => {
        const indexName = 'es-test-index';
        const action = 'index';
        const docArray = [
          { title: 'Document 1 in index es-test-index', guid: 1 },
          { title: 'Document 2 in index es-test-index', guid: 2 },
          { title: 'Document 3 in index es-test-index', guid: 3 }
        ];

        const bulkActionsBody = [
          { index: { _index: indexName, _type: '_doc', _id: 3 } },
          docArray[0],
          { index: { _index: indexName, _type: '_doc', _id: 3 } },
          docArray[1],
          { index: { _index: indexName, _type: '_doc', _id: 3 } },
          docArray[2]
        ];

        const bulkEditBodyStub = sandbox
          .stub(bulkUtils, 'bulkEditBody')
          .resolves(bulkActionsBody);

        const addDocumentsBulkStub = sandbox
          .stub(esClient, 'bulk')
          .resolves({ errors: false });

        const { success, results } = await esCrudService.addDocumentsBulk(
          indexName,
          docArray
        );
        expect(success).to.equal(true);
        expect(results)
          .to.have.property('errors')
          .to.be.equal(false);
        expect(bulkEditBodyStub.getCall(0).args[0]).to.eql(
          indexName,
          action,
          docArray
        );
        expect(addDocumentsBulkStub.getCall(0).args[0]).to.eql({
          body: bulkActionsBody
        });
      });

      it('gracefully exits if ElasticSearch fails to create documents in bulk', async () => {
        const indexName = 'es-test-index';
        const action = 'index';
        const docArray = [
          { title: 'Document 1 in index es-test-index', guid: 1 },
          { title: 'Document 2 in index es-test-index', guid: 2 },
          { title: 'Document 3 in index es-test-index', guid: 3 }
        ];

        const bulkActionsBody = [
          { index: { _index: 'es-test-index', _type: '_doc', _id: 3 } },
          { title: 'Document 1 in index es-test-index', guid: 1 },
          { index: { _index: 'es-test-index', _type: '_doc', _id: 3 } },
          { title: 'Document 2 in index es-test-index', guid: 2 },
          { index: { _index: 'es-test-index', _type: '_doc', _id: 3 } },
          { title: 'Document 3 in index es-test-index', guid: 3 }
        ];

        const bulkEditBodyStub = sandbox
          .stub(bulkUtils, 'bulkEditBody')
          .resolves(bulkActionsBody);

        const addDocumentsBulkStub = sandbox.stub(esClient, 'bulk').throws();

        const { success } = await esCrudService.addDocumentsBulk(
          indexName,
          docArray
        );
        expect(success).to.equal(false);
        expect(bulkEditBodyStub.getCall(0).args[0]).to.eql(
          indexName,
          action,
          docArray
        );
        expect(addDocumentsBulkStub.getCall(0).args[0]).to.eql({
          body: bulkActionsBody
        });
      });
    });

    describe('deleteDocument', () => {
      it('successfully deletes a document from an index given document id', async () => {
        const indexName = 'es-test-index';
        const docId = 1;
        const esDeleteDocumentResponse = {
          _index: indexName,
          _id: `${docId}`,
          result: 'deleted'
        };
        const deleteParams = {
          index: indexName,
          id: docId,
          type: '_doc'
        };
        const deleteDocumentStub = sandbox
          .stub(esClient, 'delete')
          .resolves(esDeleteDocumentResponse);

        const { success, results } = await esCrudService.deleteDocument(
          indexName,
          docId
        );

        expect(success).to.equal(true);
        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('deleted');
        expect(results)
          .to.have.property('_index')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.equal(`${docId}`);
        expect(deleteDocumentStub.getCall(0).args[0]).to.eql(deleteParams);
      });
    });

    describe('deleteDocumentsBulk', () => {});
  });
});
