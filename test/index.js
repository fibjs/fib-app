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

run('./classes');
run('./relation');
// run('./acl');
// run('./graphql');
// run('./push');
// run('./chat');
// run('./user');

test.run(console.DEBUG);
process.exit();