import { FxOrmNS } from '@fxjs/orm';
import { FibAppACL } from '../Typo/acl';
import { FibApp } from '../Typo/app';
export declare function default_session_for_acl(session_obj?: FibApp.FibAppSession | null): FibApp.FibAppSession;
/**
 * funnel style functions
 */
export declare const checkout_acl: (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, acl: FibAppACL.FibACLDef, extend?: FibAppACL.ACLExtendModelNameType) => FibAppACL.RoleActDescriptor;
export declare const checkout_obj_acl: (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, obj: FxOrmNS.Instance, extend?: FibAppACL.ACLExtendModelNameType) => FibAppACL.RoleActDescriptor;
export declare const checkout_robj_acl: (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, obj: FxOrmNS.Instance, robj: FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType) => FibAppACL.RoleActDescriptor;
