import http from 'k6/http';
import encoding from 'k6/encoding';
import { check, sleep } from 'k6';
import { authorize } from './122-zapytania-zadania.js'
import { getUsers } from './132-autoryzacja-rozwiazania.js'

export const options = {
  vus: 3,
  iterations: 30,
  insecureSkipTLSVerify: true,
  thresholds: {
    'http_reqs{status:200}': ['count>=0'],
    'http_reqs{status:201}': ['count>=0'],
    'http_reqs{status:429}': ['count>=0'],
    'http_reqs{status:409}': ['count>=0'],
    'http_reqs{status:5xx}': [], // wymaga sumRateLimit / grupowania niżej
  },
};

export default function () {

  let hostname = "63.186.38.145";
  let token = authorize(hostname);
  let userData = {
    "username": "testuser1",
    "email": "testuser1@example.com",
    "enabled": true,
    "firstName": "Test",
    "lastName": "User"
  }
  let userdetails = addUser(hostname, token, userData);

  let getUserData = getUsers(hostname, token, "?email=testuser1@example.com");
  console.log(`getUserData: ${getUserData} `);
    console.log(`id: ${getUserData[0].id} `);
  check(userdetails, { "status is 201": (res) => res.status === 201 });

}

export function addUser(hostname, token, userData) {
    const url = `https://${hostname}/admin/realms/sample-app/users`;
    const params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    let res = http.post(url, JSON.stringify(userData), params);
    return res;
  }

export function resetPassword(hostname, token, userId) {
    const url = `https://${hostname}/admin/realms/sample-app/users/${userId}/reset-password`;
    let resetPasswordData = {
      "type": "password",
      "temporary": false,
      "value": "testpassword123"
    };
    const params = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    let res = http.put(url, JSON.stringify(resetPasswordData), params);
    return res;
  }