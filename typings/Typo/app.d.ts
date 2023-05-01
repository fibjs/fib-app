/// <reference types="fib-rpc" />
/// <reference types="fib-pool" />
/// <reference types="@fibjs/types" />
/// <reference types="fib-session" />
import type { FxOrmNS, FxOrmModel, FxOrmInstance, FxOrmHook, FxOrmProperty, FxOrmQuery } from '@fxjs/orm';
import type { FxSqlQuerySubQuery } from '@fxjs/sql-query';
import type { FibAppACL } from './acl';
import { FibAppTest } from './test';
export declare namespace FibApp {
    type AppIdType = number | string;
    type UidType = AppIdType;
    type UserRoleName = string;
    interface FibAppSession {
        id?: AppIdType;
        roles?: UserRoleName[];
    }
    interface FibAppSuccessResponse {
        status?: number;
        success: any;
    }
    interface FibAppErrorResponse {
        status?: number;
        error: any;
    }
    interface FibAppResponse<SDT = any> {
        status?: number;
        success?: SDT;
        error?: FibAppFinalError;
    }
    type FibAppApiFunctionResponse<DT = any> = FibAppResponse<DT>;
    type FibAppModelFunctionResponse<DT = any> = FibAppResponse<{
        data: DT;
        message: string;
    }>;
    type FibAppModelViewServiceCallbackResponse<DT = any> = FibAppResponse<DT>;
    type FibAppModelViewFunctionResponse = FibAppResponse<string>;
    interface FibAppFinalError {
        code: number | string;
        name?: string;
        message: string;
        [extendProperty: string]: any;
    }
    interface ObjectWithIdField {
        id: AppIdType;
        [extraProp: string]: any;
    }
    type IdPayloadVar = ObjectWithIdField | AppIdType;
}
export declare namespace FibApp {
    type ReqWhere = FxOrmQuery.QueryConditions;
    type ReqWhereExists = FxOrmQuery.ChainWhereExistsInfo[];
    interface ReqFindByItem {
        extend: string;
        on?: FxSqlQuerySubQuery.SubQueryConditions;
        where?: FxSqlQuerySubQuery.SubQueryConditions;
        options?: FxOrmModel.ModelOptions__Findby;
    }
    interface FilteredFindByInfo<T = any> {
        association_name: string;
        conditions: FxSqlQuerySubQuery.SubQueryConditions;
    }
}
export declare namespace FibApp {
    interface FibAppOrmModelFunction {
        (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse;
    }
    interface FibAppOrmModelViewFunctionRequestInfo {
        base: string;
        id: AppIdType;
        extend: string;
        ext_id: AppIdType;
    }
    interface FibAppOrmModelViewFunction {
        (result: null | FibAppApiFunctionResponse, req: FibAppReq, modelViewFunctionInfo: FibAppOrmModelViewFunctionRequestInfo): FibAppModelViewFunctionResponse;
    }
    interface FibAppOrmModelFunctionHash {
        [fnName: string]: FibAppOrmModelFunction;
    }
    interface FibAppOrmModelViewFunctionDefOptions {
        static?: boolean;
        handler: FibAppOrmModelViewFunction;
        response_headers?: object;
    }
    type FibAppOrmModelViewFunctionDefinition = FibAppOrmModelViewFunction | FibAppOrmModelViewFunctionDefOptions;
    interface FibAppOrmModelViewServiceCallback {
        (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse;
    }
    interface FibAppOrmModelViewServiceHash {
        [fnName: string]: FibAppOrmModelViewServiceCallback;
    }
    type FibAppOrmInstance = FxOrmInstance.Instance;
    interface AppSpecialDateProperty extends FxOrmModel.ModelPropertyDefinition {
        type: 'date';
        time?: true;
    }
    interface FibAppOrmModelDefOptions<TProperties extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>> extends FxOrmModel.ModelDefineOptions<TProperties> {
        webx?: {
            ACL?: FibAppORMModel<TProperties>['$webx']['ACL'];
            OACL?: FibAppORMModel<TProperties>['$webx']['OACL'];
            functions?: FibAppORMModel<TProperties>['$webx']['functions'];
            viewFunctions?: FibAppORMModel<TProperties>['$webx']['viewFunctions'];
            viewServices?: FibAppORMModel<TProperties>['$webx']['viewServices'];
            no_graphql?: FibAppORMModel<TProperties>['$webx']['no_graphql'];
            rpc?: FibAppORMModel<TProperties>['$webx']['rpc'];
            tableComment?: FibAppORMModel<TProperties>['$webx']['tableComment'];
            
            queryKeyWhiteList?: FibAppORMModel<TProperties>['$webx']['queryKeyWhiteList'];
        };
    }
    type FibAppOrmModelExtendsInfo = {
        [ext_name: string]: {
            type: 'hasOne' | 'hasMany' | 'extendsTo';
            reversed?: boolean;
            model: FibApp.FibAppORMModel;
            assoc_model: FibApp.FibAppORMModel;
            model_associated_models: {
                [modelName: string]: FibAppORMModel;
            };
        };
    };
    interface FibAppORMModel<PropertyTypes extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>, Methods extends Record<string, (...args: any) => any> = Record<string, (...args: any) => any>> extends FxOrmModel.Model<PropertyTypes, Methods> {
        $webx: {
            readonly cid: number;
            readonly model_name: string;
            /** @description non-association about properties */
            readonly __selfPropertiesOnDefined: Record<string, FxOrmProperty.NormalizedProperty>;
            readonly __whereBlackProperties: Set<string>;
            readonly __findByExtendBlackProperties: Set<string>;
            ACL: FibAppACL.FibACLDef;
            OACL: FibAppACL.FibOACLDef;
            functions: FibAppOrmModelFunctionHash;
            viewFunctions: {
                get?: FibAppOrmModelViewFunctionDefinition;
                find?: FibAppOrmModelViewFunctionDefinition;
                eget?: FibAppOrmModelViewFunctionDefinition;
                efind?: FibAppOrmModelViewFunctionDefinition;
                [fnName: string]: FibAppOrmModelViewFunctionDefinition | undefined;
            };
            viewServices: FibAppOrmModelViewServiceHash;
            no_graphql: boolean;
            queryKeyWhiteList: {
                where?: string[];
                findby?: string[];
            };
            rpc: FibRpcInvoke.FibRpcFnHash;
            tableComment: string;
        };
        readonly cid: FibAppORMModel['$webx']['cid'];
        readonly model_name: FibAppORMModel['$webx']['model_name'];
        readonly ACL: FibAppORMModel['$webx']['ACL'];
        readonly OACL: FibAppORMModel['$webx']['OACL'];
        readonly functions: FibAppORMModel['$webx']['functions'];
        readonly viewFunctions: FibAppORMModel['$webx']['viewFunctions'];
        readonly viewServices: FibAppORMModel['$webx']['viewServices'];
        readonly no_graphql: FibAppORMModel['$webx']['no_graphql'];
    }
    interface FibAppOrmSettings {
        'app.orm.common_fields.createdBy': string;
        'app.orm.common_fields.createdAt': string;
        'app.orm.common_fields.updatedAt': string;
        [extend_property: string]: any;
    }
}
export declare namespace FibApp {
    export type FibModelCountTypeMACRO = number;
    export type FibAppModelExtendORMFuncName = string;
    export interface FibAppOrmDefineFn<T = any> {
        (orm: FibAppORM): T;
    }
    export interface AppORMPool<T1> extends FibPoolNS.FibPool<T1> {
        app: FibAppClass;
        use(defs?: FibAppOrmDefineFn | FibAppOrmDefineFn[], opts?: {
            reload?: boolean;
        }): FibAppOrmDefineFn[];
    }
    export type AppDBPool<T1> = AppORMPool<T1>;
    export interface GraphQLResolverArgs {
        [k: string]: {
            type: Function;
        };
    }
    export interface FibAppApiCommnPayload_hasManyArgs extends GraphQLResolverArgs {
        where: {
            type: Function;
        };
        /** @deprecated will removed or changed in fib-app >= 1.17, use `extra_where` instead */
        join_where: {
            type: Function;
        };
        extra_where: {
            type: Function;
        };
        findby: {
            type: Function;
        };
        skip: {
            type: Function;
        };
        limit: {
            type: Function;
        };
        order: {
            type: Function;
        };
    }
    export interface FibAppGraphQlPayload_Field {
        [field: string]: {
            type: string;
            args?: FibAppApiCommnPayload_hasManyArgs;
            resolve: any;
        };
    }
    export interface FibDataPayload {
        [key: string]: any;
    }
    export interface FibAppFilterableViewFunction {
        (req: FibAppReq, db: FibAppORM, cls: null | FibAppORMModel, data: FibAppReqData): FibAppApiFunctionResponse | string;
    }
    export interface FibAppFilterableApiFunction__NullModel {
        (req: FibAppReq, db: FibAppORM, cls: null, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    export interface FibAppFilterableApiFunction__WithModel {
        (req: FibAppReq, db: FibAppORM, cls: FibAppORMModel, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    export interface FibAppInternalTypedApi__Get<RT = any> {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType): RT;
    }
    export type FibAppIneternalApiFunction__Get = FibAppInternalTypedApi__Get<FibAppApiFunctionResponse>;
    export interface FibAppIneternalApiFunction__Post {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    export interface FibAppInternalTypedApi__Find<RT = any> {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model): RT;
    }
    export type FibAppIneternalApiFunction__Find = FibAppInternalTypedApi__Find<FibAppApiFunctionResponse>;
    export interface FibAppIneternalApiFunction__Put {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, data: FibAppReqData): FibAppApiFunctionResponse;
    }
    export interface FibAppIneternalApiFunction__Del {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance): FibAppApiFunctionResponse;
    }
    export interface FibAppInternalTypedApi__Eget<RT = any> {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, rid?: AppIdType): RT;
    }
    export type FibAppIneternalApiFunction__Eget = FibAppInternalTypedApi__Eget<FibAppApiFunctionResponse>;
    export interface FibAppInternalTypedApi__Efind<RT = any> {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType): RT;
    }
    export type FibAppIneternalApiFunction__Efind = FibAppInternalTypedApi__Efind<FibAppApiFunctionResponse>;
    export interface FibAppIneternalApiFunction__Epost {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, data: FibApp.IdPayloadVar | FibDataPayload): FibAppApiFunctionResponse;
    }
    export interface FibAppIneternalApiFunction__Eput {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: AppIdType, data: FibDataPayload): FibAppApiFunctionResponse;
    }
    export interface FibAppIneternalApiFunction__Edel {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: AppIdType): FibAppApiFunctionResponse;
    }
    export interface FibAppIneternalApiFunction__Elink {
        (req: FibAppReq, db: FibAppORM, cls: FxOrmModel.Model, id: AppIdType | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, data: FibDataPayload): FibAppApiFunctionResponse;
    }
    export interface FibAppInternalApis {
        get?: FibAppIneternalApiFunction__Get;
        post?: FibAppIneternalApiFunction__Post;
        find?: FibAppIneternalApiFunction__Find;
        put?: FibAppIneternalApiFunction__Put;
        del?: FibAppIneternalApiFunction__Del;
        eget?: FibAppIneternalApiFunction__Eget;
        efind?: FibAppIneternalApiFunction__Efind;
        epost?: FibAppIneternalApiFunction__Epost;
        eput?: FibAppIneternalApiFunction__Eput;
        edel?: FibAppIneternalApiFunction__Edel;
        elink?: FibAppIneternalApiFunction__Elink;
        functionHandler?: {
            (classname: string, func: string): {
                (_req: FibAppReq, db: FibAppORM, cls: FibAppORMModel, data: FibDataPayload): FibAppModelFunctionResponse;
            };
        };
    }
    export interface FibAppIneternalApiFindResult<ReponseT = any> {
        count: number;
        results: ReponseT[];
    }
    export interface FibAppInternalViewApis {
        get?: FibAppInternalTypedApi__Get<FibAppModelViewFunctionResponse>;
        find?: FibAppInternalTypedApi__Find<FibAppModelViewFunctionResponse>;
        eget?: FibAppInternalTypedApi__Eget<FibAppModelViewFunctionResponse>;
        efind?: FibAppInternalTypedApi__Efind<FibAppModelViewFunctionResponse>;
    }
    export interface FibAppModelViewServiceApis {
        [view_service_api: string]: FibAppOrmModelViewServiceHash;
    }
    export type FibAppHttpApiCollectionType = FibAppInternalApis | FibAppInternalViewApis;
    export interface AppInternalCommunicationObj {
        inst?: FxOrmInstance.Instance | null;
        acl?: FibAppACL.RoleActDescriptor;
        error?: FibAppFinalError;
    }
    export interface AppInternalCommunicationError {
        error: FibAppFinalError;
    }
    export type FibAppInternalCommObj = AppInternalCommunicationObj;
    export interface AppInternalCommunicationExtendObj extends AppInternalCommunicationObj {
        base?: FxOrmInstance.Instance;
    }
    export type FibAppInternalCommExtendObj = AppInternalCommunicationExtendObj;
    export type GraphQLQueryString = string;
    export interface GlobalAppModels {
        [key: string]: FibAppORMModel;
    }
    export interface FibAppORM extends FxOrmNS.ORM {
        app: FibAppClass;
        models: GlobalAppModels;
        graphql<T = any>(query: FibApp.GraphQLQueryString, req: FibApp.FibAppHttpRequest): T;
        define: <T extends Record<string, FxOrmModel.ComplexModelPropertyDefinition>, U extends FibAppOrmModelDefOptions<FxOrmModel.GetPropertiesType<T>>>(name: string, properties: T, opts?: U) => FibAppORMModel<FxOrmModel.GetPropertiesType<T>, Exclude<U['methods'], void>>;
    }
    export type FibAppDb = FibAppORM;
    export type FibAppFunctionToBeFilter = (FibAppFilterableApiFunction__WithModel | FibAppFilterableApiFunction__NullModel | FibAppOrmModelFunction | FibAppInternalApiFunction);
    export type FibAppInternalApiFunction = FibAppIneternalApiFunction__Get | FibAppIneternalApiFunction__Find | FibAppIneternalApiFunction__Post | FibAppIneternalApiFunction__Put | FibAppIneternalApiFunction__Del | FibAppIneternalApiFunction__Eget | FibAppIneternalApiFunction__Efind | FibAppIneternalApiFunction__Epost | FibAppIneternalApiFunction__Eput | FibAppIneternalApiFunction__Edel | FibAppIneternalApiFunction__Elink;
    export type FibAppSetupChainFn = FibApp.FibAppClass['filterRequest'];
    export interface FibAppHookBeforeResponse {
        (req: FibAppReq, responseObj: FibAppResponse): void;
    }
    export interface FibAppHttpRequest extends Class_HttpRequest, FibSessionNS.HttpRequest {
        error?: FibAppFinalError;
        session: FibApp.FibAppSession;
        id?: FibRpcJsonRpcSpec.JsonRpcId;
        [k: string]: any;
    }
    export interface FibAppReqQuery {
        where?: string | FibApp.ReqWhere;
        /** @deprecated will removed or changed in fib-app >= 1.17, use `extra_where` instead */
        join_where?: FibApp.ReqWhere;
        extra_where?: FibApp.ReqWhere;
        findby?: FibApp.ReqFindByItem;
        keys?: string | string[];
        skip?: number;
        limit?: number;
        order?: string;
        /**
         * it's numberType, but it's designed as boolean like count_required
         * @history this is mostly for arg from http get url like
         *
         * // from http
         * `http://localhost:8080/api/user?count=1`
         */
        count?: number;
        /**
         * // from http
         * `http://localhost:8080/api/user?count_required=1&skip=10` -> `count_required = true`
         * `http://localhost:8080/api/user?count_required=0&skip=10` -> `count_required = true`
         * `http://localhost:8080/api/user?count_required=&skip=10` -> `count_required = false`
         */
        count_required?: boolean;
        [extraField: string]: any;
    }
    export interface FibAppReqQueryObject extends FibAppReqQuery, Class_object {
    }
    export interface FibAppReq {
        session: FibAppSession;
        query: FibAppReqQuery;
        request?: FibAppHttpRequest;
        error?: FibAppFinalError;
        req_resource_type?: FibAppReqResourceType;
        req_resource_handler_type?: FibAppReqResourceHandlerType;
        req_resource_basecls?: string;
        req_resource_extend?: string;
        response_headers?: object;
    }
    export type FibAppReqResourceType = 'unknown' | 'json' | 'html' | 'css' | 'js';
    export type FibAppReqResourceHandlerType = 'unknown' | 'graphql' | 'builtInBaseRest' | 'builtInBaseRest' | 'builtInExtRest' | 'builtInExtRest' | 'modelFunction' | 'ModelFunction';
    export interface FibAppReqData {
        [key: string]: any;
    }
    export interface FibAppWebApiFunctionInModel {
        (requstInfo: FibAppReq, data: FibAppReqData): any;
    }
    export interface FibAppGraphQLTypeMap {
        [typeName: string]: any;
    }
    export interface FibAppDbSetupOpts {
        uuid?: boolean;
        maxsize?: number;
        timeout?: number;
        retry?: boolean;
    }
    type ItOrArray<T> = T | T[];
    export interface FibAppOpts {
        graphqlTypeMap?: FibAppGraphQLTypeMap;
        /**
         * @default '/'
         */
        apiPathPrefix?: string;
        /**
         * @default '/'
         */
        viewPathPrefix?: string;
        /**
         * @default '/'
         */
        graphQLPathPrefix?: string;
        /**
         * @default '/'
         * @recommended '/'
         */
        batchPathPrefix?: string;
        /**
         * @notice cannot be '/'
         * @default '/rpc'
         */
        rpcPathPrefix?: string;
        /**
         * @notice cannot be '/'
         * @default '/websocket'
         */
        websocketPathPrefix?: string;
        hooks?: Hooks;
        hideErrorStack?: boolean;
        customizeApiRoute?: {
            (context: {
                app: FibApp.FibAppClass;
            } & ({
                routeType: 'http-rest-post';
                handler: (origReq: FibAppHttpRequest, classname: string) => void;
            } | {
                routeType: 'http-rest-get';
                handler: (origReq: FibAppHttpRequest, classname: string, id: AppIdType) => void;
            } | {
                routeType: 'http-rest-put';
                handler: (origReq: FibAppHttpRequest, classname: string, id: AppIdType) => void;
            } | {
                routeType: 'http-rest-delete';
                handler: (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string) => void;
            } | {
                routeType: 'http-rest-find';
                handler: (origReq: FibAppHttpRequest, classname: string) => void;
            } | {
                routeType: 'http-rest-epost';
                handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void;
            } | {
                routeType: 'http-rest-eput';
                withExtendId?: boolean;
                handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void;
            } | {
                routeType: 'http-rest-efind';
                handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void;
            } | {
                routeType: 'http-rest-eget';
                withExtendId?: boolean;
                handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void;
            } | {
                routeType: 'http-rest-edel';
                handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid: FibApp.AppIdType) => void;
            } | {
                routeType: 'http-postfunc';
                handler: (origReq: FibAppHttpRequest, classname: string, func_name: string) => void;
            })): ItOrArray<typeof context['handler']>;
        };
    }
    export interface WebSocketMessageHandlerContext<DT = any> {
        app: FibApp.FibAppClass;
        data: DT;
        /**
         * @description
         */
        websocket_msg: Class_WebSocketMessage;
        /**
         * @description websocket connection
         */
        websocket: Class_WebSocket;
        /**
         * @description websocket's original request
         */
        request: FibApp.FibAppHttpRequest;
    }
    export interface Hooks {
        beforeSetupRoute?: FxOrmHook.HookActionCallback;
        afterOrmSyncFinished?: FxOrmHook.HookActionCallback;
    }
    export interface GetTestRoutingOptions {
        initRouting?: {
            (routing: {
                [k: string]: Function;
            }): void;
        };
    }
    export interface GetTestServerOptions extends GetTestRoutingOptions {
        port?: number;
        httpClient?: Class_HttpClient;
    }
    export interface SessionTestServerInfo {
        app: FibAppClass;
        server: Class_HttpServer;
        routing: Class_Routing;
        port: number;
        httpHost: string;
        websocketHost: string;
        /**
         * @alias httpHost
         */
        serverBase: string;
        appUrlBase: string;
        httpClient: Class_HttpClient;
        utils: {
            sessionAs: {
                (sessionInfo: FibAppSession): void;
            };
        };
    }
    export interface FibAppClassTestUtils {
        mountAppToSessionServer: {
            (app: FibAppClass, opts: GetTestServerOptions): SessionTestServerInfo;
        };
        getRestClient: (opts: FibAppTest.FibAppTestHttpClientOptions) => FibAppTest.FibAppTestHttpClient;
        internalApiResultAssert: {
            ok: (result: FibAppApiFunctionResponse) => void;
            fail: (result: FibAppApiFunctionResponse) => void;
        };
    }
    export interface FibAppClassUtils {
        transform_fieldslist_2_graphql_inner_string(arr: any[]): string;
        readonly isDebug: boolean;
    }
    export interface RpcMethod extends FibRpcInvoke.JsonRpcInvokedFunction {
        (params: Fibjs.AnyObject & {
            $session: FibApp.FibAppSession;
            $request: FibApp.FibAppReq;
        }): any;
    }
    export class FibAppClass extends Class_Routing {
        api: FibAppInternalApis;
        viewApi: FibAppInternalViewApis;
        ormPool: AppORMPool<FibAppORM>;
        readonly dbPool: AppORMPool<FibAppORM>;
        readonly db: AppORMPool<FibAppORM>;
        readonly rpcCall: {
            <TS = any, TERR = any>(req: FibRpcJsonRpcSpec.RequestPayload | FibApp.FibAppHttpRequest, opts?: {
                sessionid?: FibApp.FibAppHttpRequest['sessionid'];
                session?: FibApp.FibAppHttpRequest['session'];
            }): TS | FibRpc.FibRpcError<TERR>;
        };
        readonly eventor: Class_EventEmitter;
        addRpcMethod(name: string, fn: RpcMethod): number;
        hasRpcMethod(name: string): boolean;
        removeRpcMethod(name: string): number;
        allRpcMethodNames(): string[];
        clearRpcMethods(): void;
        diagram: () => any;
        filterRequest: {
            (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableApiFunction__WithModel): void;
            (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableApiFunction__NullModel): void;
            (origReq: FibAppHttpRequest, classname: string, id: AppIdType, func: FibAppInternalApiFunction): void;
            (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, efunc: FibAppInternalApiFunction): void;
            (origReq: FibAppHttpRequest, classname: string, id: AppIdType, extend: string, rid: AppIdType, efunc: FibAppInternalApiFunction): void;
            (origReq: FibAppHttpRequest, classname: string, func: FibAppFilterableViewFunction): void;
        };
        test: FibAppClassTestUtils;
        utils: FibAppClassUtils;
        readonly __opts: FibAppOpts;
        constructor(connStr: string);
        constructor(connStr: string, opts: FibAppDbSetupOpts);
        constructor(connStr: string, appOpts: FibAppOpts, opts: FibAppDbSetupOpts);
        /**
         * fix lack of
         *  [METHOD](pattern: string, ...args: any[]): Class_Routing
         * in 'fib-types'
         */
        all(pattern: string | object, ...args: any[]): Class_Routing;
        get(pattern: string | object, ...args: any[]): Class_Routing;
        post(pattern: string | object, ...args: any[]): Class_Routing;
        del(pattern: string | object, ...args: any[]): Class_Routing;
        put(pattern: string | object, ...args: any[]): Class_Routing;
        patch(pattern: string | object, ...args: any[]): Class_Routing;
        find(pattern: string | object, ...args: any[]): Class_Routing;
    }
    export type FibAppOnTypeString = 'graphql:fix-orm-type';
    export {};
}
