/// <reference types="@fxjs/orm" />
import util = require('util')
import coroutine = require('coroutine')

export function getInstanceManyAssociations (instance: FxOrmNS.Instance): FxOrmNS.InstanceAssociationItem_HasMany[] {
    return instance.__opts.many_associations
}

export function getInstanceManyAssociation (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany {
    const many_assocs = getInstanceManyAssociations(instance)
    
    return many_assocs.find(a => a.name === extend_name)
}

export function getInstanceOneAssociations (instance: FxOrmNS.Instance): FxOrmNS.InstanceAssociationItem_HasOne[] {
    return instance.__opts.one_associations
}

export function getInstanceOneAssociation (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasOne {
    const one_assocs = getInstanceOneAssociations(instance)
    
    return one_assocs.find(a => a.name === extend_name)
}

export function check_hasmany_extend_extraprops (instance: FxOrmNS.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany | false {
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