const test = require('test');
test.setup();

describe('Hooks', () => {
    var tappInfo
    function setup(opts) {
        tappInfo = require('../support/spec_helper').getRandomSqliteBasedApp({
            hooks: opts.hooks
        }, {});
    }

    var triggered = {
        beforeSetupRoute: false
    };

    afterEach(() => {
        Object.keys(triggered).forEach(k => triggered[k] = false)
    })

    const apis = [
        'get',
        'post',
        'put',
        'del',
        'eget',
        'epost',
        'eput',
        'edel',
        'functionHandler'
    ]

    function assert_apis_not_exist(app) {
        apis.forEach(k => {
            assert.notExist(app.api[k])
        })
    }

    function assert_apis_exist(app) {
        apis.forEach(k => {
            assert.isFunction(app.api[k])
        })

        assert.isFunction(app.filterRequest)
    }
          
    it('[beforeSetupRoute] triggered after app instanced', () => {
        setup({
            hooks: {
                beforeSetupRoute () {
                    assert.isFalse(triggered.beforeSetupRoute)
                    triggered.beforeSetupRoute = true;

                    assert.exist(this)
                    assert.isObject(this)

                    assert.isObject(this.api)
                    assert_apis_exist(this)
                }
            }
        })

        assert.isTrue(triggered.beforeSetupRoute);
        assert_apis_exist(tappInfo.app);
    });        

    it('[beforeSetupRoute] triggered after app instanced - next', () => {
        setup({
            hooks: {
                beforeSetupRoute (next) {
                    setTimeout(() => {
                        assert.isFalse(triggered.beforeSetupRoute)
                        triggered.beforeSetupRoute = true;

                        assert.exist(this)
                        assert.isObject(this)

                        assert.isObject(this.api)
                        assert_apis_exist(this)

                        next()
                    }, 100)
                }
            }
        })

        assert.isTrue(triggered.beforeSetupRoute);
        assert_apis_exist(tappInfo.app);
    });
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
