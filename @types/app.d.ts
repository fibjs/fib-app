import * as mq from 'mq'
import FibGraphQL = require('fib-graphql')

import FibOrmNs from 'orm';
import * as http from 'http';
import { APPError } from '../src/utils/err_info';
import { FibAppOrmModelDefOptions, FibAppORMModel, ORMFindResult, OrigORMDefProperties } from './orm-patch';

import FibSessionNS = require('fib-session/@types/export');

type FibModelCountTypeMACRO = number;

type FibModelExtendORMFuncName = string;

type FibPoolFn<T> = (cb: (o: T) => any) => T

interface FibAppOrmDefineFn {
    (db: FibAppDb): FibAppORMModel
}
interface AppDBPool<T> extends FibPoolFn<T> {
    use(defs: FibAppOrmDefineFn|FibAppOrmDefineFn[]): OrigORMDefProperties[];
}

interface FBDataPayload {
    [key: string]: any;
}

// constant type
interface FibAppApiCommnPayload_hasManyArgs {
    where: { type: Function }
    skip: { type: Function }
    limit: { type: Function }
    order: { type: Function }
}

interface FibAppGraphQlPayload_Field {
    [field: string]: {
        // related model's type
        type: string;
        args?: FibAppApiCommnPayload_hasManyArgs;
        // resolved data in communication
        resolve: any;
    }
}

interface FibDataPayload {
    [key: string]: any;
}

interface FibAppApi {
    post?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, data: FBDataPayload) => FibAppResponse;
    get?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType) => FibAppResponse;
    find?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel) => FibAppResponse;
    put?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, data: FBDataPayload) => FibAppResponse;
    del?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType) => FibAppResponse;

    eget?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid?: AppIdType) => FibAppResponse;
    efind?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType) => FibAppResponse;
    epost?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, data: FibDataPayload) => FibAppResponse;
    eput?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid: AppIdType, data: FibDataPayload) => FibAppResponse;
    edel?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid: AppIdType) => FibAppResponse;
    elink?: (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, data: FibDataPayload) => FibAppResponse;
}
interface FibAppFinalOutputResult {
    success?: any
    error?: any
}

interface AppInternalCommunicationObj {
    data?: ORMFindResult
    acl?: ACLActStringList
    error?: APPError
}
interface AppInternalCommunicationError {
    error: APPError
}
type FibAppInternalCommObj = AppInternalCommunicationObj
interface AppInternalCommunicationExtendObj extends AppInternalCommunicationObj {
    base?: ORMFindResult
}
type FibAppInternalCommExtendObj = AppInternalCommunicationExtendObj

type GraphQLString = string
interface FibAppDbGraphQLHandler {
    (query: GraphQLString, req: FibAppHttpRequest): any
}
interface FibAppDb extends FibOrmNs.FibORM {
    graphql?: FibAppDbGraphQLHandler

    define(name: string, properties: OrigORMDefProperties, opts?: FibAppOrmModelDefOptions): FibAppORMModel;
}
interface FibAppSetupChainFn {
    (origReq: FibAppHttpRequest, classname: string, func: Function): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, func: Function): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, efunc: Function): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, rid: AppIdType, efunc: Function): void;
}

interface FibAppHttpRequest extends http.Request, FibSessionNS.FibSessionHttpRequest {
    error?: FibAppFinalError
}

interface FibAppReqQuery {
    where?: string | ReqWhere
    keys?: string|string[]
    skip?: number
    limit?: number
    // such as '-id', 'person_id'
    order?: string
    // it's numberType, but it's designed as boolean
    count?: number

    [extraField: string]: any;
}
interface FibAppReqQueryObject extends FibAppReqQuery, Class__object {}

interface FibAppReq {
    session: FibAppSession
    query: FibAppReqQuery
    request?: FibAppHttpRequest
    error?: APPError
}

interface FibAppReqData {
    [key: string]: any;
}

interface FibAppWebApiFunctionInModel {
    (requstInfo: FibAppReq, data: FibAppWebApiFunctionInModel): any;
}

interface FibAppDbSetupOptsl {
    uuid?: boolean
    maxsize?: number
    timeout?: number
    retry?: boolean
}
type FibAppOpts = FibAppDbSetupOptsl

// interface FibTypesFixForRouting {
//     /**
//      * fix lack of
//      *  [METHOD](pattern: string, ...args: any[]): Class_Routing
//      * in 'fib-types'
//      */
//     get(pattern: string, ...args: any[]): Class_Routing
//     post(pattern: string, ...args: any[]): Class_Routing
//     del(pattern: string, ...args: any[]): Class_Routing
//     put(pattern: string, ...args: any[]): Class_Routing
//     patch(pattern: string, ...args: any[]): Class_Routing
//     find(pattern: string, ...args: any[]): Class_Routing
// }

interface FibAppClass extends mq.Routing {
    api: FibAppApi;
    db: AppDBPool<FibAppDb>;
    diagram: any;

    /**
     * fix lack of
     *  [METHOD](pattern: string, ...args: any[]): Class_Routing
     * in 'fib-types'
     */
    all(pattern: string, ...args: any[]): Class_Routing
    get(pattern: string, ...args: any[]): Class_Routing
    post(pattern: string, ...args: any[]): Class_Routing
    del(pattern: string, ...args: any[]): Class_Routing
    put(pattern: string, ...args: any[]): Class_Routing
    patch(pattern: string, ...args: any[]): Class_Routing
    find(pattern: string, ...args: any[]): Class_Routing
}
