const test = require('test');
test.setup();

const FIBJS_LTE_21 = require('util').buildInfo().fibjs <= '0.21.0'
if (FIBJS_LTE_21) {
    require.main = module
}

const { dbBuilder, getStaticTestDBName } = require('./support/spec_helper');

describe('fib-app', function () {
    const builder = dbBuilder(getStaticTestDBName());

    before(() => {
        builder.drop();
        builder.create();
    });

    after(() => {
        builder.drop();
    });

    require('./app-apis');
    require('./customize-api-route');

    require('./integration/exports')
    require('./integration/orm-pool-reload')
    require('./integration/hooks')

    if (!process.env.FIBAPP_NO_APP_SPEC) {
        require('./classes');
        require('./extend');
        require('./extend-operation');
        require('./reverse');
        
        require('./acl');
        require('./graphql-types');
        require('./graphql');
        require('./nographql');
        require('./query-filter');
        
        require('./chat');
        
        require('./user');
        require('../defs/hooks/spec')
    }

    if (!process.env.FIBAPP_NO_MODEL_SPEC) {
        require('../defs/acl/model.spec')
    }
})

if (require.main === module) {
    try {
        test.run(console.DEBUG);
    } catch (error) {
        console.error(error)
    }
    process.exit();
}