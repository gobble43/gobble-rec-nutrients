const helper = require('./util/helpers.js');
const cluster = require('cluster');
const redis = require('redis');
const client = redis.createClient();
const workers = {};

const checkMasterDB = () => {
  // // fetch all the newly added products & nutrients from 1 hour ago til now
  // fetch('/masterDB URL', {
  //   method: 'get',
  // }).then((res) => {
  //   console.log('===RES', res);
  //   if (res.body.length > 0) {
  //     // delete cached recommendation
  //     helper.removeRecommendations();
  //     // loop through the res.body (array)
  //     res.body.forEach((product) => {
  //       // store the information
  //       helper.storeProductInfo(product.UPC, product);
  //       // send each UPC to getCategories queue
  //       helper.addToQueue('getCategories', product.UPC);
  //     });
  //   }
  // }).catch((err) => {
  //   console.log('Error retreiving data from Gobble Master DB: ', err);
  // });
  console.log('retreiving products info from Master DB every minute for testing purpose');
  // store the product info temporarily to create matrix
  // helper.storeProductInfo(1, {
  //   UPC: 1,
  //   name: 'chobani',
  //   brand: 'meiji',
  //   sodium: 200,
  //   calcium: 100,
  // });
  // helper.addToQueue('getCategories', 1);
};

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
    workers.categoryWorker.on('message', (categoryData) => {
      console.log('master recieved categories from category worker', categoryData);
      JSON.parse(categoryData).categories.forEach((category, index) => {
        helper.addToQueue('createMatrix', JSON.stringify({
          UPC: JSON.parse(categoryData).UPC,
          category,
          jobNumber: index,
          numberOfJobs: JSON.parse(categoryData).length,
        }));
      });
    });
  }
};

const checkMatrixWorker = () => {
  if (workers.matrixWorker === undefined) {
    console.log('master created a matrix worker');
    workers.matrixWorker = cluster.fork({ ROLE: 'matrix worker' });
    workers.matrixWorker.on('online', () => {
      console.log('matrix worker online');
    });
    workers.matrixWorker.on('exit', () => {
      console.log('matrix worker exited');
      delete workers.matrixWorker;
    });
    workers.matrixWorker.on('message', (data) => {
      console.log(`matrix worker to master: matrix for ${JSON.stringify(data)} is created`);
    });
  }
};

const startMaster = () => {
  console.log('master started');

  client.on('connect', () => {
    console.log('connected to redis');

    const loopWorkers = () => {
      checkHTTPServer();
      checkCategoryWorker();
      checkMatrixWorker();
    };

    loopWorkers();
    setInterval(loopWorkers, 2000);
    checkMasterDB();
    setInterval(checkMasterDB, 360000);
  });
};

if (cluster.isMaster) {
  startMaster();
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'category worker') {
  require('./workers/categoryWorker.js');
} else if (process.env.ROLE === 'matrix worker') {
  require('./workers/matrixWorker.js');
}
