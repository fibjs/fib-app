const test = require('test');
test.setup();

const http = require('http');
const ws = require('ws');
const coroutine = require('coroutine');

const { check_result } = require('../../test/_utils');

const tappInfo = require('../../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
tSrvInfo.server.run(() => void 0)

const serverBase = tSrvInfo.serverBase
const wsBase = serverBase.replace('http://', 'ws://')

describe("chat", () => {
    var cid;
    var uid;

    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();

        var rep = http.post(tSrvInfo.appUrlBase + '/user', {
            json: {
                name: 'lion'
            }
        });

        uid = rep.json().id;

        http.post(serverBase + '/set_session', {
            json: {
                id: uid
            }
        });
    });

    it('create room', () => {
        var rep = http.post(tSrvInfo.appUrlBase + '/chatroom', {
            json: {
                name: 'room1'
            }
        });

        cid = rep.json().id;
    });

    it('post message', () => {
        var rep = http.post(tSrvInfo.appUrlBase + `/chatroom/${cid}/messages`, {
            json: {
                msg: 'hellow, world.'
            }
        });
        var mid = rep.json().id;

        rep = http.get(tSrvInfo.appUrlBase + `/chatroom/${cid}/messages`);
        check_result(rep.json(), [{
            "msg": "hellow, world.",
            "id": mid,
            "createdby_id": uid,
            "room_id": cid
        }]);
    });

    it('push', () => {
        var conn = new ws.Socket(wsBase + '/push');
        conn.onopen = () => {
            conn.send(JSON.stringify({
                act: "on",
                ch: `channel_${cid}`,
                timestamp: 0
            }));
        }

        var r = [];

        conn.onmessage = m => {
            r.push(m.json());
        };

        coroutine.sleep(100);

        http.post(tSrvInfo.appUrlBase + `/chatroom/${cid}/messages`, {
            json: {
                msg: 'hellow, world. again'
            }
        });

        coroutine.sleep(100);

        conn.send(JSON.stringify({
            act: "off",
            ch: `channel_${cid}`
        }));

        assert.equal(r.length, 3);

        assert.property(r[0], "timestamp");
        assert.notProperty(r[0], "data");

        assert.property(r[1], "timestamp");
        assert.equal(r[1].data.msg, "hellow, world.");

        assert.property(r[2], "timestamp");
        assert.equal(r[2].data.msg, "hellow, world. again");
    });


    /*
         0: 1370ms
        10: 1730ms
       100: 4200ms
       200: 4200ms
      1000: 10800ms
    */
    it('performance', () => {
        var conns = [];

        for (var i = 0; i < 200; i++) {
            var conn = new ws.Socket(wsBase + '/push');
            conn.onopen = function () {
                this.send(JSON.stringify({
                    act: "on",
                    ch: `channel_${cid}`,
                    timestamp: 0
                }));
            }

            conns.push(conn);
        }

        coroutine.sleep(1000);

        console.time('chat performance');
        coroutine.parallel(() => {
            for (var i = 0; i < 100; i++) {
                http.post(tSrvInfo.appUrlBase + `/chatroom/${cid}/messages`, {
                    json: {
                        msg: 'hellow, world. ' + i
                    }
                });
            }
        }, 10);
        console.timeEnd('chat performance');

        conns.forEach(conn => conn.close());
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
