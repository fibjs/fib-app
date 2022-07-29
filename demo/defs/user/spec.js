const test = require('test');
test.setup();

const { check_result, runServer } = require('../../test/_utils');

const http = require('http');
const cheerio = require('cheerio');

[
    {
        apiPathPrefix: '',
        viewPathPrefix: ''
    },
    {
        apiPathPrefix: '/api',
        viewPathPrefix: '/view'
    },
    {
        apiPathPrefix: '/api',
        viewPathPrefix: ''
    },
    {
        apiPathPrefix: '',
        viewPathPrefix: '/view'
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

        describe("viewFunctions", () => {
            it('get', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/${id}`, {
                    headers: {
                        Accept: 'text/html'
                    }
                });

                assert.equal(rep.firstHeader('Content-Type'), 'text/html; charset=utf8');
                assert.equal(rep.statusCode, 200);
                var html = rep.body.readAll().toString();

                assert.equal(cheerio(html).find('.user-info').length, 0)
                assert.equal(cheerio(`<div>${html}</div>`).find('.user-info').length, 1)
                assert.equal(cheerio(html).find('.user-info > h2').length, 1)
                assert.equal(cheerio(html).find('.user-info > ul').length, 1)
            })

            it('find', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user`, {
                    headers: {
                        Accept: 'text/html'
                    }
                });

                assert.equal(rep.statusCode, 200);
                var html = rep.body.readAll().toString();

                assert.equal(cheerio(html).find('.user-info-table').length, 0)
                assert.equal(cheerio(`<div>${html}</div>`).find('.user-info-table').length, 1)

                assert.equal(cheerio(html).find('.user-info-table > table').length, 1)
                assert.equal(cheerio(html).find('.user-info-table > table > thead').length, 1)
                assert.equal(cheerio(html).find('.user-info-table > table > tbody').length, 1)

                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td a[href*="/1.0/app/user"]').length, 1)

                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td[data-field="name"]').length, 1)
                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td[data-field="sex"]').length, 1)
                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td[data-field="age"]').length, 1)
                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td[data-field="password"]').length, 1)
                assert.notLessThan(cheerio(html).find('.user-info-table > table > tbody > tr > td[data-field="salt"]').length, 1)
            })

            it('custom: profile page', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/profile`, {
                    headers: {
                        Accept: 'text/html'
                    }
                });

                assert.equal(rep.statusCode, 200);
                var html = rep.body.readAll().toString();

                var xdoc = require('xml').parse(html, 'text/html');
                var body = xdoc.body.toString();

                assert.equal(cheerio(body).text().trim(), 'user profile');
            })

            it('custom: css1', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/css1`, {
                    headers: {
                        Accept: 'text/css'
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(rep.firstHeader('Content-Type'), 'text/css; charset=utf16');
            })

            it('custom: css2', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/css2`, {
                    headers: {
                        Accept: 'text/css'
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(rep.firstHeader('Content-Type'), 'text/css; charset=gbk');
            })

            it('custom: javascript1', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/javascript1`, {
                    headers: {
                        Accept: 'text/javascript'
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(rep.firstHeader('Content-Type'), 'application/javascript; charset=utf8');
            })

            it('custom: javascript2', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/javascript2`, {
                    headers: {
                        Accept: 'text/javascript'
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(rep.firstHeader('Content-Type'), 'application/javascript; charset=gbk');
            })

            ;(appOptions.apiPathPrefix !== appOptions.viewPathPrefix || appOptions.viewPathPrefix !== '') && it('custom: json1', () => {
                var rep = http.get(tSrvInfo.serverBase + `${appOptions.viewPathPrefix}/user/json1`, {
                    headers: {
                        Accept: 'application/json'
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(rep.firstHeader('Content-Type'), 'application/json; charset=utf8');

                assert.deepEqual(rep.json(), {
                    foo: 'bar'
                })
            })
        })
    });
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}