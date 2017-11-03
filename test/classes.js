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
            delete res.ACL;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("classes", () => {
    var id;

    it("post new", () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/person');
        assert.equal(rep.statusCode, 400);
        check_result(rep.json(), {
            "code": 4000001,
            "message": "POST request don't send any data."
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/app/person', {
            body: 'aaaa'
        });
        assert.equal(rep.statusCode, 400);
        check_result(rep.json(), {
            "code": 4000002,
            "message": "The data uploaded in the request is not legal JSON data."
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/app/person1', {
            json: {}
        });
        assert.equal(rep.statusCode, 404);
        check_result(rep.json(), {
            "code": 4040001,
            "message": "Missing or invalid classname 'person1'."
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/app/person', {
            json: {
                name: 'lion',
                sex: "male",
                age: 16,
                some_filed: 'skip'
            }
        });
        assert.equal(rep.statusCode, 201);
        check_result(rep.json(), {
            "id": 1
        });
        id = rep.json().id;

        rep = http.post('http://127.0.0.1:8080/1.0/app/person', {
            json: [{
                name: 'tom',
                sex: "male",
                age: 12
            }, {
                name: 'jack',
                sex: "male",
                age: 13
            }]
        });

        check_result(rep.json(), [{
                "id": 2
            },
            {
                "id": 3
            }
        ]);
    });

    it("new with createBy", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: id
            }
        });

        var rep = http.post('http://127.0.0.1:8080/1.0/app/pet', {
            json: {
                name: 'tomcat'
            }
        });
        assert.equal(rep.statusCode, 201);
        var pid = rep.json().id;

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/pet/${pid}/createBy`);
        assert.equal(rep.json().name, 'lion');

    });

    describe("get id", () => {
        it("simple", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person/9999`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": 1
            });
        });

        it("keys", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person/${id}`, {
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

    it("put id", () => {
        var rep = http.put(`http://127.0.0.1:8080/1.0/app/person1/${id}`, {
            json: {}
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/person/9999`, {
            json: {
                name: 'xicilion',
                some_filed: 'skip'
            }
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/person/${id}`);
        assert.equal(rep.statusCode, 400);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/person/${id}`, {
            json: {
                name: 'xicilion',
                some_filed: 'skip'
            }
        });
        assert.equal(rep.statusCode, 200);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/person/${id}`, {
            json: {
                name: 'xicilion'
            }
        });
        assert.equal(rep.statusCode, 200);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/person/${id}`);
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "xicilion",
            "sex": "male",
            "age": 16,
            "id": 1
        });
    });

    it("del id", () => {
        var rep = http.del(`http://127.0.0.1:8080/1.0/app/person1/${id}`);
        assert.equal(rep.statusCode, 404);

        var rep = http.del(`http://127.0.0.1:8080/1.0/app/person/9999`);
        assert.equal(rep.statusCode, 404);

        var rep = http.del(`http://127.0.0.1:8080/1.0/app/person/${id}`);
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "id": 1
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/person/${id}`);
        assert.equal(rep.statusCode, 404);
    });

    describe("get list", () => {
        before(() => {
            http.post('http://127.0.0.1:8080/1.0/app/person', {
                json: [{
                        name: 'mike',
                        sex: "female",
                        age: 14
                    },
                    {
                        name: 'frank',
                        sex: "male",
                        age: 15
                    }
                ]
            });
        });

        it("simple", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person1`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": 3
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                }
            ]);
        });

        it("keys", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    keys: 'id,name'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "id": 2
                },
                {
                    "name": "jack",
                    "id": 3
                },
                {
                    "name": "mike",
                    "id": 4
                },
                {
                    "name": "frank",
                    "id": 5
                }
            ]);
        });

        describe("where", () => {
            it("error query", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: "err_json"
                    }
                });
                assert.equal(rep.statusCode, 400);
            });

            it("eq", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":4,"age":14}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }]);

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":4,"age":15}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), []);

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"eq":4}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }]);
            });

            it("ne", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"ne":4}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": 5
                    }
                ]);
            });

            it("gt", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"gt":3}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }, {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                }]);
            });

            it("gte", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"gte":4}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }, {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                }]);
            });

            it("lt", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"lt":4}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    }
                ]);
            });

            it("lte", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"lte":3}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    }
                ]);
            });

            it("like", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"name":{"like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": 5
                    }
                ]);
            });

            it("not_like", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"name":{"not_like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": 4
                    }
                ]);
            });

            it("between", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"between":[2,4]}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    },
                    {
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": 4
                    }
                ]);
            });

            it("not_between", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"not_between":[3,4]}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": 5
                    }
                ]);
            });

            it("in", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":[1,2,3]}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    }
                ]);

                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"in":[1,2,3]}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": 2
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    }
                ]);
            });

            it("not_in", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"id":{"not_in":[1,2,3]}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": 4
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": 5
                    }
                ]);
            });

            it("or", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                    query: {
                        where: '{"or":[{"id":3},{"id":5}]}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": 3
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": 5
                    }
                ]);
            });
        });

        it("skip", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    skip: 2
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                }
            ]);
        });

        it("limit", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    limit: 2
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": 3
                }
            ]);
        });

        it("order", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    order: '-id'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": 3
                },
                {
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                }
            ]);
        });

        it("count", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    count: 1
                }
            });
            assert.equal(rep.statusCode, 200);
            var res = rep.json();
            assert.equal(res.count, 4);
            check_result(res.results, [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": 3
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": 5
                }
            ]);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/person`, {
                query: {
                    limit: 2,
                    count: 1
                }
            });
            assert.equal(rep.statusCode, 200);
            var res = rep.json();
            assert.equal(res.count, 4);
            check_result(res.results, [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": 3
                }
            ]);
        });
    });

    it("batch", () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            json: {
                requests: [{
                    "method": "GET",
                    "path": "/person/2"
                }, {
                    "method": "GET",
                    "path": "/person/2?keys=name,sex"
                }, {
                    "method": "PUT",
                    "path": "/person/2",
                    "body": {
                        age: 13
                    }
                }, {
                    "method": "GET",
                    "path": "/person/2"
                }, {
                    "method": "GET",
                    "path": "/person/200"
                }]
            }
        });

        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), [{
                "success": {
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": 2
                }
            }, {
                "success": {
                    "name": "tom",
                    "sex": "male"
                }
            },
            {
                "success": {
                    "id": 2
                }
            },
            {
                "success": {
                    "name": "tom",
                    "sex": "male",
                    "age": 13,
                    "id": 2
                }
            },
            {
                "error": {
                    "code": 4040102,
                    "message": "Object '200' not found in class 'person'."
                }
            }
        ]);
    });

    it("function", () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app/person1/test`, {
            json: {}
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.post(`http://127.0.0.1:8080/1.0/app/person/test`, {
            json: {
                name: 'lion'
            }
        });

        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "message": "test",
            "data": {
                "name": "lion"
            }
        });
    });
});