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

    interface FilteredFindByInfo<T = any> {
        accessor: string,
        conditions: FxSqlQuerySubQuery.SubQueryConditions
        accessor_payload: FxOrmQuery.IChainFind | FxOrmModel.Model
    }
}
