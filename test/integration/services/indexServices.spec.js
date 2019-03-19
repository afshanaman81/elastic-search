const { expect } = require('chai');
const sinon = require('sinon');
const indexService = require('../../../services/indexService');

const sandbox = sinon.createSandbox();
const indexName = 'es-test-index';

describe('Integration: elasticSearch: Index CRUD Services', () => {
  describe('INDEX OPERATIONS', () => {
    describe('createIndex', () => {
      afterEach(async () => {
        try {
          await indexService.deleteIndex(indexName);
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully creates an index when indexName is valid', async () => {
        const results = await indexService.createIndex(indexName);

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
          await indexService.createIndex(badIndexName);
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
            await indexService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          sandbox.restore();
        });

        it('successfully deletes an index if it exists', async () => {
          const results = await indexService.deleteIndex(indexName);

          expect(results)
            .to.be.an('object')
            .to.have.property('acknowledged')
            .to.be.equal(true);
        });
      });
      describe('deleteIndex: Failure', () => {
        beforeEach(async () => {
          try {
            await indexService.createIndex(indexName);
          } catch (err) {}
        });
        afterEach(async () => {
          try {
            await indexService.deleteIndex(indexName);
          } catch (err) {}
          sandbox.restore();
        });
        it('throws error if ElasticSearch fails to delete an index because it doesnt exist', async () => {
          const badIndexName = 'index-not-there';
          let error;
          try {
            await indexService.deleteIndex(badIndexName);
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
        await indexService.createIndex('index-1');
        await indexService.createIndex('index-2');
        await indexService.createIndex('index-3');
      });
      afterEach(async () => {
        try {
          await indexService.deleteAllIndices();
        } catch (err) {}
        sandbox.restore();
      });

      it('successfully deletes all indices', async () => {
        const results = await indexService.deleteAllIndices();

        expect(results)
          .to.be.an('object')
          .to.have.property('acknowledged')
          .to.be.equal(true);
      });
    });
  });
});
