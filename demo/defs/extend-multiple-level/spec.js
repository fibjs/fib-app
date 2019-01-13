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
        ;[
            [
                `many_sublevels_id: {
                    ne: 1
                }`, { name: `l1:name`, },
                [
                    {
                        "name": "many_levels:name"
                    },
                    {
                        "name": "many_levels3:name"
                    },
                    {
                        "name": "many_levels2:name"
                    }
                ]
            ],
            [
                `many_sublevels_id: "1"`, undefined
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

    it('find whereExists sublevel with has-one assoc', () => {
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
                            extend: "one_subl",
                            where: {
                                name: "l1-l2:name"
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
            check_result(
                rep.json().data.find_level[0],
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

            check_result(
                rep.json().data.find_level[0].one_sl,
                {
                    "name": "l1-sl:name"
                }
            );
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