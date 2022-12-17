import { FxOrmInstance, FxOrmModel, FxOrmNS, FxOrmAssociation } from '@fxjs/orm';
import { FibApp } from '../Typo/app';
export declare function check_hasmanyassoc_with_extraprops(instance: FxOrmInstance.Instance, extend_name: string): FxOrmNS.InstanceAssociationItem_HasMany | false;
export declare function extra_save(instance: FxOrmInstance.Instance, rinstance: FxOrmInstance.Instance, _many_assoc: FxOrmNS.InstanceAssociationItem_HasMany, extra: any, just_set?: boolean): void;
export declare function getSyncAccessorForPost(assoc_info: FxOrmModel.Model['associations'][any], assoc_host_instance: FxOrmInstance.Instance, opts: {
    has_associated_instance_in_many?: boolean;
}): string;
export declare function isSingleLink(type: string, association: FxOrmAssociation.InstanceAssociationItem): boolean;
export declare function shouldSetSingle(assoc_info: FxOrmModel.Model['associations'][any]): boolean;
export declare function getOneMergeIdFromAssocHasOne(association: FxOrmAssociation.InstanceAssociationItem): string;
export declare function getOneMergeIdFromAssocExtendsTo(association: FxOrmAssociation.InstanceAssociationItem): string;
export declare function addHiddenLazyLinker__AfterSave(instance: FxOrmInstance.Instance, linkers?: Function[]): void;
export declare function addHiddenLazyLinker__BeforeSave(instance: FxOrmInstance.Instance, linkers?: Function[]): void;
export declare function execLinkers(linkers: Function[], ...args: any[]): void;
export declare function buildCleanInstance(model: FxOrmModel.Model, data: FxOrmInstance.InstanceDataPayload, opts: {
    keys_to_left?: string[];
}): FxOrmInstance.Instance<Record<string, FxOrmInstance.FieldRuntimeType>, Record<string, (...args: any) => any>>;
export declare function buildShellInstance(model: FxOrmModel.Model, id: FibApp.AppIdType, extra_data?: FxOrmInstance.InstanceDataPayload): FxOrmInstance.Instance;
export declare function getValidDataFieldsFromModel(model: FxOrmModel.Model, keep_associations?: boolean): any[];
export declare function safeUpdateHasManyAssociatedInstanceWithExtra(assoc: FxOrmAssociation.InstanceAssociationItem_HasMany, host_instance: FxOrmInstance.Instance, associated_instance: FxOrmInstance.Instance, has_associated_instance_in_many: boolean): void;
