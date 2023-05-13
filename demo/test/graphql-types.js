const test = require('test');
test.setup();

// const BigNumber = require('bignumber.js');

const { runServer } = require('../test/_utils');

const tappInfo = require('../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
runServer(tSrvInfo.server, () => void 0)

const http = require('http');

var ids = [];

var testData = {
    binary1: Buffer.from('binary1'),
    binary2: Buffer.from('binary2'),
}

function init_data () {
    // const safeLongValue = new BigNumber('9007199254740991');
    var rep = http.post(tSrvInfo.appUrlBase + '/test_fields_type', {
        json: [
            {
                name1: 'name1',
                name2: 'name2',
                profile: { foo: 'bar' },
                // in real world, according to clients,
                // binary data would be JSON-type, like `{ type: "Buffer", data: [...] }`
                // or Array-type, like `[...]`
                binary1: testData.binary1,
                binary2: testData.binary2,
                point: { x: 51.5177, y: -0.0968 },
                longInSafeNumber: 9007199254740991,
            }
        ]
    });

    rep.json().forEach(r => ids.push(r.id));
}

describe("graphql-types", () => {
    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();
        
        init_data();
    })

    it('get', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                test_fields_type(id:"${ids[0]}"){
                    id,
                    name1
                    name2
                    profile
                    binary1
                    binary2
                    point
                    longInSafeNumber
                }
            }`
        });

        assert.equal(rep.statusCode, 200);

        const result = rep.json();
        assert.deepEqual(result, {
            "data": {
                "test_fields_type": {
                  "id": ids[0],
                  "name1": "name1",
                  "name2": "name2",
                  "profile": { foo: 'bar' },
                  "binary1": testData.binary1.toArray(),
                  "binary2": testData.binary2.toArray(),
                  "point": { x: 51.5177, y: -0.0968 },
                  "longInSafeNumber": 9007199254740991
                }
            }
        });
    });
    
    it('find', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                find_test_fields_type(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                ){
                    id,
                    name1
                    name2
                    profile
                    binary1
                    binary2
                    point
                    longInSafeNumber
                }
            }`
        });

        assert.equal(rep.statusCode, 200);

        const result = rep.json();
        assert.deepEqual(result, {
            "data": {
                "find_test_fields_type": [
                    {
                        "id": ids[0],
                        "name1": "name1",
                        "name2": "name2",
                        "profile": { foo: 'bar' },
                        "binary1": testData.binary1.toArray(),
                        "binary2": testData.binary2.toArray(),
                        "point": { x: 51.5177, y: -0.0968 },
                        "longInSafeNumber": 9007199254740991
                    }
                ]
            }
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
