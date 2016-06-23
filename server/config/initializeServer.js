const morgan = require('morgan');

module.exports = (app) => {
  app.use(morgan('dev'));
  // app.use(express.static(__dirname + './../../client'));
};
