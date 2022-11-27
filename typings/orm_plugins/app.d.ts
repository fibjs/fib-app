import type { FxOrmModel } from '@fxjs/orm';
import type { FibApp } from '../Typo/app';
import ORM = require('@fxjs/orm');
/**
 * @description first initial plugin before all other plugins
 */
export default function (ormInstance: FibApp.FibAppORM, plugin_opts: FxOrmModel.ModelDefineOptions): {
    beforeDefine: (name: string, properties: Record<string, FxOrmModel.ComplexModelPropertyDefinition>, opts: FxOrmModel.ModelDefineOptions) => void;
    define: (m: FibApp.FibAppORMModel) => FibApp.FibAppORMModel<Record<string, ORM.FxOrmInstance.FieldRuntimeType>, Record<string, (...args: any) => any>>;
};
