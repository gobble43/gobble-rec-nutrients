require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation', () => {
  describe('making a recommendation', () => {
    it('should return status code 404 and notify that recommendation is not ready', (done) => {
      request(appUrl)
      .post('/api/getRecommendation')
      .send({ UPC: 1 })
      .expect(
        404,
        'Recommendation is not ready yet: TypeError: Cannot convert undefined or null to object'
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
// it('should return status code 201 and return an object', (done) => {
//   request(appUrl)
//   .post('/api/getRecommendation')
//   .send({ UPC: 1 })
//   .expect(201, 'object')
//   .end((err) => {
//     if (err) {
//       done(err);
//     } else {
//       done();
//     }
//   });
// });
