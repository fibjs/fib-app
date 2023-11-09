import { FibApp } from '../Typo/app';
declare type ApiRouteContext = Parameters<FibApp.FibAppOpts['customizeApiRoute']>[0];
declare type GetHandlerType<T, K extends ApiRouteContext['routeType']> = T extends {
    routeType: K;
    handler: infer H;
} ? {
    [P in K]: H;
}[K] : never;
declare type FibAppApiHandlers = {
    [K in ApiRouteContext['routeType']]: GetHandlerType<ApiRouteContext, K>;
};
declare type BaseFilter = {
    basecls: string;
    extend?: string;
    id?: string;
    rid?: string;
};
declare type PostFuncFilter = {
    func: string | string[];
};
declare function onApiRoute<T extends ApiRouteContext['routeType']>(ctx: ApiRouteContext, routeType: T, _filters: T extends 'http-postfunc' ? (BaseFilter & PostFuncFilter) : (string | BaseFilter), userDefineHandler: FibAppApiHandlers[T]): (...args: Parameters<typeof userDefineHandler>) => any;
export declare function makeCustomizeApiRoute(maker: (ctx: {
    onApiRoute: typeof onApiRoute;
}) => FibApp.FibAppOpts['customizeApiRoute'], options?: {
    allowCustomizePostApiRoute?: FibApp.FibAppOpts['customizeApiRoute']['allowCustomizePostApiRoute'];
}): ((context: {
    app: FibApp.FibAppClass;
} & ({
    routeType: "http-rest-post";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string) => void;
} | {
    routeType: "http-rest-get";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void;
} | {
    routeType: "http-rest-put";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void;
} | {
    routeType: "http-rest-delete";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void;
} | {
    routeType: "http-rest-find";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string) => void;
} | {
    routeType: "http-rest-epost";
    handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void;
} | {
    routeType: "http-rest-eput";
    withExtendId?: boolean;
    handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void;
} | {
    routeType: "http-rest-efind";
    handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void;
} | {
    routeType: "http-rest-eget";
    withExtendId?: boolean;
    handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void;
} | {
    routeType: "http-rest-edel";
    handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid: FibApp.AppIdType) => void;
} | {
    routeType: "http-postfunc";
    handler: (origReq: FibApp.FibAppHttpRequest, classname: string, func_name: string) => void;
})) => ((origReq: FibApp.FibAppHttpRequest, classname: string) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, func_name: string) => void) | (((origReq: FibApp.FibAppHttpRequest, classname: string) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid?: FibApp.AppIdType) => void) | ((req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: string, rid: FibApp.AppIdType) => void) | ((origReq: FibApp.FibAppHttpRequest, classname: string, func_name: string) => void))[]) & {
    allowCustomizePostApiRoute?: boolean;
};
export {};
