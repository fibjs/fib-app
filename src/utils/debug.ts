export function get_is_debug () {
    return !!(process.env as any).FIBAPP_DEBUG
}

type TConsoleOp = Extract<keyof typeof console,
    | 'reset'
    | 'log'
    | 'debug'
    | 'info'
    | 'notice'
    | 'warn'
    | 'error'
    | 'crit'
    | 'alert'
    | 'dir'
    | 'time'
    | 'timeElapse'
    | 'timeEnd'
    | 'trace'
    | 'assert'
    | 'print'
>

export function debugFunctionWrapper (
    fn: (...args: any[]) => any,
    loglevel: TConsoleOp = 'error'
) {
    const self = arguments[arguments.length - 1]
    
    if (get_is_debug()) {
        const origFn = fn
        fn = function (...args) {
            try {
                return origFn.apply(self, args)
            } catch (e) {
                console[loglevel].apply(null, ['[fib_app] debugFunctionWrapper\n', e.stack])
            }
        }
    }

    return fn
}