const recommendationWorker = require('../../workers/recommendationWorker.js');
const helper = require('../../util/helpers.js');

module.exports = (app) => {
  app.post('/api/addProduct', (req, res) => {
    console.log('PRODUCT TO BE ADDED: ', req.body);
    process.send(req.body);
    res.status(201).end();
  });
  app.post('/api/getRecommendation', (req, res) => {
    let firstLetter;
    for (let i = 0; i < req.body.upc.length; i++) {
      if (Number(req.body.upc[i]) !== 0) {
        firstLetter = i;
        break;
      }
    }
    const upc = req.body.upc.substring(firstLetter, req.body.upc.length);
    console.log('httpServer recieved a task, getRecommendation: ', upc);
    helper.getRecommendation(upc)
    .then((cache) => {
      if (cache) {
        console.log('cached recommendation', cache);
        res.status(201).send(cache);
      } else {
        recommendationWorker.getRecommendation(upc, (err, data) => {
          if (err) {
            // Do not show this message to the user
            // if recommendation is not ready, just show the product info from master DB only
            console.log('recommendation is not ready yet: ', err);
            res.status(404).send(`Recommendation is not ready yet: ${err}`);
          } else {
            console.log('recommendation produced', data);
            res.status(201).send(JSON.stringify(data));
          }
        });
      }
    });
  });
};

