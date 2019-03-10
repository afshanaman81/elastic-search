Using command line:
- spin up ElasticSearch docker container
    - in the projcet rool, execute: ```docker-compose up```
    - start the express server with hot-reload: ```npm run start:dev```

Using Postman:
- create index: ```PUT ('elastic/index?indexName=test-index')```

- create mapping on the 'movies' index: POST ('elastic/mapping')
    - creating mapping is optional, for ES automatically creates dynamic mapping when the first document is indexed

- create and populate 'movies' index with Json data: ```PUT ('elastic/document/bulk')```

- search ...

- auto-complete ...

