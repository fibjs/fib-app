const assert = require('assert')

const prependHook = require('../../../lib/orm_plugins/_tools').prependHook

var model_hook_wrapper = {}

function hook_test_plugin () {
    return {
        beforeDefine (name, properties, opts) {
            if (name !== 'hook_test')
                return

            model_hook_wrapper[name] = {}

            prependHook(opts.hooks, 'beforeCreate', function () {
                model_hook_wrapper['hook_test']['beforeCreate'] = 'aaa'
            })
            
            prependHook(opts.hooks, 'beforeSave', function () {
                model_hook_wrapper['hook_test']['beforeSave'] = true
            })
            
            prependHook(opts.hooks, 'afterSave', function () {
                model_hook_wrapper['hook_test']['afterSave'] = true
            })
        }
    }
}

module.exports = db => {
    var triggered = false

    db.use(hook_test_plugin)

    function afterSave () {
        assert.isTrue(model_hook_wrapper['hook_test'].afterSave)
        
        assert.isTrue(triggered)
        triggered = false
    }
    
    db.define('hook_test', {
        name: String
    }, {
        hooks: {
            beforeCreate: function (next) {
                assert.isFalse(triggered)
                assert.equal(model_hook_wrapper['hook_test'].beforeCreate, 'aaa')

                next()
            },
            beforeSave () {
                this.name = `modified_${this.name}`

                assert.isTrue(model_hook_wrapper['hook_test'].beforeSave)
                
                assert.isFalse(triggered)
                triggered = true
            },
            afterSave: Math.random(0, 1) > 0.5 ? 
            (function (success) {
                assert.isTrue(success)
                afterSave()
            })
            :
            (function () {
                afterSave()
            })
        }
    });
}
