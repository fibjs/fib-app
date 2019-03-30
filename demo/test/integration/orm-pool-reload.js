const test = require('test');
test.setup();

const fs = require('fs');
const path = require('path');
const { check_result } = require('../_utils');

const tappInfo = require('../support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
const faker = require('../../faker');

describe('orm pool reload', () => {
    const { app } = tappInfo

    function assert_builtin_models (orm, exist = true) {
        ;['user', 'person', 'people'].forEach(model_name => {
            if (exist)
                assert.ok(orm.models[model_name])
            else
                assert.ok(!orm.models[model_name])

        })
    }

    before(() => {
        tappInfo.utils.dropModelsSync();

        app.db(orm => {
            assert_builtin_models(orm, true)
        });
    })
    
    after(() => tappInfo.utils.cleanLocalDB());

    it('no graphql error when empty orm.models', () => {
        app.db.clear();
        app.db.use();

        let trigged = false;

        app.db(() => {
            trigged = true;
        });

        assert.ok(trigged);
    });

    it('no models because all defs reloaded', () => {
        app.db.clear();
        app.db.use();

        app.db(orm => {
            assert_builtin_models(orm, false)
        });
    });

    it('reload models success', () => { 
        app.db.use(orm => {
            orm.define('re_m1', {
                're_m1_f1': String,
                're_m1_f2': String,
                're_m1_f3': String,
            });

            assert_builtin_models(orm, false)

            assert.property(orm.models, 're_m1')
        });
    });

    it(`reload models in db pool's callback`, () => {
        app.db.clear();
        app.db.use();

        app.db.use(orm => {
            orm.define('re_m1', {
                're_m1_f1': String,
                're_m1_f2': String,
                're_m1_f3': String,
            });

            assert.property(orm.models, 're_m1');

            app.db.clear();
            app.db.use();

            /**
             * `app.db.use()` equals to `app.db.use([], { reload: true })`,
             *  that only re init the orm definition function in app, but no
             *  effect on the existed orm-pool's worker.
             */
            assert.property(orm.models, 're_m1');
        });

        app.db.use(orm => {
            assert.ok(!orm.models.re_m1);
        })
    });
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
