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
          const jobNumber = JSON.parse(data).jobNumber;
          const numberOfJobs = JSON.parse(data).numberOfJobs;
          // bring the stored product info
          helper.getProductInfo(UPC)
          .then((info) => {
            const ProductInfo = JSON.parse(info);
            // for each nutrient in the product
            Object.keys(ProductInfo).forEach((key, i) => {
              if (key !== 'UPC' && key !== 'brand' && key !== 'name') {
                const nutrientLevel = helper.adjustNumber(ProductInfo[key]);
                // 1. create a product rank table sorted by both category and nutrient level
                // zadd sortByCategory:calcium 0 milk:0100:129428359
                // zrangebylex calcium [milk:0 [milk:9999
                helper.sortProductByCategory(key, category, nutrientLevel, UPC);
                // 2. create a product rank table sorted by nutrients level only
                // zadd sortByLevel:calcium 0100 milk:129428359
                // zrangebyscore -inf +inf
                helper.sortProductByNutrientLevel(key, nutrientLevel, category, UPC);
                // 3. create a category table with average nutrients level for each category
                helper.getAverageCategoryNutrientLevel(category, key)
                .then((categoryInfo) => {
                  averageNutrientLevel = Number(categoryInfo[0]);
                  numberOfProducts = Number(categoryInfo[1]);
                  // if category already exists
                  if (averageNutrientLevel) {
                    // calculate average nutrient level with the new product nutrient information
                    const newNumberOfProducts = numberOfProducts + 1;
                    const newAverageNutrientLevel =
                    (averageNutrientLevel + Number(nutrientLevel)) / newNumberOfProducts;
                    // store the new average nutrient level
                    helper.setAverageCategoryNutrientLevel(
                      category, key, newAverageNutrientLevel, newNumberOfProducts
                    );
                    // after looping through every nutrient in the product
                    if (i === Object.keys(ProductInfo).length - 1) {
                      // check if the entire job is done for this UPC
                      if (jobNumber === numberOfJobs) {
                        // remove product info to save the space
                        helper.removeProductInfo(UPC);
                      }
                      // notify master that the job is done
                      process.send({ UPC, category });
                      loopMatrixWorker();
                    }
                  } else {
                    // set the product nutrient information as the category's average
                    helper.setAverageCategoryNutrientLevel(
                      category, key, Number(nutrientLevel), 1
                    );
                    // after looping through every nutrient in the product
                    if (i === Object.keys(ProductInfo).length - 1) {
                      // check if the entire job is done for this UPC
                      if (jobNumber === numberOfJobs) {
                        // remove product information
                        helper.removeProductInfo(UPC);
                      }
                      // notify master that the job is done
                      process.send({ UPC, category });
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
