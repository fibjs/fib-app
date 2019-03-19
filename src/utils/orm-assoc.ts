/// <reference types="@fxjs/orm" />
import util = require('util')
import ORM = require('@fxjs/orm');
const Helpers = ORM.Helpers;

export function check_hasmanyassoc_with_extraprops (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany | false {
    var has_many_association = instance.__opts.many_associations.find(a => a.name === extend_name);
    var has_extra_fields = has_many_association && has_many_association.props && util.isObject(has_many_association.props) && Object.keys(has_many_association.props).length

    return has_extra_fields ? has_many_association : false
}

export function extra_save (instance: FxOrmNS.Instance, rinstance: FxOrmNS.Instance, _many_assoc: FxOrmNS.InstanceAssociationItem_HasMany, extra: any, just_set: boolean = false) {
    if (Array.isArray(extra))
        return extra.forEach(item => extra_save(instance, rinstance, _many_assoc, item))

    var hasCheck = instance[_many_assoc.hasAccessor + 'Sync'](rinstance)
    if (just_set && hasCheck) {
        /**
         * it has the same purpose of `instance[_many_assoc.setAccessor + 'Sync']`,
         * but there's one bug in patched instance's [_many_assoc.setAccessor]
         **/ 
        instance[_many_assoc.delAccessor + 'Sync'](rinstance, extra)
        instance[_many_assoc.addAccessor + 'Sync'](rinstance, extra)
    }
    else
        instance[_many_assoc.addAccessor + 'Sync'](rinstance, extra)
}

export function getAccessorForPost (
    assoc_info: FxOrmModel.Model['associations'][any],
    assoc_host_instance: FxOrmInstance.Instance,
    opts: {
        has_associated_instance_in_many?: boolean
    }
) {
    const assoc = assoc_info.association;
    let setterName: string;

    switch (assoc_info.type) {
        case 'hasOne':
            setterName = assoc.setAccessor
            break
        case 'hasMany':
            const { has_associated_instance_in_many = false } = opts || {};
            setterName = has_associated_instance_in_many ? assoc.setAccessor : assoc.addAccessor
            break
        case 'extendsTo':
            setterName = assoc.setAccessor
            break
    }

    // when pass assoc_host_instance, check if setterName in it
    if (assoc_host_instance && typeof assoc_host_instance[setterName] === 'function')
        return setterName;

    return setterName;
}

export function isSingleLink (type: string, association: FxOrmAssociation.InstanceAssociationItem) {
    return (type === 'hasOne'/*  && !association.reversed */) || type === 'extendsTo'
}

export function shouldSetSingle (
    assoc_info: FxOrmModel.Model['associations'][any]
) {
    return assoc_info.type === 'hasOne' && !assoc_info.association.reversed
}

export function getOneMergeIdFromAssocHasOne (
    association: FxOrmAssociation.InstanceAssociationItem
) {
    return Object.keys(association.field)[0]
}

export function getOneMergeIdFromAssocExtendsTo (
    association: FxOrmAssociation.InstanceAssociationItem
) {
    return Object.keys(association.field)[0]
}

export function addHiddenProperty<T = any> (instance: FxOrmInstance.Instance, p: string, v: T) {
	Object.defineProperty(instance, p, {
        value: v,
        writable: true,
		enumerable: false
	});
}

export function addHiddenLazyLinker (instance: FxOrmInstance.Instance, linkers: Function[] = []) {
    linkers = (instance.$webx_lazy_linkers || []).concat(linkers)
    
    addHiddenProperty<Function[]>(instance, '$webx_lazy_linkers', linkers)
}

export function execLinkers (linkers: Function[], ...args: any[]) {
    ;(linkers || []).forEach(linker => linker.apply(null, args));
}

export function buildCleanInstance (
    model: FxOrmModel.Model,
    data: FxOrmInstance.InstanceDataPayload,
    keys_to_left?: string[]
) {
    if (!Array.isArray(keys_to_left))
        keys_to_left = getValidDataFieldsFromModel(model);

    data = util.pick(data, keys_to_left);
    
    const inst = new model({ [model.id + '']: data.id });

    keys_to_left.forEach(key => {
        inst.set(key, data[key])
    })

    return inst;
}

export function buildPersitedInstance (
    model: FxOrmModel.Model,
    id: FibApp.AppIdType,
    extra_data?: FxOrmInstance.InstanceDataPayload
): FxOrmInstance.Instance {
    const inst = new model(id || undefined)
    if (extra_data)
        inst.extra = extra_data

    return inst
}

export function getValidDataFieldsFromModel (model: FxOrmModel.Model) {
    return []
        .concat(
            Object.keys(model.allProperties)
        )
        .concat(
            Object.keys(model.associations)
                .filter(k => model.associations[k].type !== 'extendsTo')
        )
        .concat('extra')
}