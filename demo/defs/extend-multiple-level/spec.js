const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, { appPath: '/api' });
tSrvInfo.server.run(() => void 0)

describe("extend multiple level", () => {
    var l1_id;
    var l1a_id;
    var TESTDATA = require('./__test__/mock-data.json');

    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();

        var rep = http.post(tSrvInfo.appUrlBase + '/level', {
            json: TESTDATA
        });
        
        assert.equal(rep.statusCode, 201)
        l1_id = rep.json()[0].id
        l1a_id = rep.json()[1].id
    });

    it('find level', () => {
        ;[
            'l1',
            'l1-l2',
            'l1-l2-l3',

            'l1a',
        ].forEach(key => {
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
            switch (key) {
                case 'l1':
                    check_result(rep.json().data.find_level[0], {
                        "id": l1_id,
                        "name": `${key}:name`
                    })
                    break
                case 'l1a':
                    check_result(rep.json().data.find_level[0], {
                        "id": l1a_id,
                        "name": `${key}:name`
                    })
                    break
                default:
                    check_result(rep.json().data.find_level[0], {
                        "name": `${key}:name`
                    }, [
                        'createdAt',
                        'updatedAt',
                        'id'
                    ]);
                    break
            }
        })
    });

    it('findby with non-existing extend', () => {
        var rep = http.post(tSrvInfo.appUrlBase + `/`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                find_level(
                    findby: {
                        extend: "non_existed_extend",
                        where: {
                            name: "l1-l2:name"
                        }
                    }
                ){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);

        assert.equal(
            rep.json().errors[0].message,
            "invalid association symbol 'non_existed_extend' for model 'level'"
        )
    });

    describe('find where/whereExists/join_where sublevel with has-many assoc', () => {
        const t = Date.now();
        const l1_many_sublevels = TESTDATA[0].many_sublevels;
        const l1a_many_sublevels = TESTDATA[1].many_sublevels;
        
        ;[
            [
                'only findby in association, use `ne`',
                {
                    l1args: '',
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``,
                    // debug_only: true
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'only findby in association, use `eq`',
                {
                    l1args: '',
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: "${t}" }
                    `,
                    extra_cond: ``
                },
                [
                    undefined
                ]
            ],
            [
                'only findby in association, invalid Date arg',
                {
                    l1args: '',
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { since: { eq: "${t}" } }
                    `,
                    extra_cond: ``
                },
                [
                    undefined
                ]
            ],
            [
                'only findby in association, valid Date arg',
                {
                    l1args: '',
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: {
                            since: {
                                lte: "${l1_many_sublevels[0].extra.since}"
                                modifiers: {
                                    is_date: true
                                }
                            }
                        }
                    `,
                    extra_cond: ``,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'l1 where, findby in association - 1',
                {
                    l1args: `where: { id: { eq: ${t} } }`,
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``,
                },
                [
                    undefined,
                ]
            ],
            [
                'l1 where, findby in association - 2',
                {
                    l1args: `where: { level_f: { eq: "non-exist-level_f-value" } }`,
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``
                },
                [
                    undefined,
                ]
            ],
            [
                'l1 where, findby in association - 3',
                {
                    l1args: `where: { level_f: "l1:level_f" }`,
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'l1 where, findby in association - 4',
                {
                    l1args: `where: { level_f: "l1:level_f" }`,
                    l1_findby_kv: `
                        extend: "one_l2"
                        where: { name: { eq: "l1-l2:name" } }
                    `,
                    extra_cond: ``,
                    // debug_only: true,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'l1 where, findby in association - 5',
                {
                    l1args: `where: { level_f: "l1:level_f" }`,
                    l1_findby_kv: `
                        extend: "one_l2"
                        where: { name: { eq: "non-exist--one_l2-value" } }
                    `,
                    extra_cond: ``,
                    // debug_only: true,
                },
                [
                    undefined,
                ]
            ],
            [
                'l1 where, findby in l1 association, l2 where',
                {
                    l1args: `where: { level_f: "l1:level_f" }`,
                    l1_findby_kv: `
                        extend: "one_l2"
                        where: { name: { eq: "l1-l2:name" } }
                    `,
                    l2args: `where: { name: { ne: "${l1_many_sublevels[1].name}" } }`,
                    extra_cond: ``,
                    // debug_only: true,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels.filter( x => x !== l1_many_sublevels[1])
                ]
            ],
            [
                'l1 where with multiple conditions, findby in association',
                {
                    l1args: `where: { id: { ne: ${t} }, name: "l1:name" }`,
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'l1 where with multiple conditions using `like`, findby in association',
                {
                    l1args: `where: { name: { like: "%:name%" } }`,
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: { many_sublevels_id: { ne: ${t} } }
                    `,
                    extra_cond: ``,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'findby in l1 association, join_where for l2 extra fields',
                {
                    l1args: '',
                    l1_findby_kv: `
                        extend: "many_sublevels"
                        on: {
                            since: {
                                eq: "${l1_many_sublevels[0].extra.since}"
                                modifiers: {
                                    is_date: true
                                }
                            }
                        }
                    `,
                    extra_cond: `join_where: {
                        since: {
                            eq: "${l1_many_sublevels[0].extra.since}"
                            modifiers: {
                                is_date: true
                            }
                        }
                    }`,
                },
                [
                    { name: `l1:name` },
                    [l1_many_sublevels[0]]
                ]
            ],
            [
                'get l2 by l1 --- [1]',
                {
                    l1args: `
                        where: {
                            name: "l1:name"
                        }
                    `,
                    l2args: ``,
                    extra_cond: ``,
                },
                [
                    { name: `l1:name` },
                    l1_many_sublevels
                ]
            ],
            [
                'get l2 by l1 --- [2]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: ``,
                    extra_cond: ``,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    l1a_many_sublevels
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2 --- [1]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1_many_sublevels[2].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: ``,
                },
                [
                    { name: `l1a:name` },
                    []
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2 --- [2]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1a_many_sublevels[2].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: ``,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    [ l1a_many_sublevels[2] ]
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2, where in l2 --- [3]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        where: {
                            name: "${l1a_many_sublevels[2].name}"
                        }
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1a_many_sublevels[2].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: ``,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    [ l1a_many_sublevels[2] ]
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2, join_where in l2 --- [4]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1a_many_sublevels[2].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: `
                        join_where: {
                            since: {
                                ne: "${l1a_many_sublevels[2].extra.since}"
                                modifiers: {
                                    is_date: true
                                }
                            }
                        }
                    `,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    []
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2, join_where in l2 ---  [5]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1a_many_sublevels[2].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: `
                        join_where: {
                            since: {
                                eq: "${l1a_many_sublevels[2].extra.since}"
                                modifiers: {
                                    is_date: true
                                }
                            }
                        }
                    `,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    [ l1a_many_sublevels[2] ]
                ]
            ],
            [
                'get l2 by l1, findby l3 in l2, where & join_where in l2 --- [6]',
                {
                    l1args: `
                        where: {
                            name: "l1a:name"
                        }
                    `,
                    l2args: `
                        where: {
                            name: {
                                like: "%${l1a_many_sublevels[1].name}%"
                            }
                        }
                        findby: {
                            extend: "subl_one_descendant_level"
                            where: {
                                name: "${l1a_many_sublevels[1].subl_one_descendant_level.name}"
                            }
                        }
                    `,
                    extra_cond: `
                        join_where: {
                            since: {
                                eq: "${l1a_many_sublevels[1].extra.since}"
                                modifiers: {
                                    is_date: true
                                }
                            }
                        }
                    `,
                    // debug_only: true
                },
                [
                    { name: `l1a:name` },
                    [ l1a_many_sublevels[1] ]
                ]
            ],
            [
                'only join_where for extra fields',
                {
                    l1args: `
                        order: "-name"
                        where: {
                            name: {
                                ne: "l1a:name"
                            } 
                        }
                    `,
                    l1_findby_kv: `
                    `,
                    extra_cond: `join_where: {
                        since: {
                            ne: "${l1_many_sublevels[1].extra.since}"
                            modifiers: {
                                is_date: true
                            }
                        }
                    }`,
                    // debug_only: true,
                },
                [
                    { name: `l1:name` },
                    [l1_many_sublevels[0], l1_many_sublevels[2]]
                ]
            ],
        ].forEach(([
            desc,
            w,
            [l1_result, extra_results]
        ], idx, arr) => {
            const with_only = arr.some(x => 'debug_only' in x[1])
            if (with_only && !w.debug_only || w.debug_skip)
                return 

            it(desc, () => {
                const l1args = w.l1args || ''
                const l1_findby_kv = w.l1_findby_kv || ''
                const l2args = w.l2args || ''
                const extra_cond = w.extra_cond || ''

                var rep = http.post(tSrvInfo.appUrlBase + `/`, {
                    headers: {
                        'Content-Type': 'application/graphql'
                    },
                    body: `{
                        find_level(
                            ${l1args}
                            findby: {
                                ${l1_findby_kv}
                            }
                        ){
                            id,
                            name,
                            many_sublevels(
                                order: "name"
                                ${l2args}
                                ${extra_cond ? extra_cond : ''}
                            ){
                                id,
                                name,
                                extra{
                                    since
                                }
                                subl_one_descendant_level{
                                    name
                                    descendant_level_f
                                }
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

                const mapper = x => ({
                    name: x.name,
                    extra: x.extra,
                    subl_one_descendant_level: x.subl_one_descendant_level
                })
                
                check_result(
                    rep.json().data.find_level[0].many_sublevels
                        .map(mapper),
                    // extra_results is order by 'name'
                    extra_results
                );
            })
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
    
    describe('find by level with has-one self assoc', () => {
        ;[
            [
                'only findby',
                {
                    where: '',
                    results_callback: rep => rep.json().data.find_level
                }
            ],
            [
                'l1 where, findby',
                {
                    where: `where: { name: "l1a:name" }`,
                    undefined
                }
            ]
        ].forEach(([
            desc,
            w,
        ]) => {
            it(desc, () => {
                const where = w.where || ''
                const results_callback = w.results_callback

                var rep = http.post(tSrvInfo.appUrlBase + `/`, {
                    headers: {
                        'Content-Type': 'application/graphql'
                    },
                    body: `{
                        find_level(
                            ${where}
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

                if (!results_callback) {
                    assert.deepEqual(rep.json().data.find_level, []);
                    return ;
                }
                assert_found_level_with_one_l2(rep, results_callback);
            });
        });
    });

    it('paging find by level with has-one self assoc', () => {
        ;[
            null
        ].forEach(key => {
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
            return TESTDATA[0].lproperty.weight + (++add_count)
        }
        function cur_weight () {
            return TESTDATA[0].lproperty.weight + add_count
        }

        function get_uniq_extendsTo_property () {
            var rep = http.get(tSrvInfo.appUrlBase + `/level/${l1_id}/lproperty`, {
                query: {}
            });

            assert.equal(rep.statusCode, 200);
            return rep.json()
        }

        function get_uniq_extendsTo_property_by_gql () {
            var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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
                var rep = http.put(tSrvInfo.appUrlBase + `/level/${l1_id}/lproperty`, {
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
                var rep = http.del(tSrvInfo.appUrlBase + `/level/${l1_id}/lproperty/${l1_lproperty.id}`, {
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
                var rep = http.post(tSrvInfo.appUrlBase + `/level/${l1_id}/lproperty`, {
                    query: {},
                    json: {
                        ...TESTDATA[0].lproperty,
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
                    var rep = http.get(tSrvInfo.appUrlBase + `/level`, {
                        query: {
                            findby: JSON.stringify(cond)
                        }
                    });

                    assert.equal(rep.statusCode, 200);
                    assert.equal(rep.json().length, item_count);
                    return ;
                }
                
                var rep = http.post(tSrvInfo.appUrlBase + `/`, {
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