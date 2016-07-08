const helper = require('./util/helpers.js');
const cluster = require('cluster');
const redis = require('redis');
const fetch = require('isomorphic-fetch');
const client = redis.createClient();
const workers = {};
let lastChecked;
const checkMasterDB = () => {
  console.log('fetching the data from Master DB');
  // fetch all the newly added products & nutrients from 1 hour ago til now
  if (!lastChecked) {
    const timezoneOffset = (new Date()).getTimezoneOffset() * 60000;
    const time = new Date(Date.now() - timezoneOffset);
    time.setSeconds(time.getSeconds() - 1.2);
    timeStamp = time.toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  } else {
    timeStamp = lastChecked;
  }
  const url = `http://localhost:4570/db/productsByDate?date="${timeStamp}"`;
  fetch(url, {
    method: 'get',
  })
  .then((res) => res.json())
  .then((data) => {
    if (data) {
      // loop through the res.body (array)
      data.forEach((product) => {
        if (product.product.name) {
          console.log('Data received from Master DB: ', product.product);
          lastChecked = product.product.Product_created_at
            .slice(0, 19)
            .replace('T', ' ');
          // temporarily store the information
          helper.storeProductInfo(product.product.upc, product.product);
          product.categories.forEach((category, index) => {
            helper.addToQueue('createMatrix', JSON.stringify({
              UPC: product.product.upc,
              category,
              jobNumber: index,
              numberOfJobs: product.categories.length - 1,
            }));
          });
        }
      });
      // delete cached recommendation
      helper.removeRecommendations();
    }
  })
  .catch((err) => console.log(err));
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

const clearCache = () => {
  console.log('periodically removing cache');
  helper.removeRecommendations();
};

const startMaster = () => {
  console.log('master started');

  client.on('connect', () => {
    console.log('connected to redis');

    const loopWorkers = () => {
      checkHTTPServer();
      checkMatrixWorker();
    };
    clearCache();
    setInterval(clearCache, 2000);
    loopWorkers();
    setInterval(loopWorkers, 2000);
    checkMasterDB();
    setInterval(checkMasterDB, 1000);
  });
};

if (cluster.isMaster) {
  startMaster();
} else if (process.env.ROLE === 'http server') {
  require('./httpServer/server.js');
} else if (process.env.ROLE === 'matrix worker') {
  require('./workers/matrixWorker.js');
}
