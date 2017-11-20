* 重写用例，用例独立运行, uuid

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
