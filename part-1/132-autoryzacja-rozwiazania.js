import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, sleep } from 'k6';
import { authorize } from './122-zapytania-zadania.js'

export const options = {
  vus: 3,
  iterations: 30,
  insecureSkipTLSVerify: true,
  thresholds: {
    'http_reqs{status:200}': ['count>=0'],
    'http_reqs{status:429}': ['count>=0'],
    'http_reqs{status:5xx}': [], // wymaga sumRateLimit / grupowania niżej
  },
};

export default function () {
  let hostname = "3.74.163.114"
  let token = authorize(hostname);
  // const parts = token.split('.');
  // const jwt  = JSON.parse(encoding.b64decode(parts[1].toString(), "rawstd", 's'))
  // // console.log(["jwt: ", jwt ])
  // const userId = "143830b1-c0cd-432f-9a23-38187a5693d8"
  // resetPassword(hostname, token, userId)
  getUsers(hostname, token, "?username=test&max=5");
}

export function getUsers(hostname, token, query) {
  const url = `https://${hostname}/admin/realms/sample-app/users${query}`;
  const params = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  let res = http.get(url, params);
  console.log(res.json());
  return res.json();
}




function basicAuth() {
  const credentials = `${username}:${password}`;

  // Passing username and password as part of the URL will
  // allow us to authenticate using HTTP Basic Auth.
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