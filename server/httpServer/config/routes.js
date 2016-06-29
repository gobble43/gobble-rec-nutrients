const recommendationWorker = require('../../workers/recommendationWorker.js');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/getRecommendation', (req, res) => {
    console.log('httpServer recieved a task, getRecommendation: ', req.body);
    recommendationWorker.getRecommendation(req.body.UPC, (data) => {
      res.status(201).end(typeof data);
    });
  });
};
