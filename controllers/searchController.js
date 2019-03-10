const esClient = require('../clients/elasticsearchClient');

const INDEX_NAME = 'movies';
const INDEX_TYPE = '_doc';
/** Data Exploration Operations */

// search for a term
exports.searchById = async id => {
  return esClient.search({
    index: INDEX_NAME,
    type: INDEX_TYPE,
    body: {
      query: {
        term: {
          _id: id
        }
      }
    }
  });
};

// autocomplete or Search as you type, or Type Ahead Search
exports.prefixQueryAutoCompleter = async prefix => {};

exports.edgeNgramFiltering = async param => {};

exports.completionSuggester = async (term, size) => {
  const searchParams = {
    index: INDEX_NAME,
    type: INDEX_TYPE,
    body: {
      suggest: {
        titleSuggester: {
          prefix: term,
          completion: {
            field: 'title',
            size: size,
            fuzzy: {
              fuzziness: 'auto'
            }
          }
        },
        phaseSuggester: {
          prefix: term,
          completion: {
            field: 'phase',
            size: size,
            fuzzy: {
              fuzziness: 'auto'
            }
          }
        }
      }
    }
  };
  try {
    const results = await esClient.search(searchParams);
    //console.log('results \n', results.suggest.titleSuggester);
    return results;
  } catch (err) {
    return err.message;
  }
};
