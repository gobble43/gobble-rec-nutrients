const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

const addToQueue = (task, UPC) => client.lpushAsync(task, UPC);

const checkQueue = (task) => client.llenAsync(task);

const removeQueue = (task) => client.rpopAsync(task);

const storeProductInfo = (UPC, info) =>
  client.hmsetAsync(`product:${UPC}`, 'productInfo', JSON.stringify(info));

const getProductInfo = (UPC) => client.hgetAsync(`product:${UPC}`, 'productInfo');

const removeProductInfo = (UPC) => client.delAsync(`product:${UPC}`);

const adjustNumber = (num) => {
  const digits = num.toString().split('.')[0];
  let adjustedNumber;
  if (digits.length < 4) {
    if (digits.length === 3) {
      adjustedNumber = `0${num.toString()}`;
    } else if (digits.length === 2) {
      adjustedNumber = `00${num.toString()}`;
    } else if (digits.length === 1) {
      adjustedNumber = `000${num.toString()}`;
    }
  }
  return adjustedNumber;
};

const sortProductByCategory = (key, category, nutrientLevel, UPC) =>
  client.zaddAsync(`sortByCategory:${key}`, 0, `${category}:${nutrientLevel}:${UPC}`);

const getProductWithBetterNutrients = (quality, categoryField, category, nutrientLevel) => {
  if (quality === 'Good') {
    client.zrangebylexAsync(
      `sortByCategory:${categoryField}`,
      `[${category}:${nutrientLevel}`, `[${category}:9999`
    );
  } else {
    client.zrangebylexAsync(
      `sortByCategory:${categoryField}`,
      `[${category}:0000`, `[${category}:${nutrientLevel}`
    );
  }
};

const sortProductByNutrientLevel = (key, nutrientLevel, category, UPC) =>
  client.zaddAsync(`sortByLevel:${key}`, nutrientLevel, `${category}:${UPC}`);

const setAverageCategoryNutrientLevel = (category, key, nutrientLevel, numberOfProducts) =>
  client.hmsetAsync(
    `category:${category}`, key, nutrientLevel, `${key}Products`, numberOfProducts
  );

const getAverageCategoryNutrientLevel = (category, key) =>
  client.hmgetAsync(`category:${category}`, key, `${key}Products`);

const getAllCategoryNutrientLevel = (category) =>
  client.hgetallAsync(`category:${category}`);

const storeRecommendation = (UPC, JSONObject) =>
  client.hsetAsync('recommendation', UPC, JSONObject);

const getRecommendation = (UPC) =>
  client.hgetAsync('recommendation', UPC);

const removeRecommendations = () =>
  client.delAsync('recommendation');

const checkIfBadOrGoodNutrient = (categoryField) => {
  let result = false;
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
    result = 'Good';
  } else if (
    categoryField === 'cholesterol' ||
    categoryField === 'sodium' ||
    categoryField === 'energy' ||
    categoryField === 'fat' ||
    categoryField === 'saturatedfat' ||
    categoryField === 'transfat' ||
    categoryField === 'salt' ||
    categoryField === 'caffeine' ||
    category
  ) {
    result = 'Bad';
  }
  return result;
};


module.exports = {
  addToQueue,
  checkQueue,
  removeQueue,
  storeProductInfo,
  getProductInfo,
  removeProductInfo,
  adjustNumber,
  sortProductByCategory,
  getProductWithBetterNutrients,
  sortProductByNutrientLevel,
  setAverageCategoryNutrientLevel,
  getAverageCategoryNutrientLevel,
  getAllCategoryNutrientLevel,
  storeRecommendation,
  getRecommendation,
  removeRecommendations,
  checkIfBadOrGoodNutrient,
};
