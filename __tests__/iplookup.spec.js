const { promisify } = require('util');
const fs = require('fs');
const awsMock = require('aws-sdk-mock');
const path = require('path');
const { ipLookup } = require('../src/handler');

awsMock.setSDK(path.resolve(`${__dirname}/../node_modules/aws-sdk`));

const handler = promisify(ipLookup);
const context = {};
let event = {};
process.env.S3_BUCKET = 'test-bucket';

const mockS3 = () => {
  awsMock.mock('S3', 'getObject', (params, callback) => {
    const s3Object = {
      AcceptRanges: 'bytes',
      ContentType: 'application/json',
      Metadata: {},
      Body: Buffer.from(fs.readFileSync(`${__dirname}/data/${params.Key}`)),
    };

    callback(null, s3Object);
  });
};

console.info = jest.fn();
console.error = jest.fn();

describe('IP lookup', () => {
  afterEach(() => {
    awsMock.restore();
  });
  test('IP lookup with not valid S3 files', () => {
    event = { requestContext: { identity: { sourceIp: '1.0.128.1' } } };
    awsMock.mock('S3', 'getObject', (params, callback) => {
      callback(new Error('error'), null);
    });
    const result = handler(event, context);
    return result.then(data => {
      expect(data).toHaveProperty('body', '"Internal Error"');
    });
  });
  test('IP lookup invalid address', () => {
    event = { requestContext: { identity: { sourceIp: '999.0.0.1' } } };
    mockS3();
    const result = handler(event, context);
    return result.then(data => {
      expect(data).toHaveProperty('body', '{"name":"N/A","country":"N/A","asn":0}');
    });
  });
  test('IP lookup valid address', () => {
    event = { requestContext: { identity: { sourceIp: '1.0.4.1' } } };
    mockS3();
    const result = handler(event, context);
    return result.then(data => {
      expect(data).toHaveProperty('body', '{"name":"AS24 - National Aeronautics and Space Administration","country":"US","asn":"56203"}');
    });
  });
  test('IP lookup valid address without ASN definition', () => {
    event = { requestContext: { identity: { sourceIp: '1.0.128.1' } } };
    mockS3();
    const result = handler(event, context);
    return result.then(data => {
      expect(data).toHaveProperty('body', '{"name":"N/A","country":"N/A","asn":"23969"}');
    });
  });
});
