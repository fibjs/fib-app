const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
tSrvInfo.server.run(() => void 0)

const serverBase = tSrvInfo.serverBase

describe("hook_test", () => {
    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();

        http.post(serverBase + '/set_session', {
            json: {
                id: 999
            }
        });
    });

    it('hooks: save', () => {
        var rep
        rep = http.post(tSrvInfo.appUrlBase + '/hook_test', {
            json: {
                name: 'test'
            }
        });
        var id = rep.json().id

        rep = http.get(tSrvInfo.appUrlBase + `/hook_test/${id}`);

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
