const { expect } = require('chai');
const sinon = require('sinon');
const dataService = require('../../../services/dataService');
const clusterService = require('../../../services/clusterService');
const bulkUtils = require('../../../util/esBulkUtils');
// TODO: use bulkUtils inst4ead of stubbbing it

const sandbox = sinon.createSandbox();
const indexName = 'es-test-index';

describe('Integration: elasticSearch: Document CRUD Services', () => {
  describe('DOCUMENT OPERATIONS', () => {
    describe('addOrUpdateDocument: new document case', () => {
      afterEach(async () => {
        await clusterService.deleteIndex(indexName);
        sandbox.restore();
      });

      it('successfully creates a new document', async () => {
        const doc = { title: 'Document 1 in index es-test-index', id: 1 };
        const results = await dataService.addOrUpdateDocument(indexName, doc);

        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('created');
        expect(results)
          .to.have.property('_index')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.equal(`${doc.id}`);
      });
    });

    describe('addOrUpdateDocument: update existing document case', () => {
      const doc = { title: 'Document 1 in index es-test-index', id: 1 };
      beforeEach(async () => {
        await dataService.addOrUpdateDocument(indexName, doc);
      });
      afterEach(async () => {
        await clusterService.deleteIndex(indexName);
        sandbox.restore();
      });
      it('updates document if it already exists', async () => {
        const results = await dataService.addOrUpdateDocument(indexName, doc);

        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('updated');
        expect(results)
          .to.have.property('_index')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.equal(`${doc.id}`);
      });
    });

    describe('addDocumentsBulk', () => {
      afterEach(async () => {
        try {
          await clusterService.deleteIndex(indexName);
        } catch (err) {}
        sandbox.restore();
      });
      it('Mode strict = false: returns results when creating multiple documents, even if some documents failed to create', async () => {
        const docArray = [
          { title: 'Document 1 in index es-test-index', id: 1 },
          { title: 'Document 2 in index es-test-index', id: 2 },
          { title: 'Document 3 in index es-test-index', id: 3 }
        ];

        const results = await dataService.addDocumentsBulk(indexName, docArray);

        expect(results)
          .to.have.property('errors')
          .to.be.equal(false);
        expect(results)
          .to.have.property('items')
          .to.be.an('array')
          .to.have.length(docArray.length);
      });
    });

    describe('deleteDocument', () => {
      describe('deleteDocument: Success', () => {
        const doc = { title: 'Document 100 in index es-test-index', id: 100 };

        beforeEach(async () => {
          await dataService.addOrUpdateDocument(indexName, doc);
        });
        afterEach(async () => {
          await clusterService.deleteIndex(indexName);
          sandbox.restore();
        });
        it('successfully deletes a document from an index given document id', async () => {
          const docId = doc.id;
          const results = await dataService.deleteDocument(indexName, docId);

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

      describe('deleteDocument: Failure', () => {
        describe('deleteDocument: when index is not found', () => {
          afterEach(async () => {
            sandbox.restore();
          });
          it('throws error if fails to delete a document when index doesnt exist', async () => {
            const docId = 100;
            let error;
            try {
              await dataService.deleteDocument(indexName, docId);
            } catch (err) {
              error = err;
            }

            expect(error)
              .to.have.property('name')
              .to.be.a('string')
              .to.be.equal('ElasticSearchError');

            expect(error)
              .to.have.property('type')
              .to.be.a('string')
              .to.be.equal('Index Not Found');

            expect(error)
              .to.have.property('httpCode')
              .to.be.a('number')
              .to.be.equal(404);
          });
        });

        describe('deleteDocument: when document is not found', () => {
          beforeEach(async () => {
            await clusterService.createIndex(indexName);
          });
          afterEach(async () => {
            await clusterService.deleteIndex(indexName);
            sandbox.restore();
          });
          it('throws error if fails to delete a document when document doesnt exist', async () => {
            const docId = 100;
            let error;
            try {
              await dataService.deleteDocument(indexName, docId);
            } catch (err) {
              error = err;
            }

            expect(error)
              .to.have.property('name')
              .to.be.a('string')
              .to.be.equal('ElasticSearchError');

            expect(error)
              .to.have.property('type')
              .to.be.a('string')
              .to.be.equal('Document Not Found');

            expect(error)
              .to.have.property('httpCode')
              .to.be.a('number')
              .to.be.equal(404);
          });
        });
      });
    });

    describe('deleteDocumentsBulk', () => {
      describe('deleteDocumentsBulk: Success', () => {
        const docArray = [
          { title: 'Document 1 in index es-test-index', id: 1 },
          { title: 'Document 2 in index es-test-index', id: 2 },
          { title: 'Document 3 in index es-test-index', id: 3 }
        ];

        beforeEach(async () => {
          await dataService.addDocumentsBulk(indexName, docArray);
        });
        afterEach(async () => {
          await clusterService.deleteIndex(indexName);
          sandbox.restore();
        });
        it('successfully deletes all documents in bulk', async () => {
          const docIds = [docArray[0].id, docArray[1].id, docArray[2].id];
          const results = await dataService.deleteDocumentsBulk(
            indexName,
            docIds
          );

          expect(results)
            .to.be.an('object')
            .to.have.property('errors')
            .to.be.equal(false);
          expect(results)
            .to.have.property('items')
            .to.be.an('array')
            .to.have.length(docArray.length);
        });
      });
    });
  });
});
