const helper = require('../util/helpers.js');
const Promise = require('bluebird');
const fetch = require('isomorphic-fetch');

const getRecommendation = (UPC, callback) => {
  const categoryFunctions = [];
  const categoryFunctionsIndex = [];
  const categoryDataFunctions = [];
  const categoryDataFunctionsIndex = [];
  const listFunctions = [];
  const listFunctionsIndex = [];
  const recommendation = {};

  console.log('recommendation worker working on: ', UPC);

  const url = `http://localhost:4570/db/product?upc=${UPC}`;
  fetch(url, {
    method: 'get',
  })
  .then((res) => res.json())
  .catch(() => callback('No data for the requested product'))
  .then((data) => {
    if (!data.product) {
      callback('No data for the requested product');
    }
    const productInfo = data.product;
    const image = data.media[0].url;
    Object.keys(productInfo).forEach((key) => {
      if (key === 'Product_created_at' || productInfo[key] === null) {
        delete productInfo[key];
      }
    });
    recommendation.basicInfo = productInfo;
    recommendation.basicInfo.image = image;

    // loop through each category of UPC
    const categories = data.categories;
    categories.forEach((category) => {
      recommendation[`${category}`] = {};
      // get average nutrient level for each category
      categoryFunctions.push(helper.getAllCategoryNutrientLevel(category));
      categoryFunctionsIndex.push(category);
    });

    Promise.all(categoryFunctions)
      .then((categoryDataArray) => {
        categoryDataArray.forEach((categoryData, categoryDataIndex) => {
          const category = categoryFunctionsIndex[categoryDataIndex];
          // compare nutrient level if it exists in both category and product
          Object.keys(categoryData).forEach((categoryField) => {
            if (productInfo[categoryField]) {
              const DV = helper.checkDV(categoryField);
              // check if nutrient is good or bad nutrient
              const nutrientQuality = helper.checkIfBadOrGoodNutrient(categoryField);
              if (nutrientQuality) {
                // store the comparison anaylsis in recommendation object
                recommendation[`${category}`][`${nutrientQuality}Nutrients`] =
                recommendation[`${category}`][`${nutrientQuality}Nutrients`] || {};
                recommendation[`${category}`][`${nutrientQuality}Nutrients`][categoryField] = {
                  DV,
                  ratio: productInfo[categoryField] / Number(categoryData[categoryField]),
                  product: productInfo[categoryField],
                  category: Number(categoryData[categoryField]),
                };
                const checkIfWorseThanAverage = (quality) => {
                  let result;
                  if (quality === 'Good') {
                    if ((productInfo[categoryField] / Number(categoryData[categoryField])) < 1) {
                      result = true;
                    }
                  } else {
                    if ((productInfo[categoryField] / Number(categoryData[categoryField])) > 1) {
                      result = true;
                    }
                  }
                  return result;
                };
                const worseThanAverage = checkIfWorseThanAverage(nutrientQuality);
                if (worseThanAverage) {
                  // get products with better nutrients in the same category from the rank table
                  const nutrientLevel = helper.adjustNumber(categoryData[categoryField]);
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
                  ratio: productInfo[categoryField] / Number(categoryData[categoryField]),
                  product: productInfo[categoryField],
                  category: Number(categoryData[categoryField]),
                };
              }
            }
          });
        });

        Promise.all(categoryDataFunctions)
          .then((listArray) => {
            listArray.forEach((list, listIndex) => {
              const nutrientQuality = categoryDataFunctionsIndex[listIndex][0];
              const categoryField = categoryDataFunctionsIndex[listIndex][1];
              const category = categoryDataFunctionsIndex[listIndex][2];
              list.forEach((product) => {
                const recommendedUPC = product.split(':')[2];
                // request product info for each recommended product from Master DB
                const url2 = `http://localhost:4570/db/product?upc=${recommendedUPC}`;
                listFunctions.push(fetch(url2, { method: 'get' }).then((res) => res.json()));
                listFunctionsIndex.push([nutrientQuality, categoryField, category]);
              });
            });

            Promise.all(listFunctions)
              .then((recProductArray) => {
                recProductArray.forEach((recProduct, recProductIndex) => {
                  const nutrientQuality = listFunctionsIndex[recProductIndex][0];
                  const categoryField = listFunctionsIndex[recProductIndex][1];
                  const category = listFunctionsIndex[recProductIndex][2];
                  const recommendedProductInfo = recProduct.product;
                  recommendedProductInfo.image = recProduct.media[0].url;
                  Object.keys(recommendedProductInfo).forEach((key) => {
                    if (key === 'Product_created_at' || productInfo[key] === null) {
                      delete recommendedProductInfo[key];
                    }
                  });
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
