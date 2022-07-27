const test = require('test');
test.setup();

const { check_result, runServer } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
runServer(tSrvInfo.server, () => void 0)

const http = require('http');

describe("classes - person_query", () => {
    let conn = null
    
    before(() => {
        tappInfo.utils.dropModelsSync();
        conn = tappInfo.utils.connectionToDB()
    })
    after(() => tappInfo.utils.cleanLocalDB())

    describe("post new", () => {
        var id;

        it("error: empty body", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person_query');
            assert.equal(rep.statusCode, 400);
            check_result(rep.json(), {
                "code": 4000001,
                "message": "POST request don't send any data."
            });
        });

        it("error: bad body", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

        it("create person_query", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

        it("create multi person_query", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

        let tomcat_id, tomcat2_id;
        it('new with createdBy', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/pet_query', {
                json: {
                    name: 'tomcat'
                }
            });
            assert.equal(rep.statusCode, 201);
            tomcat_id = rep.json().id;

            var rep = http.get(tSrvInfo.appUrlBase + `/pet_query/${tomcat_id}/createdBy`);
            assert.equal(rep.json().name, 'lion');
        });

        describe("new with createdBy2", () => {
            it('create', () => {
                http.post(tSrvInfo.serverBase + '/set_session', {
                    json: {
                        id: id
                    }
                });

                var rep = http.post(tSrvInfo.appUrlBase + '/pet_query', {
                    json: {
                        name: 'tomcat2'
                    }
                });
                assert.equal(rep.statusCode, 201);
                tomcat2_id = rep.json().id;
                
                var rep = http.put(tSrvInfo.appUrlBase + `/pet_query/${tomcat2_id}/createdBy2`, {
                    json: {
                        id,
                    }
                });
                assert.equal(rep.statusCode, 200);

                var rep = http.get(tSrvInfo.appUrlBase + `/pet_query/${tomcat2_id}/createdBy2`);
                assert.equal(rep.json().name, 'lion');
            });

            describe("findby", () => {
                it("invalid", () => {
                    var rep = http.get(tSrvInfo.appUrlBase + `/pet_query`, {
                        query: {
                            findby: 'errror_xxx'
                        }
                    });
                    assert.equal(rep.statusCode, 400);
                    check_result(rep.json(), {
                        "code": 4000007,
                        "message": "'findby' in the query is not legal JSON data."
                    });
                })

                it("allowed extend", () => {
                    var rep = http.get(tSrvInfo.appUrlBase + `/pet_query`, {
                        query: {
                            findby: JSON.stringify({
                                extend: 'createdBy',
                                where: {
                                    id: id
                                }
                            })
                        }
                    });
                    assert.equal(rep.statusCode, 200);
                    check_result(rep.json(), [
                        {
                          "name": "tomcat",
                          "id": tomcat_id,
                          "createdby_id": id,
                          "createdby2_id": null
                        },
                        {
                          "name": "tomcat2",
                          "id": tomcat2_id,
                          "createdby_id": id,
                          "createdby2_id": id
                        }
                    ]);
                })

                it("allowed .extend, but forbidden .where", () => {
                    var rep = http.get(tSrvInfo.appUrlBase + `/pet_query`, {
                        query: {
                            findby: JSON.stringify({
                                extend: 'createdBy',
                                where: {
                                    name: 'xxx'
                                }
                            })
                        }
                    });
                    assert.equal(rep.statusCode, 400);
                    check_result(rep.json(), {
                        "code": 4000009,
                        "message": "'name' is forbidden in the query[createdBy].where"
                    });
                })

                it("forbidden extend", () => {
                    var rep = http.get(tSrvInfo.appUrlBase + `/pet_query`, {
                        query: {
                            findby: JSON.stringify({
                                extend: 'createdBy2',
                                where: {
                                    id: id
                                }
                            })
                        }
                    });
                    assert.equal(rep.statusCode, 400);
                    check_result(rep.json(), {
                        "code": 4000008,
                        "message": "'createdBy2' is forbidden for query.findby.extend"
                    });
                });
            })
        });

        it("multi with createdBy", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: id
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/pet_query', {
                json: [
                    { name: 'tomcat' },
                    { name: 'tom' },
                    { name: 'jerry' }
                ]
            });
            assert.equal(rep.statusCode, 201);
            rep.json().forEach(r => {
                var rep = http.get(tSrvInfo.appUrlBase + `/pet_query/${r.id}/createdBy`);
                assert.equal(rep.json().name, 'lion');
            });
        });
    });

    describe("get id", () => {
        var id;

        before(() => {
            try {
                conn.execute('delete from person_query;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16
                }
            });
            id = rep.json().id;
        });

        it("error", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person_query1/${id}`);
            assert.equal(rep.statusCode, 404);

            var rep = http.get(tSrvInfo.appUrlBase + `/person_query/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("simple", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person_query/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "lion",
                "sex": "male",
                "age": 16,
                "id": id
            });
        });

        it("keys", () => {
            var rep = http.get(tSrvInfo.appUrlBase + `/person_query/${id}`, {
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
                conn.execute('delete from person_query;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

            var rep = http.put(tSrvInfo.appUrlBase + `/person_query/9999`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 404);

            var rep = http.put(tSrvInfo.appUrlBase + `/person_query/${id}`);
            assert.equal(rep.statusCode, 400);
        });

        it("update", () => {
            var rep = http.put(tSrvInfo.appUrlBase + `/person_query/${id}`, {
                json: {
                    name: 'xicilion',
                    some_filed: 'skip'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.put(tSrvInfo.appUrlBase + `/person_query/${id}`, {
                json: {
                    name: 'xicilion'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(tSrvInfo.appUrlBase + `/person_query/${id}`);
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
                conn.execute('delete from person_query;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

            var rep = http.del(tSrvInfo.appUrlBase + `/person_query/9999`);
            assert.equal(rep.statusCode, 404);
        });

        it("delete", () => {
            var rep = http.del(tSrvInfo.appUrlBase + `/person_query/${id}`);
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "id": id
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/person_query/${id}`);
            assert.equal(rep.statusCode, 404);
        })
    });

    describe("get list", () => {
        var ids = [];

        before(() => {
            try {
                conn.execute('delete from person_query;');
            } catch (e) {}

            var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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

        describe("where", () => {
            it("error query", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: "err_json"
                    }
                });
                assert.equal(rep.statusCode, 400);
            });

            it("eq", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: `{"id":"${ids[2]}","age":14}`
                    }
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000006,
                    "message": "'age' is forbidden in the query.where"
                });

                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: `{"id":"${ids[2]}","age":15}`
                    }
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000006,
                    "message": "'age' is forbidden in the query.where"
                });

                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: '{"name":{"like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000006,
                    "message": "'name' is forbidden in the query.where"
                });
            });

            it("not_like", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: '{"name":{"not_like":"%k"}}'
                    }
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000006,
                    "message": "'name' is forbidden in the query.where"
                });
            });

            it("between", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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

                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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
                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
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

                var rep = http.get(tSrvInfo.appUrlBase + `/person_query`, {
                    query: {
                        where: `{"or":[{"id":"${ids[1]}"},{"name":"xxx"}]}`
                    }
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000006,
                    "message": "'name' is forbidden in the query.where"
                });
            });
        });
    });

    it("batch", () => {
        var ids = [];

        try {
            conn.execute('delete from person_query;');
        } catch (e) {}

        var rep = http.post(tSrvInfo.appUrlBase + '/person_query', {
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
                    "path": `/person_query/${ids[0]}`
                }, {
                    "method": "GET",
                    "path": `/person_query/${ids[0]}?keys=name,sex`
                }, {
                    "method": "PUT",
                    "path": `/person_query/${ids[0]}`,
                    "body": {
                        age: 13
                    }
                }, {
                    "method": "GET",
                    "path": `/person_query/${ids[0]}`
                }, {
                    "method": "GET",
                    "path": "/person_query/200"
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
                    "code": 4040302,
                    "message": "Object '200' not found in class 'person_query'."
                }
            }
        ]);
    });

    it("function", () => {
        var rep = http.post(tSrvInfo.appUrlBase + `/person1/test`, {
            json: {}
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.post(tSrvInfo.appUrlBase + `/person_query/test`, {
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

        var rep = http.post(tSrvInfo.appUrlBase + `/person_query/getPersonByName`, {
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
