const crudService = require('../services/crudService');

exports.createIndex = async indexName => {
  try {
    await crudService.createIndex(indexName);
    return `Index ${indexName} successfully created`;
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
      await crudService.deleteIndex(indexName);
      return `Index ${indexName} successfully deleted`;
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
