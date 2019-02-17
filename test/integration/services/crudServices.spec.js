const { expect } = require('chai');
const sinon = require('sinon');
const esCrudService = require('../../../services/crudServives');
const esClient = require('../../../clients/elasticsearchClient');
const bulkUtils = require('../../../util/esBulkUtils');
const {
  ES_INDEX_NOT_FOUND,
  ES_GENERAL_ERROR
} = require('../../../errors/messages');

const sandbox = sinon.createSandbox();
const indexName = 'es-test-index';

describe.only('Integration: elasticSearch: crudServices', () => {
  describe('INDEX OPERATIONS', () => {
    describe('createIndex', () => {
      beforeEach(async () => {
        await esCrudService.deleteIndex(indexName);
      });
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });

      it('successfully creates an index when indexName is valid', async () => {
        const { success, results } = await esCrudService.createIndex(indexName);

        expect(success).to.be.equal(true);

        expect(results).to.be.an('object');
        expect(results)
          .to.have.property('acknowledged')
          .to.be.equal(true);
        expect(results)
          .to.have.property('index')
          .to.be.equal(indexName);
      });

      it('gracefully fails to create an index when indexName is invalid', async () => {
        const badIndexName = '-bad-index-name';

        const { success, results } = await esCrudService.createIndex(
          badIndexName
        );
        expect(success).to.be.equal(false);

        expect(results)
          .to.have.property('body')
          .to.be.an('object');
        expect(results.body)
          .to.have.property('error')
          .to.be.an('object');
        expect(results.body)
          .to.have.property('status')
          .to.be.equal(400);
        expect(results.body.error)
          .to.have.property('type')
          .to.be.equal('invalid_index_name_exception');
      });
    });

    describe('deleteIndex', () => {
      describe('deleteIndex: Success', () => {
        beforeEach(async () => {
          await esCrudService.createIndex(indexName);
        });
        afterEach(async () => {
          await esCrudService.deleteIndex(indexName);
          sandbox.restore();
        });

        it('successfully deletes an index if it exists', async () => {
          const { success, results } = await esCrudService.deleteIndex(
            indexName
          );

          expect(success).to.be.equal(true);
          expect(results)
            .to.be.an('object')
            .to.have.property('acknowledged')
            .to.be.equal(true);
        });
      });
      describe('deleteIndex: Failure', () => {
        beforeEach(async () => {
          await esCrudService.createIndex(indexName);
        });
        afterEach(async () => {
          sandbox.restore();
        });
        it('gracefully fails to delete an index if it doesnt exist', async () => {
          const badIndexName = 'index-not-there';
          const { success, results } = await esCrudService.deleteIndex(
            badIndexName
          );

          expect(success).to.be.equal(false);
          expect(results).to.be.equal(ES_INDEX_NOT_FOUND);
        });

        it('gracefully exists if Elasticsearch fails to delete an index which exists', async () => {
          // cause a failure in ElasticSearch method
          const deleteIndexStub = sandbox
            .stub(esClient.indices, 'delete')
            .throws(ES_GENERAL_ERROR);

          const { success, results } = await esCrudService.deleteIndex(
            indexName
          );

          expect(success).to.be.equal(false);
          expect(results).to.be.equal(ES_GENERAL_ERROR);
          expect(deleteIndexStub.getCall(0).args[0]).to.eql({
            index: indexName
          });
        });
      });
    });

    describe('deleteAllIndices', () => {
      beforeEach(async () => {
        await esCrudService.createIndex('index-1');
        await esCrudService.createIndex('index-2');
        await esCrudService.createIndex('index-3');
      });
      afterEach(async () => {
        await esCrudService.deleteAllIndices();
        sandbox.restore();
      });

      it('successfully deletes all indices', async () => {
        const { success, results } = await esCrudService.deleteAllIndices();

        expect(success).to.be.equal(true);
        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
      });

      it('gracefully exits if ElasticSearch fails to delete all indices', async () => {
        // cause a failure in ElasticSearch method
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .throws();

        const { success } = await esCrudService.deleteAllIndices();

        expect(success).to.be.equal(false);
        expect(deleteIndexStub.getCall(0).args[0]).to.eql({ index: '_all' });

        // to remove the stub, otherwise the afterEach wont work
        sandbox.restore();
      });
    });
  });

  describe('DOCUMENT OPERATIONS', () => {
    describe('addOrUpdateDocument: new', () => {
      beforeEach(async () => {
        await esCrudService.deleteIndex(indexName);
      });
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });

      it('successfully creates a new document', async () => {
        const doc = { title: 'Document 1 in index es-test-index', guid: 1 };
        const { success, results } = await esCrudService.addOrUpdateDocument(
          indexName,
          doc
        );

        expect(success).to.equal(true);
        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('created');
        expect(results)
          .to.have.property('_index')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.equal(`${doc.guid}`);
      });
    });

    describe('addOrUpdateDocument: update', () => {
      const doc = { title: 'Document 1 in index es-test-index', guid: 1 };
      beforeEach(async () => {
        await esCrudService.addOrUpdateDocument(indexName, doc);
      });
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });
      it('updates document if it already exists', async () => {
        const { success, results } = await esCrudService.addOrUpdateDocument(
          indexName,
          doc
        );

        expect(success).to.equal(true);

        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('updated');
        expect(results)
          .to.have.property('_index')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.equal(`${doc.guid}`);
      });
    });

    describe('addDocumentsBulk', () => {
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });
      it('successfully creates multiple documents using bulk API', async () => {
        const docArray = [
          { title: 'Document 1 in index es-test-index', guid: 1 },
          { title: 'Document 2 in index es-test-index', guid: 2 },
          { title: 'Document 3 in index es-test-index', guid: 3 }
        ];

        const { success, results } = await esCrudService.addDocumentsBulk(
          indexName,
          docArray
        );

        expect(success).to.equal(true);
        expect(results)
          .to.have.property('errors')
          .to.be.equal(false);
        expect(results)
          .to.have.property('items')
          .to.be.an('array')
          .to.have.length(docArray.length);
      });

      it('gracefully exits if ElasticSearch fails to create documents in bulk', async () => {
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

        const addDocumentsBulkStub = sandbox
          .stub(esClient, 'bulk')
          .throws();

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
      const doc = { title: 'Document 100 in index es-test-index', guid: 100 };

      beforeEach(async () => {
        await esCrudService.addOrUpdateDocument(indexName, doc);
      });
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });
      it('successfully deletes a document from an index given document id', async () => {
        const docId = doc.guid;
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
      });
    });

    describe('deleteDocumentsBulk', () => {});
  });
});
