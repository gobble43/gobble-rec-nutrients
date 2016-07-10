require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation', () => {
  describe('making a recommendation', () => {
    it('should return status code 404 and notify that recommendation is not ready', (done) => {
      request(appUrl)
      .post('/api/getRecommendation')
      .send({ upc: '1' })
      .expect(
        404,
        'Recommendation is not ready yet: No data for the requested product'
      )
      .end((err) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });
});
