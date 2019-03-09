const { expect } = require('chai');
const sinon = require('sinon');
const dataService = require('../../../services/dataService');
const esClient = require('../../../clients/elasticsearchClient');
const bulkUtils = require('../../../util/esBulkUtils');

const sandbox = sinon.createSandbox();

describe('elasticSearch: Document CRUD Services', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('DOCUMENT OPERATIONS', () => {
    describe('addOrUpdateDocument', () => {
      it('addOrUpdateDocument: new document case', async () => {
        const indexName = 'es-test-index';
        const doc = { title: 'Document 1 in index es-test-index', id: 1 };
        const esAddDocumentResponse = {
          _index: indexName,
          _id: doc.id,
          result: 'created'
        };
        const createParams = {
          index: indexName,
          id: doc.id,
          type: '_doc',
          body: doc
        };
        const addDocumentStub = sandbox
          .stub(esClient, 'index')
          .resolves(esAddDocumentResponse);

        const results = await dataService.addOrUpdateDocument(indexName, doc);

        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('created');
        expect(results)
          .to.have.property('_index')
          .to.be.a('string')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.a('number')
          .to.be.equal(doc.id);
        expect(addDocumentStub.getCall(0).args[0]).to.eql(createParams);
      });

      it('addOrUpdateDocument: update existing document case', async () => {
        const indexName = 'es-test-index';
        const doc = { title: 'Document 1 in index es-test-index', id: 1 };
        const esUpdateDocumentResponse = {
          _index: indexName,
          _id: doc.id,
          result: 'updated'
        };
        const createParams = {
          index: indexName,
          id: doc.id,
          type: '_doc',
          body: doc
        };
        const addDocumentStub = sandbox
          .stub(esClient, 'index')
          .resolves(esUpdateDocumentResponse);

        const results = await dataService.addOrUpdateDocument(indexName, doc);

        expect(results)
          .to.be.an('object')
          .to.have.property('result')
          .to.be.equal('updated');
        expect(results)
          .to.have.property('_index')
          .to.be.a('string')
          .to.be.equal(indexName);
        expect(results)
          .to.have.property('_id')
          .to.be.a('number')
          .to.be.equal(doc.id);
        expect(addDocumentStub.getCall(0).args[0]).to.eql(createParams);
      });
    });

    describe('addDocumentsBulk', () => {
      const indexName = 'es-test-index';
      const action = 'index';
      const docArray = [
        { title: 'Document 1 in index es-test-index', id: 1 },
        { title: 'Document 2 in index es-test-index', id: 2 },
        { title: 'Document 3 in index es-test-index', id: 3 }
      ];

      const bulkActionsBody = [
        { index: { _index: indexName, _type: '_doc', _id: 1 } },
        docArray[0],
        { index: { _index: indexName, _type: '_doc', _id: 2 } },
        docArray[1],
        { index: { _index: indexName, _type: '_doc', _id: 3 } },
        docArray[2]
      ];

      it('Mode strict = false: returns results when creating multiple documents, even if some documents failed to create', async () => {
        const addDocumentsBulkResponse = {
          took: 10,
          errors: true, // errors occured
          items: [
            {
              index: {
                _index: indexName,
                _id: docArray[0].id,
                status: 200
              }
            },
            {
              index: {
                _index: indexName,
                _id: docArray[1].id,
                status: 200
              }
            },
            {
              index: {
                _index: indexName,
                _id: docArray[2].id,
                status: 404 // this operation failed!
              }
            }
          ]
        };
        const bulkEditBodyStub = sandbox
          .stub(bulkUtils, 'bulkEditBody')
          .resolves(bulkActionsBody);

        const addDocumentsBulkStub = sandbox
          .stub(esClient, 'bulk')
          .resolves(addDocumentsBulkResponse);

        const results = await dataService.addDocumentsBulk(
          indexName,
          docArray
        ); // strict is false by default

        expect(results)
          .to.have.property('errors')
          .to.be.eq(true);
        expect(results)
          .to.have.property('items')
          .to.be.an('array')
          .to.have.length(docArray.length);
        expect(bulkEditBodyStub.getCall(0).args[0]).to.eql(
          indexName,
          action,
          docArray
        );
        expect(addDocumentsBulkStub.getCall(0).args[0]).to.eql({
          body: bulkActionsBody
        });
      });

      describe('Mode strict = true', () => {
        it('return results if all the documents were indexed successfully in bulk', async () => {
          const addDocumentsBulkResponse = {
            took: 10,
            errors: false, // no errors happened!
            items: [
              {
                index: {
                  _index: indexName,
                  _id: docArray[0].id,
                  status: 200
                }
              },
              {
                index: {
                  _index: indexName,
                  _id: docArray[1].id,
                  status: 200
                }
              },
              {
                index: {
                  _index: indexName,
                  _id: docArray[2].id,
                  status: 200
                }
              }
            ]
          };
          const bulkEditBodyStub = sandbox
            .stub(bulkUtils, 'bulkEditBody')
            .resolves(bulkActionsBody);

          const addDocumentsBulkStub = sandbox
            .stub(esClient, 'bulk')
            .resolves(addDocumentsBulkResponse);

          const results = await dataService.addDocumentsBulk(
            indexName,
            docArray,
            true
          );

          expect(results)
            .to.have.property('errors')
            .to.be.eq(false);
          expect(results)
            .to.have.property('items')
            .to.be.an('array')
            .to.have.length(docArray.length);
          expect(bulkEditBodyStub.getCall(0).args[0]).to.eql(
            indexName,
            action,
            docArray
          );
          expect(addDocumentsBulkStub.getCall(0).args[0]).to.eql({
            body: bulkActionsBody
          });
        });

        it('throws error if ElasticSearch fails to index some of the documents in bulk', async () => {
          const addDocumentsBulkResponse = {
            took: 10,
            errors: true,
            items: [
              {
                index: {
                  _index: indexName,
                  _id: docArray[0].id,
                  status: 200
                }
              },
              {
                index: {
                  _index: indexName,
                  _id: docArray[1].id,
                  status: 200
                }
              },
              {
                index: {
                  _index: indexName,
                  _id: docArray[2].id,
                  status: 404 // this operation failed!
                }
              }
            ]
          };
          const bulkEditBodyStub = sandbox
            .stub(bulkUtils, 'bulkEditBody')
            .resolves(bulkActionsBody);

          const addDocumentsBulkStub = sandbox
            .stub(esClient, 'bulk')
            .resolves(addDocumentsBulkResponse);

          let error;
          try {
            await dataService.addDocumentsBulk(indexName, docArray, true);
          } catch (err) {
            error = err;
          }

          expect(error)
            .to.have.property('name')
            .to.be.eq('ElasticSearchError');
          expect(error)
            .to.have.property('type')
            .to.be.eq('Failed To Index All Documents');
          expect(error)
            .to.have.property('httpCode')
            .to.be.eq(500);
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
    });

    describe('deleteDocument', () => {
      describe('Success', () => {
        it('successfully deletes a document from an index given document id', async () => {
          const indexName = 'es-test-index';
          const docId = 1;
          const esDeleteDocumentResponse = {
            _index: indexName,
            _id: docId,
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
            .to.be.equal(docId);
          expect(deleteDocumentStub.getCall(0).args[0]).to.eql(deleteParams);
        });
      });

      describe('Failure', () => {
        it('throws error when index is not found', async () => {
          const indexName = 'index-not-there';
          const docId = 1;
          const esDeleteDocumentError = {
            body: {
              error: {
                type: 'index_not_found_exception',
                reason: 'no such index',
                index: indexName
              },
              status: 404
            }
          };
          const deleteParams = {
            index: indexName,
            id: docId,
            type: '_doc'
          };

          const deleteDocumentStub = sandbox
            .stub(esClient, 'delete')
            .throws(esDeleteDocumentError);

          let error;
          try {
            await dataService.deleteDocument(indexName, docId);
          } catch (err) {
            error = err;
          }

          expect(deleteDocumentStub.getCall(0).args[0]).to.eql(deleteParams);
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
        
        it('throws error when the document is not found', async () => {
          const indexName = 'es-test-index';
          const docId = 100;
          const esDeleteDocumentError = {
            body: {
              _index: indexName,
              _type: '_doc',
              _id: docId,
              _version: 1,
              result: 'not_found'
            }
          };
          const deleteParams = {
            index: indexName,
            id: docId,
            type: '_doc'
          };

          const deleteDocumentStub = sandbox
            .stub(esClient, 'delete')
            .throws(esDeleteDocumentError);

          let error;
          try {
            await dataService.deleteDocument(indexName, docId);
          } catch (err) {
            error = err;
          }

          expect(deleteDocumentStub.getCall(0).args[0]).to.eql(deleteParams);
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

    describe('deleteDocumentsBulk', () => {
      const docIds = [1, 2, 3];
      const indexName = 'es-test-index';
      const bulkActionsBody = [
        { delete: { _index: indexName, _type: '_doc', _id: docIds[0] } },
        { delete: { _index: indexName, _type: '_doc', _id: docIds[1] } },
        { delete: { _index: indexName, _type: '_doc', _id: docIds[2] } }
      ];
      describe('Mode strict = true', () => {
        it('returns results if ElasticSearch successfully deleted all documents in bulk', async () => {
          const deleteDoucmentsBulkResponse = {
            took: 10,
            errors: false,
            items: [
              {
                delete: {
                  _index: indexName,
                  _id: docIds[0],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[1],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[2],
                  status: 200
                }
              }
            ]
          };

          const bulkDeleteBodyStub = sandbox
            .stub(bulkUtils, 'bulkDeleteBody')
            .resolves(bulkActionsBody);

          const deleteDocumentsBulkStub = sandbox
            .stub(esClient, 'bulk')
            .resolves(deleteDoucmentsBulkResponse);

          const results = await dataService.deleteDocumentsBulk(
            indexName,
            docIds,
            true
          );

          expect(bulkDeleteBodyStub.getCall(0).args[0]).to.eql(
            indexName,
            docIds
          );
          expect(deleteDocumentsBulkStub.getCall(0).args[0]).to.eql({
            body: bulkActionsBody
          });
          expect(results)
            .to.be.an('object')
            .to.have.property('errors')
            .to.be.equal(false);
          expect(results)
            .to.have.property('items')
            .to.be.an('array')
            .to.have.length(docIds.length);
        });

        it('throws error if ElasticSearch fails to delete some of the documents in bulk', async () => {
          const deleteDoucmentsBulkResponse = {
            took: 10,
            errors: true,
            items: [
              {
                delete: {
                  _index: indexName,
                  _id: docIds[0],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[1],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[2],
                  status: 404 // this one failed
                }
              }
            ]
          };

          const bulkDeleteBodyStub = sandbox
            .stub(bulkUtils, 'bulkDeleteBody')
            .resolves(bulkActionsBody);

          const deleteDocumentsBulkStub = sandbox
            .stub(esClient, 'bulk')
            .resolves(deleteDoucmentsBulkResponse);

          let error;
          try {
            await dataService.deleteDocumentsBulk(indexName, docIds, true);
          } catch (err) {
            error = err;
          }

          expect(bulkDeleteBodyStub.getCall(0).args[0]).to.eql(
            indexName,
            docIds
          );
          expect(deleteDocumentsBulkStub.getCall(0).args[0]).to.eql({
            body: bulkActionsBody
          });
          expect(error)
            .to.have.property('name')
            .to.be.a('string')
            .to.be.eq('ElasticSearchError');
          expect(error)
            .to.have.property('type')
            .to.be.a('string')
            .to.be.eq('Failed To Delete All Documents');
          expect(error)
            .to.have.property('httpCode')
            .to.be.a('number')
            .to.be.eq(500);
        });
      });

      describe('Mode strict = false', () => {
        it('returns results when deleting multiple documents, even if some documents failed to delete', async () => {
          const deleteDoucmentsBulkResponse = {
            took: 10,
            errors: true,
            items: [
              {
                delete: {
                  _index: indexName,
                  _id: docIds[0],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[1],
                  status: 200
                }
              },
              {
                delete: {
                  _index: indexName,
                  _id: docIds[2],
                  status: 404 // this one failed
                }
              }
            ]
          };

          const bulkDeleteBodyStub = sandbox
            .stub(bulkUtils, 'bulkDeleteBody')
            .resolves(bulkActionsBody);

          const deleteDocumentsBulkStub = sandbox
            .stub(esClient, 'bulk')
            .resolves(deleteDoucmentsBulkResponse);

          const results = await dataService.deleteDocumentsBulk(
            indexName,
            docIds,
            false
          );

          expect(bulkDeleteBodyStub.getCall(0).args[0]).to.eql(
            indexName,
            docIds
          );
          expect(deleteDocumentsBulkStub.getCall(0).args[0]).to.eql({
            body: bulkActionsBody
          });
          expect(results)
            .to.be.an('object')
            .to.have.property('errors')
            .to.be.equal(true);
          expect(results)
            .to.have.property('items')
            .to.be.an('array')
            .to.have.length(docIds.length);
        });
      });
    });
  });
});