import * as mq from 'mq';
import * as util from 'util';

import setupApis = require('./http');

import setupTest = require('./testkits')
import setupDb = require('./db');
import setupUtils = require('./utils')
import diagram = require('./utils/diagram');
import ORM = require('@fxjs/orm');
import Session = require('fib-session');
import { EventEmitter } from 'events';

class App extends mq.Routing implements FibApp.FibAppClass {
    static ORM = ORM;
    static Session = Session;

    api: FibApp.FibAppInternalApis;
    viewApi: FibApp.FibAppInternalViewApis;

    ormPool: FibApp.AppORMPool<FibApp.FibAppORM>;
    get dbPool (): FibApp.AppORMPool<FibApp.FibAppORM> { return this.ormPool }
    get db (): FibApp.AppORMPool<FibApp.FibAppORM> { return this.ormPool }

    filterRequest: FibApp.FibAppClass['filterRequest'];
    diagram: FibApp.FibAppClass['diagram'];
    test: FibApp.FibAppClassTestUtils;
    utils: FibApp.FibAppClassUtils;

    readonly __opts: FibApp.FibAppOpts;
    readonly eventor: FibApp.FibAppClass['eventor'];

    addRpcMethod: FibApp.FibAppClass['addRpcMethod'];
    hasRpcMethod: FibApp.FibAppClass['hasRpcMethod'];
    removeRpcMethod: FibApp.FibAppClass['removeRpcMethod'];
    allRpcMethodNames: FibApp.FibAppClass['allRpcMethodNames'];
    clearRpcMethods: FibApp.FibAppClass['clearRpcMethods'];
    rpcCall: FibApp.FibAppClass['rpcCall'];
    
    constructor(connStr: string, appConfig: FibApp.FibAppOpts, opts: FibApp.FibAppDbSetupOpts)
    constructor(connStr: string, opts: FibApp.FibAppDbSetupOpts)
    constructor(connStr: string) {
        super();

        const args = Array.prototype.slice.apply(arguments);
        const dbSetupOpts: FibApp.FibAppDbSetupOpts = util.last(args)
        const appOpts: FibApp.FibAppOpts = (args[1] === dbSetupOpts ? null : args[1]) || {}

        Object.defineProperty(this, '__opts', {
            value: filterFibAppOptions(appOpts),
            writable: false,
            configurable: false
        });

        Object.defineProperty(this, 'eventor', {
            value: new EventEmitter(),
            writable: false,
            configurable: false
        });

        this.__opts.graphqlTypeMap = util.extend(
            this.__opts.graphqlTypeMap,
            (dbSetupOpts as any).graphqlTypeMap, // just for compatible
        );

        this.ormPool = setupDb(this, connStr, dbSetupOpts);

        appOpts.hooks = appOpts.hooks || {};

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
    __opts.rpcPathPrefix = __opts.rpcPathPrefix || '/rpc'
    __opts.websocketPathPrefix = __opts.websocketPathPrefix || '/websocket'
    
    __opts.batchPathPrefix = __opts.batchPathPrefix || '/'
    
    __opts.graphqlTypeMap = __opts.graphqlTypeMap || {}

    return __opts
}
