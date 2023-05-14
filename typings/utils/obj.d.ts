/// <reference types="@fibjs/types" />
export declare function addHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, v: T): void;
export declare function addReadonlyHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, getter: (...args: any) => T): void;
/**
 * @description for point from sqlite, which stored as text actually
 */
export declare function unwrapQuote(stringVal: string): string;
export declare function safeParseJson<T extends object>(input: string | T, fallbackValue?: any): T;
