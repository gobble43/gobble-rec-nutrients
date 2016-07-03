const helper = require('../util/helpers.js');

const getRecommendation = (UPC, callback) => {
  let sentError = false;
  console.log('recommendation worker working on: ', UPC);
  const recommendation = {};
  // TODO: request product info from Master DB
  // TODO: then request categories of that product
  const productInfo = {
    UPC,
    name: 'chobani',
    brand: 'meiji',
    sodium: 300,
    calcium: 50,
  };
  recommendation.basicInfo = productInfo;
  const categories = ['dairy', 'yogurt'];
  // loop through each category of UPC
  categories.forEach((category, categoryIndex) => {
    recommendation[`${category}`] = {};
    // get average nutrient level for each category
    helper.getAllCategoryNutrientLevel(category)
    .then((categoryData) => {
      // store the last index of nutrients which exist in both category and product
      // so that the recommendation object is sent after every info is filled
      let lastIndex;
      Object.keys(categoryData).forEach((categoryField, categoryFieldIndex) => {
        if (productInfo[categoryField]) {
          lastIndex = categoryFieldIndex;
        }
      });
      // compare nutrient level if it exists in both category and product
      Object.keys(categoryData).forEach((categoryField, categoryFieldIndex) => {
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
              // // get products with better nutrients in the same category from the rank table
              // const nutrientLevel = helper.adjustNumber(categoryData[categoryField]);
              // helper.getProductWithBetterNutrients(
              //   nutrientQuality, categoryField, category, nutrientLevel
              // )
              // .then((list) => {
              const exampleList = [1, 2, 3];
              exampleList.forEach((product) => {
                // const recommendedUPC = product.split(':')[2];
                // TODO: request product info for each recommended product from Master DB
                // store the recommended products info in recommendation object
                recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                [categoryField].recommendedProducts =
                recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                [categoryField].recommendedProducts || [];
                recommendation[`${category}`][`${nutrientQuality}Nutrients`]
                [categoryField].recommendedProducts.push({
                  UPC: product,
                  name: 'exampleName',
                  brand: 'exampleBrand',
                  sodium: 'exampleNutrientLevel',
                  calcium: 'exampleNutrientLevel',
                });
              });
              // after looping through every category and nutrient
              if (
                categoryIndex === categories.length - 1
                && categoryFieldIndex === lastIndex
              ) {
                // store and send the recommendation object
                console.log('Storing recommendation: ', recommendation);
                helper.storeRecommendation(UPC, JSON.stringify(recommendation));
                callback(null, recommendation);
              }
              // });
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
    })
    .catch((err) => {
      if (!sentError) {
        sentError = true;
        callback(err);
      }
    });
  });
};

module.exports = {
  getRecommendation,
};
