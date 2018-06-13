/// <reference path="req.d.ts" />

type ACLAct = 'create' | 'read' | 'write' | 'delete' | 'find'
type ACLAllAct = '*'

type ACLActString = ACLAct | ACLAllAct
type ACLActStringList = /* ACLAct | ACLAllAct |  */string[]

type ExtendModelNameType = string

type OrmFieldName = string
type ACLPermisionAllowedFieldListType = OrmFieldName[]
type ACLPermissionBooleanOrArrayType = boolean | ACLAct[] | ACLPermisionAllowedFieldListType
type ACLPermisionBooleanOrActActStringListType = boolean | ACLActStringList
type ACLPermisionBooleanType = boolean

type AClPermissionDescriptorKey = string | '*'

interface RoleActDescriptorStruct {
    /* with key AClPermissionDescriptorKey :start */
    create?: ACLPermissionBooleanOrArrayType
    read?: ACLPermissionBooleanOrArrayType;
    write?: ACLPermissionBooleanOrArrayType;
    delete?: ACLPermisionBooleanType;
    find?: ACLPermisionBooleanType;
    '*'?: ACLPermisionBooleanOrActActStringListType
    /* with key AClPermissionDescriptorKey :end */

    // invalid for entry{[id], roles}
    extends?: HashOfAssociationModelACLDefinition
}
type RoleActDescriptor = RoleActDescriptorStruct | boolean

type RoleKeyInRoleActDescriptionHash = string
interface RoleActDescriptorHash {
    [roleName: string/* RoleKeyInRoleActDescriptionHash */]: RoleActDescriptor
}
interface HashOfAssociationModelACLDefinition {
    // MODEL_NAME, '*'
    [extendModelName: string]: ACLDefinition | boolean
}

interface OACLDescriptorStruct extends RoleActDescriptorStruct {
}
type OACLDescriptor = OACLDescriptorStruct | boolean

type ACLGeneratorFn = (sess: FibAppSession) => ACLDefinition
type OACLGeneratorFn = (sess: FibAppSession) => OACLDefinition
type FibACLDef = ACLGeneratorFn | ACLDefinition
type FibOACLDef = OACLGeneratorFn | OACLDefinition

type FibACLDefResult = ACLDefinition

type ACLExtendModelNameType = string;
interface ACLToExntedModel {
}

// '*', [ID], 'roles'
type ACLDefineSubjectName = '*' | 'roles' | string

// key is ACLDefineSubjectName
interface ACLDefinition {
    // judge guest(all) visitor
    '*'?: RoleActDescriptor
    // judge visitor with role in Object.keys(roles)
    roles?: RoleActDescriptorHash
    // judge visitor with id = uid 
    [uid: string]: RoleActDescriptor
}

interface OACLDefinition extends ACLDefinition {}

type ArgActVarWhenCheck = 
    /**
     * for init, or undefined result
     */
    undefined |
    /**
     * for act to checkt
     */
    string |
    /**
     * for final access control check result
     */
    boolean |
    /**
     * for filter, when
     */
    RoleActDescriptor|
    /**
     * for filter, when `Array.isArray(acl) === true && act === 'read'`
     */
    ACLPermisionAllowedFieldListType
type ModelACLCheckResult = /* ArgActVarWhenCheck */boolean | string | ACLPermisionAllowedFieldListType

type ResultPayloadACLActWhenCheck = undefined | ACLPermissionBooleanOrArrayType

type ArgAclRoleValueTypeWhenCheck = undefined | ACLPermissionBooleanOrArrayType | RoleActDescriptorHash
type ACLRoleVarHostType = RoleActDescriptor
