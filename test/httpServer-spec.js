require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation - redis cached database', () => {
  describe('get the prepared json object with UPC', () => {
    it('should return status code 200 and the prepared json object', (done) => {
      request(appUrl)
        .post('/api/tasks')
        .send({ UPC: 1 })
        .expect(200, '{"test":"success"}')
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            console.log('response obj', res.text);
            done();
          }
        });
    });
    it('should return status code 200 and the empty json object', (done) => {
      request(appUrl)
        .post('/api/tasks')
        .send({ task: 'addNewProductRecommendation', UPC: 2 })
        .expect(200, '')
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            console.log('response obj', res.text);
            done();
          }
        });
    });
  });
});
