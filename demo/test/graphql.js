const test = require('test');
test.setup();

const { runServer } = require('../test/_utils');

const tappInfo = require('../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
runServer(tSrvInfo.server, () => void 0)

const http = require('http');

var ids = [];
var TreeCity = {
    code: 'ST',
    name: 'Tree City'
}

function init_data () {
    var rep = http.post(tSrvInfo.appUrlBase + '/people', {
        json: [
            {
                name: 'tom',
                sex: "male",
                age: 35,
                city: TreeCity
            }, {
                name: 'alice',
                sex: "female",
                age: 32,
                city: TreeCity
            }, {
                name: 'jack',
                sex: "male",
                age: 8,
                city: TreeCity
            }, {
                name: 'lily',
                sex: "female",
                age: 4,
                city: TreeCity
            },
            {
                name: 'mike',
                sex: "male",
                age: 65,
                city: TreeCity
            }
        ]
    });

    rep.json().forEach(r => ids.push(r.id));
}

function init_extend () {
    var rep = http.put(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
        json: {
            id: ids[1]
        }
    });
    assert.equal(rep.statusCode, 200)

    var rep = http.put(tSrvInfo.appUrlBase + `/people/${ids[0]}/father`, {
        json: {
            id: ids[4]
        }
    });
    assert.equal(rep.statusCode, 200)

    var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}`, {
        query: {
            keys: 'wife_id'
        }
    });
    assert.equal(rep.statusCode, 200)

    var rep = http.put(tSrvInfo.appUrlBase + `/people/${ids[1]}/husband`, {
        json: {
            id: ids[0]
        }
    });
    assert.equal(rep.statusCode, 200)

    function set_parents(id) {
        var rep = http.put(tSrvInfo.appUrlBase + `/people/${id}/father`, {
            json: {
                id: ids[0]
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.put(tSrvInfo.appUrlBase + `/people/${id}/mother`, {
            json: {
                id: ids[1]
            }
        });
        assert.equal(rep.statusCode, 200)
    }

    set_parents(ids[2]);
    set_parents(ids[3]);

    function add_childs(id) {
        var rep = http.put(tSrvInfo.appUrlBase + `/people/${id}/childs`, {
            json: {
                id: ids[2]
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.put(tSrvInfo.appUrlBase + `/people/${id}/childs`, {
            json: {
                id: ids[3]
            }
        });
        assert.equal(rep.statusCode, 200)
    }

    add_childs(ids[0]);
    add_childs(ids[1]);
}

describe("graphql", () => {
    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();
        
        init_data();
        init_extend();
    })

    it('simple', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[0]}"){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "id": ids[0],
                    "name": "tom"
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
                find_people(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                ){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "find_people": [{
                    "id": ids[0],
                    "name": "tom"
                }]
            }
        });
    });

    it('count', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                count_people(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                )
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "count_people": 1
            }
        });
    });

    it('paging', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                paging_people(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                ){
                    results{
                        id
                        name
                    }
                    count
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "paging_people": {
                    results: [{
                        "id": ids[0],
                        "name": "tom"
                    }],
                    count: 1
                }
            }
        });
    });
    
    it('paging cannot set query conditions in subfields', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                paging_people(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                ){
                    results(
                        where:{
                            id: {
                                eq: "${ids[0]}"
                            }
                        }
                    ){
                        id
                        name
                    }
                    count
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.property(rep.json(), 'errors');
        assert.greaterThan(rep.json().errors.length, 0);
    });

    describe('featured graphql quering', () => {
        it('explicit and named query', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `query PagingPeople{
                    paging_people(
                        where:{
                            id: {
                                eq: "${ids[0]}"
                            }
                        }
                    ){
                        results{
                            id
                            name
                        }
                        count
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "paging_people": {
                        results: [{
                            "id": ids[0],
                            "name": "tom"
                        }],
                        count: 1
                    }
                }
            });
        })

        it('alias', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `query PagingPeople{
                    paging_people(
                        where:{
                            id: {
                                eq: "${ids[0]}"
                            }
                        }
                    ){
                        list: results{
                            id
                            name
                        }
                        number: count
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "paging_people": {
                        list: [{
                            "id": ids[0],
                            "name": "tom"
                        }],
                        number: 1
                    }
                }
            });
        })
        
        xit('mutations', () => undefined)
    })

    describe('hasOne', () => {
        it('basic', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[2]}"){
                        id,
                        name,
                        mother{
                            id,
                            name,
                            husband{
                                id,
                                name
                            }
                        }
                    }
                }`
            });
    
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[2],
                        "name": "jack",
                        "mother": {
                            "id": ids[1],
                            "name": "alice",
                            "husband": {
                                "id": ids[0],
                                "name": "tom"
                            }
                        }
                    }
                }
            });
        });
    
        it('hasOne with null', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        father{
                            id,
                            name
                        },
                        mother{
                            id,
                            name
                        }
                    }
                }`
            });
    
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                  "people": {
                    "id": ids[0],
                    "name": "tom",
                    "father": {
                      "id": ids[4],
                      "name": "mike"
                    },
                    "mother": null
                  }
                }
              });
        });
    });

    describe('hasMany', () => {
        it('simple', () => {
            var childs = [{
                    "id": ids[2],
                    "name": "jack",
                    "mother": {
                        "id": ids[1],
                        "name": "alice"
                    }
                },
                {
                    "id": ids[3],
                    "name": "lily",
                    "mother": {
                        "id": ids[1],
                        "name": "alice"
                    }
                }
            ]

            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs{
                            id,
                            name,
                            mother{
                                id,
                                name
                            }
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": childs
                    }
                }
            });

            // paging
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        paging_childs{
                            results{
                                id,
                                name,
                                mother{
                                    id,
                                    name
                                }
                            }
                            count
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "paging_childs": {
                            results: childs,
                            count: 2
                        }
                    }
                }
            });
        });

        it('where', () => {
            var childs = [{
                "id": ids[3],
                "name": "lily"
            }];

            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(
                            where:{
                                name: {
                                    eq: "lily"
                                }
                            }
                        ){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": childs
                    }
                }
            });

            // paging
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        paging_childs(
                            where:{
                                name: {
                                    eq: "lily"
                                }
                            }
                        ){
                            results{
                                id,
                                name
                            }
                            count
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "paging_childs": {
                            results: childs,
                            count: 1
                        }
                    }
                }
            });
        });

        it('skip', () => {
            var childs = [{
                "id": ids[3],
                "name": "lily"
            }];

            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(skip:1){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": childs
                    }
                }
            });

            // paging
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        paging_childs(skip:1){
                            results{
                                id,
                                name
                            }
                            count
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "paging_childs": {
                            "results": childs,
                            "count": 2
                        }
                    }
                }
            });
        });

        it('limit', () => {
            var childs = [{
                "id": ids[2],
                "name": "jack"
            }];

            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(limit:1){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": childs
                    }
                }
            });

            // paging
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        paging_childs(limit:1){
                            results{
                                id,
                                name
                            }
                            count
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "paging_childs": {
                            "results": childs,
                            "count": 2
                        }
                    }
                }
            });
        });

        it('order', () => {
            var childs = [{
                    "id": ids[2],
                    "name": "jack"
                },
                {
                    "id": ids[3],
                    "name": "lily"
                }
            ];
            
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(order:"name"){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": childs
                    }
                }
            });
            
            // paging
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        paging_childs(order:"name"){
                            results{
                                id,
                                name
                            }
                            count
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "paging_childs": {
                            "results": childs,
                            "count": 2
                        }
                    }
                }
            });
        });
    });

    it("error", () => {
        http.post(tSrvInfo.serverBase + '/set_session', {
            json: {
                id: 12345
            }
        });
    
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                test_acl(id:"${ids[0]}"){
                    id,
                    name,
                    ext{
                        id,
                        name
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 404);
        assert.equal(rep.json().errors[0].code, 4040002);
        assert.equal(rep.json().errors[0].message, `Object '${ids[0]}' not found in class 'test_acl'.`);
    });

    it('acl field error', () => {
        http.post(tSrvInfo.serverBase + '/set_session', {
            json: {
                id: 123457,
                roles: ['test']
            }
        });

        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[2]}"){
                    name,
                    mother{
                        name
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "name": "jack",
                    "mother": {
                        "name": "alice"
                    }
                }
            }
        });
    });

    it('json data', () => {
        var rep = http.post(tSrvInfo.appUrlBase + '/json', {
            json: {
                name: 'tom',
                profile: {
                    a: 100,
                    b: 200
                }
            }
        });

        var id = rep.json().id;

        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                json(id:"${id}"){
                    name,
                    profile,
                    createdAt
                }
            }`
        });

        let r = rep.json();
        assert.equal(r.data.json.createdAt.toString().slice(-1), "Z");
        if (tappInfo.protocol === 'sqlite')
            assert.notEqual(new Date(r.data.json.createdAt).getTime() % 1000, 0);
        delete r.data.json.createdAt;
        assert.deepEqual(r, {
            "data": {
                "json": {
                    "name": "tom",
                    "profile": {
                        "a": 100,
                        "b": 200
                    }
                }
            }
        });
    });

    it('in batch request: rest/graphql', () => {
        var testName = 'GeziFighter' + Date.now()
        var rep = http.post(tSrvInfo.appUrlBase + '', {
            json: {
                requests: [
                    {
                        method: 'POST',
                        path: '/json',
                        body: {
                            name: testName,
                            profile: {
                                a: 100,
                                b: 200
                            }
                        } 
                    },
                    {
                        method: 'POST',
                        path: '/',
                        headers: {
                            'Content-Type': 'application/graphql'
                        },
                        body: `{
                            find_json(
                                where: {
                                    name:"${testName}"
                                }
                            ){
                                id,
                                name,
                                profile,
                                createdAt
                            }
                        }`
                    }
                ]
            }
        });

        var response = rep.json();
        assert.property(response[0], 'success');
        assert.property(response[1], 'success');
        var createR = response[0].success;
        assert.property(response[1].success, 'data');
        assert.property(response[1].success.data, 'find_json');

        var queryR = response[1].success.data.find_json[0];

        assert.equal(createR.id, queryR.id)

        assert.equal(queryR.createdAt.toString().slice(-1), "Z");
        if (tappInfo.protocol === 'sqlite')
            assert.notEqual(new Date(queryR.createdAt).getTime() % 1000, 0);
        delete queryR.createdAt;

        assert.deepEqual(queryR, {
            "id": createR.id,
            "name": testName,
            "profile": {
                "a": 100,
                "b": 200
            }
        });
    });

    describe('virtual view', () => {
        it('people_relations_statics', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people_relations_statics: find_people_relations_statics(
                        order: "people_id"
                        limit: 1000
                    ){
                        people_id,
                        childs_count
                    }
                }`
            });
    
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people_relations_statics": [
                        {
                            "people_id": ids[0],
                            "childs_count": 2
                        },
                        {
                            "people_id": ids[1],
                            "childs_count": 2
                        }
                    ]
                }
            });
        });

        it('where', () => {
            var rep = http.post(tSrvInfo.appUrlBase + ``, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people_relations_statics: find_people_relations_statics(
                        order: "people_id"
                        limit: 1000
                        where: {
                            people_id: "${ids[0]}"
                        }
                    ){
                        people_id,
                        childs_count
                    }
                }`
            });
    
            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people_relations_statics": [
                        {
                            "people_id": ids[0],
                            "childs_count": 2
                        }
                    ]
                }
            });
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
