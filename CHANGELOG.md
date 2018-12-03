
n.n.n / 2018-12-03
==================

  * upgrade dependency, return error when wrong format data provided to hasMany-extend's extra props.

v1.13.5 / 2018-12-03
====================

  * Release v1.13.5
  * function declaration robust; best test case.
  * support hasMany-extra 's epost/eput operation.
  * add testcase about hasMany-extra query; add utils/orm-assoc.ts and apply it.
  * typo repair, support hasmany-extra-query in graphql.
  * better doc about acl.
  * changelog fix.

v1.13.4 / 2018-11-30
====================

  * Release v1.13.4
  * robust.

v1.13.3 / 2018-11-30
====================

  * Release v1.13.3
  * make common property's name customizable.
  * support intercerpt association fields in rest api's extend-operation.
  * upgrade orm dependency.

v1.13.2 / 2018-11-29
====================

  * Release v1.13.2
  * normalize acl about typo.

v1.13.1 / 2018-11-29
====================

  * Release v1.13.1
  * add hidden property 'associated_instances' to `this` object in OACL.
  * typo and README.md normalization.
  * better variable declaration.
  * make fib-app ts-debugable
  * make '@types/fibjs' as distribution dependencies.

v1.13.0 / 2018-11-28
====================

  * Release v1.13.0
  * add appveyor ci config.
  * checkout back from '@fxjs/webx'
  * v1.12.1

v1.12.1 / 2018-07-16
====================

  * Merge pull request #22 from richardo2016/feat/beautify_code
  * feat: beautify internal structure.
  * Merge pull request #21 from richardo2016/master
  * testcase: for batch tasks
  * feat: save 'extraProperties' information when generating one db model.
  * feat: support graphql query in batch-task
  * Merge pull request #20 from richardo2016/master

v1.12.0 / 2018-07-09
====================

  * Release v1.12.0
  * mark model with special style when generate viz in `app.diagram`
  * support option 'graphqlTypeMap'
  * support 'no_graphql' for FibAppOrmModelDefOptions
  * little type fix.
  * Merge pull request #19 from richardo2016/master
  * Merge remote-tracking branch 'orig/master'
  * Merge pull request #18 from richardo2016/master

v1.11.5 / 2018-07-01
====================

  * Release v1.11.5
  * fix computation of `p.statusCode` in root batching request.
  * fix implement of 'app.put'
  * fix type about FibAppSession
  * update build npm script.
  * little type fix about graphql.
  * Release v1.11.4
  * upgrade version of '@types/fibjs', fix implement of `app.eput`

v1.11.4 / 2018-06-29
====================

  * Release v1.11.4
  * upgrade version of '@types/fibjs', fix implement of `app.eput`
  * add src to .npmignore
  * Merge pull request #17 from richardo2016/master

v1.11.3 / 2018-06-19
====================

  * Release v1.11.3
  * upgrade 'fib-session', and do little code clean.
  * upgrade dependency
  * Merge pull request #16 from richardo2016/master

v1.11.2 / 2018-06-17
====================

  * 1.11.2
  * merge and fix conflict.
  * adapt 'fib-push' with version >= '1.2.x', then upgrade it to latest version.
  * fix test error of fib-push.
  * Merge remote-tracking branch 'orig/master'
  * add ci test version of fibjs.
  * [types] little fix for AppDbPool<T>
  * Merge pull request #15 from richardo2016/master

v1.11.1 / 2018-06-14
====================

  * 1.11.1
  * upgrade version of '@types/fibjs'
  * [types] little change for `FibAppReqQuery`
  * little fix for types
  * Merge pull request #14 from richardo2016/feat/typify

