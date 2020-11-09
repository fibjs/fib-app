/// <reference types="@fibjs/types" />
export declare function get_is_debug(): boolean;
declare type TConsoleOp = Extract<keyof typeof console, 'reset' | 'log' | 'debug' | 'info' | 'notice' | 'warn' | 'error' | 'crit' | 'alert' | 'dir' | 'time' | 'timeElapse' | 'timeEnd' | 'trace' | 'assert' | 'print'>;
export declare function debugFunctionWrapper(fn: (...args: any[]) => any, loglevel?: TConsoleOp): (...args: any[]) => any;
export {};
