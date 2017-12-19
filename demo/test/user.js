const test = require('test');
test.setup();

const http = require('http');
const util = require('util');

function clen_result(res) {
    if (util.isObject(res)) {
        if (Array.isArray(res))
            res.forEach(r => clen_result(r));
        else {
            delete res.createdAt;
            delete res.updatedAt;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("user", () => {
    var id;

    describe("post new", () => {
        it("error: empty body", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/user');
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000001,
                "message": "POST request don't send any data."
            });
        });

        it("error: bad body", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
                body: 'aaaa'
            });
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000002,
                "message": "The data uploaded in the request is not legal JSON data."
            });
        });

        it("error: bad class", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/user1', {
                json: {}
            });
            assert.equal(rep.statusCode, 404);
            check_result(rep.json(), {
                "code": 4040001,
                "message": "Missing or invalid classname 'user1'."
            });
        });

        it("create user", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }
            });
            assert.equal(rep.statusCode, 201);
            assert.property(rep.json(), "id");
            id = rep.json().id;
        });

        xit("error: bad field", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
                json: {
                    name: 'lion1',
                    sex: "male",
                    age: 16,
                    password1: '123456'
                }
            });
            assert.equal(rep.statusCode, 500);
        });
    });

    describe("get by id", () => {
        it("bad class", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/user1/${id}`);
            assert.equal(rep.statusCode, 404);
        });

        it("bad id", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/user/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("simple", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/user/${id}`);
            assert.equal(rep.statusCode, 200);
            var data = rep.json();
            delete data.salt;
            delete data.password;
            check_result(data, {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": id
            });
        });

        it("keys", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/user/${id}`, {
                query: {
                    keys: "age"
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "age": 16
            });
        });
    });
});