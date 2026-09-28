import http from 'k6/http';
import { check } from 'k6';
import { authorize } from './122-zapytania-zadania.js';

export const options = {
  vus: 3,
  iterations: 30,
  insecureSkipTLSVerify: true,
  thresholds: {
    'http_reqs{status:200}': ['count >= 1'],
    'http_reqs{status:429}': ['count >= 0'],
    'http_reqs{status:5xx}': ['count < 1'],
  },
};

export default function () {
  const hostname = __ENV.HOSTNAME || '3.74.163.114';
  const token = authorize(hostname);

  const users = getUsers(hostname, token, '?username=test&max=5');
  check(users, {
    'response is an array': (value) => Array.isArray(value),
  });
}

export function getUsers(hostname, token, query) {
  const url = `https://${hostname}/admin/realms/sample-app/users${query}`;
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.get(url, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  return res.json();
}

function basicAuth() {
  const username = __ENV.USERNAME || 'testuser';
  const password = __ENV.PASSWORD || 'testpass';
  const credentials = `${username}:${password}`;
  const url = `https://${credentials}@httpbin.org/basic-auth/${username}/${password}`;

  let res = http.get(url);

  // Verify response
  check(res, {
    'status is 200': (r) => r.status === 200
  });

  // Alternatively you can create the header yourself to authenticate
  // using HTTP Basic Auth
  const encodedCredentials = encoding.b64encode(credentials);
  const options = {
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  res = http.get(`https://httpbin.org/basic-auth/${username}/${password}`, options);

  // Verify response (checking the echoed data from the QuickPizza
  // basic auth test API endpoint)
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
