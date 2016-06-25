const cluster = require('cluster');
const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();
const workers = {};

const checkHTTPServer = () => {
  if (workers.httpServer === undefined) {
    console.log('master created an httpServer');
    workers.httpServer = cluster.fork({ ROLE: 'http server' });
    workers.httpServer.on('online', () => {
      console.log('http server online');
    });
    workers.httpServer.on('exit', () => {
      console.log('http server exited');
      delete workers.httpServer;
    });
    workers.httpServer.on('message', (message) => {
      // message contains task along with UPC or nutrient
      console.log('master recieved message from http server', message);
      if (!message.task) {
        console.log('bad task');
        return;
      }
      if (message.task === 'addNewProduct') {
        client.lpush('addNewProduct', message.UPC);
        client.lpush('getProductInfo', message.UPC);
      }
    });
  }
};

const checkProductWorker = () => {
  if (workers.productWorker === undefined) {
    console.log('master created a product worker');
    workers.productWorker = cluster.fork({ ROLE: 'product worker' });
    workers.productWorker.on('online', () => {
      console.log('product worker online');
    });
    workers.productWorker.on('exit', () => {
      console.log('product worker exited');
      delete workers.productWorker;
    });
    workers.productWorker.on('message', (productInfo) => {
      console.log('master recieved productInfo from product worker', productInfo);
      const parsedProductInfo = JSON.parse(productInfo);
      // 1. create a product table with productInfo
      client.hmset(
        `product:${parsedProductInfo.UPC}`,
        'productInfo', productInfo
      );
      client.lpush('getCategories', parsedProductInfo.UPC);
    });
  }
};

const checkCategoryWorker = () => {
  if (workers.categoryWorker === undefined) {
    console.log('master created a category worker');
    workers.categoryWorker = cluster.fork({ ROLE: 'category worker' });
    workers.categoryWorker.on('online', () => {
      console.log('category worker online');
    });
    workers.categoryWorker.on('exit', () => {
      console.log('category worker exited');
      delete workers.categoryWorker;
    });
    workers.categoryWorker.on('message', (categories) => {
      console.log('master recieved categories from category worker', categories);
      const parsedCategories = JSON.parse(categories);
      parsedCategories.categories.forEach((category) => {
        client.hgetAsync(`product:${parsedCategories.UPC}`, 'productInfo')
        .then((productInfo) => {
          const parsedProductInfo = JSON.parse(productInfo);
          Object.keys(parsedProductInfo).forEach((key) => {
            if (key !== 'UPC' && key !== 'brand' && key !== 'name') {
              if (Number(parsedProductInfo[key]) < 1000) {
                modifiedNutrientLevel = `0${parsedProductInfo[key].toString()}`;
              }
              // 2. create a product nutrients rank table sorted by category
              // zadd rankByCategory:calcium 0 milk:0100:129428359
              // zrangebylex calcium [milk:0 [milk:9999
              client.zadd(
                `rankByCategory:${key}`, 0,
                `${category}:${modifiedNutrientLevel}:${parsedCategories.UPC}`
              );
              // 3. create a product nutrients rank table sorted by nutrients level
              // zadd rankByLevel:calcium 0100 milk:129428359
              // zrangebyscore -inf +inf
              client.zadd(`rankByLevel:${key}`,
                modifiedNutrientLevel, `${category}:${parsedCategories.UPC}`
              );
              // 4. create a category table with average nutrients level for each category
              client.hmgetAsync(`category:${category}`, key, `${key}Products`)
              .then((categoryInfo) => {
                console.log('categoryInfo: ', categoryInfo);
                nutrientLevel = categoryInfo[0];
                numberOfProducts = categoryInfo[1];
                if (nutrientLevel) {
                  const newNumberOfProducts = numberOfProducts + 1;
                  const newNutrientLevel =
                  (nutrientLevel + parsedProductInfo[key]) / newNumberOfProducts;
                  client.hmset(
                    `category:${category}`, key, newNutrientLevel,
                    `${key}Products`, newNumberOfProducts
                  );
                } else {
                  client.hmset(
                    `category:${category}`, key, parsedProductInfo[key], `${key}Products`, 1
                  );
                }
              });
            }
          });
        });
      });
    });
  }
};

const startMaster = () => {
  console.log('master started');

  client.on('connect', () => {
    console.log('connected to redis');

    const loopWorkers = () => {
      checkHTTPServer();
      checkProductWorker();
      checkCategoryWorker();
    };

    loopWorkers();
    setInterval(loopWorkers, 2000);
  });
};

if (cluster.isMaster) {
  startMaster();
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'product worker') {
  require('./workers/productWorker.js');
} else if (process.env.ROLE === 'category worker') {
  require('./workers/categoryWorker.js');
}
