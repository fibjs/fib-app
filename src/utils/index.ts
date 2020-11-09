import { transform_fieldslist_2_graphql_inner_string } from '../testkits/http-client'
import { get_is_debug } from './debug';

import { FibApp } from '../Typo/app';

export function bind (app: FibApp.FibAppClass) {
    app.utils = {
        transform_fieldslist_2_graphql_inner_string,
        get isDebug (): boolean {
            return get_is_debug()
        }
    }
}
