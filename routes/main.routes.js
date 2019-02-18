const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ElasticSearch Demo App' });
});

module.exports = router;
