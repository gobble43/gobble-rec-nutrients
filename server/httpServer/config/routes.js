const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/tasks', (req, res) => {
    console.log('httpServer recieved a task: ', req.body);
    // check cached table
    client.hgetallAsync(req.body.UPC)
    .then((data) => {
      if (data) {
        console.log('data from redis cached table: ', data);
        res.status(200).end(JSON.stringify(data));
      } else {
        process.send(req.body);
        res.status(200).end();
      }
    })
    .catch((err) => {
      res.status(500).end(err);
    });
  });
};
