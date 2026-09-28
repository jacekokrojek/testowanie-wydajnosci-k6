import http from 'k6/http';
import { check } from 'k6';

class UsersApiClient {
  constructor(hostname, token) {
    this.hostname = hostname;
    this.token = token;
    this.baseUrl = `https://${hostname}/admin/realms/sample-app/users`;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  getUsers(query = '') {
    const url = `${this.baseUrl}${query}`;
    const params = { headers: this.headers };
    const res = http.get(url, params);
    check(res, { 'status is 200': (r) => r.status === 200 });
    console.log(res.body);
    return res;
  }

  createUser(user) {
    const url = this.baseUrl;
    const payload = JSON.stringify(user);
    const params = { headers: this.headers };
    const res = http.post(url, payload, params);
    check(res, { 'status is 201': (r) => r.status === 201 });
    console.log(res.body);
    return res;
  }

  resetPassword(userId, newPassword = 'testpassword123') {
    const url = `${this.baseUrl}/${userId}/reset-password`;
    const resetPassword = {
      type: 'password',
      temporary: false,
      value: newPassword,
    };
    const payload = JSON.stringify(resetPassword);
    const params = { headers: this.headers };
    const res = http.put(url, payload, params);
    check(res, { 'status is 204 or 200': (r) => r.status === 200 || r.status === 204 });
    console.log(res.body);
    return res;
  }
}