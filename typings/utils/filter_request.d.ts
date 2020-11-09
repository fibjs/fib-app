/// <reference types="@fibjs/types" />
/// <reference lib="es2016" />
import { FibApp } from '../Typo/app';
export declare const filterRequest: FibApp.FibAppClass['filterRequest'];
export declare function normalizeQueryWhere(_req: FibApp.FibAppReq): FibApp.FibAppReq['query']['where'];
export declare function makeFibAppReqInfo(orequest: FibApp.FibAppHttpRequest, app: FibApp.FibAppClass, { classname, handler, extend_args: earg }: {
    classname: string;
    handler?: FibApp.FibAppFunctionToBeFilter;
    extend_args?: [
        (FibApp.AppIdType | FibApp.FibDataPayload)?,
        string?,
        FibApp.AppIdType?
    ];
}): FibApp.FibAppReq;
export declare function parse_req_resource_and_hdlr_type(req: Class_HttpRequest): {
    requestedResultType: FibApp.FibAppReqResourceType;
    requestedPayloadType: FibApp.FibAppReqResourceHandlerType;
};
