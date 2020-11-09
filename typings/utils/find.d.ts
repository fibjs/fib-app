import { FxOrmInstance } from '@fxjs/orm/typings/Typo/instance';
import { FxOrmModel } from '@fxjs/orm/typings/Typo/model';
import { FxOrmQuery } from '@fxjs/orm/typings/Typo/query';
import { FibAppACL } from '../Typo/acl';
import { FibApp } from '../Typo/app';
declare const _default: <ReponseT = any>(req: FibApp.FibAppReq, finder: FxOrmQuery.IChainFind['find'], base_model: FxOrmModel.Model, ext_info?: {
    base_instance: FxOrmInstance.Instance;
    extend_in_rest: FibAppACL.ACLExtendModelNameType;
}) => FibApp.FibAppIneternalApiFindResult<FxOrmInstance.Instance>;
export = _default;
