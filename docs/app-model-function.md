## Model Function

你可以在 Model Function 中调用 app.api 上的 rest 风格函数, 来定制属于你的函数, 比如

```JavaScript
module.exports = db => {
  var Person = db.define('person', {
    name: String,
    sex: ["male", "female"],
    age: Number
  }, {
    functions: {
      /**
       * getUserByNicknames 为 FibAppORMModelFunction 类型
       * 
       * @param fibAppReq
       *    fibAppReq 包含了
       *    - session
       *    - query object
       *    - 原生的 request 信息
       *        - 如果 request 在传给 fib-app 之前经过过滤被挂载了别的属性, 这些属性也有效, 比如 fib-session 对 request 添加的字段
       *          - request.session, 与上一层的 session 为同一对象
       *          - request.sessionid
       * 
       * @param fibAppReqData
       *    来自 POST 请求, `request.json()`, 默认为 {}
       */
      getUserByNicknames (fibAppReq, fibAppReqData) {
        // rest get 操作
        var data = app.api.get(fibAppReq, db, Person, fibAppReqData.id)
        // rest post 操作
        var postRes = app.api.post(fibAppReq, db, Person, fibAppReqData.id, {
          name: 'test',
          sex: 'male',
          age: 18
        })

        if (postRes.error)
          throw postRes.error

        // 方法的返回值必须为 FibAppModelFunctionResponse 类型
        return {
          success: postRes.success
        }
      }
    }
  });
};
```
 

绝大多数权限可以通过 ACL 控制完成，不需要通过 Function 来完成基于对象的权限. 对于复杂数据操作, 你通过自定义 Model Function 来完成, 如: 
- 基于数据的权限, 比如根据审批状态，赋予不同用户组权限
- 多项修改, 比如需要修改多条数据库记录
- 基础 Rest 操作的组合
- 其它任何你认为需要的操作

**NOTICE** Model Function 都是 `FibAppORMModelFunction` 类型, 需通过 POST `/:classname/:func` 的方式进行调用, 在调用到 func 之前, request 已通过 `app.filterRequest` 进行过滤.