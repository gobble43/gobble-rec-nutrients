require('./setup');
const appUrl = `${process.env.PROTOCOL}${process.env.HOST}:${process.env.PORT}`;
const request = require('supertest');

describe('Gobble recommendation', () => {
  // describe('adding a new product', () => {
  //   it('should return status code 201 and an acknowledgement', (done) => {
  //     request(appUrl)
  //       .post('/api/addNewProduct')
  //       .send({ UPC: 1, task: 'addNewProduct' })
  //       .expect(201, 'Added New Product')
  //       .end((err) => {
  //         if (err) {
  //           done(err);
  //         } else {
  //           done();
  //         }
  //       });
  //   });
  //   it('should return status code 201 and an acknowledgement', (done) => {
  //     request(appUrl)
  //       .post('/api/addNewProduct')
  //       .send({ UPC: 2, task: 'addNewProduct' })
  //       .expect(201, 'Added New Product')
  //       .end((err) => {
  //         if (err) {
  //           done(err);
  //         } else {
  //           done();
  //         }
  //       });
  //   });
  // });
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
