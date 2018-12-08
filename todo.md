* reverse 测试
  - hasOne 测试
  - hasMany 测试
* relation 创建
* relation createBy 优化测试

* create relation 自动创建

* create acl 支持 field

------------------------------------
* relation acl
* autoFetch acl
* multi level update?
* acl 抛错
  - create 抛错
  - read 抛错
  - update 抛错
  - find 抛错
* 异常错误抛出信息处理

* graphql 复用 api
* batch 复用 api


* 索引，orm 自建

field：link 权限修改
extend：二级对象权限
无 extend：继承 rel_cls 缺省权限
obj 权限优先

elink
field: write


eput
extend:cls: write


epost
extend:cls: create


efind
extend:cls: find


eget
extend:cls: read


edel
extend:cls: delete

## use cases

* [x] 重写用例，用例独立运行, uuid
  - 修正 uuid 模式下, 关联模型用 id 关联时, 关联字段在 mysql 中分配长度过小的问题.

* [ ] 写覆盖 OACL 为 Function 的测试
* [ ] orm.settings[get/set]
    - `rest.model.${cls.model_name}.extend.keep_association_beforewrite`: 在 rest api 对 extend 操作时, 保持实例的关联对象对象信息
* [x] graphql extra 查询的测试用例
* [ ] hasMany-extend operation 的测试用例
    - [x] epost: extra from item in rdata List
    - [ ] epost: extra from rdata
    - [ ] epost: reverse
    - [ ] epost: 错误用例
    - [x] epost: extra from item in rdata List
    - [ ] epost: extra from rdata
    - [ ] eput: reverse
    - [ ] eput: 错误用例
* [ ] extend operation
    - [x] epost
        - [x] recursive epost
    - [x] eget
    - [x] efind
    - [x] eput

## new features

* [x] support graphql hasMany extra query
* [ ] support hasMany-extend operation
    - [x] epost
    - [ ] epost: reverse
    - [x] eput
    - [ ] eput: reverse
* [ ] support hasMany-extend reversed epost

* [ ] support built-in rpc feature
* [ ] support built-in emitter