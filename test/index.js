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

run('./classes');
run('./acl');
run('./relation');

test.run(console.DEBUG);
process.exit();