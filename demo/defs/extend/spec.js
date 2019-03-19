const test = require('test');
test.setup();

const util = require('util');
const http = require('http');

const { check_result, cutOffMilliSeconds, cutOffSeconds } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
tSrvInfo.server.run(() => void 0)
const mockData = require('./__test__/mock-data')

describe("extend", () => {
    var ids = [];
    var StoneCity = {
        code: 'ST',
        name: 'Stone City'
    }

    const CHECK_EXCLUDE_FIELDS = [
        'code',
        'createdAt',
        'updatedAt'
    ]

    function init_base () {
        var rep = http.post(tSrvInfo.appUrlBase + '/people', {
            json: mockData.init_people.map(x => {
                x.city = StoneCity
                return x
            })
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

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}`, {
            query: {
                keys: 'wife_id'
            }
        });
        check_result(rep.json(), {
            wife_id: ids[1]
        });

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

    before(() => {
        tappInfo.utils.dropModelsSync();

        init_base();
        init_extend();
    });

    after(() => tappInfo.utils.cleanLocalDB());

    it('get extend', () => {
        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        filterable_extend_query__hasOne: {
            /**
             * `people` only **hasOne** `wife`. That is, as you add 'count=1' and **not realistic** `where` condition in query, 
             * it just return the specified item result. In fact, it equivelent to eget the **only** item
             */
            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
                query: {
                    // useless
                    count: 1,
                    keys: 'name,age',
                    // not realistic
                    where: JSON.stringify({
                        name: {ne: 'alice'}
                    })
                }
            });
            check_result(rep.json(), {
                "name": "alice",
                "age": 32
            });
        }

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife/${ids[1]}`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[2]}/mother`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }, {
            "name": "jack",
            "age": 8
        }]);

        filterable_extend_query__hasMany: {
            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
                query: {
                    count: 1,
                    keys: 'name,age',
                    order: 'age'
                }
            });
            check_result(rep.json(), {
                results: [{
                    "name": "lily",
                    "age": 4
                }, {
                    "name": "jack",
                    "age": 8
                }],
                count: 2
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
                query: {
                    count: 1,
                    keys: 'name,age',
                    order: 'age',
                    // realistic
                    where: JSON.stringify({
                        name: {ne: 'lily'}
                    })
                }
            });
            check_result(rep.json(), {
                results: [{
                    "name": "jack",
                    "age": 8
                }],
                count: 1
            });

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
                query: {
                    count: 1,
                    keys: 'name,age',
                    order: 'age',
                    // realistic
                    where: JSON.stringify({
                        name: {eq: 'lily'}
                    })
                }
            });
            check_result(rep.json(), {
                results: [{
                    "name": "lily",
                    "age": 4
                }],
                count: 1
            });
        }

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[3]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            "name": "lily",
            "age": 4
        });

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[1]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            // "code": 4040602,
            "message": `Object '${ids[1]}' not found in class 'people.childs'.`
        }, CHECK_EXCLUDE_FIELDS);
    });

    it('delete extend', () => {
        var rep = null

        // you can not do unlink-operation(edel) one original model from on reversed model, which in one `hasOne` association
        rep = http.del(tSrvInfo.appUrlBase + `/people/${ids[1]}/husbands/${ids[0]}`)
        assert.equal(rep.statusCode, 404);
        check_result(rep.json(), {
            // "code": 4040603,
            "message": `'husbands' in class 'people' does not support this operation`
        }, CHECK_EXCLUDE_FIELDS)

        rep = http.del(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife/${ids[1]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.del(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[2]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }]);

        var rep = http.put(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            json: {
                id: ids[2]
            }
        });
        assert.equal(rep.statusCode, 200)
    });

    describe('extend - hasMany', () => {
        it('create extend object - hasMany', () => {
            var rep = http.post(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
                json: {
                    name: 'jack_li',
                    sex: "male",
                    age: 8,
                    city: StoneCity
                }
            });
            assert.equal(rep.statusCode, 201);
            ids.push(rep.json().id);

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
                query: {
                    keys: 'name,age'
                }
            });

            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "jack_li",
                "age": 8
            });

            var rep = http.post(tSrvInfo.appUrlBase + `/people/${ids[4]}/childs`, {
                json: [{
                    name: 'jack_li_0',
                    sex: "male",
                    age: 8,
                    city: StoneCity
                }, {
                    name: 'jack_li_1',
                    sex: "male",
                    age: 9,
                    city: StoneCity
                }]
            });
            assert.equal(rep.statusCode, 201);
            rep.json().forEach(r => ids.push(r.id));

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
                query: {
                    keys: 'name,age'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "jack_li",
                "age": 8
            });

            var rep = http.post(tSrvInfo.appUrlBase + `/people/${ids[4]}/wife`, {
                json: {
                    name: 'ly_li',
                    sex: "female",
                    age: 8,
                    city: StoneCity
                }
            });
            assert.equal(rep.statusCode, 201);

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[4]}/wife`, {
                query: {
                    keys: 'name,age'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                name: 'ly_li',
                age: 8
            });
        });

        it('change extend object', () => {
            var rep = http.put(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
                json: {
                    name: 'jack_li',
                    sex: "male",
                    age: 18
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
                query: {
                    keys: 'name,age'
                }
            });
            assert.equal(rep.statusCode, 200);
            check_result(rep.json(), {
                "name": "jack_li",
                "age": 18
            });

            rep = http.del(tSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`);
            assert.equal(rep.statusCode, 200);
        });
    });

    it("multi level create", () => {
        var rep = http.post(tSrvInfo.appUrlBase + '/people', {
            json: [
                {
                    name: 'tom',
                    sex: "male",
                    age: 35,
                    city: StoneCity,
                    wife: {
                        name: 'lily',
                        sex: "female",
                        age: 35,
                        city: StoneCity,
                        childs: [
                            {
                                name: 'coco',
                                sex: "female",
                                age: 12,
                                city: StoneCity
                            }
                        ]
                    }
                }
            ]
        });

        assert.equal(rep.statusCode, 201);
    })

    it("graphql query hasMany-extend with extra", () => {
        function assertInstance(people) {
            assert.property(people, 'id')
            assert.property(people, 'name')
            assert.property(people, 'sex')
            assert.property(people, 'age')
            assert.property(people, 'createdAt')
        }

        var rep = null;
        var base_obj = null, ext_obj = null;

        var getTestData = function () {
            return {
                name: 'tom_with_friend',
                sex: "male",
                age: 35,
                city: StoneCity,
                friends: [
                    {
                        name: 'friend_of_tom',
                        sex: "female",
                        age: 35,
                        city: StoneCity,
                        extra: {
                            hobby: 'train',
                            meeting_time: Date.now()
                        },
                        childs: [
                            {
                                name: 'coco_of_friend_of_tom',
                                sex: "female",
                                age: 12,
                                city: StoneCity,
                            }
                        ]
                    }
                ]
            }
        }

        var doPost = function (testdata) {
            return http.post(tSrvInfo.appUrlBase + '/people', {
                json: [testdata]
            });
        }

        var doPut = function (testdata) {
            testdata.friends[0].id = ext_obj.id
            testdata.friends[0].age = 36
            testdata.friends[0].extra.hobby = 'train2'

            return http.put(tSrvInfo.appUrlBase + `/people/${base_obj.id}/friends/${ext_obj.id}`, {
                json: util.omit(
                    testdata.friends[0],
                    // TODO: should support auto epost here
                    ['city', 'childs']
                )
            });
        }

        var doGraphQlCheck = function (testdata) {
            rep = http.post(tSrvInfo.appUrlBase + '', {
                json: {
                    requests: [
                        {
                            method: 'POST',
                            path: '/',
                            headers: {
                                'Content-Type': 'application/graphql'
                            },
                            body: `{
                                find_people(
                                    where: {
                                        name: "tom_with_friend"
                                    }
                                ){
                                    id
                                    name
                                    sex
                                    age
                                    createdAt
                                    friends(
                                        where: {
                                            name: "friend_of_tom"
                                        }
                                    ){
                                        id
                                        name
                                        sex
                                        age
                                        createdAt
                                        my_friends{
                                            id
                                            name
                                            sex
                                            age
                                            createdAt
                                        }
                                        extra{
                                            hobby
                                            meeting_time
                                        }
                                    }
                                    friends__extra{
                                        id
                                        name
                                        sex
                                        age
                                        createdAt
                                    }
                                    _friends: friends__extra{
                                        id
                                        name
                                        sex
                                        age
                                        createdAt
                                    }
                                }
                            }`
                        }
                    ]
                }
            });

            var response = rep.json();
            assert.property(response[0], 'success');

            var queriedPeople = response[0].success.data.find_people[0];

            base_obj = base_obj || queriedPeople
            assertInstance(queriedPeople)
            assert.property(queriedPeople, 'friends')

            var cur_ext_obj = queriedPeople.friends[0]
            ext_obj = ext_obj || cur_ext_obj
            assertInstance(cur_ext_obj)
            assert.property(cur_ext_obj, 'my_friends')

            /* compare original instance's data with data from reversed instance's reverse accessor */
            assertInstance(cur_ext_obj.my_friends[0])
            Object.keys(cur_ext_obj.my_friends[0]).forEach(key => {
                if (queriedPeople.hasOwnProperty(key))
                    assert.equal(
                        queriedPeople[key],
                        cur_ext_obj.my_friends[0][key]
                    )
            })

            /* check extra data */
            assert.property(cur_ext_obj, 'extra')
            assert.property(cur_ext_obj.extra, 'hobby')
            assert.deepEqual(
                cur_ext_obj.extra.hobby,
                testdata.friends.find(x => x.name === 'friend_of_tom').extra.hobby
            )
            assert.property(cur_ext_obj.extra, 'meeting_time')
            assert.closeTo(
                gettime(cur_ext_obj.extra.meeting_time),
                gettime(testdata.friends.find(x => x.name === 'friend_of_tom').extra.meeting_time),
                1000
            )
            
            assert.property(queriedPeople, 'friends__extra')
            assert.property(queriedPeople, '_friends')
            assert.deepEqual(
                queriedPeople.friends__extra,
                queriedPeople._friends
            )            
            assert.property(cur_ext_obj, 'extra')
        }

        var td1 = getTestData()
        doPost(td1)
        doGraphQlCheck(td1)

        var td2 = getTestData()
        doPut(td2)
        doGraphQlCheck(td2)
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}

function gettime(m) {
    let ms = m

    ms = cutOffMilliSeconds(ms)
    ms = cutOffSeconds(ms)

    return ms
}