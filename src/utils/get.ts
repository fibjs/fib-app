import util = require('util');
import ORM = require('@fxjs/orm');
const Helpers = ORM.Helpers;

import { err_info } from '../utils/err_info';
import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';
import { FibApp } from '../Typo/app';
import { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
import { FibAppACL } from '../Typo/acl';

function isInvalidNumber (v: string | number) {
    v = parseInt(v as any);

    return isNaN(v);
}

export const _get = function (cls: FxOrmNS.Model, id: FibApp.AppIdType, session: FibApp.FibAppSession, act?: FibAppACL.ACLActString): FibApp.FibAppInternalCommObj {
    var iobj = <FibApp.FibAppInternalCommObj>{ inst: null };

    const intPrimaryProp = Object.values(Helpers.pickProperties(cls, (p) =>
        (p.key || p.klass === 'primary') && (p.type === 'serial' || p.type === 'integer')
    ))[0];

    if (intPrimaryProp && isInvalidNumber(id)) {
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);
    }

    iobj.inst = cls.find().where({
        id: id
    }).firstSync()

    if (iobj.inst === null)
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);

    if (act) {
        var acl = checkout_obj_acl(session, act, iobj.inst);
        if (!acl)
            return err_info(4030001, {classname: cls.model_name}, cls.cid);
        iobj.acl = acl;
    }

    return iobj;
};

export const _eget = function (cls: FxOrmNS.Model, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): FibApp.FibAppInternalCommExtendObj {
    return _egetx(cls, id, extend, rid, session, act).riobj
}

function wrap_error (err: FibApp.FibAppResponse) {
    return {
        riobj: err,
        iobj: err
    }
}

export const _egetx = function (cls: FxOrmNS.Model, id: FibApp.IdPayloadVar | FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType, session: FibApp.FibAppSession, act: FibAppACL.ACLActString): {
    riobj: FibApp.FibAppInternalCommExtendObj,
    iobj: FibApp.FibAppInternalCommExtendObj
} {
    var rel_assoc_info = cls.associations[extend];
    if (rel_assoc_info === undefined)
        return wrap_error(
            err_info(4040001, {
                classname: extend
            }, cls.cid)
        )

    var iobj: FibApp.AppInternalCommunicationObj;

    if (util.isObject(id)) {
        iobj = {
            inst: id as FxOrmNS.Instance
        };
        id = (id as any).id;
    } else {
        iobj = {
            inst: (cls as any).find().where({
                id: id
            }).firstSync()
        };

        if (iobj.inst === null)
            return wrap_error(
                err_info(4040002, {
                    id: id,
                    classname: cls.model_name
                }, cls.cid)
            );
    }

    var __opt,
        is_extendsTo = rel_assoc_info.type === 'extendsTo',
        rel_type = rel_assoc_info.type,
        key_model = rel_assoc_info.association.model,
        assoc = Helpers.getAssociationItemFromInstanceByExtname(rel_assoc_info.type, iobj.inst, extend);

    switch (rel_type) {
        default:
            throw new Error(`invalid rel_assoc_info.type ${rel_type}`)
        case 'extendsTo':
            const assoc_id = assoc.model.id.length > 1 ? assoc.model.id.filter(x => x !== 'id')[0] : assoc.model.id[0]
            if (!assoc_id)
                __opt = null
            else
                __opt = assoc.model.find({ [`${assoc_id}`]: id }).limit(1);
            break
        case 'hasOne':
            if (rel_assoc_info.association.reversed)
                __opt = iobj.inst[assoc.getAccessor].call(iobj.inst);
            else {
                var rid1 = iobj.inst[Object.keys(assoc.field)[0]];
                if (rid === undefined)
                    rid = rid1;
                else if (rid != rid1)
                    return wrap_error(
                        err_info(4040002, {
                            id: rid,
                            classname: `${cls.model_name}.${extend}`
                        }, rel_assoc_info.association.model.cid)
                    );
                __opt = rel_assoc_info.association.model.find();
            }
            break
        case 'hasMany':
            __opt = iobj.inst[assoc.getAccessor].call(iobj.inst);
            break
    }

    var riobj: FibApp.FibAppInternalCommExtendObj = {
        base: iobj.inst,
        inst: is_extendsTo ? 
            ( !__opt ? null : __opt.firstSync() )
            : __opt.where({ id: rid }).firstSync()
    };

    if (is_extendsTo && riobj.inst === null) {
        return {
            riobj,
            iobj
        }
    }

    if (riobj.inst == null)
        return wrap_error(
            err_info(4040002, {
                id: rid,
                classname: `${cls.model_name}.${extend}`
            }, key_model.cid)
        );

    if (act) {
        var acl = checkout_robj_acl(session, act, iobj.inst, riobj.inst, extend);
        if (!acl)
            return wrap_error(
                err_info(4030001, {classname: cls.model_name}, key_model.cid)
            );
        riobj.acl = acl;
    }

    return {
        riobj,
        iobj
    };
};