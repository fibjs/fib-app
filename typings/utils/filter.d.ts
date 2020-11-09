import type { FibApp } from '../Typo/app';
import type { FxOrmInstance } from '@fxjs/orm/typings/Typo/instance';
import type { FibAppACL } from '../Typo/acl';
import type { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
export declare function filter<T = FxOrmInstance.Instance | FibApp.FibDataPayload>(obj: FxOrmInstance.Instance | FibApp.FibDataPayload, keys: boolean | string | string[], readonly_keys?: FibAppACL.RoleActDescriptor): T;
export declare function filter_ext(session: FibApp.FibAppSession, obj: FxOrmNS.Instance): FxOrmInstance.Instance;
