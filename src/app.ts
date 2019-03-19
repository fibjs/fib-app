import * as mq from 'mq';
import setupApis = require('./http');

import setupTest = require('./testkits')
import setupDb = require('./db');
import setupUtils = require('./utils')
import diagram = require('./utils/diagram');
import ORM = require('@fxjs/orm');
import Session = require('fib-session');

class App extends mq.Routing implements FibApp.FibAppClass {
    static ORM = ORM;
    static Session = Session;

    api: FibApp.FibAppInternalApis;
    viewApi: FibApp.FibAppInternalViewApis;

    
    ormPool: FibApp.AppORMPool<FibApp.FibAppORM>;
    get dbPool (): FibApp.AppORMPool<FibApp.FibAppORM> { return this.ormPool }
    get db (): FibApp.AppORMPool<FibApp.FibAppORM> { return this.ormPool }

    filterRequest: FibApp.FibAppSetupChainFn;
    diagram: () => any;

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

        Object.defineProperty(this, '__opts', {
            value: filterFibAppOptions(appOpts),
            writable: false
        })

        // just for compatible
        this.__opts.graphqlTypeMap = this.__opts.graphqlTypeMap || (dbSetupOpts as any).graphqlTypeMap || {}
        this.ormPool = setupDb(this, connStr, dbSetupOpts);

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
    __opts.graphQLPathPrefix = __opts.graphQLPathPrefix || '/'
    __opts.batchPathPrefix = __opts.batchPathPrefix || '/'

    __opts.graphqlTypeMap = __opts.graphqlTypeMap || {}

    return __opts
}
