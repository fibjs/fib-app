const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const testAppInfo = require('../..').getRandomSqliteBasedApp();
const testSrvInfo = require('../..').mountAppToSrv(testAppInfo.app, { appPath: '/api' });
testSrvInfo.server.run(() => void 0)

describe("extend multiple level", () => {
    var top_id;

    after(() => testAppInfo.cleanSqliteDB())

    before(() => {
        var rep = http.post(testSrvInfo.appUrlBase + '/level', {
            json: require('./__test__/mock-data.json').l1
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
            check_result(rep.json().data.find_sub_level[0], {
                "name": `${key}:name`
            },
                [
                    'createdAt',
                    'updatedAt',
                    'id'
                ])
        })
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}

function gettime(m) {
    return (new Date(m)).getTime()
}