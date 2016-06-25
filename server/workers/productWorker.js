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
            .then((UPC) => {
              console.log('productWorker working on: ', UPC);
              // TODO: request name, brand, nutrients from master DB with task.UPC
              return JSON.stringify({
                UPC, name: 'exampleName', brand: 'exampleBrand', sodium: 200, calcium: 100,
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
