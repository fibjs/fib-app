const test = require('test');
const assert = require('assert');
const { describe, it, before, after, beforeEach, afterEach } = test;

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

