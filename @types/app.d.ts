/// <reference types="fibjs" />
/// <reference types="@fxjs/orm" />
/// <reference types="fib-session" />

/// <reference path="req.d.ts" />
/// <reference path="test.d.ts" />
/// <reference path="orm-patch.d.ts" />

declare namespace FibApp {
    type FibModelCountTypeMACRO = number;

    type FibAppModelExtendORMFuncName = string;

    type FibPoolFn<T> = (cb: (o: T) => any) => T

    interface FibAppOrmDefineFn {
        (db: FibAppDb): void | FibAppORMModel | any
    }
    interface AppDBPool<T> extends FibPoolFn<T> {
        app: FibAppClass
        use(defs: FibAppOrmDefineFn | FibAppOrmDefineFn[]): FibAppOrmDefineFn[];
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
    /* filterable function :start */
    interface FibAppFilterableViewFunction {
        (req: FibAppReq, db: FibAppDb, cls: null | FibAppORMModel, data: FibAppReqData): FibAppApiFunctionResponse | string;
    }
    interface FibAppFilterableApiFunction__NullModel {
        (req: FibAppReq, db: FibAppDb, cls: null, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    interface FibAppFilterableApiFunction__WithModel {
        (req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    /* filterable function :end */

    /* internal api function :start */
    interface FibAppInternalTypedApi__Get<RT = any> {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType): RT;
    }
    type FibAppIneternalApiFunction__Get = FibAppInternalTypedApi__Get<FibAppApiFunctionResponse>

    interface FibAppIneternalApiFunction__Post {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, data: FibAppReqData): FibAppApiFunctionResponse;
    }

    interface FibAppInternalTypedApi__Find<RT = any> {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel): RT;
    }
    type FibAppIneternalApiFunction__Find = FibAppInternalTypedApi__Find<FibAppApiFunctionResponse>

    interface FibAppIneternalApiFunction__Put {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, data: FibAppReqData): FibAppApiFunctionResponse;
    }

    interface FibAppIneternalApiFunction__Del {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType): FibAppApiFunctionResponse;
    }

