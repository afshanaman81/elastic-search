module.exports = {
  bulkEditBody: (index, action, docArray) => {
    const bulkActionsArray = [];
    const type = '_doc';
    const actionObject = {};
    // TODO: use map instead of forEach
    docArray.forEach(document => {
      if (!document.guid) {
        const error = 'Document requires a guid attribute for indexing.';
        console.log(error);
        throw new Error(error);
      }

      actionObject[action] = { _index: index, _type: type, _id: document.guid };
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
