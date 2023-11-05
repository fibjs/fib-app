import { FibApp } from '../Typo/app';

type ApiRouteContext = Parameters<FibApp.FibAppOpts['customizeApiRoute']>[0];

type GetHandlerType<T, K extends ApiRouteContext['routeType']> = T extends {
    routeType: K
    handler: infer H;
  } ? { [P in K]: H }[K] : never

type FibAppApiHandlers = {
    [K in ApiRouteContext['routeType']]: GetHandlerType<ApiRouteContext, K>
}

type BaseFilter = {
    basecls: string,
    extend?: string,
    id?: string,
    rid?: string,
};

type PostFuncFilter = { func: string | string[] };

function onApiRoute<T extends ApiRouteContext['routeType']>(
    ctx: ApiRouteContext,
    routeType: T,
    _filters: T extends 'http-postfunc' ? (BaseFilter & PostFuncFilter) : (string | BaseFilter),
    userDefineHandler: FibAppApiHandlers[T]
) {
    if (routeType !== ctx.routeType) return null;

    const filters: BaseFilter & Partial<PostFuncFilter> = typeof _filters === 'string' ? { basecls: _filters } : _filters;

    const funcs = (Array.isArray(filters.func) ? filters.func : [filters.func]).filter(Boolean);

    if (routeType === 'http-postfunc' && !funcs.length) {
        throw new Error(`[onApiRoute] func name is required for route with type 'http-postfunc'`);
    }

    return (...args: Parameters<typeof userDefineHandler>) => {
        const [, _maybeBase, _idOrFunc, _maybeExtend, _eid] = args;
        if (_maybeBase !== filters.basecls) return ;

        if (filters.extend) {
            if (_maybeExtend !== filters.extend) return ;
            if (filters.rid && _eid !== filters.rid) return ;
        }

        if (routeType === 'http-postfunc' && !funcs.includes(_idOrFunc as string)) {
            return ;
        }

        return userDefineHandler.apply(null, args);
    };
}

export function makeCustomizeApiRoute(
    maker: (ctx: {
        onApiRoute: typeof onApiRoute
    }) => FibApp.FibAppOpts['customizeApiRoute'],
    options?: {
        allowCustomizePostApiRoute?: FibApp.FibAppOpts['customizeApiRoute']['allowCustomizePostApiRoute']
    }
) {
    const customize = maker({
        onApiRoute,
    });

    if (options?.allowCustomizePostApiRoute) {
        Object.defineProperty(customize, 'allowCustomizePostApiRoute', {
            value: true,
            writable: false,
            configurable: false,
        });
    }

    return customize;
}