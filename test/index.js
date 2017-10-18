const test = require('test');
test.setup();

var fs = require('fs');

try {
    fs.unlink("test.db");
} catch (e) {};
try {
    fs.unlink("test.db-shm");
} catch (e) {};
try {
    fs.unlink("test.db-wal");
} catch (e) {};

run('../demo/app');
require('coroutine').sleep(100);

const http = require('http');

function check_result(res, data) {
    if (Array.isArray(res))
        res.forEach(r => {
            delete r.createAt;
            delete r.updateAt;
            delete r.ACL;
        })
    else {
        delete res.createAt;
        delete res.updateAt;
        delete res.ACL;
    }

    assert.deepEqual(res, data);
}

run('./classes');
run('./acl');
run('./relation');

test.run(console.DEBUG);
process.exit();