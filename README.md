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

var app = new App('sqlite:test.db', {
    uuid: true
});
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
svr.run();
```
其中 `person` 是 Model 定义模块，内容如下：
```JavaScript
module.exports = db => {
    db.define('person', {
        name: String,
        sex: ["male", "female"],
        age: Number
    });
};
```
这是一个标准的 orm 定义，同样可以使用 orm 的其它功能，比如类型检查，事件等。

## API 数据格式

对于 POST 和 PUT 请求，请求的主体必须是 JSON 格式，而且 HTTP header 的 Content-Type 需要设置为 application/json。

```sh
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name": "tom","sex":"male","age":23}' \
  http://localhost/1.0/person/57fbbdb0a2400000
```
对于所有的请求，响应格式都是一个 JSON 对象。

一个请求是否成功是由 HTTP 状态码标明的。一个 2XX 的状态码表示成功，而一个 4XX 表示请求失败。当一个请求失败时响应的主体仍然是一个 JSON 对象，但是总是会包含 code 和 message 这两个字段，你可以用它们来进行调试。举个例子，如果一个请求权限认证失败，会返回以下信息：
```JavaScript
{
    "code": 4030501,
    "message": "The operation isn’t allowed for clients due to class-level permissions."
}
```
code 编码分为三个部分，前三位 403 表示错误类型，05 表示数据表编号，01 表示详细错误编码。

对于 GET 请求，通常会返回对象数据，根据 GET 请求的地址不同，可能会返回一个对象，也可能会返回一个数组。比如：
```JavaScript
{
  "name": "tom",
  "sex": "male",
  "age": 23
}
```
或者：
```JavaScript
[
  {
    "name": "tom",
    "sex": "male",
    "age": 23
  },
  {
    "name": "lily",
    "sex": "female",
    "age": 22
  }
]
```
## 特殊字段
对象数据中，有四个特殊含义的字段，是不允许通过 API 更改的。分别是 `id`, `updatedAt`, `createdAt`, `createdBy`。

其中 `id`, `updatedAt`, `createdAt` 单个字段会自动创建和修改。`createdBy` 则需要自行指定类型。

## 基础对象访问 API
完成这样的数据定义，便直接拥有了一整套符合 REST api 规范的接口调用：

| url                 | method | action     |
|---------------------|--------|------------|
| /1.0/:className     | POST   | 创建新对象   |
| /1.0/:className/:id | GET    | 读取对象    |
| /1.0/:className/:id | PUT    | 修改对象    |
| /1.0/:className/:id | DELETE | 删除对象    |
| /1.0/:className     | GET    | 查询对象列表 |

### 创建新对象
为了创建一个新的对象，应该向 class 的 URL 发送一个 POST 请求，其中应该包含对象本身。例如，要创建如上所说的对象：
```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "tom","sex":"male","age":23}' \
  http://localhost/1.0/person
```
当创建成功时，HTTP 的返回是 201 Created，响应的主体是一个 JSON 对象，包含新的对象的 objectId 和 createdAt 时间戳：
```JavaScript
{
  "createdAt": "2017-11-25T01:39:35.931Z",
  "id": "57fbbdb0a2400000"
}
```
### 读取对象
当你创建了一个对象时，你可以通过发送一个 GET 请求到返回的 header 的 Location 以获取它的内容。例如，为了得到我们上面创建的对象：
```sh
curl -X GET \
  http://localhost/1.0/person/57fbbdb0a2400000
```
返回的主体是一个 JSON 对象包含所有用户提供的 field 加上 `createdAt`、`updatedAt` 和 `id` 字段：
```JavaScript
{
  "name": "tom",
  "sex": "male",
  "age": 23,
  "createdAt": "2017-11-25T01:39:35.931Z",
  "updatedAt": "2017-11-25T01:39:35.931Z",
  "id": "57fbbdb0a2400000"
}
```
通过设置返回字段，可以定制返回的内容：
```sh
curl -X GET http://localhost/1.0/person/57fbbdb0a2400000?keys=name,sex
```
将返回：
```JavaScript
{
  "name": "tom",
  "sex": "male"
}
```
### 修改对象
为了更改一个对象已经有的数据，你可以发送一个 PUT 请求到对象相应的 URL 上，任何你未指定的 key 都不会更改，所以你可以只更新对象数据的一个子集。例如，我们来更改我们对象的一个 age 字段：
```sh
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"age": 25}' \
  http://localhost/1.0/person/57fbbdb0a2400000
```
返回的 JSON 对象会包含 `updatedAt` 和 `id` 字段，表明更新发生的时间：
```JavaScript
{
  "updatedAt": "2017-11-25T01:39:35.931Z",
  "id": "57fbbdb0a2400000"
}
```
### 删除对象
为了删除一个对象，可以发送一个 DELETE 请求到指定的对象的 URL，比如：
```sh
curl -X DELETE http://localhost/1.0/person/57fbbdb0a2400000
```
## 扩展对象访问 API
| url                              | method | action        |
|----------------------------------|--------|---------------|
| /1.0/:className/:id/:extendName      | PUT    | 设置扩展对象    |
| /1.0/:className/:id/:extendName      | POST   | 创建扩展对象    |
| /1.0/:className/:id/:extendName/:rid | GET    | 读取扩展对象    |
| /1.0/:className/:id/:extendName/:rid | PUT    | 修改扩展对象    |
| /1.0/:className/:id/:extendName/:rid | DELETE | 删除扩展对象    |
| /1.0/:className/:id/:extendName      | GET    | 查询扩展对象列表 |

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
