const helper = require('../util/helpers.js');

const startMatrixWorker = () => {
  const loopMatrixWorker = () => {
    helper.checkQueue('createMatrix')
      .then((length) => {
        if (length === 0) {
          setTimeout(loopMatrixWorker, 1000);
        } else {
          helper.removeQueue('createMatrix')
            .then((data) => {
              console.log('matrixWorker working on: ', data);
              const UPC = JSON.parse(data).UPC;
              const category = JSON.parse(data).category;
              helper.getProductInfo(UPC)
              .then((info) => {
                const ProductInfo = JSON.parse(info);
                Object.keys(ProductInfo).forEach((key, i) => {
                  if (key !== 'UPC' && key !== 'brand' && key !== 'name') {
                    const nutrientLevel = helper.adjustNumber(ProductInfo[key]);
                    // 1. create a product nutrients rank table sorted by category
                    // zadd rankByCategory:calcium 0 milk:0100:129428359
                    // zrangebylex calcium [milk:0 [milk:9999
                    helper.sortProductByCategory(key, category, nutrientLevel, UPC);
                    // 2. create a product nutrients rank table sorted by nutrients level
                    // zadd rankByLevel:calcium 0100 milk:129428359
                    // zrangebyscore -inf +inf
                    helper.sortProductByNutrientLevel(key, nutrientLevel, category, UPC);
                    // 3. create a category table with average nutrients level for each category
                    helper.getAverageCategoryNutrientLevel(category, key)
                    .then((categoryInfo) => {
                      averageNutrientLevel = Number(categoryInfo[0]);
                      numberOfProducts = Number(categoryInfo[1]);
                      if (averageNutrientLevel) {
                        const newNumberOfProducts = numberOfProducts + 1;
                        const newAverageNutrientLevel =
                        (averageNutrientLevel + Number(nutrientLevel)) / newNumberOfProducts;
                        helper.setAverageCategoryNutrientLevel(
                          category, key, newAverageNutrientLevel, newNumberOfProducts
                        );
                        if (i === Object.keys(ProductInfo).length - 1) {
                          loopMatrixWorker();
                        }
                      } else {
                        helper.setAverageCategoryNutrientLevel(
                          category, key, Number(nutrientLevel), 1
                        );
                        if (i === Object.keys(ProductInfo).length - 1) {
                          loopMatrixWorker();
                        }
                      }
                    })
                    .catch((err) => {
                      console.err(err);
                    });
                  }
                });
              })
              .catch((err) => {
                console.log(err);
              });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  loopMatrixWorker();
};

startMatrixWorker();
