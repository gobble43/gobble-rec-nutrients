const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

const startProductWorker = () => {
  const loopProductWorker = () => {
    client.llenAsync('getProductInfo')
      .then((length) => {
        if (length === 0) {
          setTimeout(loopProductWorker, 1000);
        } else {
          client.rpopAsync('getProductInfo')
            .then((taskString) => {
              console.log('productWorker working on: ', taskString);
              const task = JSON.parse(taskString);
              // TODO: request brand, nutrients from master DB with task.UPC
              return JSON.stringify({
                UPC: task.UPC, brand: 'exampleBrand',
                nutrients: { exampleBadNutrient: 200, exampleGoodNutrient: 100 },
              });
            })
            .then((productInfo) => {
              console.log('sending productInfo to master :', productInfo);
              // send back UPC with brand, nutrients
              process.send(productInfo);
              loopProductWorker();
            })
            .catch((err) => {
              console.err(err);
            });
        }
      });
  };
  loopProductWorker();
};

startProductWorker();
