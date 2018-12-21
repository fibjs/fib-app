const test = require('test');
test.setup();

const { serverBase } = require('..');
const { check_result } = require('./_utils');

const { app, cleanSqliteDB } = require('..').getRandomSqliteBasedApp();
const faker = require('../faker');

describe('app apis', () => {
    let postData = null
    let findCondition = null
    let getId = null
    let putData = null

    const reqInfo = {
        session: {
            id: Date.now(),
            roles: ['admin']
        },
        query: {}
    }

    before(() => {
        postData = {
            name: faker.name.findName(),
            sex: 'female',
            age: 17
        }

        putData = {
            age: 16
        }
    })
    
    after(() => cleanSqliteDB());

    it('util: app.dbPool', () => {
        assert.isFunction(app.db)
        assert.isFunction(app.dbPool)
    })

    it('util: app.filterRequest', () => {
        assert.isFunction(app.filterRequest)
    })

    it('util: app.diagram', () => {
        assert.isFunction(app.diagram)
    })

    it('util: app.api', () => {
        assert.isObject(app.api)

        assert.isFunction(app.api.get)
        assert.isFunction(app.api.find)
        assert.isFunction(app.api.post)
        assert.isFunction(app.api.put)
        assert.isFunction(app.api.del)

        assert.isFunction(app.api.eget)
        assert.isFunction(app.api.efind)
        assert.isFunction(app.api.epost)
        assert.isFunction(app.api.eput)
        assert.isFunction(app.api.edel)
        assert.isFunction(app.api.elink)
    })

    it('util: app.api.post', () => {
        app.dbPool(db => {
            const postResult = app.api.post(
                reqInfo,
                db, db.models.person,
                postData
            )

            app.test.internalApiResultAssert.ok(postResult)
            
            check_result({id: postResult.success.id}, {id: postData.id})

            getId = postData.id
            findCondition = {
                id: getId
            }
        })
    })

    it('util: app.api.get', () => {
        app.dbPool(db => {
            const getResult = app.api.get(
                reqInfo,
                db, db.models.person,
                getId
            )

            app.test.internalApiResultAssert.ok(getResult)

            const { success: gotItem } = getResult || {}
            check_result(gotItem, postData)
        })
    })

    it('util: app.api.find', () => {
        app.dbPool(db => {
            const findResult = app.api.find(
                {
                    ...reqInfo,
                    query: {
                        where: findCondition
                    }
                },
                db, db.models.person,
            )

            app.test.internalApiResultAssert.ok(findResult)

            const [ foundItem ] = findResult.success || []
            check_result(foundItem, postData)
        })
    })

    it('util: app.api.put', () => {
        app.dbPool(db => {
            const putResult = app.api.put(
                reqInfo,
                db, db.models.person,
                getId,
                putData
            )

            app.test.internalApiResultAssert.ok(putResult)

            const { success: putItem } = putResult || {}
            check_result({id: putItem.id}, {id: postData.id})
        })
    })

    it('util: app.api.del', () => {
        app.dbPool(db => {
            const delResult = app.api.del(
                reqInfo,
                db, db.models.person,
                getId
            )

            app.test.internalApiResultAssert.ok(delResult)

            const { success: delItem } = delResult || {}
            check_result({id: delItem.id}, {id: postData.id})
        })
    })

    it('util: app.test.getRestClient', () => {
        assert.isFunction(app.test.getRestClient)

        const restClient = app.test.getRestClient({
            serverBase: serverBase,
            modelName: 'person'
        })

        assert.isFunction(restClient.create)
        assert.isFunction(restClient.get)
        assert.isFunction(restClient.getByGraphQL)
        assert.isFunction(restClient.find)
        assert.isFunction(restClient.findByGraphQL)
        assert.isFunction(restClient.update)
        assert.isFunction(restClient.delete)

        assert.isFunction(restClient.link)
        assert.isFunction(restClient.unlink)
    })

    it('util: app.utils', () => {
        assert.isObject(app.utils)

        assert.isFunction(app.utils.transform_fieldslist_2_graphql_inner_string)
        
        assert.isBoolean(app.utils.isDebug)
        assert.equal(app.utils.isDebug, !!process.env.FIBAPP_DEBUG)
    })
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
