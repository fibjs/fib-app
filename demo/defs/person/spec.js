const test = require('test');
test.setup();

const { check_result } = require('../../test/_utils');

const testAppInfo = require('../..').getRandomSqliteBasedApp();
const testSrvInfo = require('../..').mountAppToSrv(testAppInfo.app, {appPath: '/api'});
testSrvInfo.server.run(() => void 0)

const http = require('http');

describe("classes - person", () => {
    let conn = null
    
    before(() => {
        conn = testAppInfo.utils.connectionToDB()
    })
    after(() => testAppInfo.cleanSqliteDB())

    describe("post new", () => {
        var id;

        it("error: empty body", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person');
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000001,
                "message": "POST request don't send any data."
            });
        });

        it("error: bad body", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                body: 'aaaa'
            });
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000002,
                "message": "The data uploaded in the request is not legal JSON data."
            });
        });

        it("error: bad class", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person1', {
                json: {}
            });
            assert.equal(rep.statusCode, 404);
            check_result(rep.json(), {
                "code": 4040001,
                "message": "Missing or invalid classname 'person1'."
            });
        });

        it("create person", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            assert.equal(rep.statusCode, 201);
            assert.property(rep.json(), "id");
            id = rep.json().id;
        });

        it("create multi person", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: [{
                        name: 'lion 1',
                        sex: "male",
                        age: 16
                    },
                    {
                        name: 'lion 2',
                        sex: "male",
                        age: 16
                    }
                ]
            });
            assert.equal(rep.statusCode, 201);
            assert.isArray(rep.json());
        });

        xit("error: bad field", () => {
            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion1',
                    sex: "male",
                    age: 16,
                    password1: '123456'
                }
            });
            assert.equal(rep.statusCode, 500);
        });

        it("new with createdBy", () => {
            http.post(testSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(testSrvInfo.appUrlBase + '/pet', {
                json: {
                    name: 'tomcat'
                }
            });
            assert.equal(rep.statusCode, 201);
            var pid = rep.json().id;

            var rep = http.get(testSrvInfo.appUrlBase + `/pet/${pid}/createdBy`);
            assert.equal(rep.json().name, 'lion');
        });

        it("multi with createdBy", () => {
            http.post(testSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(testSrvInfo.appUrlBase + '/pet', {
                json: [{
                        name: 'tomcat'
                    }, {
                        name: 'tom'
                    },
                    {
                        name: 'jerry'
                    }
                ]
            });
            assert.equal(rep.statusCode, 201);
            rep.json().forEach(r => {
                var rep = http.get(testSrvInfo.appUrlBase + `/pet/${r.id}/createdBy`);
                assert.equal(rep.json().name, 'lion');
            });
        });
    });

    describe("get id", () => {
        var id;

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(testSrvInfo.appUrlBase + `/person/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("simple", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": id
            });
        });

        it("keys", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person/${id}`, {
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

    describe("put id", () => {
        var id;

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.put(testSrvInfo.appUrlBase + `/person1/${id}`, {
                json: {}
            });
            assert.equal(rep.statusCode, 404);

            var rep = http.put(testSrvInfo.appUrlBase + `/person/9999`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 404);

            var rep = http.put(testSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 400);
        });

        it("update", () => {
            var rep = http.put(testSrvInfo.appUrlBase + `/person/${id}`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.put(testSrvInfo.appUrlBase + `/person/${id}`, {
                json: {
                    name: 'xicilion'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(testSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "xicilion",
                "sex": "male",
                "age": 16,
                "id": id
            });
        });
    });

    describe("del id", () => {
        var id;

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.del(testSrvInfo.appUrlBase + `/person1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.del(testSrvInfo.appUrlBase + `/person/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("delete", () => {
            var rep = http.del(testSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "id": id
            });

            var rep = http.get(testSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 404);
        })
    });

    describe("get list", () => {
        var ids = [];

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(testSrvInfo.appUrlBase + '/person', {
                json: [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13
                    }, {
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

            rep.json().forEach(r => ids.push(r.id));
        });

        it("simple", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person1`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(testSrvInfo.appUrlBase + `/person`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": ids[0]
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": ids[1]
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                }
            ]);
        });

        it("keys", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                query: {
                    keys: 'id,name'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "id": ids[0]
                },
                {
                    "name": "jack",
                    "id": ids[1]
                },
                {
                    "name": "mike",
                    "id": ids[2]
                },
                {
                    "name": "frank",
                    "id": ids[3]
                }
            ]);
        });

        describe("where", () => {
            it("error query", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: "err_json"
                    }
                });
                assert.equal(rep.statusCode, 400);
            });

            it("eq", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":"${ids[2]}","age":14}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                }]);

                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":"${ids[2]}","age":15}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), []);

                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"eq":"${ids[2]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                }]);
            });

            it("ne", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"ne":"${ids[2]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": ids[3]
                    }
                ]);
            });

            it("gt", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"gt":"${ids[1]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                }, {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                }]);
            });

            it("gte", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"gte":"${ids[2]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                }, {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                }]);
            });

            it("lt", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"lt":"${ids[2]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    }
                ]);
            });

            it("lte", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"lte":"${ids[1]}"}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    }
                ]);
            });

            it("like", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: '{"name":{"like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": ids[3]
                    }
                ]);
            });

            it("not_like", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: '{"name":{"not_like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": ids[2]
                    }
                ]);
            });

            it("between", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"between":["${ids[0]}","${ids[2]}"]}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    },
                    {
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": ids[2]
                    }
                ]);
            });

            it("not_between", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"not_between":["${ids[1]}","${ids[2]}"]}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": ids[3]
                    }
                ]);
            });

            it("in", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":["123456","${ids[0]}","${ids[1]}"]}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    }
                ]);

                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"in":["123456","${ids[0]}","${ids[1]}"]}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "tom",
                        "sex": "male",
                        "age": 12,
                        "id": ids[0]
                    },
                    {
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    }
                ]);
            });

            it("not_in", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":{"not_in":["123456","${ids[0]}","${ids[1]}"]}}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "mike",
                        "sex": "female",
                        "age": 14,
                        "id": ids[2]
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": ids[3]
                    }
                ]);
            });

            it("or", () => {
                var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"or":[{"id":"${ids[1]}"},{"id":"${ids[3]}"}]}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), [{
                        "name": "jack",
                        "sex": "male",
                        "age": 13,
                        "id": ids[1]
                    },
                    {
                        "name": "frank",
                        "sex": "male",
                        "age": 15,
                        "id": ids[3]
                    }
                ]);
            });
        });

        it("skip", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                query: {
                    skip: 2
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                }
            ]);
        });

        it("limit", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                query: {
                    limit: 2
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": ids[0]
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": ids[1]
                }
            ]);
        });

        it("order", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
                query: {
                    order: '-id'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), [{
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": ids[1]
                },
                {
                    "name": "tom",
                    "sex": "male",
                    "age": 12,
                    "id": ids[0]
                }
            ]);
        });

        it("count", () => {
            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
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
                    "id": ids[0]
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": ids[1]
                },
                {
                    "name": "mike",
                    "sex": "female",
                    "age": 14,
                    "id": ids[2]
                },
                {
                    "name": "frank",
                    "sex": "male",
                    "age": 15,
                    "id": ids[3]
                }
            ]);

            var rep = http.get(testSrvInfo.appUrlBase + `/person`, {
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
                    "id": ids[0]
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13,
                    "id": ids[1]
                }
            ]);
        });
    });

    it("batch", () => {
        var ids = [];

        try {
            conn.execute('delete from person;');
        } catch (e) {}

        var rep = http.post(testSrvInfo.appUrlBase + '/person', {
            json: [{
                    "name": "tom",
                    "sex": "male",
                    "age": 12
                },
                {
                    "name": "jack",
                    "sex": "male",
                    "age": 13
                }, {
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

        rep.json().forEach(r => ids.push(r.id));

        var rep = http.post(testSrvInfo.appUrlBase + ``, {
            json: {
                requests: [{
                    "method": "GET",
                    "path": `/person/${ids[0]}`
                }, {
                    "method": "GET",
                    "path": `/person/${ids[0]}?keys=name,sex`
                }, {
                    "method": "PUT",
                    "path": `/person/${ids[0]}`,
                    "body": {
                        age: 13
                    }
                }, {
                    "method": "GET",
                    "path": `/person/${ids[0]}`
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
                    "id": ids[0]
                }
            }, {
                "success": {
                    "name": "tom",
                    "sex": "male"
                }
            },
            {
                "success": {
                    "id": ids[0]
                }
            },
            {
                "success": {
                    "name": "tom",
                    "sex": "male",
                    "age": 13,
                    "id": ids[0]
                }
            },
            {
                "error": {
                    "code": 4040202,
                    "message": "Object '200' not found in class 'person'."
                }
            }
        ]);
    });

    it("function", () => {
        var rep = http.post(testSrvInfo.appUrlBase + `/person1/test`, {
            json: {}
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.post(testSrvInfo.appUrlBase + `/person/test`, {
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

        var rep = http.post(testSrvInfo.appUrlBase + `/person/getPersonByName`, {
            json: {
                name: 'tom',
                foo: 'male',
                bar: 18
            }
        });

        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "message": "ok",
            "data": [
                {
                    "name": "tom",
                }
            ]
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
