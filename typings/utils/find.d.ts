import { FxOrmInstance, FxOrmModel, FxOrmQuery } from '@fxjs/orm';
import { FibAppACL } from '../Typo/acl';
import { FibApp } from '../Typo/app';
declare const _default: (req: FibApp.FibAppReq, finder: FxOrmQuery.IChainFind['find'], finder_model: FxOrmModel.Model, ext_info?: {
    base_instance: FxOrmInstance.Instance;
    extend_in_rest: FibAppACL.ACLExtendModelNameType;
}) => FibApp.FibAppIneternalApiFindResult<FxOrmInstance.Instance>;
export = _default;
