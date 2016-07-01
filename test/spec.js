require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation', () => {
  describe('making a recommendation', () => {
    it('should return status code 201 and an object', (done) => {
      request(appUrl)
        .post('/api/getRecommendation')
        .send({ UPC: 1 })
        .expect(201, 'object')
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
