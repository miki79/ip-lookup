import { downloadData } from './lib/dataApnic';
import checkIp from './lib/ipCheck';

const generateHttpResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Credentials': 'false',
  },
  body: JSON.stringify(body),
});

export const ipLookup = async (event, context, callback) => {
  try {
    console.info('Request from %s', event.requestContext.identity.sourceIp);
    const response = generateHttpResponse(200, await checkIp(event.requestContext.identity.sourceIp));
    console.info('Response %s', response.body);
    callback(null, response);
  } catch (e) {
    console.error(e);
    callback(null, generateHttpResponse(500, 'Internal Error'));
  }
};

export const download = (event, context, callback) => {
  downloadData().then(() => { callback(null, 'OK'); }).catch((e) => { console.error(e); callback(e.toString()); });
};

export default { ipLookup, downloadData };
