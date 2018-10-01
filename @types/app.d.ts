import * as mq from 'mq'

import FibOrmNs from 'orm';
import * as http from 'http';
import { FibAppOrmModelDefOptions, FibAppORMModel, ORMFindResult, OrigORMDefProperties } from './orm-patch';

import FibSessionNS = require('fib-session/@types/export');

type FibModelCountTypeMACRO = number;

type FibModelExtendORMFuncName = string;

type FibPoolFn<T> = (cb: (o: T) => any) => T

interface FibAppOrmDefineFn {
    (db: FibAppDb): FibAppORMModel
}
interface AppDBPool<T> extends FibPoolFn<T> {
    app: FibAppClass
    use(defs: FibAppOrmDefineFn | FibAppOrmDefineFn[]): OrigORMDefProperties[];
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
interface FibAppIneternalApiFunction__NullModel {
    (req: FibAppReq, db: FibAppDb, cls: null, data: FibAppReqData): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Get {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Post {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, data: FibAppReqData): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Find {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Put {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, data: FibAppReqData): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Del {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Eget {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid?: AppIdType): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Efind {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Epost {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, data: FibDataPayload): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Eput {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid: AppIdType, data: FibDataPayload): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Edel {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, rid: AppIdType): FibAppApiFunctionResponse;
}
interface FibAppIneternalApiFunction__Elink {
    (req: FibAppReq, db: FibAppDb, cls: FibOrmNs.FibOrmFixedModel, id: AppIdType, extend: ACLExtendModelNameType, data: FibDataPayload): FibAppApiFunctionResponse;
}

interface FibAppInternalApis {
    get?: FibAppIneternalApiFunction__Get
    post?: FibAppIneternalApiFunction__Post
    find?: FibAppIneternalApiFunction__Find
    put?: FibAppIneternalApiFunction__Put
    del?: FibAppIneternalApiFunction__Del
    eget?: FibAppIneternalApiFunction__Eget
    efind?: FibAppIneternalApiFunction__Efind
    epost?: FibAppIneternalApiFunction__Epost
    eput?: FibAppIneternalApiFunction__Eput
    edel?: FibAppIneternalApiFunction__Edel
    elink?: FibAppIneternalApiFunction__Elink
}
type FibAppApi = FibAppInternalApis

interface AppInternalCommunicationObj {
    data?: ORMFindResult
    acl?: ACLActStringList
    error?: FibAppFinalError
}
interface AppInternalCommunicationError {
    error: FibAppFinalError
}
type FibAppInternalCommObj = AppInternalCommunicationObj
interface AppInternalCommunicationExtendObj extends AppInternalCommunicationObj {
    base?: ORMFindResult
}
type FibAppInternalCommExtendObj = AppInternalCommunicationExtendObj

type GraphQLQueryString = string
interface FibAppDbGraphQLHandler {
    (query: GraphQLQueryString, req: FibAppHttpRequest): any
}
interface FibAppORM extends FibOrmNs.FibORM {
    app: FibAppClass
    /* override :start */
    models: { [key: string]: FibAppORMModel };
    /* override :end */

    graphql?: FibAppDbGraphQLHandler
    define(name: string, properties: OrigORMDefProperties, opts?: FibAppOrmModelDefOptions): FibAppORMModel;
}
type FibAppDb = FibAppORM

interface FibAppORMModelFunction {
    (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse
}

type FibAppInternalApiFunction =
    | FibAppIneternalApiFunction__Get
    | FibAppIneternalApiFunction__Find
    | FibAppIneternalApiFunction__Post
    | FibAppIneternalApiFunction__Put
    | FibAppIneternalApiFunction__Del
    | FibAppIneternalApiFunction__Eget
    | FibAppIneternalApiFunction__Efind
    | FibAppIneternalApiFunction__Epost
    | FibAppIneternalApiFunction__Eput
    | FibAppIneternalApiFunction__Edel
    | FibAppIneternalApiFunction__Elink

interface FibAppSetupChainFn {
    (origReq: FibAppHttpRequest, classname: string, func: FibAppIneternalApiFunction__NullModel): void;
    (origReq: FibAppHttpRequest, classname: string, func: FibAppORMModelFunction): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, func: FibAppInternalApiFunction): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, efunc: FibAppInternalApiFunction): void;
    (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, rid: AppIdType, efunc: FibAppInternalApiFunction): void;
}

interface FibAppHttpRequest extends http.Request, FibSessionNS.FibSessionHttpRequest {
    error?: FibAppFinalError
}

interface FibAppReqQuery {
    where?: string | ReqWhere
    keys?: string | string[]
    skip?: number
    limit?: number
    // such as '-id', 'person_id'
    order?: string
    // it's numberType, but it's designed as boolean
    count?: number

    [extraField: string]: any;
}
interface FibAppReqQueryObject extends FibAppReqQuery, Class__object { }

interface FibAppReq {
    session: FibAppSession
    query: FibAppReqQuery
    request?: FibAppHttpRequest
    error?: FibAppFinalError
}

interface FibAppReqData {
    [key: string]: any;
}

interface FibAppWebApiFunctionInModel {
    (requstInfo: FibAppReq, data: FibAppReqData): any;
}

interface FibAppGraphQLTypeMap {
    [typeName: string]: any
}

interface FibAppDbSetupOpts {
    uuid?: boolean
    maxsize?: number
    timeout?: number
    retry?: boolean

    graphqlTypeMap?: FibAppGraphQLTypeMap
}
type FibAppOpts = FibAppDbSetupOpts

interface FibAppClass extends mq.Routing {
    api: FibAppApi;
    dbPool: AppDBPool<FibAppDb>;
    // alias of 'dbPool'
    db: AppDBPool<FibAppDb>;

    diagram: any;
    filterRequest: FibAppSetupChainFn;

    /**
     * fix lack of
     *  [METHOD](pattern: string, ...args: any[]): Class_Routing
     * in 'fib-types'
     */
    all(pattern: string | object, ...args: any[]): Class_Routing
    get(pattern: string | object, ...args: any[]): Class_Routing
    post(pattern: string | object, ...args: any[]): Class_Routing
    del(pattern: string | object, ...args: any[]): Class_Routing
    put(pattern: string | object, ...args: any[]): Class_Routing
    patch(pattern: string | object, ...args: any[]): Class_Routing
    find(pattern: string | object, ...args: any[]): Class_Routing
}

type FibAppOnTypeString =
    'graphql:fix-orm-type'
