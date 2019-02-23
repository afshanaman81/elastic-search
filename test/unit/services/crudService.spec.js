const { expect } = require('chai');
const sinon = require('sinon');
const esCrudService = require('../../../services/crudService');
const esClient = require('../../../clients/elasticsearchClient');
const bulkUtils = require('../../../util/esBulkUtils');
const ElasticSearchError = require('../../../errors/esError');

const sandbox = sinon.createSandbox();

describe('elasticSearch: crudServices', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('INDEX OPERATIONS', () => {
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

      it('throws error if ElasticSearch fails to create an index when indexName is invalid', async () => {
        const badIndexName = '-bad-index-name';
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

        let error;
        try {
          await esCrudService.createIndex(badIndexName);
        } catch (err) {
          error = err;
        }

        expect(createIndexStub.getCall(0).args[0]).to.eql({
          index: badIndexName
        });

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

      it('throws error if ElasticSearch fails to delete an index because it doesnt exist', async () => {
        const badIndexName = 'index-not-there';
        const existsIndexStub = sandbox
          .stub(esClient.indices, 'exists')
          .throws(new ElasticSearchError('Index Not Found', {}, 404));

        let error;
        try {
          await esCrudService.deleteIndex(badIndexName);
        } catch (err) {
          error = err;
        }

        expect(existsIndexStub.getCall(0).args[0]).to.eql({
          index: badIndexName
        });

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

      it('throws error if ElasticSearch fails to delete all indices', async () => {
        const deleteIndexStub = sandbox
          .stub(esClient.indices, 'delete')
          .throws(new ElasticSearchError('Unknown Server Error', {}, 500));

        let error;
        try {
          await esCrudService.deleteAllIndices();
        } catch (err) {
          error = err;
        }

        expect(deleteIndexStub.getCall(0).args[0]).to.eql({ index: '_all' });
        expect(error)
          .to.have.property('name')
          .to.be.a('string')
          .to.be.equal('ElasticSearchError');

        expect(error)
          .to.have.property('type')
          .to.be.a('string')
          .to.be.equal('Unknown Server Error');

        expect(error)
          .to.have.property('httpCode')
          .to.be.a('number')
          .to.be.equal(500);
      });
    });
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

        const results = await esCrudService.addOrUpdateDocument(indexName, doc);

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

        const results = await esCrudService.addOrUpdateDocument(indexName, doc);

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

        const results = await esCrudService.addDocumentsBulk(
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

          const results = await esCrudService.addDocumentsBulk(
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
            await esCrudService.addDocumentsBulk(indexName, docArray, true);
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
            await esCrudService.deleteDocument(indexName, docId);
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
            await esCrudService.deleteDocument(indexName, docId);
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

          const results = await esCrudService.deleteDocumentsBulk(
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
            await esCrudService.deleteDocumentsBulk(indexName, docIds, true);
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

          const results = await esCrudService.deleteDocumentsBulk(
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