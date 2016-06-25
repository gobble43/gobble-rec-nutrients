require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation - redis cached database', () => {
  describe('get the prepared json object with UPC', () => {
    it('should return status code 200 and an empty json object', (done) => {
      request(appUrl)
        .post('/api/tasks')
        .send({ UPC: 1, task: 'addNewProduct' })
        .expect(200, '')
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
