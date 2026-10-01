import http from 'k6/http';
import { parseHTML } from 'k6/html';  
import encoding from 'k6/encoding';
import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  
  const encodedCredentials = encoding.b64encode("1PBDHK5JEL1XFNNU13AVBG64ILEKRLUE:");

  const options = {
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
    },
  };
  let res = http.get('http://3.71.14.30:8001/api/products/1', options);

  let xml = parseHTML(res.body);
  let stock_availables = xml.find('stock_availables').children();
  let stock_available = stock_availables.get(0).getAttribute('xlink:href');
  console.log(stock_available);
  let res2 = http.get(stock_available, options);
  let xml2 = parseHTML(res2.body);
  console.log(res2.body); 
  let id_product_regex = extractCDATA(res2.body, 'quantity') 
  const id_product_fb = findBetween(res2.body, '<quantity><![CDATA[', ']]></quantity>');
  console.log(`id_product_regex: ${id_product_regex}`);
  console.log(`id_product_fb: ${id_product_fb}`);
  
}

function extractCDATA(xmlString, tagName) {
  const r = `<${tagName}.*<!\\[CDATA\\[(.*?)\\]\\]`
  const match = new RegExp(r, 'i').exec(xmlString);
  return match ? match[1] : null;
}