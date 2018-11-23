import { transformFieldsList2GraphQLInnerString } from '../testkits/http-client'
import { getIsDebug } from './debug';

export function bind (app: FibApp.FibAppClass) {
    app.utils = {
        transformFieldsList2GraphQLInnerString,
        get isDebug (): boolean {
            return getIsDebug()
        }
    }
}
