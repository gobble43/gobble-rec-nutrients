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
  const digits = Math.ceil(Number(num)).toString();
  let adjustedNumber;
  if (digits.length < 4) {
    if (digits.length === 3) {
      adjustedNumber = `0${digits}`;
    } else if (digits.length === 2) {
      adjustedNumber = `00${digits}`;
    } else if (digits.length === 1) {
      adjustedNumber = `000${digits}`;
    }
  }
  return adjustedNumber;
};

const sortProductByCategory = (key, category, nutrientLevel, UPC) =>
  client.zaddAsync(`sortByCategory:${key}`, 0, `${category}:${nutrientLevel}:${UPC}`);

const getProductWithBetterNutrients = (quality, categoryField, category, nutrientLevel) => {
  let command;
  if (quality === 'Good') {
    command = client.zrangebylexAsync(
      `sortByCategory:${categoryField}`,
      `[${category}:${nutrientLevel}`, `[${category}:9999`
    );
  } else {
    command = client.zrangebylexAsync(
      `sortByCategory:${categoryField}`,
      `[${category}:0000`, `[${category}:${nutrientLevel}`
    );
  }
  return command;
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

const removeRecommendations = () => {
  console.log('removing recommendations');
  client.delAsync('recommendation');
};

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
    categoryField === 'carbohydrates' ||
    categoryField === 'salt' ||
    categoryField === 'caffeine'
  ) {
    result = 'Bad';
  }
  return result;
};

const checkDV = (nutrient) => {
  let DV;
  if (nutrient === 'energy') {
    DV = 2000;
  } else if (nutrient === 'fat') {
    DV = 65;
  } else if (nutrient === 'sodium') {
    DV = 2400;
  } else if (nutrient === 'saturatedfat') {
    DV = 20;
  } else if (nutrient === 'cholesterol') {
    DV = 300;
  } else if (nutrient === 'carbohydrates') {
    DV = 300;
  } else if (nutrient === 'fiber') {
    DV = 25;
  } else if (nutrient === 'protein') {
    DV = 50;
  } else if (nutrient === 'vitamina') {
    DV = 5000;
  } else if (nutrient === 'vitaminc') {
    DV = 60;
  } else if (nutrient === 'vitamind') {
    DV = 400;
  } else if (nutrient === 'vitamine') {
    DV = 30;
  } else if (nutrient === 'vitamink') {
    DV = 80;
  } else if (nutrient === 'vitaminb6') {
    DV = 2;
  } else if (nutrient === 'vitaminb12') {
    DV = 6;
  } else if (nutrient === 'biotin') {
    DV = 300;
  } else if (nutrient === 'pantothenicacid') {
    DV = 10;
  } else if (nutrient === 'potassium') {
    DV = 3500;
  } else if (nutrient === 'calcium') {
    DV = 1000;
  } else if (nutrient === 'phosphorus') {
    DV = 1000;
  } else if (nutrient === 'iron') {
    DV = 18;
  } else if (nutrient === 'magnesium') {
    DV = 400;
  } else if (nutrient === 'zinc') {
    DV = 15;
  } else if (nutrient === 'manganese') {
    DV = 2;
  } else if (nutrient === 'selenium') {
    DV = 70;
  } else if (nutrient === 'chromium') {
    DV = 120;
  } else if (nutrient === 'molybdenum') {
    DV = 75;
  } else if (nutrient === 'iodine') {
    DV = 150;
  } else {
    DV = null;
  }
  return DV;
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
  checkDV,
};
