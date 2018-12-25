const test = require('test');
test.setup();

const FIBJS_LTE_21 = require('util').buildInfo().fibjs <= '0.21.0'
if (FIBJS_LTE_21) {
    require.main = module
}

run('./app-apis');

if (!process.env.FIBAPP_NO_APP_SPEC) {
    run('./classes');
    run('./extend');
    run('./reverse');
    
    run('./acl');
    run('./graphql');
    run('./nographql');
    
    run('./chat');
    
    run('./user');
    require('../defs/hooks/spec')
}

if (!process.env.FIBAPP_NO_MODEL_SPEC) {
    run('../defs/acl/model.spec')
}

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}