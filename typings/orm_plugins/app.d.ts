import { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
import { FibApp } from '../Typo/app';
/**
 * @description first initial plugin before all other plugins
 */
export default function (ormInstance: FibApp.FibAppORM, opts: FxOrmNS.ModelOptions): {
    beforeDefine: (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) => void;
    define: (m: FibApp.FibAppORMModel) => FibApp.FibAppORMModel;
};
