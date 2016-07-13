let helper;
const cluster = require('cluster');
let client;
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
      if (data.upc) {
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
      }
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
      if (data.UPC) {
        console.log(`matrix worker to master: matrix for ${JSON.stringify(data)} is created`);
      }
    });
  }
};

const startMaster = () => {
  console.log('master started');
  const redis = require('redis');
  client = redis.createClient();
  client.on('connect', () => {
    console.log('connected to redis');
    helper = require('./util/helpers.js');

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
