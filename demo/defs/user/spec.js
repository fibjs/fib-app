const test = require('test');
test.setup();

const { check_result, runServer } = require('../../test/_utils');

const http = require('http');
const cheerio = require('cheerio');

[
    {
        apiPathPrefix: '',
    },
    {
        apiPathPrefix: '/api',
    }
].forEach((appOptions) => {
    const appPath = !appOptions.apiPathPrefix ? '/api' : ''

    const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp(appOptions, {/* uuid: getTestDbType() === 'sqlite' */});
    const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath});
    runServer(tSrvInfo.server, () => void 0)

    describe(`user, specified appOptions: \n${JSON.stringify(appOptions, null, '\t')}\n`, () => {
        before(() => {
            tappInfo.utils.dropModelsSync();
        });
        
        var id;
        after(() => tappInfo.utils.cleanLocalDB())

        describe("post new", () => {
            it("error: empty body", () => {
                var rep = http.post(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user`);
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000001,
                    "message": "POST request don't send any data."
                });
            });

            it("error: bad body", () => {
                var rep = http.post(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user`, {
                    body: 'aaaa'
                });
                assert.equal(rep.statusCode, 400);
                check_result(rep.json(), {
                    "code": 4000002,
                    "message": "The data uploaded in the request is not legal JSON data."
                });
            });

            it("error: bad class", () => {
                var rep = http.post(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user1`, {
                    json: {}
                });
                assert.equal(rep.statusCode, 404);
                check_result(rep.json(), {
                    "code": 4040001,
                    "message": "Missing or invalid classname 'user1'."
                });
            });

            it("create user", () => {
                var rep = http.post(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user`, {
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
                var rep = http.post(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user`, {
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
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user1/${id}`);
                assert.equal(rep.statusCode, 404);
            });

            it("bad id", () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user/9999`);
                assert.equal(rep.statusCode, 404);
            });

            it("simple", () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user/${id}`);
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
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.apiPathPrefix}/user/${id}`, {
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
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}