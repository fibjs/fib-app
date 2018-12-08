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

    it('init data', () => {
        var rep = http.post(testSrvInfo.appUrlBase + '/level', {
            json: require('./__test__/mock-data.json').l1
        });

        top_id = rep.json().id
    });

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
                    ])
            }
        })
    })

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
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}

function gettime(m) {
    return (new Date(m)).getTime()
}