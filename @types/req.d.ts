/// <reference types="fibjs" />

/// <reference path="common.d.ts" />

declare namespace FibApp {
    interface ReqWhere {
        [key: string]: FxOrmNS.QueryConditionAtomicType
        or?: FxOrmNS.QueryConditionAtomicType[]
    }
}
