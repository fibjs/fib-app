import { FxOrmInstance } from '@fxjs/orm/typings/Typo/instance';
export declare function filterInstanceAsItsOwnShape<T = any, T2 = T>(inst: T | T[], mapper: (inst: T, idx?: number, arr?: any) => T2): T2 | T2[];
export declare const map_to_result: (ro: FxOrmInstance.Instance) => {
    id: any;
    createdAt: any;
};
export declare function shallowCopy(data: object): any;
