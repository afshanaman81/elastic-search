## pre-requisites
It is assumed that you have installed node.js, npm, and docker on your system

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