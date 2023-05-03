const test = require('test');
test.setup();

const { runServer } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
runServer(tSrvInfo.server, () => void 0)

const http = require('http');
const util = require('util');

describe("nographql", () => {
    before(() => {
        tappInfo.utils.dropModelsSync();

        init_data();
    });

    after(() => tappInfo.utils.cleanLocalDB())

    const testData = {
        foo: Date.now(),
        bin: new Buffer(123)
    }
    
    function init_data () {
        var rep = http.post(tSrvInfo.appUrlBase + '/nographql', {
            json: testData
        });

        assert.equal(rep.statusCode, 201);
        assert.property(rep.json(), "id");
    }

    it('error for when graphql-query', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                nographql{
                    foo,
                    bin
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        const response = rep.json()
        assert.property(response, 'errors');
        assert.isArray(response.errors);
        assert.equal(response.errors[0].message, `Cannot query field "nographql" on type "Query".`);
    });

    it('success in rest', () => {
        var rep = http.get(tSrvInfo.appUrlBase + '/nographql');

        const response = rep.json()
        assert.isArray(response)
        const item = response[0]

        assert.property(item, 'id');
        assert.property(item, 'foo');

        if (process.version < '0.36.0') {
            assert.isTrue(util.isBuffer(item.bin)); 
            assert.deepEqual(item.bin, testData.bin)
        } else {
            assert.isTrue(item.bin.type === 'Buffer');
        }
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}