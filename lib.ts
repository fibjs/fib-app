import util = require('util')

if (util.buildInfo().fibjs !== '0.25.0') {
    module.exports = require('./src')
} else {
    module.exports = require('./lib/index.js')
}