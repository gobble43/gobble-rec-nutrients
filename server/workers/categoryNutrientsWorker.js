const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

const startCategoryNutrientsWorker = () => {
  const loopCategoryNutrientsWorker = () => {
    client.llenAsync('getCategoryNutrients')
      .then((length) => {
        if (length === 0) {
          setTimeout(loopCategoryNutrientsWorker, 1000);
        } else {
          client.rpopAsync('getCategoryNutrients')
            .then((taskString) => {
              console.log('categoryNutrientsWorker working on: ', taskString);
              // const task = JSON.parse(taskString);
              // request nutrients from master DB with task.category
            })
            .then((categoryNutrients) => {
              console.log('sending categoryNutrients to master :', categoryNutrients);
              // send back UPC with nutrients
              process.send(categoryNutrients);
              loopCategoryNutrientsWorker();
            })
            .catch((err) => {
              console.err(err);
            });
        }
      });
  };
  loopCategoryNutrientsWorker();
};

startCategoryNutrientsWorker();
