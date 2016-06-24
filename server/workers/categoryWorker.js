const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

const startCategoryWorker = () => {
  const loopCategoryWorker = () => {
    client.llenAsync('getCategories')
      .then((length) => {
        if (length === 0) {
          setTimeout(loopCategoryWorker, 1000);
        } else {
          client.rpopAsync('getCategories')
            .then((taskString) => {
              console.log('categoryWorker working on: ', taskString);
              const task = JSON.parse(taskString);
              // TODO: request all the categories from master DB with task.UPC
              return JSON.stringify({
                UPC: task.UPC,
                categories: ['exampleCategory1', 'exampleCategory2'],
              });
            })
            .then((categories) => {
              console.log('sending categories to master :', categories);
              // send back UPC with categories
              process.send(categories);
              loopCategoryWorker();
            })
            .catch((err) => {
              console.err(err);
            });
        }
      });
  };
  loopCategoryWorker();
};

startCategoryWorker();
