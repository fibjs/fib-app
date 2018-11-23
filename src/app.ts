import * as mq from 'mq';
import setupApis = require('./http');

import setupTest = require('./testkits')
import setupDb = require('./db');
import setupUtils = require('./utils')
import diagram = require('./utils/diagram');

class App extends mq.Routing implements FibApp.FibAppClass {
    api: FibApp.FibAppInternalApis;
    viewApi: FibApp.FibAppInternalViewApis;

    db: FibApp.AppDBPool<FibApp.FibAppDb>;
    dbPool: FibApp.AppDBPool<FibApp.FibAppDb>;
    filterRequest: FibApp.FibAppSetupChainFn;
    diagram: any;

    graphqlTypeMap: any;
    test: FibApp.FibAppClassTestUtils;

    utils: FibApp.FibAppClassUtils;

    readonly __opts: FibApp.FibAppOpts;
    
    constructor(connStr: string, appConfig: FibApp.FibAppOpts, opts: FibApp.FibAppDbSetupOpts)
    constructor(connStr: string, opts: FibApp.FibAppDbSetupOpts)
    constructor(connStr: string) {
        super();

        const dbSetupOpts: FibApp.FibAppDbSetupOpts = arguments[arguments.length - 1]
        const appOpts: FibApp.FibAppOpts = (arguments[1] === dbSetupOpts ? null : arguments[1]) || {}

        this.__opts = filterFibAppOptions(appOpts)

        // just for compatible
        this.__opts.graphqlTypeMap = this.__opts.graphqlTypeMap || (dbSetupOpts as any).graphqlTypeMap || {}
        this.dbPool = this.db = setupDb(this, connStr, dbSetupOpts);

        setupApis.bind(this);
        
        setupTest.bind(this);
        setupUtils.bind(this);

        this.diagram = diagram;
    }

    [extraMember: string]: any;
}

export = App;

function filterFibAppOptions (__opts: FibApp.FibAppOpts) {
    __opts.apiPathPrefix = __opts.apiPathPrefix || ''
    __opts.viewPathPrefix = __opts.viewPathPrefix || ''
    
    __opts.graphqlTypeMap = __opts.graphqlTypeMap || {}

    return __opts
}
