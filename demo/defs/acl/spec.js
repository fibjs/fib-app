const test = require('test');
test.setup();

const { check_result, runServer } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});

runServer(tSrvInfo.server, () => void 0)

const http = require('http');

describe("acl", () => {
    before(() => {
        tappInfo.utils.dropModelsSync();
    });

    after(() => tappInfo.utils.cleanLocalDB())

    describe("basic", () => {
        var id;

        it("forbidden", () => {
            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 403);
        });

        it("role allow act", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
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
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
            assert.equal(rep.statusCode, 403);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
            assert.equal(rep.statusCode, 200);
        });

        it("role allow all", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
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
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r2']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            var res = rep.json();

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12346
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${res.id}`);
            assert.equal(rep.statusCode, 403);
        });

        it("user disallow", () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 9999,
                    roles: ['r1']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
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
                http.post(tSrvInfo.serverBase + '/set_session', {
                    json: {
                        id: 123,
                        roles: ['r3']
                    }
                });
            });

            it("create", () => {
                var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
                    json: {
                        name: "aaa",
                        age: 12,
                        sex: "female"
                    }
                });

                var id = rep.json().id;

                var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: null
                });
            });

            it("get", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: 12
                });

                var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`, {
                    query: {
                        keys: 'name,sex'
                    }
                });
                assert.deepEqual(rep.json(), {
                    name: "aaa"
                });
            });

            it("update", () => {
                var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}`, {
                    json: {
                        name: "bbb",
                        age: 123,
                        sex: "male"
                    }
                });

                var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
                assert.deepEqual(rep.json(), {
                    name: "aaa",
                    age: 123
                });

            });

            it("find", () => {
                var rep = http.get(tSrvInfo.appUrlBase + `/test_acl`, {
                    query: {
                        limit: 2,
                        ...tappInfo.dbType === 'postgres' && {
                            order: 'id'
                        }
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
        var rid1;

        before(() => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['admin']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + '/test_acl', {
                json: {
                    name: "aaa",
                    age: 12,
                    sex: "female"
                }
            });
            assert.equal(rep.statusCode, 201);
            id = rep.json().id;

            var rep = http.post(tSrvInfo.appUrlBase + '/ext_acl', {
                json: {
                    name: "aaa_ext"
                }
            });
            assert.equal(rep.statusCode, 201);
            rid = rep.json().id;
        });

        it('link', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 403);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r3']
                }
            });

            var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 403);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['admin']
                }
            });

            var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`, {
                json: {
                    id: rid
                }
            });
            assert.equal(rep.statusCode, 200);
        });

        it('read', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`);
            assert.equal(rep.statusCode, 403);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`);
            check_result(rep.json(), {
                name: 'aaa_ext'
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`);
            check_result(rep.json(), {
                id: rid,
                name: 'aaa_ext',
                age: null
            });
        });

        it('put', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`, {
                json: {
                    name: 'aaa_ext 1',
                }
            });
            check_result(rep.json(), {
                "code": 4030501,
                "message": "The operation isn’t allowed to 'test_acl' for clients due to class-level permissions."
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.put(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`, {
                json: {
                    name: 'aaa_ext 1',
                    age: 123
                }
            });
            assert.equal(rep.statusCode, 200);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid}`);
            check_result(rep.json(), {
                "id": rid,
                "name": "aaa_ext",
                "age": 123
            });
        });

        it('autoFetch', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
            check_result(rep.json(), {
                "code": 4030701,
                "message": "The operation isn’t allowed to 'test_acl' for clients due to class-level permissions."
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
            check_result(rep.json(), {
                "name": "aaa",
                "age": 12,
                "ext": [{
                    "name": "aaa_ext"
                }]
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}`);
            check_result(rep.json(), {
                "id": id,
                "name": "aaa",
                "age": 12,
                "sex": "female",
                "ext1_id": null,
                "ext": [{
                    "id": rid,
                    "name": "aaa_ext",
                    "age": 123
                }]
            });
        });

        it('create', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`, {
                json: {
                    name: 'new name',
                    age: 123
                }
            });
            check_result(rep.json(), {
                "code": 4030701,
                "message": "The operation isn’t allowed to 'test_acl' for clients due to class-level permissions."
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.post(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`, {
                json: {
                    name: 'new name',
                    age: 123
                }
            });
            assert.equal(rep.statusCode, 201);
            rid1 = rep.json().id;

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid1}`);
            check_result(rep.json(), {
                "id": rid1,
                "name": null,
                "age": 123
            });

        });

        it('find', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`);
            check_result(rep.json(), {
                "code": 4030501,
                "message": "The operation isn’t allowed to 'test_acl' for clients due to class-level permissions."
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`);
            check_result(rep.json(), [{
                    "name": "aaa_ext"
                },
                {
                    "name": null
                }
            ]);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`);
            check_result(rep.json(), [{
                    "id": rid,
                    "name": "aaa_ext",
                    "age": 123
                },
                {
                    "id": rid1,
                    "name": null,
                    "age": 123
                }
            ]);
        });

        it('delete', () => {
            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345
                }
            });

            var rep = http.del(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid1}`);
            check_result(rep.json(), {
                "code": 4030501,
                "message": "The operation isn’t allowed to 'test_acl' for clients due to class-level permissions."
            });

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 12345,
                    roles: ['r4']
                }
            });
            var rep = http.del(tSrvInfo.appUrlBase + `/test_acl/${id}/ext/${rid1}`);
            assert.equal(rep.statusCode, 200);

            http.post(tSrvInfo.serverBase + '/set_session', {
                json: {
                    id: 54321
                }
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/test_acl/${id}/ext`);
            check_result(rep.json(), [{
                "id": rid,
                "name": "aaa_ext",
                "age": 123
            }]);
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
