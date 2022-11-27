import { FxOrmModel, FxOrmInstance } from '@fxjs/orm';
import { FibApp } from '../Typo/app';
import { FibAppACL } from '../Typo/acl';
export declare const _get: (cls: FxOrmModel.Model, id: FibApp.AppIdType, session: FibApp.FibAppSession, act?: FibAppACL.ACLActString) => FibApp.FibAppInternalCommObj;
export declare const _eget: (cls: FxOrmModel.Model, id: FibApp.IdPayloadVar | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString) => FibApp.FibAppInternalCommExtendObj;
export declare const _egetx: (cls: FxOrmModel.Model, id: FibApp.IdPayloadVar | FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString) => {
    riobj: FibApp.FibAppInternalCommExtendObj;
    iobj: FibApp.FibAppInternalCommExtendObj;
};
