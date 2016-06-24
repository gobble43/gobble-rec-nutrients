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
      if (message.task === 'addNewProductRecommendation') {
        client.hmset(
          message.UPC, 'brand', 'waitingForData', 'nutrients', 'waitingForData',
          'recommendedProduct', 'waitingForData', 'recommendedProductNutrients', 'waitingForData'
        );
        client.lpush('addNewProductRecommendation', JSON.stringify(message));
        client.lpush('getProductInfo', JSON.stringify(message));
        client.lpush('getCategories', JSON.stringify(message));
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
      client.hmset(
        productInfo.UPC, 'brand', productInfo.brand, 'nutrients',
        JSON.stringify(productInfo.nutrients)
      );
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
      categories.categories.forEach((category) => {
        client.hset(categories.UPC, category, 'waitingForData');
        data = { UPC: categories.UPC, category };
        client.lpush('getCategoryNutrients', JSON.stringify(data));
      });
    });
  }
};

const checkCategoryNutrientsWorker = () => {
  if (workers.categoryNutrientsWorker === undefined) {
    console.log('master created a categoryNutrients worker');
    workers.categoryNutrientsWorker = cluster.fork({ ROLE: 'categoryNutrients worker' });
    workers.categoryNutrientsWorker.on('online', () => {
      console.log('categoryNutrients worker online');
    });
    workers.categoryNutrientsWorker.on('exit', () => {
      console.log('categoryNutrients worker exited');
      delete workers.categoryNutrientsWorker;
    });
    workers.categoryNutrientsWorker.on('message', (categoryNutrients) => {
      console.log(
        'master recieved categoryNutrients from categoryNutrients worker', categoryNutrients
      );
      client.hset(categoryNutrients.UPC, categoryNutrients.category, categoryNutrients.nutrients);
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
      checkCategoryNutrientsWorker();
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
} else if (process.env.ROLE === 'categoryNutrients worker') {
  require('./workers/categoryNutrientsWorker.js');
}

