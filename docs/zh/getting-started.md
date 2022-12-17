# 快速开始

[![NPM version](https://img.shields.io/npm/v/fib-app.svg)](https://www.npmjs.org/package/fib-app)
[![Build Status][actions-image]][actions-url]

[actions-image]:https://github.com/fibjs/fib-app/actions/workflows/run-ci.yml/badge.svg
[actions-url]:https://github.com/fibjs/fib-app/actions/workflows/run-ci.yml

基于 `fib-app`, 快速对业务建模, 并通过 http 对模型进行 restful 操作.

```js
// index.js
const http = require('http');
const App = require('fib-app');

const person_def = App.defineAppModel(orm => {
    orm.define('person', {
        name: String,
        age: Number,
        gender: ['male', 'female']
    })
})

const app = new App('sqlite:test.db');
app.db.use(person_def);

const svr = new http.Server(1234, [
  {
    '/1.0': app
  }
]);

svr.start();
```

通过 `fibjs index.js`, 运行上述代码, 我们就完成了两项工作: 

1. 对数据库中的表(`person`)建模
2. 将其映射到了 `http://127.0.0.1:1234/1.0` 这个 endpoint

现在我们可以通过该 endpoint 对数据库进行操作

## create <Badge type="info" text="POST" />

**请求格式**: `POST http://{endpoint}/{model_name}`

通过 POST 操作, 我们可以向数据库中添加一条 person 数据

```bash
curl -X POST 'http://127.0.0.1:1234/1.0/person' \
        -H 'Content-Type: application/json' \
        -d '{"name": "Jack", "age": 12, "gender": "male"}'
```

请求结果:

```json
{
  "id": 1,
  "createdAt": "2022-12-17T13:06:41.592Z"
}
```

这表示, 该操作往数据库中添加了一条新数据, 且其 id 为 1

## get

**请求格式**: `GET http://{endpoint}/{model_name}/:id`

已知一个 `person` 的 id, 可以通过 GET 请求查询其信息

```bash
curl -X GET 'http://127.0.0.1:1234/1.0/person/1'
```

请求结果:

```json
{
  "name": "Jack",
  "age": 12,
  "gender": "male",
  "createdAt": "2022-12-17T13:06:41.592Z",
  "updatedAt": "2022-12-17T13:06:41.592Z",
  "id":1
}
```

如果查询一个不存在的 id, 则会返回错误:

```bash
curl -X GET 'http://127.0.0.1:1234/1.0/person/9999'
```

请求结果

```json
{
    "code":4040102,
    "message":"Object '9999' not found in class 'person'."
}
```

## find <Badge type="info" text="GET" />

**请求格式**: `GET http://{endpoint}/{model_name}`

在不知道 id 情况下, 我们也可以直接尝试 list `person`,

```bash
curl -X GET 'http://127.0.0.1:1234/1.0/person'
```

请求结果:

```json
[
  {
    "name": "Jack",
    "age": 12,
    "gender": "male",
    "createdAt": "2022-12-17T13:06:41.592Z",
    "updatedAt": "2022-12-17T13:06:41.592Z",
    "id":1
  }
]
```

## update <Badge type="warning" text="PUT" />

**请求格式**: `PUT http://{endpoint}/{model_name}/:id`

已知一个 `person` 的 id, 可以通过 PUT 请求更改其信息

```bash
curl -X PUT 'http://127.0.0.1:1234/1.0/person/1' \
        -H 'Content-Type: application/json' \
        -d '{"age": 13}'
```

请求结果:

```json
{
  "id":1
}
```

这表示, 该操作改变了数据库中 id 为 1 的 person 的数据


## remove <Badge type="warning" text="DELETE" />

**请求格式**: `DELETE http://{endpoint}/{model_name}/:id`

已知一个 `person` 的 id, 可以通过 DELETE 请求删除这条数据

```bash
curl -X DELETE 'http://127.0.0.1:1234/1.0/person/1'
```

请求结果:

```json
{
  "id":1
}
```

这表示, 该操作删除了数据库中 id 为 1 的 person 的数据.

## 下一步呢?

让我们跟随[指南](/zh/guide.html), 学习 fib-app 更多的定制方法.
