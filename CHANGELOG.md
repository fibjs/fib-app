
v1.15.5 / 2022-11-20
==================

  * chore: update fib-session version to fix type conflicts with fib-pool
  * fix: func name

v1.15.4 / 2022-11-05
====================

  * update diagram.

v1.15.3 / 2022-10-13
====================

  * Release v1.15.3
  * chore: some pointless changes.
  * feat: adapt to latest orm version.
  * feat: upgrade fib-typify, lock typescript to 4.5.x

v1.15.2 / 2022-09-24
====================

  * Release v1.15.2
  * feat: update internal plugin timestamp, add default field comment.
  * feat: update lock.

v1.15.1 / 2022-09-20
====================

  * Release v1.15.1
  * feat: upgrade orm version to enable comment on property.
  * typo: remove usage for `FxOrmNS.ModelPropertyDefinitionHash`
  * chore: update lockfile

v1.15.0 / 2022-08-08
====================

  * Release v1.15.0
  * deps: declare graphql's version to avoid version mismatch.
  * test: add test case about return json in viewFunctions
  * feat: support define options `queryKeyWhiteList.where` and `queryKeyWhiteList.findBy`
  * chore: update .gitignore
  * fix: add package-lock.json
  * fix: typo fix.
  * feat: robust change about `app.api.get`, stop query if no valid id provided for serial-type key property (#49)
  * feat: upgrade to orm 1.13 to support postgresql. (#48)
  * ci: fix ci in github actions.
  * chore: repo clean.
  * chore: upgrade dependencies.
  * chore: upgrade dependencies and adjust.
  * use nomnoml to render er graph.

v1.14.1 / 2020-11-10
====================

  * Release v1.14.1
  * chore: upgrade dependpencies.
  * Merge pull request #46 from luoyhang003/master
  * fix: graphql query error without session.
  * chore: update npm config.

v1.14.0 / 2020-11-10
====================

  * Release v1.14.0
  * chore: add fibjs version to be tested.
  * feat: adjust fibjs 0.30.0, 0.31.0.
  * chore: upgrade types.

v1.13.43 / 2019-09-16
=====================

  * Release v1.13.43
  * feat: remove hard dependency on 'fib-session'

v1.13.42 / 2019-08-19
=====================

  * Release v1.13.42
  * feat: support re-sync after calling `app.use`.
  * robust change, break change for plugin `timestamp`

v1.13.41 / 2019-08-03
=====================

  * Release v1.13.41
  * feat: add FibAppClass['eventor'], support `onReceiveFibPushAct` event

v1.13.40 / 2019-07-30
=====================

  * Release v1.13.40
  * feat: tuning, allow pass `session` to options of `app.rpcCall`.
  * upgrade fib-rpc & @fibjs/ci

v1.13.39 / 2019-07-29
=====================

  * Release v1.13.39
  * bugfix: little fix about testkits.http-server

v1.13.38 / 2019-07-29
=====================

  * Release v1.13.38
  * feat: better process of rpc methods based on `fib-rpc`'s interceptor
  * fix travis ci config.
  * support FibAppOpts['websocketPathPrefix']
  * support rpcMethods operation for fib-app
  * support `app.rpcCall`
  * add vuepress based doc src

v1.13.37 / 2019-07-19
=====================

  * Release v1.13.37
  * upgrade orm minor version

v1.13.36 / 2019-07-12
=====================

  * Release v1.13.36
  * feat: lazyload viz.js

v1.13.35 / 2019-06-28
=====================

  * Release v1.13.35
  * bugfix: typo fix
  * feat: add FibAppOpts['hideErrorStack']
  * typo robust.
  * bugfix: use 'prepend' instead of 'overwrite' when change models' hook.
  * throw Error with error message rather string only.

v1.13.34 / 2019-06-25
=====================

  * Release v1.13.34
  * remove pointless `extends` field in model
  * allow elink auto redirect to epost
  * use @fxjs/orm@1.10.2
  * use `model_define_opts.webx` as FibAppORMModel's webx first-class config source, whose options' fallback to field in`model_define_opts`
  * upgrade fib-pool
  * support Hooks
  * upgrade dependencies; mark 'fib-session' to devDependencies.
  * typo fix.
  * use latest @fxjs/orm, replace '@types/fibjs' with '@fibjs/types'
  * upgrade @fxjs/orm; add test script.

v1.13.33 / 2019-04-15
=====================

  * Release v1.13.33
  * code clean.
  * upgrade @fxjs/orm to fix probabel fatal error.
  * feat, filter_request: support default session object.
  * [test] change default sqlite db uri.

v1.13.32 / 2019-04-10
=====================

  * Release v1.13.32
  * upgrade orm.
  * fix literal mistake.

v1.13.31 / 2019-03-30
=====================

  * Release v1.13.31
  * [db pool]support reload orm.
  * typo change.
  * fix logic when fetch Extend Association field.

v1.13.30 / 2019-03-27
=====================

  * Release v1.13.30
  * upgrade orm to fix bug about orm hooks.
  * fix peer dependencies.

v1.13.29 / 2019-03-27
=====================

  * Release v1.13.29
  * assert there's always non-empty `this.id` in OACL function internally.
  * use `prependHook` in orm's Helpers instead.
  * upgrade orm to use correct hook patch.

v1.13.28 / 2019-03-25
=====================

  * Release v1.13.28
  * support orm level option `rest.model.disable_access_composite_table`.
  * code robust for better performance and sqlite compat in fibjs <= 0.22
  * fix mismatch between find conditions(`findby`) with found results in when multiple-level associations.
  * equivalent transformation of test cases for next feature.
  * add test cases about extend operation.
  * code robust
  * refactor internal app api `post`, `epost`.

v1.13.27 / 2019-03-20
=====================

  * Release v1.13.27
  * fix: unrecognized table alias when do `findBy*` in self-hasone-assoc.
  * code style change.

v1.13.26 / 2019-03-19
=====================

  * Release v1.13.26
  * feat: throw error when trying to find invalid association name for `findby`.
  * fix: wrong arg when _find in base-extend rest find.
  * test case code normalization.

v1.13.25 / 2019-03-16
=====================

  * Release v1.13.25
  * support use `join_where` option in query for has-many assoc.
  * apply model's field `associations`.
  * normalize test case code.
  * make mysql as default test driver; fix error of test case in mysql.
  * 1.13.25-dev
  * upgrade @fxjs/orm. apply its feature about literal where conditions.

v1.13.24 / 2019-03-07
=====================

  * Release v1.13.24
  * code clean.
  * code clean.
  * fix error when generating diagram with `extendsTo` association type.
  * upgrade core dependency.

v1.13.23 / 2019-03-03
=====================

  * Release v1.13.23
  * support using rest api for extendsTo-type association.
  * rename `WEBX_CI_DB_DEBUG` to `WEBX_TEST_DB_DEBUG`.
  * test case fix.
  * upgrade @fxjs/orm; fix bad implements for findby-query in hasOne-type association.

v1.13.22 / 2019-02-20
=====================

  * Release v1.13.22
  * upgrade @fxjs/orm.

v1.13.21 / 2019-01-15
=====================

  * Release v1.13.21
  * support comma separated orders.

v1.13.20 / 2019-01-14
=====================

  * Release v1.13.20
  * fix README.md
  * fix: downgrade the check for 'findby' from OACL level to ACL level.

v1.13.19 / 2019-01-14
=====================

  * Release v1.13.19
  * support `findby ` in FibAppReq.

v1.13.18 / 2019-01-11
=====================

  * Release v1.13.18
  * fix: wrong intialization for opts.batchPathPrefix.

v1.13.17 / 2019-01-09
=====================

  * Release v1.13.17
  * upgrade orm.
  * typo adjust.
  * upgrade orm.

v1.13.16 / 2019-01-08
=====================

  * Release v1.13.16
  * upgrade @fxjs/orm to new minor version, adjust typo.

v1.13.15 / 2019-01-06
=====================

  * Release v1.13.15
  * fix wrong initialization for uuid orm plugin.

v1.13.14 / 2019-01-05
=====================

  * Release v1.13.14
  * normalize types about orm pool.
  * upgrade fib-pool.
  * robust.
  * code format.
  * typo fix.
  * upgrade fib-typify.

v1.13.13 / 2018-12-25
=====================

  * Release v1.13.13
  * fix: lack of call to oldHook by `prependHook`.

v1.13.12 / 2018-12-24
=====================

  * Release v1.13.12
  * refactor dbPool based on orm's plugin mechanism.
  * add some test cases about graphql feature.
  * normalize declartion of internal functions; upgrade @fxjs/orm
  * upgrade @fxjs/orm.

v1.13.11 / 2018-12-17
=====================

  * Release v1.13.11
  * support `viewServices` options in model define Properties.
  * little typo fix.
  * update script 'build''.
  * upgrade version of @fxjs/orm

v1.13.10 / 2018-12-13
=====================

  * Release v1.13.10
  * [grahpql]support paging in *2m assoc (including reverse-hasOne and hasMany)
  * comment update.
  * more clean internal find work-flow.
  * add test case about extend fields' filter.

v1.13.9 / 2018-12-10
====================

  * Release v1.13.9
  * upgrade orm version
  * [injected rest request info] little fix; robust for `attachInteralApiRequestInfoToInstnace`.
  * [injected rest request info] normalize name of var/setting-key.
  * use model-level setting key 'rest.model.inject_request_info' as switch of inject-rest-request-information for model.
  * support inject fib-app about rest request information to orm as hidden property.
  * code clean.
  * code clean; emit error from extend-operations such as api.post/api.epost as soon as possible.
  * [graphql] better fatal error info

v1.13.8 / 2018-12-09
====================

  * Release v1.13.8
  * doc update.
  * support paging query in graphql.
  * robust for orm setting `rest.model.keep_association.post.*`.
  * fix bad orm setting key, do some code format.
  * code clean.
  * fix wrong implement for recursive epost, and add test case to prove/cover that.
  * fix keyname of orm option about 'keep_association_beforewrite' of rest base operation.

v1.13.7 / 2018-12-07
====================

  * Release v1.13.7
  * upgrade @fxjs/orm
  * better error_info 403001.

v1.13.6 / 2018-12-03
====================

  * Release v1.13.6
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
