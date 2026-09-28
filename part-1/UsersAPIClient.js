class UsersApiClient {
    
    constructor(hostname, token) {
        this.hostname = hostname;
        this.token = token;
        this.baseUrl = `https://${hostname}/admin/realms/sample-app/users`;
        this.headers = {
            Authorization: `Bearer ${token}`
        };
    }

    getUsers(query = "") {
        const url = `${this.baseUrl}${query}`;
        const params = { headers: this.headers };
        let res = http.get(url, params);
        console.log(res.body);
        return res;
    }

    createUser(user) {
        const url = this.baseUrl;
        const payload = JSON.stringify(user);
        const params = { headers: this.headers };
        const res = http.post(url, payload, params);
        console.log(res.body);
        return res;
    }

    resetPassword(userId, newPassword = "testpassword123") {
        const url = `${this.baseUrl}/${userId}/reset-password`;
        const resetPassword = {
            "type": "password",
            "temporary": false,
            "value": newPassword
        };
        const payload = JSON.stringify(resetPassword);
        const params = { headers: this.headers };
        const res = http.put(url, payload, params);
        console.log(res.body);
        return res;
    }
}