import http from 'k6/http';
import { check } from 'k6';
import { authorize } from './122-zapytania-zadania.js';
import { getUsers } from './132-autoryzacja-rozwiazania.js';

export const options = {
  vus: 3,
  iterations: 30,
  insecureSkipTLSVerify: true,
  thresholds: {
    'http_reqs{status:200}': ['count >= 1'],
    'http_reqs{status:201}': ['count >= 1'],
    'http_reqs{status:429}': ['count >= 0'],
    'http_reqs{status:409}': ['count >= 0'],
    'http_reqs{status:5xx}': ['count < 1'],
  },
};

export default function () {
  const hostname = __ENV.HOSTNAME || '63.186.38.145';
  const token = authorize(hostname);

  const userData = {
    username: 'testuser1',
    email: 'testuser1@example.com',
    enabled: true,
    firstName: 'Test',
    lastName: 'User',
  };

  const userDetails = addUser(hostname, token, userData);
  check(userDetails, { 'status is 201': (res) => res.status === 201 });

  const userList = getUsers(hostname, token, '?email=testuser1@example.com');
  const userRecord = Array.isArray(userList) ? userList[0] : null;

  if (userRecord) {
    console.log(`id: ${userRecord.id}`);
  } else {
    console.log('User list empty or response not array');
  }
}

export function addUser(hostname, token, userData) {
  const url = `https://${hostname}/admin/realms/sample-app/users`;
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  return http.post(url, JSON.stringify(userData), params);
}

export function resetPassword(hostname, token, userId) {
  const url = `https://${hostname}/admin/realms/sample-app/users/${userId}/reset-password`;
  const resetPasswordData = {
    type: 'password',
    temporary: false,
    value: 'testpassword123',
  };
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  return http.put(url, JSON.stringify(resetPasswordData), params);
}