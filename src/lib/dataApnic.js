const AWS = require('aws-sdk');
const httpClient = require('./httpClient');

const ASN_FILE = 'autnum.json';
const IP_RANGE_FILE = 'ip-range.json';
let dataAsn = null;
let dataIpRange = null;

const ip2long = (ip) => {
  let longValue = 0;
  const multipliers = [0x1000000, 0x10000, 0x100, 1];
  ip.split('.').forEach((part, i) => {
    longValue += part * multipliers[i];
  });
  return longValue;
};

const saveFile = async (dataFile, filename) => {
  const s3 = new AWS.S3();
  const options = {
    Bucket: process.env.S3_BUCKET,
    Key: filename,
    Body: JSON.stringify(dataFile),
  };
  await s3.putObject(options).promise();
  console.info('File saved:', filename);
  return true;
};

const getFile = async (filename) => {
  const s3 = new AWS.S3();
  const options = {
    Bucket: process.env.S3_BUCKET,
    Key: filename,
  };
  const fileData = await s3.getObject(options).promise();
  return fileData.Body.toString('utf-8');
};

const parseAsnResponse = async (response) => {
  const results = response.split(/\r?\n/);
  const listAsn = {};
  for (let i = 0; i < results.length; i += 1) {
    const match = results[i].match(/\s*(\d+)\s+(.*)/);
    if (match) {
      listAsn[match[1]] = match[2].trim();
    }
  }
  if (Object.keys(listAsn).length === 0) {
    throw new Error('Error getting raw-table');
  }
  await saveFile(listAsn, ASN_FILE);
  return true;
};

const saveAsn = async () => {
  const response = await httpClient('http://thyme.apnic.net/current/data-used-autnums');
  return parseAsnResponse(response);
};

const parseIpRangeResponse = async (response) => {
  const results = response.split(/\r?\n/);
  const listIp = {};
  for (let i = 0; i < results.length; i += 1) {
    const match = results[i].match(/([0-9.]+)\/(\d+)\s+(\d+)/);
    if (match) {
      const ipLong = ip2long(match[1]);
      if (!Object.prototype.hasOwnProperty.call(listIp, ip2long(match[1]))) {
        listIp[ipLong] = {};
      }
      listIp[ipLong][match[2]] = match[3].trim();
    }
  }

  if (Object.keys(listIp).length === 0) {
    throw new Error('error getting Ip range');
  }
  await saveFile(listIp, IP_RANGE_FILE);
  return true;
};

const saveIpRange = async () => {
  const response = await httpClient('http://thyme.apnic.net/current/data-raw-table');
  return parseIpRangeResponse(response);
};

const getAsn = async () => {
  if (dataAsn) {
    return dataAsn;
  }
  dataAsn = JSON.parse(await getFile(ASN_FILE));
  console.info('loaded asn from S3');
  return dataAsn;
};

const getIpRange = async () => {
  if (dataIpRange) {
    return dataIpRange;
  }
  dataIpRange = JSON.parse(await getFile(IP_RANGE_FILE));
  console.info('loaded IpRange from S3');
  return dataIpRange;
};

const downloadData = () =>
  Promise.all([saveIpRange(), saveAsn()]).catch((e) => {
    throw e;
  });

const getData = () => Promise.all([getAsn(), getIpRange()]).then(data => ({ asn: data[0], ipRange: data[1] }));

module.exports = { downloadData, getData };
