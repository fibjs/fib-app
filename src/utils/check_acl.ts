/// <reference path="../../@types/acl.d.ts" />
/// <reference path="../../@types/req.d.ts" />
/// <reference path="../../@types/common.d.ts" />

import * as util from 'util';
import FibOrmNS from 'orm';
const orm = require("orm")

/**
 * funnel style functions
 */

export const check_acl = function (session: FibAppSession, act: ArgActVarWhenCheck, acl: FibACLDef, extend?: ACLExtendModelNameType): ModelACLCheckResult {
    var aclAct: ResultPayloadACLActWhenCheck = undefined;

    /**
     * 
     * @param _acl_role type of _acl_role is one description item in RoleActDescriptionHash's ACLPermissionBooleanOrArrayType
     * 
     * @returns undefined | boolean
     */
    function _check_acl_act(_acl_role: ArgAclRoleValueTypeWhenCheck): boolean {
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
            aclAct = _acl_role;
            return true;
        }

        /*
            now, 
                - _acl_role is (should be) RoleActDescriptionHash
                - act made sense, (expected to be) RoleKeyInRoleActDescriptionHash
            check whether AClPermissionDescriptorKey `act` exists.
            {
                'role1234': {
                    'read': true
                }
            }
        */
        aclAct = (
            _acl_role as RoleActDescriptorHash
        )[act as RoleKeyInRoleActDescriptionHash] as (/* RoleActDescriptor ->*/boolean | undefined);
        if (aclAct !== undefined)
            return true;

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
     * in `_check_acl_role`, no matter how arg `_act_role` is, 
     * it finally led to one explicit **arg** with type 'ArgAclRoleValueTypeWhenCheck(ACLPermissionBooleanOrArrayType)',
     * 
     * then, return the the **result** `_check_acl_act(arg)`
     * 
     * @param _acl_role 
     * 
     * @returns ArgAclRoleValueTypeWhenCheck
     */
    function _check_acl_role(_acl_role: ACLRoleVarHostType | ArgAclRoleValueTypeWhenCheck): boolean {
        if (_acl_role === undefined)
            return;

        /* now, _acl_role is(should be) ArgAclRoleValueTypeWhenCheck */
        if (extend === undefined)
            return _check_acl_act(_acl_role as ArgAclRoleValueTypeWhenCheck);

        /* now, _acl_role is(should be) ACLRoleVarHostType */
        var exts: HashOfAssociationModelACLDefinition | undefined = (_acl_role as RoleActDescriptorStruct).extends;
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
            if (_check_acl_act(exts[extend]))
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
            return _check_acl_act(exts['*']);
        }
    }

    if (util.isFunction(acl)) {
        acl = (acl as ACLGeneratorFn)(session);
    }
    if (acl === null || acl === undefined)
        return;

    /*
        {
            '1234': {}
        }
    */
    if (_check_acl_role(acl[session.id]))
        return aclAct;

    /*
        {
            'roles': {
                'r1': {}
            }
        }
    */
    var roles: UserRoleName[] | undefined = session.roles;
    if (roles !== undefined) {
        var role_acls = (acl as ACLDefinition).roles;

        if (role_acls !== undefined) {
            for (var i = roles.length - 1; i >= 0; i--)
                if (_check_acl_role(role_acls[roles[i]]))
                    return aclAct;
        }
    }

    /*
    {
        '*': {}
    }
    */
    if (_check_acl_role(acl['*']))
        return aclAct;

    return;
}

export const check_obj_acl = function (session: FibAppSession, act: ArgActVarWhenCheck, obj: FibOrmNS.FibOrmFixedModelInstance, extend?: ACLExtendModelNameType): ModelACLCheckResult {
    var cls: FibOrmNS.FibOrmFixedModel = obj.model();

    var acl: ArgActVarWhenCheck;

    var _oacl: FibACLDef = cls.OACL;
    if (util.isFunction(_oacl))
        _oacl = (_oacl as ACLGeneratorFn).call(obj, session);

    acl = check_acl(session, act, _oacl, extend);
    if (acl === undefined)
        acl = check_acl(session, act, cls.ACL, extend);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(cls.extends));

    return acl;
}

export const check_robj_acl = function (session: FibAppSession, act: ArgActVarWhenCheck, obj: FibOrmNS.FibOrmFixedModelInstance, robj: FibOrmNS.FibOrmFixedModelInstance, extend: ACLExtendModelNameType): ModelACLCheckResult {
    var cls: FibOrmNS.FibOrmFixedModel = obj.model();
    var rcls: FibOrmNS.FibOrmFixedModel = robj.model();

    var acl: ArgActVarWhenCheck;

    var _oacl = rcls.OACL;
    if (util.isFunction(_oacl))
        _oacl = _oacl.call(robj, session);

    acl = check_acl(session, act, _oacl);

    if (acl === undefined)
        acl = check_obj_acl(session, act, obj, extend);
    if (acl === undefined)
        acl = check_acl(session, act, rcls.ACL);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(rcls.extends));

    return acl;
}
