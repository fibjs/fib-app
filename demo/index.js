const detectPort = require('@fibjs/detect-port');

let port = detectPort();

console.log(`[fib-app] would start test server on listening ${port}.`);

exports.port = port
exports.serverBase = `http://127.0.0.1:${exports.port}`
