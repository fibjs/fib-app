const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const testAppInfo = require('../..').getRandomSqliteBasedApp();
const testSrvInfo = require('../..').mountAppToSrv(testAppInfo.app, { appPath: '/api' });
testSrvInfo.server.run(() => void 0)

describe("extend multiple level", () => {
    var top_id;
    var TESTDATA = require('./__test__/mock-data.json');

    function get_uniq_level () {
        var rep = http.get(testSrvInfo.appUrlBase + `/level`, {
            query: {
                where: JSON.stringify({
                    name: 'l1:name'
                })
            }
        });

        var l1 = rep.json()[0];
        return l1;
    }

    after(() => testAppInfo.cleanSqliteDB())

    before(() => {
        var rep = http.post(testSrvInfo.appUrlBase + '/level', {
            json: TESTDATA.l1
        });

        top_id = rep.json().id
    })

    it('find level', () => {
        ;[
            'l1',
            'l1-l2',
            'l1-l2-l3',
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_level(
                        where: {
                            name: "${key}:name"
                        }
                    ){
                        id,
                        name
                    }
                }`
            });
            
            assert.equal(rep.statusCode, 200);
            if (key === 'l1') {
                check_result(rep.json().data.find_level[0], {
                    "id": top_id,
                    "name": `${key}:name`
                })
            } else {
                check_result(rep.json().data.find_level[0], {
                    "name": `${key}:name`
                }, [
                        'createdAt',
                        'updatedAt',
                        'id'
                ]);
            }
        })
    });

    it('find whereExists sublevel with has-many assoc', () => {
        const t = Date.now();
        const all_many_sublevels = [
            {
                "name": "many_sublevels:name"
            },
            {
                "name": "many_sublevels3:name"
            },
            {
                "name": "many_sublevels2:name"
            }
        ];
        
        ;[
            [
                `many_sublevels_id: { ne: ${t} }`,
                { name: `l1:name`, },
                all_many_sublevels
            ],
            [
                `many_sublevels_id: "${t}"`,
                undefined,
                []
            ]
        ].forEach(([on_cond, l1_result, results]) => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_level(
                        findby: {
                            extend: "many_sublevels",
                            on: {
                                ${on_cond}
                            }
                        }
                    ){
                        id,
                        name,
                        many_sublevels(
                            order: "-name"
                        ){
                            id,name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            
            if (!l1_result) {
                assert.equal(
                    rep.json().data.find_level[0],
                    l1_result
                )
                return ;
            }

            check_result(
                rep.json().data.find_level[0],
                l1_result,
                [
                    'createdAt',
                    'updatedAt',
                    'id',
                    'many_sublevels'
                ]
            )
            
            check_result(
                rep.json().data.find_level[0].many_sublevels.map(x => ({ name: x.name })),
                // results is order by '-name'
                results
            );
        });
    });

    function assert_found_level_with_one_l2 (rep, fetcher) {
        check_result(
            fetcher(rep)[0],
            {
                name: `l1:name`,
            },
            [
                'createdAt',
                'updatedAt',
                'id',
                'one_l2'
            ]
        );
        assert.equal(fetcher(rep).length, 1);

        check_result(
            fetcher(rep)[0].one_l2,
            {
                "name": "l1-l2:name"
            }
        );
    }
    
    it('find by level with has-one self assoc', () => {
        ;[
            null
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_level(
                        findby: {
                            extend: "one_l2",
                            where: {
                                name: "l1-l2:name"
                            }
                        }
                    ){
                        id,
                        name,
                        one_l2{
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);

            assert_found_level_with_one_l2(rep, rep => rep.json().data.find_level);
        });
    });

    it('paging find by level with has-one self assoc', () => {
        ;[
            null
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    paging_level(
                        findby: {
                            extend: "one_l2",
                            where: {
                                name: "l1-l2:name"
                            }
                        }
                    ){
                        results{
                            id,
                            name,
                            one_l2{
                                name
                            }
                        }
                        count
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);

            assert_found_level_with_one_l2(rep, rep => rep.json().data.paging_level.results);
            assert.equal(rep.json().data.paging_level.count, 1);
        });
    });

    function assert_found_level_with_sublevel (rep, fetcher) {
        check_result(
            fetcher(rep)[0],
            {
                name: `l1:name`,
            },
            [
                'createdAt',
                'updatedAt',
                'id',
                'one_sl'
            ]
        );
        assert.equal(fetcher(rep).length, 1);

        check_result(
            fetcher(rep)[0].one_sl,
            {
                "name": "l1-sl:name"
            }
        );
    }
    it('find by sublevel with has-one assoc', () => {
        ;[
            null
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_level(
                        findby: {
                            extend: "one_sl",
                            where: {
                                name: "l1-sl:name"
                            }
                        }
                    ){
                        id,
                        name,
                        one_sl{
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert_found_level_with_sublevel(rep, rep => rep.json().data.find_level);
        });
    });

    it('paging find by sublevel with has-one assoc', () => {
        ;[
            null
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    paging_level(
                        findby: {
                            extend: "one_sl",
                            where: {
                                name: "l1-sl:name"
                            }
                        }
                    ){
                        results{
                            id,
                            name,
                            one_sl{
                                name
                            }
                        }
                        count
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert_found_level_with_sublevel(rep, rep => rep.json().data.paging_level.results);
            assert.equal(rep.json().data.paging_level.count, 1);
        });
    });

    it('find sublevel', () => {
        ;[
            'l1-sl',
            'l1-sl-subl',
        ].forEach(key => {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_sub_level(
                        where: {
                            name: "${key}:name"
                        }
                    ){
                        id,
                        name
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            check_result(rep.json().data.find_sub_level[0], 
                {
                    "name": `${key}:name`
                },
                [
                    'createdAt',
                    'updatedAt',
                    'id'
                ]
            );
        });
    });

    describe('extendsTo association', () => {
        let add_count = 0;
        function count_increament () {
            return TESTDATA.l1.lproperty.weight + (++add_count)
        }
        function cur_weight () {
            return TESTDATA.l1.lproperty.weight + add_count
        }

        function get_uniq_extendsTo_property () {
            var rep = http.get(testSrvInfo.appUrlBase + `/level/${top_id}/lproperty`, {
                query: {}
            });

            assert.equal(rep.statusCode, 200);
            return rep.json()
        }

        function get_uniq_extendsTo_property_by_gql () {
            var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    find_level(
                        where: {
                            name: "l1:name"
                        }
                    ){
                        id,
                        name,
                        lproperty{
                            name
                            weight
                        }
                    }
                }`
            });

            return rep.json()
        }

        function assert_uniq_extendsTo_property (l1_lproperty) {
            assert.equal(l1_lproperty.name, "l1:level_property-name")
            assert.equal(l1_lproperty.weight, 987654321 + add_count)
        }

        it(`created level_lproperty`, () => {
            var l1_lproperty = get_uniq_extendsTo_property()
            assert_uniq_extendsTo_property(l1_lproperty)

            var l1_lproperty = get_uniq_extendsTo_property_by_gql().data.find_level[0].lproperty
            assert_uniq_extendsTo_property(l1_lproperty)
        })

        it(`find/get, update level's level_lproperty`, () => {
            ;[
                null
            ].forEach(key => {
                var rep = http.put(testSrvInfo.appUrlBase + `/level/${top_id}/lproperty`, {
                    query: {},
                    json: {
                        weight: count_increament()
                    }
                });

                assert.equal(rep.statusCode, 200);
                assert.property(rep.json(), 'id');
                assert.property(rep.json(), 'updatedAt');
            });
        })

        it(`return null after level's level_lproperty removed, then recreate it`, () => {
            var l1_lproperty = get_uniq_extendsTo_property();
            assert_uniq_extendsTo_property(l1_lproperty);

            remove_it: {
                var rep = http.del(testSrvInfo.appUrlBase + `/level/${top_id}/lproperty/${l1_lproperty.id}`, {
                    query: {},
                    body: {}
                });

                assert.equal(rep.statusCode, 200);
                assert.property(rep.json(), 'id');
                assert.property(rep.json(), 'updatedAt');

                var l1_lproperty = get_uniq_extendsTo_property();
                assert.equal(l1_lproperty, null)


                var l1_lproperty = get_uniq_extendsTo_property_by_gql().data.find_level[0].lproperty
                assert.equal(l1_lproperty, null)
            }

            recreate: {
                var rep = http.post(testSrvInfo.appUrlBase + `/level/${top_id}/lproperty`, {
                    query: {},
                    json: {
                        ...TESTDATA.l1.lproperty,
                        weight: count_increament(),
                    }
                });

                assert.equal(rep.statusCode, 201);
                assert.property(rep.json(), 'id');
                assert.property(rep.json(), 'createdAt');

                var l1_lproperty = get_uniq_extendsTo_property();
                assert_uniq_extendsTo_property(l1_lproperty);

                var l1_lproperty = get_uniq_extendsTo_property_by_gql().data.find_level[0].lproperty
                assert_uniq_extendsTo_property(l1_lproperty);
            }
        });

        it('Host findby extend field', () => {
            ;[
                [
                    {
                        extend: "lproperty",
                        where: {
                            weight: {
                                eq: cur_weight()
                            }
                        }
                    },
                    1
                ],
                [
                    {
                        extend: "lproperty",
                        where: {
                            weight: {
                                ne: cur_weight()
                            }
                        }
                    },
                    /**
                     * there are more than 1 'level' items, but ONLY 1 has its `lproperty`,
                     * when I `findby` by lproperty with SQL, the pre-requisite contains that
                     * `level must has its own lproperty`. So there is 0
                     */
                    0
                ],
                [
                    `
                    {
                        find_level(
                            findby: {
                                extend: "lproperty",
                                where: {
                                    weight: {
                                        eq: ${cur_weight()}
                                    }
                                }
                            }
                        ){
                            id
                            lproperty{
                                name
                                weight
                            }
                        }
                    }
                    `,
                    1,
                    rep => rep.json().data.find_level
                ],
                [
                    `
                    {
                        paging_level(
                            findby: {
                                extend: "lproperty",
                                where: {
                                    weight: {
                                        eq: ${cur_weight()}
                                    }
                                }
                            }
                        ){
                            results {
                                id
                                lproperty{
                                    name
                                    weight
                                }
                            }
                            count
                        }
                    }
                    `,
                    1,
                    rep => ({length: rep.json().data.paging_level.count})
                ]
            ].forEach(([cond, item_count, data_fetcher]) => {
                if (typeof cond === 'object') {
                    var rep = http.get(testSrvInfo.appUrlBase + `/level`, {
                        query: {
                            findby: JSON.stringify(cond)
                        }
                    });

                    assert.equal(rep.statusCode, 200);
                    assert.equal(rep.json().length, item_count);
                    return ;
                }
                
                var rep = http.post(testSrvInfo.appUrlBase + `/`, {
                    headers: {
                        'Content-Type': 'application/graphql'
                    },
                    body: cond
                });

                assert.equal(rep.statusCode, 200);
                assert.equal(data_fetcher(rep).length, item_count);
            });
        })
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}

function gettime(m) {
    return (new Date(m)).getTime()
}