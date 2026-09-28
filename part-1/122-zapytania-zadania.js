import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  insecureSkipTLSVerify: true,
};

function getOpenIdConfig(hostname) {
  let res = http.get(`https://${hostname}/realms/sample-app/.well-known/openid-configuration`);
  check(res, { "status is 200": (res) => res.status === 200 });
  sleep(1);
}

export function authorize(hostname) {
  
    const url = `https://${hostname}/realms/sample-app/protocol/openid-connect/token`;
    const payload =
    {
        grant_type: 'client_credentials',
        client_id: 'client-pat',
        client_secret: "WJmCgangJQYEttl2fQOvjdniGIJbHvWq"
    }

    const res = http.post(url, payload);
    let jsonResponse = res.json();
    return jsonResponse.access_token
}


export default function () {
  let hostname = "63.186.38.145"
  getOpenIdConfig(hostname);
  let token = authorize(hostname);
}
