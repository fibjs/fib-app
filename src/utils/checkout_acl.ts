/// <reference path="../../@types/acl.d.ts" />
/// <reference path="../../@types/req.d.ts" />
/// <reference path="../../@types/common.d.ts" />

import * as util from 'util';

/**
 * funnel style functions
 */

export const checkout_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ArgActVarWhenCheck, acl: FibAppACL.FibACLDef, extend?: FibAppACL.ACLExtendModelNameType): FibAppACL.ModelACLCheckResult {
    var aclAct: FibAppACL.ResultPayloadACLActWhenCheck = undefined;

    var _is_read = act === 'read';

    /**
     * 
     * @param _acl_role type of _acl_role is one description item in RoleActDescriptionHash's ACLPermissionBooleanOrArrayType
     * 
     * @returns undefined | boolean
     */
    function _checkout_acl_acthash(_acl_role: FibAppACL.ArgAclRoleValueTypeWhenCheck): boolean {
        if (_acl_role === undefined)
            return;

        /*
            first, check whether _acl_role is ACLPermissionBooleanOrArrayType
            {
                'read': true,
                'create': ['field1', 'field2', 'field3', ...]
            }
        */
        if (_acl_role === false || _acl_role === true || Array.isArray(_acl_role)) {
            aclAct = _acl_role as FibAppACL.ACLPermisionBooleanOrActActStringListType;
            return true;
        }

        /*
            now, 
                - _acl_role is (should be) RoleActDescriptionHash
                - act made sense, (expected to be) FibAppACL.RoleKeyInRoleActDescriptionHash
            check whether AClPermissionDescriptorKey `act` exists.
            {
                'role1234': {
                    'read': true
                }
            }
        */
        aclAct = (
            _acl_role as FibAppACL.RoleActDescriptorHash
        )[act as FibAppACL.RoleKeyInRoleActDescriptionHash] as (/* RoleActDescriptor ->*/boolean | undefined);
        if (aclAct !== undefined)
            return _is_read ? aclAct : true;

        /*
            check whether AClPermissionDescriptorKey '*' exists.
            {
                'role1234': {
                    '*': true
                }
            }
        */
        aclAct = _acl_role['*'] as (/* RoleActDescriptor->*/boolean | undefined);
        if (aclAct !== undefined)
            return true;
    }

    /**
     * in `_checkout_acl_role`, no matter what arg `_act_role` is, 
     * it finally led to one explicit **arg** with type 'FibAppACL.ArgAclRoleValueTypeWhenCheck(ACLPermissionBooleanOrArrayType)',
     * 
     * then, return the the **result** `_checkout_acl_acthash(arg)`
     * 
     * @param _acl_role 
     * 
     * @returns FibAppACL.ArgAclRoleValueTypeWhenCheck
     */
    function _checkout_acl_role(_acl_role: FibAppACL.ACLRoleVarHostType | FibAppACL.ArgAclRoleValueTypeWhenCheck): boolean {
        if (_acl_role === undefined)
            return;

        /* now, _acl_role is(should be) FibAppACL.ArgAclRoleValueTypeWhenCheck */
        if (extend === undefined)
            return _checkout_acl_acthash(_acl_role as FibAppACL.ArgAclRoleValueTypeWhenCheck);

        /* now, _acl_role is(should be) FibAppACL.ACLRoleVarHostType */
        var exts: FibAppACL.HashOfAssociationModelACLDefinition | undefined = (_acl_role as FibAppACL.RoleActDescriptorStruct).extends;
        if (exts !== undefined) {
            /*
                check whether AClPermissionDescriptorKey `extend` exists in parent-AClPermissionDescriptor's 'extends' hash.
                {
                    '1234': {
                        'extends': {
                            'ext': {}
                        }
                    }
                }
            */
            if (_checkout_acl_acthash(exts[extend]))
                return true;

            /*
                check whether AClPermissionDescriptorKey `*` exists in parent-AClPermissionDescriptor's 'extends' hash.
                {
                    '1234': {
                        'extends': {
                            '*': {}
                        }
                    }
                }
            */
            return _checkout_acl_acthash(exts['*']);
        }
    }

    if (util.isFunction(acl)) {
        acl = (acl as FibAppACL.ACLGeneratorFn)(session);
    }
    if (acl === null || acl === undefined)
        return;

    /*
        {
            '1234': {}
        }
    */
    if (_checkout_acl_role(acl[session.id]))
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

    /*
    {
        '*': {}
    }
    */
    if (_checkout_acl_role(acl['*']))
        return aclAct;

    return;
}

export const checkout_obj_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ArgActVarWhenCheck, obj: FxOrmNS.FibOrmFixedModelInstance, extend?: FibAppACL.ACLExtendModelNameType): FibAppACL.ModelACLCheckResult {
    var cls: FxOrmNS.FibOrmFixedModel = obj.model();

    var acl: FibAppACL.ArgActVarWhenCheck;

    var _oacl: FibAppACL.FibACLDef = cls.OACL;
    if (util.isFunction(_oacl))
        _oacl = (_oacl as FibAppACL.ACLGeneratorFn).call(obj, session);

    acl = checkout_acl(session, act, _oacl, extend);
    if (acl === undefined)
        acl = checkout_acl(session, act, cls.ACL, extend);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(cls.extends));

    return acl;
}

export const checkout_robj_acl = function (session: FibApp.FibAppSession, act: FibAppACL.ArgActVarWhenCheck, obj: FxOrmNS.FibOrmFixedModelInstance, robj: FxOrmNS.FibOrmFixedModelInstance, extend: FibAppACL.ACLExtendModelNameType): FibAppACL.ModelACLCheckResult {
    var cls: FxOrmNS.FibOrmFixedModel = obj.model();
    var rcls: FxOrmNS.FibOrmFixedModel = robj.model();

    var acl: FibAppACL.ArgActVarWhenCheck;

    var _oacl = rcls.OACL;
    if (util.isFunction(_oacl))
        _oacl = _oacl.call(robj, session);

    acl = checkout_acl(session, act, _oacl);

    if (acl === undefined)
        acl = checkout_obj_acl(session, act, obj, extend);
    if (acl === undefined)
        acl = checkout_acl(session, act, rcls.ACL);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(rcls.extends));

    return acl;
}
