const test = require('test');
test.setup();

const { check_result, runServer } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});

runServer(tSrvInfo.server, () => void 0)

const faker = require('../../faker')

const restClients = {
    test_acl: tappInfo.app.test.getRestClient({
        httpClient: tSrvInfo.httpClient, appUrlBase: tSrvInfo.appUrlBase, modelName: 'test_acl'
    }),
    ext_acl: tappInfo.app.test.getRestClient({
        httpClient: tSrvInfo.httpClient, appUrlBase: tSrvInfo.appUrlBase, modelName: 'ext_acl'
    }),
    ext_acl1: tappInfo.app.test.getRestClient({
        httpClient: tSrvInfo.httpClient, appUrlBase: tSrvInfo.appUrlBase, modelName: 'ext_acl1'
    }),
}

const sessionAs = tSrvInfo.utils.sessionAs

describe('defs: acl', () => {
    before(() => {
        tappInfo.utils.dropModelsSync()
    })
    
    after(() => tappInfo.utils.cleanLocalDB())

    describe('base:, role as admin', () => {
        before(() => sessionAs({ id: 12345, roles: ['admin'] }))
        after(() => sessionAs())

        let postData = null
        const postDataList = Array.apply(null, {length: 100}).map((_, index) => {
            const data = {
                name: faker.name.findName(),
                age: 12,
                sex: 'female'
            }

            if (!postData)
                postData = data

            return data
        })
        let expectedData = {id: null, ext1_id: null, ...postData}

        it('create', () => {
            expectedData.id = restClients.test_acl.create(postData)
        });

        it('batch creating', () => {
            restClients.test_acl.create(postDataList)
        });

        it('get', () => {
            const getResult = restClients.test_acl.get(expectedData.id)

            check_result(getResult, expectedData)
        });

        it('getByGraphQL', () => {
            const getResult = restClients.test_acl.getByGraphQL(expectedData.id, [
                'name',
                'age',
                'sex'
            ])

            check_result(getResult, {id: expectedData.id, ...postData})
        });

        it('find', () => {
            const findResult = restClients.test_acl.find({
                id: expectedData.id
            })

            check_result(findResult, [expectedData])
        });

        describe('findByGraphQL', () => {
            it('default', () => {
                const findResult = restClients.test_acl.findByGraphQL({
                    id: expectedData.id
                }, [
                    'name',
                    'age',
                    'sex'
                ])

                check_result(findResult[0], {id: expectedData.id, ...postData})
            })

            it('limit: 10', () => {
                const findResult = restClients.test_acl.findByGraphQL({
                }, [
                    'name',
                    'age',
                    'sex'
                ], {
                    limit: 10
                })

                assert.equal(findResult.length, 10)
                check_result(findResult[0], {id: expectedData.id, ...postData})
            })

            it('limit: 1', () => {
                const findResult = restClients.test_acl.findByGraphQL({
                }, [
                    'name',
                    'age',
                    'sex'
                ], {
                    limit: 1
                })

                assert.equal(findResult.length, 1)
                check_result(findResult[0], {id: expectedData.id, ...postData})
            })
        })
    })

    function testAllowed () {
        const postBaseData = {
            name: faker.name.findName(),
            age: 12,
            sex: 'female'
        }
        let gotId = null

        it('create', () => {
            gotId = restClients.test_acl.create(postBaseData)
        });

        const postHasOneExtData = {
            name: faker.name.findName(),
            age: 12,
        }
        let hasOneExtId = null
        it('create extend[hasOne]', () => {
            hasOneExtId = restClients.ext_acl1.create(postHasOneExtData)
            const res = restClients.test_acl.link(gotId, 'ext1', hasOneExtId)

            assert.equal(res.id, gotId)
        });

        const postHasManyExtData = {
            name: faker.name.findName(),
            age: 12,
        }
        let hasManyExtId = null
        it('create extend[hasMany]', () => {
            hasManyExtId = restClients.ext_acl.create(postHasManyExtData)
            const res = restClients.test_acl.link(gotId, 'ext', hasManyExtId)

            assert.notEqual(res.id, hasManyExtId)
        });

        it('find extend[hasOne]', () => {
            sessionAs({ id: 54321 })
            restClients.test_acl.findExt(gotId, 'ext1')
        });

        it('find extend[hasMany]', () => {
            sessionAs({ id: 54321 })
            restClients.test_acl.findExt(gotId, 'ext')
        });
    }

    describe('extend:ext, role as admin, then user-id as 54321', () => {
        before(() => sessionAs({ id: 12345, roles: ['admin'] }));
        after(() => sessionAs());

        testAllowed();
    })
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
