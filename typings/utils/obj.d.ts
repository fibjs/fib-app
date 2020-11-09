/// <reference types="@fibjs/types" />
export declare function addHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, v: T): void;
export declare function addReadonlyHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, getter: (...args: any) => T): void;
