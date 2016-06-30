const recommendationWorker = require('../../workers/recommendationWorker.js');
const helper = require('../../util/helpers.js');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.end('Hello World!');
  });
  app.post('/api/getRecommendation', (req, res) => {
    console.log('httpServer recieved a task, getRecommendation: ', req.body);
    // TODO: modify the first parameter once the master DB endpoint is established
    helper.getRecommendation(1)
    .then((cache) => {
      if (cache) {
        console.log('cached recommendation', JSON.parse(cache));
        res.status(201).send(typeof JSON.parse(cache));
      } else {
        recommendationWorker.getRecommendation(1, (err, data) => {
          if (err) {
            // Do not show this message to the user
            // if recommendation is not ready, just show the product info from master DB only
            console.log('recommendation is not ready yet: ', err);
            res.status(404).send(`Recommendation is not ready yet: ${err}`);
          } else {
            console.log('recommendation produced', data);
            res.status(201).send(typeof data);
          }
        });
      }
    });
  });
};
