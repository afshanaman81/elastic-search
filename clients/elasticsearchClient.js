require('dotenv').config();
const elasticSearch = require('elasticsearch');


let client = false;
console.log(`ElasticSearch URL: ${process.env.ES_URL}`);
try {
  client = elasticSearch.Client({
    host: process.env.ES_URL
  });
} catch (err) {
  console.log(JSON.stringify(err, null, 2));
}

module.exports = client;
