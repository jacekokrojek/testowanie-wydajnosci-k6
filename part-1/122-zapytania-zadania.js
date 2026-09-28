import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  insecureSkipTLSVerify: true,
};

function getOpenIdConfig(hostname) {
  const res = http.get(`https://${hostname}/realms/sample-app/.well-known/openid-configuration`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

export function authorize(hostname) {
  const url = `https://${hostname}/realms/sample-app/protocol/openid-connect/token`;
  const payload = {
    grant_type: 'client_credentials',
    client_id: __ENV.CLIENT_ID || 'client-pat',
    client_secret: __ENV.CLIENT_SECRET || 'replace-me',
  };

  const res = http.post(url, payload);
  check(res, {
    'token endpoint responds 200': (r) => r.status === 200,
  });

  const jsonResponse = res.json();
  return jsonResponse.access_token;
}

export default function () {
  const hostname = __ENV.HOSTNAME || '63.186.38.145';
  getOpenIdConfig(hostname);
  const token = authorize(hostname);
  console.log(`token length: ${token.length}`);
}
