const test = require('test');
test.setup();

const http = require('http');
const util = require('util');

function clen_result(res) {
    if (util.isObject(res)) {
        if (Array.isArray(res))
            res.forEach(r => clen_result(r));
        else {
            delete res.createAt;
            delete res.updateAt;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("acl", () => {
    describe("basic", () => {
        var id;

        it("forbidden", () => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 403);
        });

        it("role allow act", () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            id = rep.json().id;
        });

        it("object act", () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`);
            assert.equal(rep.statusCode, 403);

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`);
            assert.equal(rep.statusCode, 200);
        });

        it("role allow all", () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            var res = rep.json();
        });

        it("object allow owner", () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            var res = rep.json();

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12346
                }
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${res.id}`);
            assert.equal(rep.statusCode, 403);
        });

        it("user disallow", () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 9999,
                    roles: ['r1']
                }
            });

            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 403);
        });

        describe("allow field", () => {
            before(() => {
                http.post('http://127.0.0.1:8080/set_session', {
                    json: {
                        id: 123,
                        roles: ['r3']
                    }
                });
            });

            it("create", () => {
                var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                    json: {
                        name: "aaa",
                        age: 12,
                        sex: "female"
                    }
                });

                var id = rep.json().id;

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: null
                });
            });

            it("get", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: 12
                });

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`, {
                    query: {
                        keys: 'name,sex'
                    }
                });
                assert.deepEqual(rep.json(), {
                    name: "aaa"
                });
            });

            it("update", () => {
                var rep = http.put(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`, {
                    json: {
                        name: "bbb",
                        age: 123,
                        sex: "male"
                    }
                });

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: 123
                });

            });

            it("find", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl`, {
                    query: {
                        limit: 2
                    }
                });
                assert.deepEqual(rep.json(), [{
                        name: "aaa",
                        age: 123
                    },
                    {
                        name: "aaa",
                        age: 12
                    }
                ]);
            });
        });
    });

    describe("extend", () => {
        var id;
        var rid;

        before(() => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['admin']
                }
            });

            var rep = http.post('http://127.0.0.1:8080/1.0/app/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            id = rep.json().id;

            var rep = http.post('http://127.0.0.1:8080/1.0/app/ext_acl', {
                json: {
                    name: "aaa_ext"
                }
            });
            assert.equal(rep.statusCode, 201);
            rid = rep.json().id;
        });

        it('link', () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 403);

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['r3']
                }
            });

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 403);

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['admin']
                }
            });

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 200);
        });

        it('read', () => {
            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}/ext/${rid}`);
            assert.equal(rep.statusCode, 403);

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/test_acl/${id}/ext/${rid}`);
            check_result(rep.json(), {
                name: 'aaa_ext'
            });
        });
    });
});