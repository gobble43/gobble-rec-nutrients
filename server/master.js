const helper = require('./util/helpers.js');
const cluster = require('cluster');
const redis = require('redis');
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
    workers.httpServer.on('message', (data) => {
      console.log(`http server to master: ${JSON.stringify(data)} is ready to be added`);
      // REMOVE CACHE
      helper.removeRecommendations();
      // STORE PRODUCT INFO
      helper.storeProductInfo(data.upc, data);
      // CREATE MATRIX
      data.categories.forEach((category) => {
        helper.addToQueue('createMatrix', JSON.stringify({
          UPC: data.upc,
          category,
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
      checkMatrixWorker();
    };
    loopWorkers();
    setInterval(loopWorkers, 2000);
  });
};

if (cluster.isMaster) {
  startMaster();
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'matrix worker') {
  require('./workers/matrixWorker.js');
}
