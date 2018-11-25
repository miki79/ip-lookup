const { promisify } = require('util');
const nock = require('nock');
const fs = require('fs');
const awsMock = require('aws-sdk-mock');
const path = require('path');
const { download } = require('../src/handler');

awsMock.setSDK(path.resolve(`${__dirname}/../node_modules/aws-sdk`));

const handler = promisify(download);
const context = {};
const event = {};
process.env.S3_BUCKET = 'test-bucket';

console.info = jest.fn();
console.error = jest.fn();

describe('Download Files', () => {
  afterEach(() => {
    nock.cleanAll();
    awsMock.restore();
  });
  test('Download valid files', () => {
    nock('http://thyme.apnic.net')
      .get('/current/data-used-autnums')
      .reply(200, fs.readFileSync(`${__dirname}/data/data-used-autnums.txt`));
    nock('http://thyme.apnic.net')
      .get('/current/data-raw-table')
      .reply(200, fs.readFileSync(`${__dirname}/data/data-raw-table.txt`));
    awsMock.mock('S3', 'putObject', (params, callback) => {
      callback(null, 'OK');
    });
    const result = handler(event, context);
    return result.then(data => {
      expect(data).toContain('OK');
    });
  });
  test('Download Empty ASN file', async () => {
    nock('http://thyme.apnic.net')
      .get('/current/data-used-autnums')
      .reply(200, '');
    nock('http://thyme.apnic.net')
      .get('/current/data-raw-table')
      .reply(200, fs.readFileSync(`${__dirname}/data/data-raw-table.txt`));
    awsMock.mock('S3', 'putObject', (params, callback) => {
      callback(null, 'OK');
    });
    const result = handler(event, context);
    return result
      .then(data => {
        expect(data).toBeFalsy();
      })
      .catch(e => {
        expect(e).toBe('Error: Error getting raw-table');
      });
  });
  test('Download Empty IP range file', async () => {
    nock('http://thyme.apnic.net')
      .get('/current/data-used-autnums')
      .reply(200, fs.readFileSync(`${__dirname}/data/data-used-autnums.txt`));
    nock('http://thyme.apnic.net')
      .get('/current/data-raw-table')
      .reply(200, '');
    awsMock.mock('S3', 'putObject', (params, callback) => {
      callback(null, 'OK');
    });
    const result = handler(event, context);
    return result
      .then(data => {
        expect(data).toBeFalsy();
      })
      .catch(e => {
        expect(e).toBe('Error: error getting Ip range');
      });
  });
  test('Download not 200 response', async () => {
    nock('http://thyme.apnic.net')
      .get('/current/data-used-autnums')
      .reply(200, fs.readFileSync(`${__dirname}/data/data-used-autnums.txt`));
    nock('http://thyme.apnic.net')
      .get('/current/data-raw-table')
      .reply(404, '');
    awsMock.mock('S3', 'putObject', (params, callback) => {
      callback(null, 'OK');
    });
    const result = handler(event, context);
    return result
      .then(data => {
        expect(data).toBeFalsy();
      })
      .catch(e => {
        expect(e).toBe('Error: Failed to load page, status code: 404');
      });
  });
});
