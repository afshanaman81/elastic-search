const { expect } = require('chai');
const sinon = require('sinon');
const clusterService = require('../../../services/clusterService');

const sandbox = sinon.createSandbox();
const indexName = 'es-test-index';

describe('Integration: elasticSearch: Index CRUD Services', () => {
  describe('INDEX OPERATIONS', () => {
    describe('createIndex', () => {
      afterEach(async () => {
        try {
          await clusterService.deleteIndex(indexName);
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully creates an index when indexName is valid', async () => {
        const results = await clusterService.createIndex(indexName);

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
          await clusterService.createIndex(badIndexName);
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
            await clusterService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          sandbox.restore();
        });

        it('successfully deletes an index if it exists', async () => {
          const results = await clusterService.deleteIndex(indexName);

          expect(results)
            .to.be.an('object')
            .to.have.property('acknowledged')
            .to.be.equal(true);
        });
      });
      describe('deleteIndex: Failure', () => {
        beforeEach(async () => {
          try {
            await clusterService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          try {
            await clusterService.deleteIndex(indexName);
          } catch (err) {}
          sandbox.restore();
        });
        it('throws error if ElasticSearch fails to delete an index because it doesnt exist', async () => {
          const badIndexName = 'index-not-there';
          let error;
          try {
            await clusterService.deleteIndex(badIndexName);
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
        await clusterService.createIndex('index-1');
        await clusterService.createIndex('index-2');
        await clusterService.createIndex('index-3');
      });
      afterEach(async () => {
        try {
          await clusterService.deleteAllIndices();
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully deletes all indices', async () => {
        const results = await clusterService.deleteAllIndices();

        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
      });
    });
  });
});
