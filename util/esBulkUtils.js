module.exports = {
  bulkEditBody: (index, action, docArray) => {
    const bulkActionsArray = [];
    const type = '_doc';

    docArray.forEach(document => {
      const actionObject = {};
      if (!document.id) {
        const error = 'Document requires id attribute for indexing.';
        console.log(error);
        throw new Error(error);
      }

      actionObject[action] = { _index: index, _type: type, _id: document.id };
      bulkActionsArray.push(actionObject);
      bulkActionsArray.push(document);
    });

    return bulkActionsArray;
  },

  bulkDeleteBody: (index, idsArray) => {
    const bulkActionsArray = [];
    const type = '_doc';
    idsArray.forEach(id => {
      bulkActionsArray.push({
        delete: { _index: index, _type: type, _id: id }
      });
    });

    return bulkActionsArray;
  }
};
