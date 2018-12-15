/// <reference path="common.d.ts" />

declare namespace FibAppRest {
    interface PostResponse {
        createdAt: string
        id: FibApp.AppIdType
    }

    interface PutResponse {
        updatedAt: string
        id: FibApp.AppIdType
    }

    type GetResponse<T> = T
    type FindReponse<T> = T[]

    interface DelReponse {
        id: FibApp.AppIdType
    }

    interface EPostResponse {
        createdAt: string
        id: FibApp.AppIdType
    }

    interface EPutResponse {
        updatedAt: string
        id: FibApp.AppIdType
    }

    type EGetResponse<T> = T
    type EFindReponse<T> = T[]

    interface EDelReponse {
        id: FibApp.AppIdType
    }
}