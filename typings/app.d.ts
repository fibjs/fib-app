import * as mq from 'mq';
import ORM = require('@fxjs/orm');
import { FibApp } from './Typo/app';
declare class App extends mq.Routing implements FibApp.FibAppClass {
    static ORM: typeof ORM;
    api: FibApp.FibAppInternalApis;
    viewApi: FibApp.FibAppInternalViewApis;
    ormPool: FibApp.AppORMPool<FibApp.FibAppORM>;
    get dbPool(): FibApp.AppORMPool<FibApp.FibAppORM>;
    get db(): FibApp.AppORMPool<FibApp.FibAppORM>;
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
    constructor(connStr: string, appConfig: FibApp.FibAppOpts, opts: FibApp.FibAppDbSetupOpts);
    constructor(connStr: string, opts: FibApp.FibAppDbSetupOpts);
    [extraMember: string]: any;
}
export = App;
