const router = require('express').Router();
const path = require('path');

router.get('/', (req, res) => {
  res.render('index', { title: 'Elasticsearch Demo' })
});

module.exports = router;
