const helper = require('../util/helpers.js');
const Promise = require('bluebird');

const getRecommendation = (UPC, callback) => {
  const categoryFunctions = [];
  const categoryFunctionsIndex = [];
  const categoryDataFunctions = [];
  const categoryDataFunctionsIndex = [];
  const listFunctions = [];
  const listFunctionsIndex = [];
  const recommendation = {};

  console.log('recommendation worker working on: ', UPC);

  helper.getProductInfo(UPC)
  .then((data) => {
    if (!data) {
      callback('No data for the requested product', null);
      return;
    }
    const productInfo = JSON.parse(data);
    console.log(productInfo, typeof productInfo);
    const image = productInfo.image;
    recommendation.basicInfo = productInfo;
    recommendation.basicInfo.image = image;

    // loop through each category of UPC
    const categories = productInfo.categories;
    categories.forEach((category) => {
      console.log(category);
      recommendation[`${category}`] = {};
      // get average nutrient level for each category
      categoryFunctions.push(helper.getAllCategoryNutrientLevel(category));
      categoryFunctionsIndex.push(category);
    });
    Promise.all(categoryFunctions)
      .then((categoryDataArray) => {
        categoryDataArray.forEach((categoryData, categoryDataIndex) => {
          console.log('CATEGORY NU INFORMATION: ', categoryData, typeof categoryData);
          const category = categoryFunctionsIndex[categoryDataIndex];
          // compare nutrient level if it exists in both category and product
          if (categoryData) {
            Object.keys(categoryData).forEach((categoryField) => {
              console.log(categoryField);
              if (productInfo[categoryField]) {
                const DV = helper.checkDV(categoryField);
                // check if nutrient is good or bad nutrient
                const nutrientQuality = helper.checkIfBadOrGoodNutrient(categoryField);
                console.log(nutrientQuality);
                if (nutrientQuality) {
                  // store the comparison anaylsis in recommendation object
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`] =
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`] || {};
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`][categoryField] = {
                    DV,
                    ratio: Math.ceil(productInfo[categoryField]) / Number(categoryData[categoryField]),
                    product: productInfo[categoryField],
                    category: Number(categoryData[categoryField]),
                  };
                  const checkIfWorseThanAverage = (quality) => {
                    let result;
                    if (quality === 'Good') {
                      if ((Math.ceil(productInfo[categoryField]) / Number(categoryData[categoryField])) < 1) {
                        result = true;
                      }
                    } else {
                      if ((Math.ceil(productInfo[categoryField]) / Number(categoryData[categoryField])) > 1) {
                        result = true;
                      }
                    }
                    return result;
                  };
                  const worseThanAverage = checkIfWorseThanAverage(nutrientQuality);
                  console.log('worse than ave?', worseThanAverage, categoryField, productInfo[categoryField], categoryData[categoryField]);
                  if (worseThanAverage) {
                    // get products with better nutrients in the same category from the rank table
                    const nutrientLevel = helper.adjustNumber(categoryData[categoryField]);
                    console.log(categoryData, categoryField, nutrientLevel);
                    categoryDataFunctions.push(
                      helper.getProductWithBetterNutrients(
                        nutrientQuality, categoryField, category, nutrientLevel));
                    categoryDataFunctionsIndex.push([nutrientQuality, categoryField, category]);
                  }
                } else {
                  recommendation[`${category}`].nutrientsWithoutRecommendation =
                  recommendation[`${category}`].nutrientsWithoutRecommendation || {};
                  recommendation[`${category}`].nutrientsWithoutRecommendation[categoryField] = {
                    DV,
                    ratio: Math.ceil(productInfo[categoryField]) / Number(categoryData[categoryField]),
                    product: productInfo[categoryField],
                    category: Number(categoryData[categoryField]),
                  };
                }
              }
            });
          }
        });

        Promise.all(categoryDataFunctions)
          .then((listArray) => {
            listArray.forEach((list, listIndex) => {
              console.log('lIST', list);
              const nutrientQuality = categoryDataFunctionsIndex[listIndex][0];
              const categoryField = categoryDataFunctionsIndex[listIndex][1];
              const category = categoryDataFunctionsIndex[listIndex][2];
              list.forEach((product) => {
                console.log(product);
                const recommendedUPC = product.split(':')[2];
                listFunctions.push(helper.getProductInfo(recommendedUPC));
                listFunctionsIndex.push([nutrientQuality, categoryField, category]);
              });
            });

            Promise.all(listFunctions)
              .then((recProductArray) => {
                recProductArray.forEach((recProduct, recProductIndex) => {
                  const nutrientQuality = listFunctionsIndex[recProductIndex][0];
                  const categoryField = listFunctionsIndex[recProductIndex][1];
                  const category = listFunctionsIndex[recProductIndex][2];
                  const recommendedProductInfo = JSON.parse(recProduct);
                  // store the recommended products info in recommendation object
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                  [categoryField].recommendedProducts =
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                  [categoryField].recommendedProducts || [];
                  recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                  [categoryField].recommendedProducts.push(recommendedProductInfo);
                });

                // store and send the recommendation object
                helper.storeRecommendation(UPC, JSON.stringify(recommendation));
                callback(null, recommendation);
              });
          });
      });
  });
};


module.exports = {
  getRecommendation,
};
