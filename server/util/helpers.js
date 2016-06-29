const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();

const addToQueue = (task, UPC) => client.lpush(task, UPC);

const checkQueue = (task) => client.llenAsync(task);

const removeQueue = (task) => client.rpopAsync(task);

const storeProductInfo = (UPC, info) =>
  client.hmset(`product:${UPC}`, 'productInfo', JSON.stringify(info));

const getProductInfo = (UPC) => client.hgetAsync(`product:${UPC}`, 'productInfo');

const removeProductInfo = (UPC) => client.del(`product:${UPC}`);

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
  client.zadd(`sortByCategory:${key}`, 0, `${category}:${nutrientLevel}:${UPC}`);

const getProductWithHigherNutrientLevel = (categoryField, category, nutrientLevel) =>
  client.zrangebylexAsync(
    `sortByCategory:${categoryField}`,
    `[${category}:${nutrientLevel}`, `[${category}:9999`
  );

const getProductWithLowerNutrientLevel = (categoryField, category, nutrientLevel) =>
  client.zrangebylexAsync(
    `sortByCategory:${categoryField}`,
    `[${category}:0000`, `[${category}:${nutrientLevel}`
  );

const sortProductByNutrientLevel = (key, nutrientLevel, category, UPC) =>
  client.zadd(`sortByLevel:${key}`, nutrientLevel, `${category}:${UPC}`);

const setAverageCategoryNutrientLevel = (category, key, nutrientLevel, numberOfProducts) =>
  client.hmset(
    `category:${category}`, key, nutrientLevel, `${key}Products`, numberOfProducts
  );

const getAverageCategoryNutrientLevel = (category, key) =>
  client.hmgetAsync(`category:${category}`, key, `${key}Products`);

const getAllCategoryNutrientLevel = (category) =>
  client.hgetallAsync(`category:${category}`);

const storeRecommendation = (UPC, JSONObject) =>
  client.hset('recommendation', UPC, JSONObject);

const getRecommendation = (UPC) =>
  client.hgetAsync('recommendation', UPC);

const removeRecommendations = () =>
  client.del('recommendation');

module.exports = {
  addToQueue,
  checkQueue,
  removeQueue,
  storeProductInfo,
  getProductInfo,
  removeProductInfo,
  adjustNumber,
  sortProductByCategory,
  getProductWithHigherNutrientLevel,
  getProductWithLowerNutrientLevel,
  sortProductByNutrientLevel,
  setAverageCategoryNutrientLevel,
  getAverageCategoryNutrientLevel,
  getAllCategoryNutrientLevel,
  storeRecommendation,
  getRecommendation,
  removeRecommendations,
};
