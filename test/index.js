const test = require('test');
test.setup();

var fs = require('fs');

try {
    fs.unlink("test.db");
} catch (e) {};
try {
    fs.unlink("test.db-shm");
} catch (e) {};
try {
    fs.unlink("test.db-wal");
} catch (e) {};

run('../demo/app');
require('coroutine').sleep(100);

const http = require('http');

describe("classed", () => {
    var id;

    it("post new", () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/classes/person1');
        assert.equal(rep.statusCode, 103);

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/person', {
            body: 'aaaa'
        });
        assert.equal(rep.statusCode, 107);

        var rep = http.post('http://127.0.0.1:8080/1.0/classes/person', {
            json: {
                name: 'lion',
                sex: "male",
                age: 16,
                some_filed: 'skip'
            }
        });
        assert.equal(rep.statusCode, 201);
        assert.deepEqual(rep.json(), {
            "id": 1
        });
        id = rep.json().id;

        rep = http.post('http://127.0.0.1:8080/1.0/classes/person', {
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

        assert.deepEqual(rep.json(), [{
                "id": 2
            },
            {
                "id": 3
            }
        ]);
    });

    describe("get id", () => {
        it("simple", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person1/${id}`);
            assert.equal(rep.statusCode, 103);

            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person/9999`);
            assert.equal(rep.statusCode, 101);

            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person/${id}`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": 1
            });
        });

        it("keys", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person/${id}?keys=age`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "age": 16
            });
        });
    });

    it("put id", () => {
        var rep = http.put(`http://127.0.0.1:8080/1.0/classes/person1/${id}`);
        assert.equal(rep.statusCode, 103);

        var rep = http.put(`http://127.0.0.1:8080/1.0/classes/person/9999`);
        assert.equal(rep.statusCode, 101);

        var rep = http.put(`http://127.0.0.1:8080/1.0/classes/person/${id}`);
        assert.equal(rep.statusCode, 107);

        var rep = http.put(`http://127.0.0.1:8080/1.0/classes/person/${id}`, {
            json: {
                name: 'xicilion',
                some_filed: 'skip'
            }
        });
        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "id": 1
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person/${id}`);
        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "name": "xicilion",
            "sex": "male",
            "age": 16,
            "id": 1
        });
    });

    it("del id", () => {
        var rep = http.del(`http://127.0.0.1:8080/1.0/classes/person1/${id}`);
        assert.equal(rep.statusCode, 103);

        var rep = http.del(`http://127.0.0.1:8080/1.0/classes/person/9999`);
        assert.equal(rep.statusCode, 101);

        var rep = http.del(`http://127.0.0.1:8080/1.0/classes/person/${id}`);
        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "id": 1
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person/${id}`);
        assert.equal(rep.statusCode, 101);
    });

    describe("get list", () => {
        before(() => {
            http.post('http://127.0.0.1:8080/1.0/classes/person', {
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person1`);
            assert.equal(rep.statusCode, 103);

            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), [{
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?keys=id,name`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where=err_json`);
                assert.equal(rep.statusCode, 107);
            });

            it("eq", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":4,"age":14}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }]);

                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":4,"age":15}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), []);

                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$eq":4}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": 4
                }]);
            });

            it("ne", () => {
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$ne":4}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$gt":3}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$gte":4}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$lt":4}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$lte":3}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"name":{"$like":"%k"}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"name":{"$not_like":"%k"}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$between":[2,4]}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$not_between":[3,4]}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":[1,2,3]}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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

                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$in":[1,2,3]}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"id":{"$not_in":[1,2,3]}}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
                var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?where={"$or":[{"id":3},{"id":5}]}`);
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), [{
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?skip=2`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), [{
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?limit=2`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), [{
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?order=-id`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), [{
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
            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?count=1`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "results": [{
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
                ],
                "count": 4
            });

            var rep = http.get(`http://127.0.0.1:8080/1.0/classes/person?limit=2&count=1`);
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "results": [{
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
                ],
                "count": 4
            });
        });
    })

    it("method", () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/classes/person1/test`);
        assert.equal(rep.statusCode, 103);

        var rep = http.post(`http://127.0.0.1:8080/1.0/classes/person/test`, {
            json: {
                name: 'lion'
            }
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "message": "test",
            "data": {
                "name": "lion"
            }
        });

        var rep = http.post(`http://127.0.0.1:8080/1.0/classes/person/test1`);

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "message": "current result"
        });
    });
});

test.run(console.DEBUG);
process.exit();