v1.11.0 / 2018-06-13
====================

  * 1.11.0
  * migrate src to typescript.
  * v1.10.0
  * Merge pull request #13 from richardo2016/feat/support_count
  * [graphql]support `countlist_xxx` style, make test server base configurable.
  * v1.9.3
  * return null extern object in graphql.
  * v1.9.2
  * Merge pull request #12 from richardo2016/dev
  * Merge pull request #11 from richardo2016/master
  * some change.
  * lock version of 'viz.js'
  * add error statusCode in graphql.
  * Merge pull request #8 from richardo2016/feat/text_fix
  * correct some text/varname mistake.
  * v1.9.0
  * Merge pull request #7 from vickyjam/master
  * graphql返回date为ISOString格式
  * v 1.8.5
  * Merge pull request #6 from Jaraxuss/mysql
  * update: 将updatedAt,createdAt字段的time属性设置为true，使得MySQL下这两个字段的类型由date为datetime，更符合业务场景
  * v1.8.4
  * Merge pull request #4 from vickyjam/master
  * Merge branch 'master' of https://github.com/fibjs/fib-app
  * support json data in graphql.
  * Merge branch 'master' of https://github.com/fibjs/fib-app
  * use created_by to set createdBy.
  * 1.8.1
  * orm validation失败时候，抛出错误信息给控制台和前台
  * Merge pull request #3 from vickyjam/master
  * Merge pull request #2 from onceyoung/dev
  * move the test folder to the demo folder
  * 1. throw error info to console and response 2. add test command
  * fix http header issue of graphql
  * remove push from app.
  * refactor create, insert createdBy directly.
  * remove nouse depend module.
  * fix test case for graphql.
  * support find in graphql.
  * fix reversed error.
  * fix graphql model error.
  * fix graphql query error.
  * update document.
  * 1.7.0
  * refactor api.
  * fix error message in graphql.
  * v1.6.1 use base object directly, do not query record again.
  * 1.6.0
  * use rest api to fetch data in graphql.
  * support diagram render.
  * not match base "*" for extend access control.
  * add extend acl document.
  * format code style.
  * change object acl interface.
  * delete half chinese chars.
  * add object acl document.
  * delete half chinese chars.
  * add acl document.
  * fix style.
  * extend docs.
  * Merge branch 'master' of https://github.com/xicilion/fib-app
  * v1.3.0
  * modify style.
  * document about find method.
  * remove half chinese char.
  * write some documents.
  * rename reserved field name.
  * add GrapgQL test case.
  * v1.2.0
  * support acl in extend delete.
  * support extend acl in find method.
  * chat test case.
  * support create acl.
  * put extend acl.
  * use find acl in hasMany extend object.
  * refactor check_obj_acl
  * filter extend data.
  * refactor find.
  * refactor check_acl.
  * refactor filter.
  * add base obj extend acl check.
  * acl of extend get
  * refactor: define role acl in group.
  * extend link acl.
  * support multi level acl.
  * todo
  * Merge branch 'new-app'
  * add uuid options.
  * rename method.
  * refactor rlink.
  * refactor extend get.
  * create acl, object acl.
  * rename relation to extend.
  * basic acl.
  * multi level auto create.
  * m:n test
  * 1:n reverse.
  * todo
  * relation test case.
  * more test case.
  * refactor classes.post.
  * 1.1.2
  * new app.
  * sync  database init.
  * fix chat/1/messages
  * v1.10
  * use date.
  * push
  * refactor.
  * support crateBy
  * refactor
  * refactor error, interface.
  * organize the file structure.
  * change statusCode.
  * refactor
  * support post relation object array.
  * support put relation objecgt.
  * support create relation object.
  * refactor
  * Revert "remove nouse api"
  * remove nouse api
  * Reverse check permissions
  * support acl callback.
  * split code.
  * support read relation object.
  * change put relation api, send rid in body.
  * use + acl in relation access.
  * support + in acl.
  * graphql support acl.
  * Simplified code
  * support json filer args.
  * support list options.
  * graphql support hasMany.
  * graphql support hasone.
  * split graphql code.
  * simple graphql.
  * save relations.
  * do not fix the path name.
  * use query
  * support delete relation.
  * support get relation.
  * auto get field id and ACL.
  * support create relation.
  * set default ACL when opts not exists.
  * support batch.
  * delete char.
  * delete char.
  * readme
  * add find case.
  * support field acl.
  * default catch.
  * remove nouse param.
  * refactor.
  * more object acl.
  * support object acl.
  * basic acl.
  * use query to send param.
  * set functions in define.
  * auto define createAt and updateAt.
  * support createAt/updateAt.
  * support custom method.
  * refactor
  * add session
  * refactor api and rename package.
  * remove err.API in convert_where.
  * select fields use only.
  * support count
  * support $or
  * set default limit and limit range(1-1000)
  * basic classes.
