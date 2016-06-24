const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.get('/api/tasks', (req, res) => {
    console.log('httpServer recieved a task: ', req.body);
    // check cached table
    client.hgetall(req.body.UPC)
    .then((data) => {
      if (data) {
        res.status(200).end(data);
      } else {
        res.status(200).end();
      }
    })
    .catch((err) => {
      res.status(500).end(err);
    });
  });
};
