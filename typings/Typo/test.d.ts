/// <reference types="@fibjs/types" />
import type { FibApp } from "./app";
export declare namespace FibAppTest {
    interface FibAppTestClientOptions {
        modelName: string;
        httpClient?: Class_HttpClient;
    }
    interface FibAppTestHttpClientOptions extends FibAppTestClientOptions {
        /**
         * @deprecated use `appUrlBase` instead
         */
        serverBase?: string;
        appUrlBase?: string;
        apiUrlBase?: string;
        graphQlUrlBase?: string;
    }
    interface FibAppTestHttpClient {
        create: (obj: object) => FibApp.AppIdType;
        get: <T extends any = object>(id: FibApp.AppIdType) => T;
        getByGraphQL: <T extends any = object>(id: FibApp.AppIdType, fields: string[] | string) => T;
        find: <T extends any = object>(condition: object | string) => T;
        findByGraphQL: <T extends any = object>(condition: object | string) => T;
        update: <T extends any = object>(id: FibApp.AppIdType, obj: object) => T;
        delete: <T extends any = object>(id: FibApp.AppIdType) => T;
        link: <T extends any = object>(id: FibApp.AppIdType, extName: string, ext_id: FibApp.AppIdType) => T;
        unlink: <T extends any = object>(id: FibApp.AppIdType, extName: string, ext_id: FibApp.AppIdType) => T;
        findExt: <T extends any = object>(id: FibApp.AppIdType, extName: string, condition: object | string) => T;
        createExt: <T extends any = object>(id: FibApp.AppIdType, extName: string, data: object) => T;
        updateExt: <T extends any = object>(id: FibApp.AppIdType, extName: string, edata: object) => T;
        postFunction: <T extends any = object>(funcName: string, data: object) => T;
    }
}
