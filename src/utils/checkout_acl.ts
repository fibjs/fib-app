import { FxOrmInstance, FxOrmModel } from '@fxjs/orm';
import * as util from 'util';
import { FibAppACL } from '../Typo/acl';

import { FibApp } from '../Typo/app';

export function default_session_for_acl (session_obj?: FibApp.FibAppSession | null): FibApp.FibAppSession {
    if (!session_obj || typeof session_obj !== 'object')
        session_obj = {};

    if (session_obj.id === undefined  || session_obj.id === null)
        session_obj.id = null;

    if (!Array.isArray(session_obj.roles))
        session_obj.roles = [];

    return session_obj;
}

function compute_acl_def (def: FibAppACL.FibACLDef, session: FibApp.FibAppSession, inst?: FxOrmInstance.Instance): FibAppACL.ACLDefinition | FibAppACL.OACLDefinition {
    if (!util.isFunction(def))
        return def as any

    const acl_def = def as FibAppACL.ACLGeneratorFn
    let acl = null
    if (inst) {
        acl = acl_def.call(inst, session)
    } else {
        acl = acl_def.call(null, session)
    }

    return acl
}

function compute_oacl_def (def: FibAppACL.FibACLDef, session: FibApp.FibAppSession, inst?: FxOrmInstance.Instance): FibAppACL.OACLDefinition {
    mount_associated_instance_hash(inst)
    return compute_acl_def(def, session, inst)
}

function mount_associated_instance_hash (robj: FxOrmInstance.Instance) {
    // TODO: validate if extend in one association type between obj and robj in DEBUG mode.
    if (!robj.hasOwnProperty('$associated_instances')) {
        Object.defineProperty(robj, '$associated_instances', {
            configurable: true,
            writable: false,
            value: {}
        })
    }
}

function set_associated_instance (obj: FxOrmInstance.Instance, robj: FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType) {
    if (!extend || !obj)
        return
    
    // TODO: validate if extend in one association type between obj and robj in DEBUG mode.
    mount_associated_instance_hash(robj)

    if (obj) {
        var oname = obj.model().model_name
        robj.$associated_instances[`${oname}@${extend}`] = obj
    }
}

/**
 * funnel style functions
 */
export const checkout_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, acl: FibAppACL.FibACLDef, extend?: FibAppACL.ACLExtendModelNameType): FibAppACL.RoleActDescriptor {
    var aclAct: FibAppACL.ActCheckoutStatusType = undefined;

    var _is_read = act === 'read';

    /**
     * 
     * @param _acl_role type of _acl_role is one description choice of ActCheckoutStatusType
     * 
     * @returns FibAppACL.ActCheckoutStatusType
     */
    function _checkout_aclhash(_acl_role: FibAppACL.RoleActDescriptor): FibAppACL.ActCheckoutStatusType {
        if (_acl_role === undefined)
            return;

        /*
            first, check whether _acl_role is AclPermissionType
            {
                'read': true,
                'create': ['field1', 'field2', 'field3', ...]
            }
        */
        if (_acl_role === false || _acl_role === true || Array.isArray(_acl_role)) {
            aclAct = _acl_role as FibAppACL.AclPermissionType;
            return true;
        }

        /*
            now, 
                - act made sense, (expected to be) string
            check whether AclPermissionDescriptorKey `act` exists.
            {
                'role1234': {
                    'read': true
                }
            }
        */
        aclAct = (_acl_role as any)[act];
        if (aclAct !== undefined)
            return _is_read ? aclAct : true;

        /*
            check whether AclPermissionDescriptorKey '*' exists.
            {
                'role1234': {
                    '*': true
                }
            }
        */
        aclAct = _acl_role['*'];
        if (aclAct !== undefined)
            return true;
    }

    /**
     * in `_checkout_acl_role`, no matter what arg `_act_role` is, 
     * it finally led to one explicit FibAppACL.AclPermissionType
     * 
     * @param _acl_role 
     * 
     * @returns FibAppACL.AclPermissionType
     */
    function _checkout_acl_role(_acl_role: FibAppACL.RoleActDescriptor): FibAppACL.ActCheckoutStatusType {
        if (_acl_role === undefined)
            return;

        /* now, _acl_role is(should be) FibAppACL.ActCheckoutStatusType */
        if (extend === undefined)
            return _checkout_aclhash(_acl_role);

        /* now, _acl_role is(should be) FibAppACL.RoleActDescriptor */
        var exts: FibAppACL.AssociationModelACLDefinitionHash | undefined = (_acl_role as FibAppACL.RoleActDescriptorStruct).extends;
        if (exts !== undefined) {
            /*
                check whether AclPermissionDescriptorKey `extend` exists in parent-AClPermissionDescriptor's 'extends' hash.
                {
                    '1234': {
                        'extends': {
                            'ext': {}
                        }
                    }
                }
            */
            if (_checkout_aclhash(exts[extend]))
                return true;

            /*
                check whether AclPermissionDescriptorKey `*` exists in parent-AClPermissionDescriptor's 'extends' hash.
                {
                    '1234': {
                        'extends': {
                            '*': {}
                        }
                    }
                }
            */
            return _checkout_aclhash(exts['*']);
        }
    }

    if (util.isFunction(acl))
        acl = compute_acl_def(acl, session);

    if (acl === null || acl === undefined)
        return;

    /*
        {
            '1234': {}
        }
    */
    if (session !== undefined) {
        if (_checkout_acl_role((acl as any)[session.id]))
            return aclAct;

        /*
            {
                'roles': {
                    'r1': {}
                }
            }
        */
        var roles: FibApp.UserRoleName[] | undefined = session.roles;
        if (roles !== undefined) {
            var role_acls = (acl as FibAppACL.ACLDefinition).roles;

            if (role_acls !== undefined) {
                for (var i = roles.length - 1; i >= 0; i--)
                    if (_checkout_acl_role(role_acls[roles[i]]))
                        return aclAct;
            }
        }
    }

    /*
    {
        '*': {}
    }
    */
    if (_checkout_acl_role((acl as any)['*']))
        return aclAct;

    return;
}

export const checkout_obj_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, obj: FxOrmInstance.Instance, extend?: FibAppACL.ACLExtendModelNameType): FibAppACL.RoleActDescriptor {
    var cls: FxOrmModel.Model = obj.model();

    var acl: FibAppACL.RoleActDescriptor;

    var _oacl: FibAppACL.FibACLDef = cls.OACL;
    if (util.isFunction(_oacl))
        _oacl = compute_oacl_def(_oacl, session, obj);

    acl = checkout_acl(session, act, _oacl, extend);
    if (acl === undefined)
        acl = checkout_acl(session, act, cls.ACL, extend);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(cls.associations));

    return acl;
}

export const checkout_robj_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ACLAct, obj: FxOrmInstance.Instance, robj: FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType): FibAppACL.RoleActDescriptor {
    var rcls: FxOrmModel.Model = robj.model();

    var acl: FibAppACL.RoleActDescriptor;

    var _oacl = rcls.OACL;
    if (util.isFunction(_oacl)) {
        set_associated_instance(obj, robj, extend)
        _oacl = compute_oacl_def(_oacl, session, robj);
    }

    acl = checkout_acl(session, act, _oacl);

    if (acl === undefined)
        acl = checkout_obj_acl(session, act, obj, extend);
    if (acl === undefined)
        acl = checkout_acl(session, act, rcls.ACL);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(rcls.associations));

    return acl;
}