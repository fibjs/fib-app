import type { FxOrmNS, FxOrmModel } from '@fxjs/orm';
import type { FibApp } from '../Typo/app';
/**
 * @description first initial plugin before all other plugins
 */
export default function (ormInstance: FibApp.FibAppORM, opts: FxOrmNS.ModelOptions): {
    beforeDefine: (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) => void;
    define: (m: FibApp.FibAppORMModel) => FibApp.FibAppORMModel;
};
