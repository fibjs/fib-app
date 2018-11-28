## View Function

通过在 orm 的 opts 中添加 `viewFunctions` , 可以定义该模型相关的视图处理函数; 基于此, 你可以使得 fib-app 具有直接输出 html 的能力: 当来自客户端的 http 请求头是 `Accept: text/html` 时, fib-app 会尝试使用 `viewFunctions` 定义的函数处理视图. 参考下例:

```javascript
const fpug = require('fib-pug')
const ejs = require('ejs')

db.define('user', {
    name: String,
    sex: ["male", "female"],
    age: Number,
    password: String,
    salt: String
}, {
    ...
    viewFunctions: {
        /**
         * @ctx `Accept: text/html`
         * 
         * 当客户端发起  GET /user/1 时, 会调用此函数;
         * 
         * 如果 id=1 的 user 存在, 则 result = {sucess: ...}; 否则 result = {error: ...}
         */
        get (apiResult) {
            let tpl = fpug.compile(
                    fs.readTextFile(path.resolve(__dirname, './tpl.get.pug'))
                )
            return {
                success: tpl(apiResult && {user: apiResult.success} || {})
            }
        },
        /**
         * @ctx `Accept: text/html`
         * 
         * 当客户端发起  GET /user 时, 会调用此函数
         * 
         * apiResult = {sucess: ...};
         */
        find (apiResult) {
            let tpl = ejs.compile(
                    fs.readTextFile(path.resolve(__dirname, './tpl.find.ejs'))
                )
            return {
                success: tpl(apiResult && {users: apiResult.success} || {})
            }
        },
        /**
         * @ctx `Accept: text/html`
         * 
         * 当客户端发起  GET /user/profile 时, 会调用此函数.
         * 
         * 由于 static: true, 此时 handler 的第一个参数 _ 恒为 null
         * 
         * @note 注意该路由与 /user/1 同属于 /:classname/:id 格式, 但 fib-app
         * 会优先尝试调用该方法.
         * 
         */
        profile: {
            static: true,
            /** _ is null */
            handler (_) {
                let tpl = ejs.compile(
                        fs.readTextFile(path.resolve(__dirname, './tpl.profile.ejs'))
                    )
                return {
                    success: tpl()
                }
            }
        }
    }
});
```

#### 调用优先级
当客户端发起 `Accept: text/html` 的 http 请求时, viewFunctions 的调用优先级是这样的:

- `/:classname/:idOrFunc` ==> `viewFunctions.idOrFunc` > `viewFunctions.get`
- `/:classname` ==> `viewFunctions.function`

#### 定义选项

```javascript
viewFunctions: {
  get: {
    // {boolean}, default false
    static: true,
    // static === true, apiResult 为 null; 否则, apiResult 为 {success: ...} 或 {error: ...}
    handler (apiResult) {
      return {
        success: ...
      }
    }
  },
  /**
   * 此时 等价于 
   * {
   *    static: true,
   *    handler: func2
   * }
   */
  func2 () {
    return {
      success: ...
    }
  }
}
```

1. 如果 `viewFunction` 的 `static` 为 true, `viewFunction` 函数的第一个参数为 null;
1. 如果 `viewFunctions` 没有 `viewFunction.get`, `viewFunction.find`, `viewFunction.eget`, `viewFunction.efind` 定义时, 所有该导向这些`viweFunction`的请求都等价于直接请求对应的 **fib-app 内部 API 方法**. 
1. 如果 `viewFunction` 的 `static` 不为 true, 如果存在对应的 **fib-app 内部 API 方法** , 则 `viewFunction` 函数的第一个参数是该对应方法的返回值;

关于第 2 点, 比如 Model user 有如下定义

```javascript
viewFunctions: {
}
```

此时发起 {`Accept: text/html`, `GET /user/1`} 请求, 不会通过 viewFunctions 处理, 该请求等价于 {`Accept: applicaton/json`, `GET /user/1`} 请求的结果. 同理, 此时发起 {`Accept: text/html`, `GET /user`} 请求等价于发起 {`Accept: applicaton/json`, `GET /user`} 请求.

关于第 3 点, 比如 Model user 有如下定义
```javascript
viewFunctions: {
  func1: {
    static: false,
    handler (apiResult) {
      
    }
  }
}
```

此时发起 {`Accept: text/html`, `GET /user/func1`} 请求, 由于它可以被认为是请求 id=fun1 的 user 的信息, 因此, 如果 id=func1 的 user 真的存在且可以被请求道, 则此时 handler 的第一个参数 apiResult 就是 `{ success: [userInfo] }`; 若 id=fun1 的 user 不存在或者因ACL 权限无法被用户访问到, 则 apiResult 为 `{ error: ... }`

这个特性意味着你可以对某些 Model 的特定对象做特殊处理, 比如, 对 id=888 的 User 设定为 Lucky Dog, 返回特别的 html 给客户端 :)

### viewFunction 对比 function

#### 共同点
`viewFunction` 与 `function` 很相似

1. 都要返回符合 [`FibAppResponse` 格式](./@types/app.d.ts) 的对象
1. 都是 ORM Model 的定义选项

#### 区别
1. `function` 处理 fib-app 中的 `POST /:classname/:func` 请求; `viewFunctions` 处理 fib-app 中的 `GET /:classname/:func` 且 `Accept` 头包含 `text/html` 的请求
1. `function` 函数的返回值, fib-app 会尝试以 json 的方式写入 `HttpResponse`; `viewFunction` 函数的返回值, fib-app 会尝试以文本的方式写入 `HttpResponse`
