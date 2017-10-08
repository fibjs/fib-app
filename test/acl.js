const test = require('test');
test.setup();

const http = require('http');

describe("acl", () => {
    it("forbidden", () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa"
            }
        });
        assert.equal(rep.statusCode, 119);
    });

    it("role allow act", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12345,
                roles: ['r2']
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa"
            }
        });
        assert.equal(rep.statusCode, 201);
    });

    it("role allow all", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12345,
                roles: ['r2']
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa"
            }
        });
        assert.equal(rep.statusCode, 201);
        var res = rep.json();

        var rep = http.get(`http://127.0.0.1:8080/1.0/classes/test_acl/${res.id}`);
        assert.deepEqual(rep.json().ACL, {
            12345: {
                "*": true
            }
        });
    });

    it("custom acl", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12345,
                roles: ['r2']
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa",
                ACL: {
                    '*': {
                        '*': true
                    }
                }
            }
        });
        assert.equal(rep.statusCode, 201);
        var res = rep.json();

        var rep = http.get(`http://127.0.0.1:8080/1.0/classes/test_acl/${res.id}`);
        assert.deepEqual(rep.json().ACL, {
            "*": {
                "*": true
            }
        });
    });

    it("object allow owner", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12345,
                roles: ['r2']
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa"
            }
        });
        assert.equal(rep.statusCode, 201);
        var res = rep.json();

        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12346
            }
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/classes/test_acl/${res.id}`);
        assert.equal(rep.statusCode, 119);
    });

    it("user disallow", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 9999,
                roles: ['r1']
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/test_acl', {
            json: {
                name: "aaa"
            }
        });
        assert.equal(rep.statusCode, 119);
    });
});