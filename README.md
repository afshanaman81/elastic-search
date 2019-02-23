## pre-requisites
It is assumed that you have installed node.js, npm, and docker on your system, and have downloaded the docker images for the latest elasticsearch and kibana (optional).

This demo uses images of version 6.6 for both ES and Kibana, but if you are using a different set of images, update the docker-compose.yml to reflect that. 

## install dependencies
```npm i```

## run elasticsearch and kibana in a docker container
```docker-compose up```

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

