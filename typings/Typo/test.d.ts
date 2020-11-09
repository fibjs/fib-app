import type { FibApp } from "./app";
export declare namespace FibAppTest {
    interface FibAppTestClientOptions {
        modelName: string;
    }
    interface FibAppTestHttpClientOptions extends FibAppTestClientOptions {
        serverBase?: string;
        appUrlBase?: string;
        apiUrlBase?: string;
        graphQlUrlBase?: string;
    }
    interface FibAppTestHttpClient {
        create: (obj: object) => FibApp.AppIdType;
        get: (id: FibApp.AppIdType) => object;
        getByGraphQL: (id: FibApp.AppIdType, fields: string[] | string) => object;
        find: (condition: object | string) => object;
        findByGraphQL: (condition: object | string) => object;
        update: (id: FibApp.AppIdType, obj: object) => object;
        delete: (id: FibApp.AppIdType) => object;
        link: (id: FibApp.AppIdType, extName: string, ext_id: FibApp.AppIdType) => object;
        unlink: (id: FibApp.AppIdType, extName: string, ext_id: FibApp.AppIdType) => object;
        findExt: (id: FibApp.AppIdType, extName: string, condition: object | string) => object;
        createExt: (id: FibApp.AppIdType, extName: string, data: object) => object;
        updateExt: (id: FibApp.AppIdType, extName: string, edata: object) => object;
    }
}
