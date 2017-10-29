# fib-app
fibjs 应用程序基础 api 框架

## Install

```sh
npm install fib-app [--save]
```

## Test

```sh
fibjs test
```

## 建立基础脚本

```JavaScript
const http = require('http');
const util = require('util')
const Session = require('fib-session')
const App = require('../');

var app = new App('sqlite:test.db', {});
app.db.use(require('./defs/person'));

var session = new Session(new util.LruCache(20000), {
    timeout: 60 * 1000
});

var svr = new http.Server(8080, [
    session.cookie_filter,
    {
        '/1.0': app.handler
    }
]);
svr.run(;
```
其中 `person` 是 Model 定义模块，内容如下：
```JavaScript
const orm = require('fib-orm');

module.exports = db => {
    db.define('person', {
        name: String,
        sex: ["male", "female"],
        age: Number
    });
};
```
这是一个标准的 orm 定义，同样可以使用 orm 的其它功能，比如类型检查，事件等。

完成这样的数据定义，便直接拥有了一整套符合 REST api 规范的接口调用，包括：
```sh
POST /person    // 创建对象
GET /person/${id}      // 读取对象
PUT /person/${id}      // 修改对象
DELETE /person/${id}   // 删除对象
GET /person            // 查询对象列表


PUT /person/${id}/wife // 添加关系
POST /person/${id}/child // 创建一个关系对象
GET /person/${id}/child/${rid} // 查询 hasMany 关系其中一项
GET /person/${id}/wife // 查询关系
PUT /person/${id}/child/${rid} // 修改指定关系对象
DELETE /person/${id}/wife/${rid} // 删除关系 ？？？


POST /person/ // 批处理，或者 GraphQL 查询

POST /person/${func} // 调用自定义函数
```

## ACL
可以通过定义 Model 的 ACL 控制数据权限，根据需求可以精确到对象属性级别的控制。比如:
```JavaScript
const orm = require('fib-orm');

module.exports = db => {
    db.define('blog', {
        title: String,
        detail: String，
        note: String
    }, {
        ACL: {
            '*': {
                'read': ['title', 'detail']
            },
            'role:user': {
                'create': true
            }
            ":owner": {
                'read': true,
                "write": true
            }
        }
    });
};
```
定义了一个 Model，只允许 user 用户组的用户创建，作者本人可以读取所有字段，而其它任何人只允许读取 `title` 和 `detail` 两个字段。

## Function
可以为 Model 定义 api，对于复杂数据操作，可以通过自定义 Function 来完成。

绝大多数权限可以通过 ACL 控制完成，不需要通过 Function 来完成基于对象的权限。Function 可用于完成基于数据的权限，比如根据审批状态，赋予不同用户组权限。以及多项修改，比如需要修改多条数据库记录。
