const { expect } = require('chai');
const sinon = require('sinon');
const clusterService = require('../../../services/clusterService');
const esClient = require('../../../clients/elasticsearchClient');
const ElasticSearchError = require('../../../errors/esError');

const sandbox = sinon.createSandbox();

describe('elasticSearch: Index CRUD Services', () => {
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

        const results = await clusterService.createIndex(indexName);

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
          await clusterService.createIndex(badIndexName);
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

        const results = await clusterService.deleteIndex(indexName);

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
          await clusterService.deleteIndex(badIndexName);
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

        const results = await clusterService.deleteAllIndices();

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
          await clusterService.deleteAllIndices();
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

});