/// <reference types="fibjs" />

/// <reference path="common.d.ts" />

declare namespace FibApp {
    type ReqWhere = FxOrmQuery.QueryConditions
    type ReqWhereExists = FxOrmQuery.ChainWhereExistsInfo[]

    interface ReqFindByItem {
        extend: string
        on?: FxSqlQuerySubQuery.SubQueryConditions
        where?: FxSqlQuerySubQuery.SubQueryConditions
    }
}
