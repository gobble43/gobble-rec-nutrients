const helper = require('../util/helpers.js');

const startCategoryWorker = () => {
  const loopCategoryWorker = () => {
    helper.checkQueue('getCategories')
      .then((length) => {
        if (length === 0) {
          setTimeout(loopCategoryWorker, 1000);
        } else {
          helper.removeQueue('getCategories')
            .then((UPC) => {
              console.log('categoryWorker working on: ', UPC);
              // TODO: request all the categories from master DB with task.UPC
              return JSON.stringify({
                UPC, categories: ['dairy', 'yogurt'],
              });
            })
            .then((categoryData) => {
              console.log('sending categoryData to master :', categoryData);
              // send back UPC with categories
              process.send(categoryData);
              loopCategoryWorker();
            })
            .catch((err) => {
              console.err(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  loopCategoryWorker();
};

startCategoryWorker();
