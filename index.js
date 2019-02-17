require('dotenv').config();
const express = require('express');
const validator = require('joi');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const PORT = process.env.PORT;
const app = express();

// MIDDLEWARE


// ROTUES
app.use('/', (req, res) => res.json("Welcome to the ElasticSearch Demo!"))
app.use('/search', require('./routes/main.routes'))

// ERROR HANDLING
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
});

app.listen(PORT, () => {
  console.log(`
    App is Listening on port ${PORT}
    ENV: ${process.env.NODE_ENV}
    URL: http://localhost:${PORT}
    ES URL: ${process.env.ES_URL}`);
});

// EXPORT THE APP FOR TESTING                       ----------------------------------
module.exports = app;
