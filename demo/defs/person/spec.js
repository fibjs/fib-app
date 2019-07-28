const test = require('test');
test.setup();

const querystring = require('querystring');
const coroutine = require('coroutine');
const Rpc = require('fib-rpc');

const { check_result } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
tSrvInfo.server.run(() => void 0)

const http = require('http');

describe("classes - person", () => {
    let conn = null
    
    before(() => {
        tappInfo.utils.dropModelsSync();
        conn = tappInfo.utils.connectionToDB()
    })
    after(() => tappInfo.utils.cleanLocalDB())

    describe("post new", () => {
        var id;

        it("error: empty body", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person');
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000001,
                "message": "POST request don't send any data."
            });
        });

        it("error: bad body", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
                body: 'aaaa'
            });
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000002,
                "message": "The data uploaded in the request is not legal JSON data."
            });
        });

        it("error: bad class", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person1', {
                json: {}
            });
            assert.equal(rep.statusCode, 404);
            check_result(rep.json(), {
                "code": 4040001,
                "message": "Missing or invalid classname 'person1'."
            });
        });

        it("create person", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
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
            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
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
            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
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
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/pet', {
                json: {
                    name: 'tomcat'
                }
            });
            assert.equal(rep.statusCode, 201);
            var pid = rep.json().id;

            var rep = http.get(tSrvInfo.appUrlBase + `/pet/${pid}/createdBy`);
            assert.equal(rep.json().name, 'lion');
        });

        it("multi with createdBy", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/pet', {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/pet/${r.id}/createdBy`);
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

            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(tSrvInfo.appUrlBase + `/person/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("simple", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": id
            });
        });

        it("keys", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person/${id}`, {
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

    describe("view service", () => {
        const test_session = {
            id: Date.now(),
            roles: ['nothing']
        }
        
        it("get request always fallback to viewServices", () => {
            var rep = http.request('GET', tSrvInfo.appUrlBase + `/person/test`, {
            });
            assert.equal(rep.statusCode, 200);
            
            var rep = http.request('GET', tSrvInfo.appUrlBase + `/person/test`, {
                headers: {
                    'Content-Type': 'application/xjson'
                }
            });
            assert.equal(rep.statusCode, 200);
            
            ;[
                'text/html; charset=utf8',
                'text/css; charset=utf8',
                'text/javascript; charset=utf8',
                'application/javascript; charset=utf8'
            ].forEach(contentType => {
                var rep = http.request('GET', tSrvInfo.appUrlBase + `/person/test`, {
                    headers: {
                        'Content-Type': contentType
                    }
                });
                // try find viewFunctions/serviceFunctions -> internalApi -> 404 response
                assert.equal(rep.statusCode, 200);
                assert.equal(rep.json(), null);
            })
        });

        describe('static response', () => {
            ;[
                [404, 'undefined', 'staticUndefined'],
                [200, 'null', 'staticNull', null],
                [200, 'NaN', 'staticNaN', null],
                [200, 'number', 'staticNumber', 123],
                [200, 'null', 'staticString', 'static person'],
                [200, 'boolean', 'staticBoolean', true],
                [200, 'object', 'staticObject', {a: 1}],
                [404, 'Symbol', 'staticSymbol'],
            ].forEach(([status, value_type, method, response_value]) => {
                if (status === 200) {
                    it(`can be ${value_type}`, () => {

                        var rep = http.get(tSrvInfo.appUrlBase + `/person/${method}`, {
                        });
                        assert.equal(rep.statusCode, 200);
                        assert.deepEqual(rep.json(), response_value);
                    })
                } else {
                    it(`** can not be ${value_type}`, () => {
                        var rep = http.get(tSrvInfo.appUrlBase + `/person/${method}`, {
                        });
                        assert.equal(rep.statusCode, status);
                    })
                }
            })
        })

        it("testReqSession", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: test_session
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/person/testReqSession`, {
                json: {}
            });
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), test_session);
        });

        it("testReqQuery", () => {
            ;[
                [
                    {
                        a: 1,
                        b: false,
                        c: 3
                    },
                    {
                        a: "1",
                        b: "false",
                        c: "3"
                    }
                ],
                [
                    {
                    },
                    {
                    }
                ]
            ].forEach(([test_query, result_query]) => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person/testReqQuery`, {
                    json: {},
                    query: test_query
                });
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), result_query);

                var rep = http.get(tSrvInfo.appUrlBase + `/person/testReqQuery?${querystring.stringify(test_query)}`, {
                    json: {},
                });
                assert.equal(rep.statusCode, 200);
                assert.deepEqual(rep.json(), result_query);
            })
        });
        
        it("testCtxOrm", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person/testCtxOrm`, {
                json: {}
            });
            assert.equal(rep.statusCode, 200);
            assert.isTrue(rep.json().includes('person'));
        });
    })

    describe("put id", () => {
        var id;

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.put(tSrvInfo.appUrlBase + `/person1/${id}`, {
                json: {}
            });
            assert.equal(rep.statusCode, 404);

            var rep = http.put(tSrvInfo.appUrlBase + `/person/9999`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 404);

            var rep = http.put(tSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 400);
        });

        it("update", () => {
            var rep = http.put(tSrvInfo.appUrlBase + `/person/${id}`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.put(tSrvInfo.appUrlBase + `/person/${id}`, {
                json: {
                    name: 'xicilion'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(tSrvInfo.appUrlBase + `/person/${id}`);
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

            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.del(tSrvInfo.appUrlBase + `/person1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.del(tSrvInfo.appUrlBase + `/person/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("delete", () => {
            var rep = http.del(tSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "id": id
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/person/${id}`);
            assert.equal(rep.statusCode, 404);
        })
    });

    describe("get list", () => {
        var ids = [];

        before(() => {
            try {
                conn.execute('delete from person;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person', {
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person1`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(tSrvInfo.appUrlBase + `/person`);
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: "err_json"
                    }
                });
                assert.equal(rep.statusCode, 400);
            });

            it("eq", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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

                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
                    query: {
                        where: `{"id":"${ids[2]}","age":15}`
                    }
                });
                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), []);

                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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

                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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
            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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

            var rep = http.get(tSrvInfo.appUrlBase + `/person`, {
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

        var rep = http.post(tSrvInfo.appUrlBase + '/person', {
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

        var rep = http.post(tSrvInfo.appUrlBase + ``, {
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
        var rep = http.post(tSrvInfo.appUrlBase + `/person1/test`, {
            json: {}
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.post(tSrvInfo.appUrlBase + `/person/test`, {
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

        var rep = http.post(tSrvInfo.appUrlBase + `/person/getPersonByName`, {
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

    describe("built-in rpc", () => {
        it("call rpc method", () => {
            var rep = http.post(tSrvInfo.serverBase + `/rpc`, {
                json: {
                    id: 1234,
                    method: 'person._getPersonByName',
                    params: {
                        name: 'tom'
                    }
                }
            });

            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "id": 1234,
                "result": [{
                    "name": "tom"
                }]
            });
        });

        it("call fallback to functions method", () => {
            var rep = http.post(tSrvInfo.serverBase + `/rpc`, {
                json: {
                    id: 1234,
                    method: 'person.getPersonByName',
                    params: {
                        name: 'tom'
                    }
                }
            });

            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "id": 1234,
                "result": {
                    "message": "ok",
                    "data": [
                      {
                        "name": "tom"
                      }
                    ]
                }
            });
        });

        it("call in memory", () => {
            const response = tappInfo.app.rpcCall({
                id: 12345,
                method: 'person.getPersonByName',
                params: {
                    name: 'tom'
                }
            });

            assert.deepEqual(
                response.result.data, [
                    {
                        "name": "tom"
                    }
                ]
            )
        });

        describe('exception', () => {
            it('no model', () => {
                var rep = http.post(tSrvInfo.serverBase + `/rpc`, {
                    json: {
                        id: 1234,
                        method: 'model_no_exist.getPersonByName',
                        params: {
                            name: 'tom'
                        }
                    }
                });

                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), {
                    "id": 1234,
                    "error": {
                        code: -32601,
                        "message": "Method not found."
                    }
                });
            });

            it('no rpc method or any fallback function', () => {
                var rep = http.post(tSrvInfo.serverBase + `/rpc`, {
                    json: {
                        id: 1234,
                        method: 'person.non_existed_rpc_method_or_function',
                        params: {
                            name: 'tom'
                        }
                    }
                });

                assert.equal(rep.statusCode, 200);
                check_result(rep.json(), {
                    "id": 1234,
                    "error": {
                        code: -32601,
                        "message": "Method not found."
                    }
                });
            });
        });
    });

    describe("rpc operation", () => {
        var noOp = () => void 0

        var integerAdd = ({ $session, v1, v2 }) => {
            assert.exist($session)

            if (!Number.isInteger(v1) || !Number.isInteger(v2))
                throw Rpc.rpcError(-1, 'Addend must be integer')
                
            return v1 + v2
        }

        beforeEach(() => {
            tappInfo.app.clearRpcMethods()

            assert.strictEqual(tappInfo.app.hasRpcMethod('anything', noOp), false);
            assert.deepEqual(tappInfo.app.allRpcMethodNames(), []);
        });

        it("addRpcMethod", () => {
            assert.strictEqual(
                tappInfo.app.addRpcMethod('personMethod.test', noOp),
                1
            );

            assert.throws(() => {
                tappInfo.app.addRpcMethod('personMethod.test', noOp);
            });

            assert.strictEqual(
                tappInfo.app.hasRpcMethod('personMethod.test', noOp),
                true
            );
        });

        it("removeRpcMethod", () => {
            assert.strictEqual(
                tappInfo.app.addRpcMethod('personMethod.test', noOp),
                1
            );

            assert.strictEqual(
                tappInfo.app.hasRpcMethod('personMethod.test', noOp),
                true
            );

            assert.strictEqual(
                tappInfo.app.removeRpcMethod('personMethod.test', noOp),
                0
            );

            assert.strictEqual(
                tappInfo.app.hasRpcMethod('personMethod.test', noOp),
                false
            );
        });

        it("parallel add/remove", () => {
            var happended = false

            const counts = Array.apply(null, { length: 100 }).map((_, idx) => idx + 1)

            coroutine.parallel(
                counts,
                (count) => {
                    if (!happended) happended = true;
                    
                    assert.strictEqual(
                        tappInfo.app.addRpcMethod(`personMethod.${count}`, noOp),
                        count
                    );
                }
            );
            
            assert.deepEqual(
                tappInfo.app.allRpcMethodNames(),
                counts.map(c => `personMethod.${c}`)
            );
            assert.equal(happended, true)

            happended = false;
            coroutine.parallel(
                counts.reverse(),
                (cur) => {
                    if (!happended) happended = true;
                    
                    assert.strictEqual(
                        tappInfo.app.removeRpcMethod(`personMethod.${cur}`, noOp),
                        cur - 1
                    );
                }
            );
            assert.equal(happended, true)
        });

        describe("use it", () => {
            it("orm less, simple", () => {
                tappInfo.app.addRpcMethod('xxx.integerAdd', integerAdd);

                var response = tappInfo.app.rpcCall({
                    id: 12345,
                    method: 'xxx.integerAdd',
                    params: { v1: 2, v2: 1 }
                });

                assert.deepEqual(
                    response.result, 3
                );
                
                var response = tappInfo.app.rpcCall({
                    id: 12345,
                    method: 'xxx.integerAdd',
                    params: { v1: 2.1, v2: 1 }
                });

                assert.deepEqual(
                    response.error, { code: -1, message: 'Addend must be integer' }
                );
            });

            it("from websocket client", () => {
                tappInfo.app.addRpcMethod('integerAdd.123', integerAdd);

                // const remoting = Rpc.connect(`${tSrvInfo.websocketHost}${tappInfo.app.__opts.websocketPathPrefix}`);
                const remoting = Rpc.open_connect(`${tSrvInfo.websocketHost}/websocket`);

                try {
                    remoting['integerAdd.123']({v1: 1.1, v2: 2})
                } catch (err_msg) {
                    assert.equal(err_msg, 'Addend must be integer')
                }

                assert.equal(remoting['integerAdd.123']({v1: 1, v2: 2}), 3)
            });
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
