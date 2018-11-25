const { getData } = require('./dataApnic');

const ip2long = ip => {
  let longValue = 0;
  const multipliers = [0x1000000, 0x10000, 0x100, 1];
  ip.split('.').forEach((part, i) => {
    longValue += part * multipliers[i];
  });
  return longValue;
};

const cidrToRange = (start, mask) => {
  const range = [2];
  range[0] = start;
  range[1] = 2 ** (32 - mask) + (start - 1);
  return range;
};

const getRange = (ip2, ipValue, listIp) => {
  let greaterMask = 0;
  let asn = 0;
  Object.keys(listIp[ip2]).forEach(z => {
    if (greaterMask < z) {
      greaterMask = z;
      const range = cidrToRange(ip2, z);
      if (range[0] <= ipValue && range[1] >= ipValue) {
        asn = listIp[ip2][z];
      }
    }
  });
  return asn;
};

const checkIp = async ip => {
  const data = await getData();
  const ipValue = parseInt(ip2long(ip), 10);
  const response = {
    name: 'N/A',
    country: 'N/A',
    asn: 0,
  };

  for (let i = 0; i < 32; i += 1) {
    const ip2 = ((ipValue >> i) << i) >>> 0;
    if (Object.prototype.hasOwnProperty.call(data.ipRange, ip2)) {
      response.asn = getRange(ip2, ipValue, data.ipRange);
      if (response.asn !== 0) {
        if (Object.prototype.hasOwnProperty.call(data.asn, response.asn)) {
          const match = data.asn[response.asn].match(/(.+),\s([A-Z]+)$/);
          response.name = data.asn[response.asn];
          if (match && match[2]) {
            response.name = match[1].trim();
            response.country = match[2].trim();
          }
        }
        break;
      }
    }
  }
  return response;
};

module.exports = { checkIp };
