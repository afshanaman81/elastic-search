## pre-requisites
It is assumed that you have installed node.js, npm, and docker on your system, and have downloaded the docker images for the latest elasticsearch and kibana (optional).

This demo uses images of version 6.6 for both ES and Kibana, but if you are using a different set of images, update the docker-compose.yml to reflect that. 

In the project home:
## create .env file from the .env.example
make a copy of the env.example file and save it as .env

## install dependencies
```npm install```

## run elasticsearch and kibana in a docker container
```docker-compose up```

## populate ElasticSearch index
Using Postman:
- create index: ```PUT ('localhost:3000/elastic/index?indexName=movies')```

- create mapping on the 'movies' index: ```PUT ('localhost:3000/elastic/mapping?indexName=movies')```
    - creating mapping is optional in most cases for simple searches, since ES automatically creates dynamic mapping when the first document is indexed
    - but in case of auto-complete functionality, we must create the appropriate mapping on the index

    ```
    const mapping = {
        properties: {
            title: {
                type: 'completion', // will be used in auto-complete suggestions
                analyzer: 'simple',
                search_analyzer: 'simple'
            },
            phase: {
                type: 'completion',
                analyzer: 'simple',
                search_analyzer: 'simple'
            },
            category_name: { type: 'keyword' }, // type=keyword means exact matches only
            rating_name: { type: 'keyword' },
            budget: { type: 'keyword' }, // we do not want ES to look inside the value, for example for '000'
            release_year: {
                type: 'date',
                format: 'yyyy||epoch_millis'
            },
            release_date: { type: 'date', format: 'MMM dd, yyyy||epoch_millis' }
        }
    }
    ```

- populate 'movies' index with Json data: ```PUT ('localhost:3000/elastic/document/bulk?indexName=movies')```

## run the node server
```npm start```

## run the node server with hot reload (using nodemon)
```npm run start:dev```

## run unit tests
```npm test```

## run integration tests
(needs the elasticsearch running. Use docker-compose up)

```npm run test:int```

## to access
* ES: http://localhost:9200 
* See list of ElasticSearch indices: http://localhost:9200/_cat/indices?v
* See data in an index named 'test-index': http://localhost:9200/test-index?pretty
* Kibana: http://localhost:5601 