    interface FibAppInternalTypedApi__Eget<RT = any> {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid?: AppIdType): RT;
    }
    type FibAppIneternalApiFunction__Eget = FibAppInternalTypedApi__Eget<FibAppApiFunctionResponse>

    interface FibAppInternalTypedApi__Efind<RT = any> {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType): RT;
    }
    type FibAppIneternalApiFunction__Efind = FibAppInternalTypedApi__Efind<FibAppApiFunctionResponse>

    interface FibAppIneternalApiFunction__Epost {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType, data: FibDataPayload): FibAppApiFunctionResponse;
    }

    interface FibAppIneternalApiFunction__Eput {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: AppIdType, data: FibDataPayload): FibAppApiFunctionResponse;
    }

    interface FibAppIneternalApiFunction__Edel {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: AppIdType): FibAppApiFunctionResponse;
    }

    interface FibAppIneternalApiFunction__Elink {
        (req: FibAppReq, db: FibAppDb, cls: FxOrmNS.FibOrmFixedModel, id: AppIdType, extend: FibAppACL.ACLExtendModelNameType, data: FibDataPayload): FibAppApiFunctionResponse;
    }
    /* internal api function :end */

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

        functionHandler?: {
            (classname: string, func: string): {
                (_req: FibAppReq, db: FibAppDb, cls: FibAppORMModel, data: FibDataPayload): FibAppModelFunctionResponse
            }
        }
    }

    interface FibAppInternalViewApis {
        get?: FibAppInternalTypedApi__Get<FibAppModelViewFunctionResponse>
        find?: FibAppInternalTypedApi__Find<FibAppModelViewFunctionResponse>
        eget?: FibAppInternalTypedApi__Eget<FibAppModelViewFunctionResponse>
        efind?: FibAppInternalTypedApi__Efind<FibAppModelViewFunctionResponse>
    }

    type FibAppHttpApiCollectionType = FibAppInternalApis | FibAppInternalViewApis

    interface AppInternalCommunicationObj {
        data?: FxOrmNS.FibOrmFixedModelInstance
        acl?: FibAppACL.ModelACLCheckResult // ACLActStringList
        error?: FibAppFinalError
    }
    interface AppInternalCommunicationError {
        error: FibAppFinalError
    }
    type FibAppInternalCommObj = AppInternalCommunicationObj
    interface AppInternalCommunicationExtendObj extends AppInternalCommunicationObj {
        base?: FxOrmNS.FibOrmFixedModelInstance
    }
    type FibAppInternalCommExtendObj = AppInternalCommunicationExtendObj

    type GraphQLQueryString = string
    interface FibAppDbGraphQLHandler {
        (query: GraphQLQueryString, req: FibAppHttpRequest): any
    }
    interface FibAppORM extends FxOrmNS.FibORM {
        app: FibAppClass
        /* override :start */
        models: { [key: string]: FibAppORMModel };
        /* override :end */

        graphql?: FibAppDbGraphQLHandler
        define(name: string, properties: OrigORMDefProperties, opts?: FibAppOrmModelDefOptions): FibAppORMModel;
    }
    type FibAppDb = FibAppORM

    type FibAppFunctionToBeFilter = FibAppFilterableApiFunction__WithModel | FibAppFilterableApiFunction__NullModel | FibAppOrmModelFunction | FibAppInternalApiFunction

    interface FibAppOrmModelFunction {
        (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse
    }

    /* view model function :start */
    interface FibAppOrmModelViewFunctionRequestInfo {
        base: string
        id: AppIdType
        extend: string
        ext_id: AppIdType
    }
    interface FibAppOrmModelViewFunction {
        (result: null | FibAppApiFunctionResponse, req: FibAppReq, modelViewFunctionInfo: FibAppOrmModelViewFunctionRequestInfo): FibAppModelViewFunctionResponse
    }
    /* view model function :end */

    type FibAppInternalApiFunction =
        FibAppIneternalApiFunction__Get
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
        (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableApiFunction__WithModel): void;
        (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableApiFunction__NullModel): void;

        (origReq: FibAppHttpRequest, classname: string, id: AppIdType, func: FibAppInternalApiFunction): void;
        (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, efunc: FibAppInternalApiFunction): void;
        (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, rid: AppIdType, efunc: FibAppInternalApiFunction): void;

        (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableViewFunction): void;
    }

    interface FibAppHookBeforeResponse {
        (req: FibAppReq, responseObj: FibAppResponse): void
    }

    interface FibAppHttpRequest extends Class_HttpRequest, FibSessionNS.HttpRequest {
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

        req_resource_type?: FibAppReqResourceType
        req_resource_handler_type?: FibAppReqResourceHandlerType
        req_resource_basecls?: string
        req_resource_extcls?: string

        response_headers?: object
    }

    type FibAppReqResourceType = 'unknown' | 'json' | 'html' | 'css' | 'js'

    type FibAppReqResourceHandlerType =
        'unknown'
        | 'graphql'
        | 'builtInBaseRest' | 'builtInBaseRest'
        | 'builtInExtRest' | 'builtInExtRest'
        | 'modelFunction' | 'ModelFunction'

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
        /* for fib-pool */
        uuid?: boolean
        maxsize?: number
        timeout?: number
        retry?: boolean
    }

    interface FibAppOpts {
        graphqlTypeMap?: FibAppGraphQLTypeMap

        apiPathPrefix?: string
        viewPathPrefix?: string
    }

    interface GetTestRoutingOptions {
        appPath?: string
    }

    interface GetTestServerOptions extends GetTestRoutingOptions {
        port?: number
    }

    interface SessionTestServerInfo {
        app: FibAppClass
        server: Class_HttpServer
        routing: Class_Routing
        port: number,
        serverBase: string,
        appUrlBase: string,
        utils: {
            sessionAs: { (sessionInfo: FibAppSession): void }
        }
    }

    interface FibAppClassTestUtils {
        mountAppToSessionServer: {
            (app: FibAppClass, opts: GetTestServerOptions): SessionTestServerInfo
        }

        getRestClient: (opts: FibAppTest.FibAppTestClientOptions) => FibAppTest.FibAppTestHttpClient

        internalApiResultAssert: {
            ok: (result: FibAppApiFunctionResponse) => void
            fail: (result: FibAppApiFunctionResponse) => void

            // typed: (app: FibAppClass, result: FibAppApiFunctionResponse, internalFunction: FibAppInternalApiFunction) => void
        }
    }

    interface FibAppClassUtils {
        transformFieldsList2GraphQLInnerString(arr: any[]): string
        readonly isDebug: boolean;
    }

    export class FibAppClass extends Class_Routing {
        api: FibAppInternalApis;
        viewApi: FibAppInternalViewApis;
        dbPool: AppDBPool<FibAppDb>;
        // alias of 'dbPool'
        db: AppDBPool<FibAppDb>;

        diagram: any;
        filterRequest: FibAppSetupChainFn;

        test: FibAppClassTestUtils;

        utils: FibAppClassUtils;

        readonly __opts: FibAppOpts;

        constructor(connStr: string);
        constructor(connStr: string, opts: FibAppDbSetupOpts);
        constructor(connStr: string, appOpts: FibAppOpts, opts: FibAppDbSetupOpts);

        // beforeResponse?: FibAppHookBeforeResponse;
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
}
