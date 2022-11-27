/// <reference lib="es2017" />
import type { FxOrmModel, FxOrmQuery } from '@fxjs/orm';
import { FibApp } from '../Typo/app';
export declare function query_filter_where(req: FibApp.FibAppReq): unknown;
export declare function query_filter_join_where(req: FibApp.FibAppReq): unknown;
interface QueryFilterFindbyResult {
    exists: FxOrmQuery.ChainWhereExistsInfo[] | null;
    findby_infos: FibApp.FilteredFindByInfo[];
}
export declare function query_filter_findby(findby: FibApp.FibAppReqQuery['findby'], base_model: FxOrmModel.Model, opts: {
    extend_in_rest?: string;
    req: FibApp.FibAppReq;
}): QueryFilterFindbyResult;
export declare function query_filter_skip(query: FibApp.FibAppReqQuery): number;
export declare function query_filter_limit(query: FibApp.FibAppReqQuery): number;
export declare function query_filter_order(query: FibApp.FibAppReqQuery): string[];
export declare function is_count_required(query: FibApp.FibAppReqQuery): boolean;
export declare function found_result_selector(result: FibApp.FibAppIneternalApiFindResult, fetch_field?: 'results' | 'count' | ''): number | any[] | FibApp.FibAppIneternalApiFindResult<any>;
export declare function parse_json_queryarg<T>(req: FibApp.FibAppReq, k: 'findby' | 'join_where' | 'where'): T | null;
export {};
