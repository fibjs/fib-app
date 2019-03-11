const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const testAppInfo = require('../..').getRandomSqliteBasedApp();
const testSrvInfo = require('../..').mountAppToSrv(testAppInfo.app, {appPath: '/api'});
testSrvInfo.server.run(() => void 0)

const serverBase = testSrvInfo.serverBase

describe("hook_test", () => {
    after(() => testAppInfo.cleanSqliteDB())

    before(() => {
        testAppInfo.dropModelsSync();

        http.post(serverBase + '/set_session', {
            json: {
                id: 999
            }
        });
    });

    it('hooks: save', () => {
        var rep
        rep = http.post(testSrvInfo.appUrlBase + '/hook_test', {
            json: {
                name: 'test'
            }
        });
        var id = rep.json().id

        rep = http.get(testSrvInfo.appUrlBase + `/hook_test/${id}`);

        check_result(rep.json(), {
            "name": "modified_test",
            id
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
