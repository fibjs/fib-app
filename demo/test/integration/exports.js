const test = require('test');
test.setup();

const Module = require('../../../');

describe('module exports', () => {
    it('commonjs export', () => {
        assert.isFunction(Module);
    });

    it('default export', () => {
        assert.isFunction(Module.default);

        assert.equal(Module.default, Module);
    });
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
