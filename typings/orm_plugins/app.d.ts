import type { FxOrmNS, FxOrmModel } from '@fxjs/orm';
import type { FibApp } from '../Typo/app';
import ORM = require('@fxjs/orm');
/**
 * @description first initial plugin before all other plugins
 */
export default function (ormInstance: FibApp.FibAppORM, opts: FxOrmNS.ModelOptions): {
    beforeDefine: (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) => void;
    define: (m: FibApp.FibAppORMModel) => FibApp.FibAppORMModel<Record<string, ORM.FxOrmInstance.FieldRuntimeType>, Record<string, (...args: any) => any>>;
};
