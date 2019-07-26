## `app.api.*`

通过内部方法, 直接进行 rest 风格的操作, 详情可参考 [@types/app.d.ts] 中的 FibAppInternalApis.

- app.api.post: FibAppIneternalApiFunction__Post
- app.api.get: FibAppIneternalApiFunction__Get
- app.api.find: FibAppIneternalApiFunction__Find
- app.api.put: FibAppIneternalApiFunction__Put
- app.api.del: FibAppIneternalApiFunction__Del
- app.api.eget: FibAppIneternalApiFunction__Eget
- app.api.efind: FibAppIneternalApiFunction__Efind
- app.api.epost: FibAppIneternalApiFunction__Epost
- app.api.eput: FibAppIneternalApiFunction__Eput
- app.api.edel: FibAppIneternalApiFunction__Edel
- app.api.elink: FibAppIneternalApiFunction__Elink

如果你对它们的实现感兴趣, 可以参考 [src/classes] 目录下中的实现, 其中单实体的操作(post, get, find, put, del)在 [src/classes/base.ts] 中; 对实体的扩展示例的操作(eget, efind, epost, eput, edel, elink)的实现在 [src/classes/extend.ts]

FibAppInternalApis 中的所有所有 rest 操作函数, 内部都经过了 `app.filterRequest` 过滤. 

* `app.filterRequest: FibAppSetupChainFn`

注意该函数无返回值, 而是以最后一个参数作为回调函数. 更多详情可参考 [@types/app.d.ts](@types/app.d.ts) 

使用 `app.filterRequest` 为 app 定制个性化的路由
------------

`app.filterRequest` 是上述所有的实体相关的操作函数(所有的 rest 操作函数, 和可定制的 Model Function)的前置条件, 它主要做了两件事情:

1. 过滤原生的 HttpRequest 对象 request 为 FibAppReq 对象, 并传给 func 作为第一个参数;
1. 将 `request.json()` 的结果作为 FibAppReqData 类型对象, 并传给 func 作为最后一个参数;

由于 `fib-app` 本质上是一个 [mq.Routing] 对象, 你可以用其 API 定制更多的个性化的路由, 比如

```javascript
// 挂载一个静态目录
app.get('/static', http.fileHandler(path.resolve(__dirname, './static'), {}, true))
// 定制特别的 API
app.post('/__with_cls', (request) => {
  /**
   * 第二个参数传模型名, 表示寻找内置 model
   */
  app.filterRequest(request, 'person',
    /** 
     * @param req: FibAppReq
     * @param db: FibAppDb
     * @param __internal_model__: FxOrmNS.FibOrmFixedModel
     * @param data: FibAppData
     */
    (req, db, __internal_model__, data) => {
      // Do what you want to do
    }
  )
})
// 定制无关内置模型的 API
app.get('/__null_cls', (request) => {
  /**
   * 第二个参数传 '', 表示不寻找内置 model, 此时, 回调函数类型为 FibAppFilterableApiFunction__NullModel, 即第三个参数 __null_cls__ 为 null;
   */
  app.filterRequest(request, '',
    /** 
     * @param req: FibAppReq
     * @param db: FibAppDb
     * @param __null_cls__: null
     * @param data: FibAppData
     */
    (req, db, __null_cls__, data) => {
      // Do what you want to do
    }
  )
})
```

实际上, [Model Function](./app-model-function.md) 正是通过 `app.filterRequest` 实现的, 详情可参考 [src/classes/index.ts] 中关于 `app.post(':classname/:func', ...)` 的实现.

[mq.Routing]:http://fibjs.org/docs/manual/object/ifs/routing.md.html
[src/classes]:src/classes
[src/classes/index.ts]:src/classes/index.ts
[src/classes/base.ts]:src/classes/base.ts
[src/classes/extend.ts]:src/classes/extend.ts

### hasMany-extra read/epost/eput(beta)

...