const { expect } = require('chai');
const sinon = require('sinon');
const esCrudService = require('../../../services/crudService');
const bulkUtils = require('../../../util/esBulkUtils');
// TODO: use bulkUtils inst4ead of stubbbing it

const sandbox = sinon.createSandbox();
const indexName = 'es-test-index';

describe('Integration: elasticSearch: crudServices', () => {
  describe('INDEX OPERATIONS', () => {
    describe('createIndex', () => {
      afterEach(async () => {
        try {
          await esCrudService.deleteIndex(indexName);
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully creates an index when indexName is valid', async () => {
        const results = await esCrudService.createIndex(indexName);

        expect(results).to.be.an('object');
        expect(results)
          .to.have.property('acknowledged')
          .to.be.equal(true);
        expect(results)
          .to.have.property('index')
          .to.be.equal(indexName);
      });

      it('throws error if Elasticsearch fails to create an index when indexName is invalid', async () => {
        const badIndexName = '-bad-index-name';
        let error;
        try {
          await esCrudService.createIndex(badIndexName);
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
          .to.be.equal('Invalid Index Name');

        expect(error)
          .to.have.property('httpCode')
          .to.be.a('number')
          .to.be.equal(400);
      });
    });

    describe('deleteIndex', () => {
      describe('deleteIndex: Success', () => {
        beforeEach(async () => {
          try {
            await esCrudService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          sandbox.restore();
        });

        it('successfully deletes an index if it exists', async () => {
          const results = await esCrudService.deleteIndex(indexName);

          expect(results)
            .to.be.an('object')
            .to.have.property('acknowledged')
            .to.be.equal(true);
        });
      });
      describe('deleteIndex: Failure', () => {
        beforeEach(async () => {
          try {
            await esCrudService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          try {
            await esCrudService.deleteIndex(indexName);
          } catch (err) {}
          sandbox.restore();
        });
        it('throws error if ElasticSearch fails to delete an index because it doesnt exist', async () => {
          const badIndexName = 'index-not-there';
          let error;
          try {
            await esCrudService.deleteIndex(badIndexName);
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
    });

    describe('deleteAllIndices', () => {
      beforeEach(async () => {
        await esCrudService.createIndex('index-1');
        await esCrudService.createIndex('index-2');
        await esCrudService.createIndex('index-3');
      });
      afterEach(async () => {
        try {
          await esCrudService.deleteAllIndices();
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully deletes all indices', async () => {
        const results = await esCrudService.deleteAllIndices();

        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
      });
    });
  });

  describe('DOCUMENT OPERATIONS', () => {
    describe('addOrUpdateDocument: new document case', () => {
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });

      it('successfully creates a new document', async () => {
        const doc = { title: 'Document 1 in index es-test-index', id: 1 };
        const results = await esCrudService.addOrUpdateDocument(indexName, doc);

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
        await esCrudService.addOrUpdateDocument(indexName, doc);
      });
      afterEach(async () => {
        await esCrudService.deleteIndex(indexName);
        sandbox.restore();
      });
      it('updates document if it already exists', async () => {
        const results = await esCrudService.addOrUpdateDocument(indexName, doc);

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
          await esCrudService.deleteIndex(indexName);
        } catch (err) {}
        sandbox.restore();
      });
      it('Mode strict = false: returns results when creating multiple documents, even if some documents failed to create', async () => {
        const docArray = [
          { title: 'Document 1 in index es-test-index', id: 1 },
          { title: 'Document 2 in index es-test-index', id: 2 },
          { title: 'Document 3 in index es-test-index', id: 3 }
        ];

        const results = await esCrudService.addDocumentsBulk(
          indexName,
          docArray
        );

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
          await esCrudService.addOrUpdateDocument(indexName, doc);
        });
        afterEach(async () => {
          await esCrudService.deleteIndex(indexName);
          sandbox.restore();
        });
        it('successfully deletes a document from an index given document id', async () => {
          const docId = doc.id;
          const results = await esCrudService.deleteDocument(indexName, docId);

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
              await esCrudService.deleteDocument(indexName, docId);
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
            await esCrudService.createIndex(indexName);
          });
          afterEach(async () => {
            await esCrudService.deleteIndex(indexName);
            sandbox.restore();
          });
          it('throws error if fails to delete a document when document doesnt exist', async () => {
            const docId = 100;
            let error;
            try {
              await esCrudService.deleteDocument(indexName, docId);
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
          await esCrudService.addDocumentsBulk(indexName, docArray);
        });
        afterEach(async () => {
          await esCrudService.deleteIndex(indexName);
          sandbox.restore();
        });
        it('successfully deletes all documents in bulk', async () => {
          const docIds = [docArray[0].id, docArray[1].id, docArray[2].id];
          const results = await esCrudService.deleteDocumentsBulk(
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