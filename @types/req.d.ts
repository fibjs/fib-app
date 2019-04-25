/// <reference types="@fibjs/types" />

/// <reference path="common.d.ts" />

declare namespace FibApp {
    type ReqWhere = FxOrmQuery.QueryConditions
    type ReqWhereExists = FxOrmQuery.ChainWhereExistsInfo[]

    interface ReqFindByItem {
        extend: string
        on?: FxSqlQuerySubQuery.SubQueryConditions
        where?: FxSqlQuerySubQuery.SubQueryConditions
        options?: FxOrmModel.ModelOptions__Findby
    }

    interface FilteredFindByInfo<T = any> {
        accessor: string,
        conditions: FxSqlQuerySubQuery.SubQueryConditions
        accessor_payload: FxOrmQuery.IChainFind | FxOrmModel.Model
    }
}
