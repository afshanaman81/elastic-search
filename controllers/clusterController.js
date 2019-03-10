const indexService = require('../services/clusterService');

// Index CRUD Operations
exports.createIndex = async indexName => {
  try {
    const response = await indexService.createIndex(indexName);
    console.log('createIndex response: ', response);
    return `Index '${indexName}' successfully created`;
  } catch (err) {
    let errorMessage;
    if (err.message == 'invalid_index_name_exception')
      errorMessage = 'Index name was invalid. Please try again.';
    else if (err.message == 'resource_already_exists_exception')
      errorMessage = 'Index already exists';

    return errorMessage;
  }
};

exports.deleteIndex = async indexName => {
  try {
    if (indexName) {
      await indexService.deleteIndex(indexName);
      return `Index '${indexName}' successfully deleted`;
    } else {
      await crudService.deleteAllIndices();
      return 'All indices successfully deleted';
    }
  } catch (err) {
    //console.log(err.message);
    let errorMessage = err.message;
    return errorMessage;
  }
};

exports.createMapping = async indexName => {
  // read on 'index: not_analyzed', 'include_in_all: false', 'index: no' etc
  const mapping = {
    properties: {
      title: { type: 'text' },
      phase: { type: 'text' },
      category_name: { type: 'text', index: 'not_analyzed' },
      rating_name: { type: 'text', index: 'not_analyzed' },
      budget: { type: 'text', index: 'not_analyzed' }, // we do not want ES to look inside the value, for example for '000'
      release_year: {
        type: 'date',
        format: 'yyyy||epoch_millis',
        index: 'not_analyzed'
      },
      release_date: { type: 'date', format: 'MMM dd, yyyy||epoch_millis' }
    }
  };

  try {
    const response = await indexService.createMapping(indexName, mapping);
    console.log('createMapping response: ', response);
    return `Mapping successfully created on index '${indexName}'`;
  } catch (err) {
    return err.message;
  }
};
