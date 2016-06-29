const helper = require('../util/helpers.js');
// get productInfo and categoreis from master DB
// get each nutrient and its nutrient level from productInfo
// get each nutrient and its nutrient level from category table
// compare two
  // according to http://www.fda.gov/food/ingredientspackaginglabeling/labelingnutrition/ucm274593.htm#nutrients
  // if good nutrient is lower than average
    // fiber, protein, vitamin(), calcium, iron, potassium, biotin, pantothenicacid, magnesium
    // get products with good nutrient level between average and highest from sortByCategory table
    // zrangebylex calcium [milk:0300 [milk:9999
  // if bad nutrient is higher than average
    // cholesterol, sodium, energy, fat, saturatedfat, transfat, salt, caffeine, taurine
    // get products with bad nutrient level between average and lowest from sortByCategory table
    // zrangebylex sodium [milk:0 [milk:0300
  // send the analysis and recommendations

const getRecommendation = (UPC, callback) => {
  const JSONObject = {};
  // TODO: request product info from Master DB
  // TODO: then request categories of that product
  const productInfo = {
    UPC,
    name: 'chobani',
    brand: 'meiji',
    sodium: 300,
    calcium: 50,
  };
  const categories = ['dairy', 'yogurt'];
  categories.forEach((category, categoryIndex) => {
    JSONObject[`${category}`] = {};
    JSONObject[`${category}`].goodNutrients = {};
    JSONObject[`${category}`].badNutrients = {};
    JSONObject[`${category}`].recommendationForGood = [];
    JSONObject[`${category}`].recommendationForBad = [];
    helper.getAllCategoryNutrientLevel(category)
    .then((categoryData) => {
      let lastIndex;
      Object.keys(categoryData).forEach((categoryField, categoryFieldIndex) => {
        if (productInfo[categoryField]) {
          lastIndex = categoryFieldIndex;
        }
      });
      Object.keys(categoryData).forEach((categoryField, categoryFieldIndex) => {
        if (productInfo[categoryField]) {
          if (
            categoryField === 'fiber' ||
            categoryField === 'protein' ||
            categoryField.substring(0, 7) === 'vitamin' ||
            categoryField === 'calcium' ||
            categoryField === 'iron' ||
            categoryField === 'potassium' ||
            categoryField === 'biotin' ||
            categoryField === 'pantothenicacid' ||
            categoryField === 'magnesium'
          ) {
            JSONObject[`${category}`].goodNutrients[categoryField] = {
              ratio: productInfo[categoryField] / Number(categoryData[categoryField]),
              product: productInfo[categoryField],
              category: Number(categoryData[categoryField]),
            };
            if ((productInfo[categoryField] / Number(categoryData[categoryField])) < 1) {
              // const nutrientLevel = helper.adjustNumber(categoryData[categoryField]);
              // helper.getProductWithHigherNutrientLevel(categoryField, category, nutrientLevel)
              // .then((list) => {
              const exampleList = [1, 2, 3];
              exampleList.forEach((product) => {
                // const recommendedUPC = product.split(':')[2];
                // TODO: request product info from Master DB
                JSONObject[`${category}`]
                .recommendationForGood.push({
                  UPC: product,
                  name: 'exampleName',
                  brand: 'exampleBrand',
                  sodium: 'exampleNutrientLevel',
                  calcium: 'exampleNutrientLevel',
                });
              });
              if (
                categoryIndex === categories.length - 1
                && categoryFieldIndex === lastIndex
              ) {
                console.log('Storing recommendation: ', JSONObject);
                helper.storeRecommendation(UPC, JSON.stringify(JSONObject));
                callback(JSONObject);
              }
              // });
            }
          } else if (
            categoryField === 'cholesterol' ||
            categoryField === 'sodium' ||
            categoryField === 'energy' ||
            categoryField === 'fat' ||
            categoryField === 'saturatedfat' ||
            categoryField === 'transfat' ||
            categoryField === 'salt' ||
            categoryField === 'caffeine' ||
            categoryField === 'taurine'
          ) {
            JSONObject[`${category}`].badNutrients[categoryField] = {
              ratio: productInfo[categoryField] / Number(categoryData[categoryField]),
              product: productInfo[categoryField],
              category: Number(categoryData[categoryField]),
            };
            if ((productInfo[categoryField] / Number(categoryData[categoryField])) > 1) {
              // const nutrientLevel = helper.adjustNumber(categoryData[categoryField]);
              // helper.getProductWithLowerNutrientLevel(categoryField, category, nutrientLevel)
              // .then((list) => {
              const exampleList = [1, 2, 3];
              exampleList.forEach((product) => {
                // const recommendedUPC = product.split(':')[2];
                // TODO: request product info from Master DB
                JSONObject[`${category}`]
                .recommendationForBad.push({
                  UPC: product,
                  name: 'exampleName',
                  brand: 'exampleBrand',
                  sodium: 'exampleNutrientLevel',
                  calcium: 'exampleNutrientLevel',
                });
              });
              if (
                categoryIndex === categories.length - 1
                && categoryFieldIndex === lastIndex
              ) {
                console.log('Storing recommendation: ', JSONObject);
                helper.storeRecommendation(UPC, JSON.stringify(JSONObject));
                callback(JSONObject);
              }
              // });
            }
          }
        }
      });
    })
    .catch((err) => {
      console.err(err);
    });
  });
};


module.exports = {
  getRecommendation,
};
