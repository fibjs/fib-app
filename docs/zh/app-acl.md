# ACL

`fib-app` 内置了一套简明的 ACL 规则, 定义了系统中不同身份, 不同 id 的用户对每个类和对象的**可访问性**. 基于内置的 [fib-session] 服务, `fib-app` 对来自客户端的 http 请求(包括 rest 和 graphql)信息标记了访问者的**身份**.

在[权限]和[扩展对象权限]中, 已说明了通过 http API 对一个 orm 类进行 CURD 操作时, 权限判定的简明过程. 阅读本文, 你可以更深入其中的与原理.

## 关键词

- 实例对象
- 身份与[主体](ACL role/subject)
- 操作(act)
    - 操作描述符(`create`/`read`/`find`/`write`/`delete`)
    - 操作描述值(`undefined`/`true`/`false`)
- 操作访问性表
- 级联选择
- 尽可能寻找许可操作

## 实例对象

首先明确, ACL 描述是对实例对象的操作, 在 fib-app 中, 实例对象就是 orm 读取的类的实例, 它是一个对象, 具有键值对, 如

```javascript
// 描述了 Kate 的家庭作业的一个对象
{
    "id": 1,
    "type": "general",
    "description": "Kate's homework"
    "content": "..."
}
```

## 身份(主体) / Role

`fib-app` 的 ACL 基于身份(主体) , 以下都是身份:

- 游客(匿名访问者)
- 已登录的普通用户
- 已登录的系统管理员

反映这些**身份**的 session 很简单
```javascript
// request.session
{
    id: 1,
    roles: ['normal']
}
```

### 可访问性 / Accessibility

对于每个身份, fib-app 会有一套级联的规则集合来描述, 比如, 描述 `@fxjs/orm` 中一个对象的规则可能是这样的:

这是 fib-app 对接入其服务的 `@fxjs/orm` 的 Model 的默认 ACL 描述:

```javascript
orm.define('public_resource', {
    name: String
}, {
    // 这也是 orm 类的默认规则
    ACL: {
        "*": {
            "*": true,
            "extends": {
                "*": {
                    "*": true
                }
            }
        }
    }
})
```

上述规则, 表明了, 对于 `public_resource` 这个类, **任何人**可以对其进行**任意**操作.

## 操作访问性

### 6 种操作符 / 6 Kinds of Acts

操作访问性表的键名往往是以下 6 种:

- `*`: 通用操作描述
- `create`: 创建
- `read`: 读取
- `find`: (批量)查询
- `write`: 修改
- `delete`: 删除

act 的值和其对应含义如下:

- `undefined`: 未指定
- `true`: 明确允许
- `false`: 明确禁止
- string[]: 仅当 act 为 'read' 时有意义, 表示允许读取, 但会过滤掉不在 `string[]` 中的字段

**注意** 注意, 未指定不意味着禁止, 只有当一个操作在所有的操作访问性表都未指定时, 才等价于**禁止**.

比如, 当在一个**操作访问性表**中,

- 通用操作和明确操作同时存在且其中一个的值是 `undefined` 时, 会以另一个明确指定为准;
- 关于某种操作 ACT 的描述在不同的身份的操作描述符中值不同, 以最终**被选择**的身份中关于 ACT 的描述为准

上文提到的对 [orm 类的默认规则](#orm-类的默认规则-/-Default-ACL-in-ORM-Model)等价于下列完整规则

```javascript
// 一个ACL 对象
ACL: {
    "*": {
        "*": true,
        create: undefined,
        find: undefined,
        read: undefined,
        write: undefined,
        delete: undefined
        "extends": {
            "*": {
                "*": true,
                create: undefined,
                find: undefined,
                read: undefined,
                write: undefined,
                delete: undefined
            }
        }
    }
}
```

可以看到, 与简写操作描述相比, 完整版的描述明确地表达了: 对于这个类别的对象的 **5** 种**明确操作(act)**, 都是 **"未指定"(undefined)**(注意不是"允许").

## 操作访问性表 / Act Descriptor

上例中的 `ACL['*']` 就是一个操作访问性表

### 保留字 / Reserved Keyword

保留字在操作访问性表中具有独特的意义
- `"extends"`: 用于定义具有关联关系(associations)的对象的间接操作访问性表

### 操作 / Acts
- 通用操作
    - `*`: 定义对实例对象的所有操作的优先级, 优先级低于**明确操作**
- REST明确操作
    - `create`: 创建该类别的实例对象
    - `read`: 读取该类别的实例对象
    - `find`: (批量)查询该类别的实例对象
    - `write`: 修改该类别的实例对象
    - `delete`: 删除该类别的实例对象
- 自定义明确操作:
    - `[ANY_VALID_STRING]`: 任何不是上述 6 种操作符的字符串

你可能已经注意到, 每个**REST 明确操作**都对应了一种 rest 操作:

- `find`: `GET /item`
- `read`: `GET /item/:id`
- `create`: `POST /item`
- `write`: `PUT /item/:id`
- `delete`: `DELETE /item/:id`

find 和 read 的区别, 在于描述的对象分别是"所有的实例对象"和"单个实例对象".

在上面提到的 orm 默认 ACL 对象中, `ACL['*']['*']` 中的第二个 `'*'` 就是操作描述符的键名, 它是**通用操作**.

我们再来看一个例子:

```javascript
orm.define('protected_resource', {
    name: String
}, {
    // 在 orm 的定义中, ACL 可以是对象, 也可以是返回对象的函数
    ACL () {
        return {
            // 此处的 '*' 作为键表示身份(role), 其值是一个完成的 aclAct 描述符
            '*': {
                // 允许创建该类别的实例对象
                create: true,
                // 未指定是否可批量查找该实例对象
                find: undefined,
                // 允许读取该类别的实例对象
                read: true
                // 允许修改该类别的实例对象
                write: true
                // 禁止删除该类别的实例对象
                delete: false
            }
        }
    }
})
```

如上, 对于**所有的用户**, 都可以对`protected_resource` 这个类别的实例对象进行**创建**, **单个读取**, **修改**, **删除** 的操作, 但无法进行**批量查询**, 因为没有明确对 `find` 进行定义, 也没有其它的身份来标记别的用户可以对 `protected_resource` 这个资源可以进行 **批量查询** 操作.

## 级联的身份选择 / Cascaded Selection for ACL Role

在 `fib-app` 的 ACL 中, 存在 3 种**身份描述键:**

- **通用身份描述**
    - `'*'`: 所有用户
- **明确身份描述**
    - `ID`: session.id 为 ID 的用户
    - `roles`: 角色为 roles 表中某个键的用户

这三种描述键的优先级是 ID > ROLE > `'*'`.

在级联的身份选择中, **对于某个特定操作**:

- 优先选择以其 ID 为键的操作访问性表
- (降级)如果该操作不被明确(是 `undefined`), 则会尝试去 ROLE 为键的操作访问性表寻找
- (降级)如果该操作不被明确(是 `undefined`), 则会尝试去, `'*'` 为键的操作访问性表

可以看到, 这体现了 fib-app 会为访问者**尽可能**寻找对某个操作的许可, 并且**一旦寻找到明确操作, 便不会继续寻找, 无论该明确操作是 允许(true) 还是 禁止(false)**.

### 题外话 / Assimilate

如果你看过名侦探柯南 M9 《水平线上的阴谋》, 可以想象 `fib-app` 就是其中的毛利小五郎: 对于剧中那个长得很像小五郎妻子的人物(**操作**), 他不希望这个人物是凶手(不是凶手 = **允许操作**), 会尽可能需寻找那个人物不是凶手的证据(尽可能寻找**许可**), 但一旦确认了这个人物是凶手(寻找到了**明确操作**), 则不管她是不是凶手, 都会中止希望, 逮捕这个人(中止寻找).

### 实战 / Practice

让我们来看一个例子, 这是一个 orm 中 Model 类的 ACL 对象(或者是由 ACL 函数得到的返回对象):

```javascript
ACL: {
    // 对于所有用户, 可对 Model 的对象进行 create 操作
    '*': {
        '*': false,
        'create': true,
        'read': ['id', 'name', 'alias']
    },
    roles: {
        'admin': {
            'write': true
        },
        'normal': {
            'read': true
        }
    },
    1: {
        '*': true
    }
}
```

在这个 ACL 对象中写明了 4 种身份(而不是 3 种):
- `'*'`: 能进行 create 操作
- `'role.admin'`: 能进行 write 操作
- `'role.normal'`: 能进行 read 操作
- `具有 id=1 的用户`: 能对该对象进行任何操作.

对于以下不同的用户, 他们的最终操作结果如下:

| 操作 | 结果 | 用户描述 | 级联选择过程 | 备注 |
| -- | -- | -- | -- | -- |
| -- | -- | -- | -- | 以下: 恰好命中了 `id=1` 的用户 |
| create | true | id: 1; roles: ['normal'] | `acl[1]['create'] = undefined` <br>-> `acl[1]['*'] = true` | ✔️ |
| read | true | id: 1; roles: ['normal'] | `acl[1]['read'] = undefined` <br>-> `acl[1]['*'] = true` | ✔️ |
| find | true | id: 1; roles: ['normal'] | `acl[1]['find'] = undefined` <br>-> `acl[1]['*'] = true` | ✔️ |
| write | true | id: 1; roles: ['normal'] | `acl[1]['write'] = undefined` <br>-> `acl[1]['*'] = true` | ✔️ |
| delete | true | id: 1; roles: ['normal'] | `acl[1]['delete'] = undefined` <br>-> `acl[1]['*'] = true` | ✔️ |
| -- | -- | -- | -- | 以下: 匿名用户 |
| create | true | id: undefined; roles: [] | `acl['*']['create'] = true` | ✔️ |
| read | ['id', 'name', 'alias'] | id: undefined; roles: [] | `acl['*']['read'] = ['id', 'name', 'alias']` | ✔️ |
| find | false | id: undefined; roles: [] | `acl['*']['find'] = undefined` <br>-> `acl['*']['find'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |
| write | false | id: undefined; roles: [] | `acl['*']['write'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |
| delete | false | id: undefined; roles: [] | `acl['*']['delete'] = undefined` <br>-> `acl['*']['delete'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |
| other_func | true | id: 99; roles: ['normal'] | `acl[1]['other_func'] = undefined` <br>-> `acl[1]['*'] = undefined` <br>-> `acl['*']['*'] = undefined` <br>-> `false` | 非 REST 的明确操作 | ✔️ |
| -- | -- | -- | -- | 以下: 仅具有 normal 用户 |
| create | true | id: 99; roles: ['normal'] | `acl.roles['normal']['create'] = undefined` <br>-> `acl['*']['create'] = true` | ✔️ |
| read | ['id', 'name', 'alias'] | id: 99; roles: ['normal'] | `acl.roles['normal']['read'] = true` | ✔️ 注意这里由于在 ROLE 这一级找到了"明确操作", 不会继续往下寻找 |
| find | false | id: 99; roles: ['normal'] | `acl.roles['normal']['find'] = undefined` <br>-> `acl['*']['find'] = undefined` <br>-> `false` | ✔️ |
| write | false | id: 99; roles: ['normal'] | `acl.roles['normal']['write'] = undefined` <br>-> `acl['*']['write'] = undefined` <br>-> `false` | ✔️ |
| delete | false | id: 99; roles: ['normal'] | `acl.roles['normal']['delete'] = undefined` <br>-> `acl['*']['delete'] = undefined` <br>->`false` | ✔️ |
| -- | -- | -- | -- | 以下: 仅具有 admin 的用户 |
| create | true | id: 99; roles: ['admin'] | `acl.roles['admin']['create'] = undefined` <br>-> `acl['*']['create'] = true` | ✔️ |
| read | ['id', 'name', 'alias'] | id: 99; roles: ['admin'] | `acl.roles['admin']['read'] = undefined` <br>-> `acl.roles['*']['read'] = ['id', 'name', 'alias']` | ✔️ |
| find | false | id: 99; roles: ['admin'] | `acl.roles['admin']['find'] = undefined` <br>-> `acl['*']['find'] = undefined` <br>->`acl['*']['*'] = false` | ✔️ |
| write | true | id: 99; roles: ['admin'] | `acl.roles['admin']['write'] = true` | ✔️ |
| delete | false | id: 99; roles: ['admin'] | `acl.roles['admin']['delete'] = undefined` <br>-> `acl['*']['delete'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |
| -- | -- | -- | -- | 以下: 同时具有 admin/normal 的用户 |
| create | true | id: 99; roles: ['admin'] | `acl.roles['admin']['create'] = undefined` <br>-> `acl['*']['create'] = true` | ✔️ |
| read | ['id', 'name', 'alias'] | id: 99; roles: ['normal'] | `acl.roles['normal']['read'] = true` | ✔️ 注意这里由于在 ROLE 这一级找到了"明确操作", 不会继续往下寻找 |
| find | false | id: 99; roles: ['admin'] | `acl.roles['admin']['find'] = undefined` <br>-> `acl['*']['find'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |
| write | true | id: 99; roles: ['admin'] | `acl.roles['admin']['write'] = true` | ✔️ |
| delete | false | id: 99; roles: ['admin'] | `acl.roles['admin']['delete'] = undefined` <br>-> `acl['*']['delete'] = undefined` <br>-> `acl['*']['*'] = false` | ✔️ |

### 自定义操作符

你可能会好奇, 上表的 `other_func` 是什么情况, Act 难道不是只可能是限定的 [6 种操作符](#6-种操作符) 中的一种么? 

并非如此, Act 可以是任何合法的 Javascript 非空字符串, 甚至可能是 `'undefined'`, `'null'`, `'NaN'` 这种看起来很奇怪的东西.

只要有需要对某种名为 `'other_func'` 的 act 进行判定的需求, 在操作符描述表中 `'other_func'` 就会发挥作用, 只是一般这个工作由降级的 `'*'` 属性描述符来担任. 在仅通过 `'*'` 不好描述的场景, 自定义的操作符能明确指定某个操作是否可以被完成. 比如, 如果你希望定义在 [Model Function] 上定义"基于 cookie 的用户登录"这个操作, 这个操作应该对所有用户开放, 此时你可能会想将 Model 定义写成下面这样:

```javascript
orm.define('user', {
    // ...
    // define user properties
}, {
    ACL() {
        return {
            '*': {
                '*': true
            }
        }
    },
    functions: {
        login (req) {
            // do login, accessible for everyone
        },
        get_profile (req) {
            // do get_profile, accessible only for logined-user
        },
        logout (req) {
            // do logout, accessible only for logined-user
        }
    }
})
```

此时的问题是, 匿名用户其实不能访问 get_profile/logout 这两个操作, 它是无意义的. 尽管在 [Model Function] 的每个 handler 中, 第一个参数 req 中具有访问用户的所有 session 信息(id, roles), 你可以在 profile/logout 中判定该用户是否为匿名用户, 然后判断是否应该给该访问者(如果访问者是匿名用户, 则拒绝该操作) 返回 403 响应...对于这样的判定, 可能还会出现在别的所有的仅对已登录用户的有效的 handler 中, 你当然可以写一个方法来判定并放在所有的这些函数中(在别的语言或者支持 decorator 的 js 超集如 typescript 中, 这样工作往往交给装饰器来完成), 但这样显得有点繁琐.

我们可以把问题简化一点, 像下面这样定义:

```javascript
orm.define('user', {
    // ...
    // define user properties
}, {
    ACL() {
        return {
            '*': {
                // all non-builtin operation denied...
                '*': false
                // but 'login'!
                'login': true
            }
        }
    },
    functions: {
        login (req) {
            // do login
        },
        profile (req) {
            // do login
        },
        logout (req) {
            // do logout
        }
    }
})
```

仅需修改一下 `'*'` 身份下的操作访问性表, 你就可以轻松描述对 user 这个类的 login 和 non-login 操作的权限.

## ACL/OACL

### ACL

ACL 所有特性均如上文所述.

### OACL

OACL 是**与某个具体实例对象**相关的操作的 ACL 判定依据, 它的内部运行机制与 ACL 完全一致.

关于 OACL 的示例可参考[指南]中关于[扩展对象权限]一节.

OACL 具有以下特性:
- OACL 的判定优先级比 ACL 更高
- 当 OACL 判定的结果为 `false`, 会继续尝试到 ACL 中去寻找 `true`.
- 当 Model 的 OACL 是一个函数时, 它的 `this` 指向其要判定的实例对象.

### 使用函数来定义 ACL/OACL

你会注意到, 在上文的大多数示例中, Model 上的 ACL 选项都不是一个对象(尽管它可以是), 而是一个返回 ACL 对象的函数. 在运行时, 函数计算显然是会花费一些时间的, 但你能在其中写入更多的逻辑, 比如

```javascript
OACL (session) {
    return {
        '*': {
            '*': false
            'read': !!session.id || undefined
        }
    }
}
```

该 ACL 定义的含义是: 对于任意用户, 如果具有 session.id, 则可以读取实例对象; 反之, 不明确 read 操作, 交给下一级判定.

或者是:
```javascript
orm.define('something', {

}, {
    OACL (session) {
        const act = {
            {
                '*': {
                    '*': false
                    'read': !!session.id || undefined
                }
            }
        }

        if (session.id === this.createdby_id) {
            // the creator of something can do anything with it.
            act['*'] = {'*': true}
        }
        
        return act[]
    }
})

orm.models.something.hasOne('createdBy', orm.models.user)
```

该 ACL 定义的含义是:
- 任意有会话的用户, 可以对任意一个 something 进行读取操作
- 对于 something 对象的创造者, 可以对其创造的 something 对象为所欲为

## 操作访问性表中的 extends / extends in ACL hash

上文提到过, `extends` 是身份主体描述的一个保留字, 它和其它操作描述符在操作访问性表处于同级, 但它不表达操作, 而是表示某个当访问者通过实例对象去访问其扩展对象时候的访问权限.

已经由 `extends` 定义的操作访问性表, 其下的 `extends` 无意义(即 `extends` 只能存在于 ACL 主体的第一层级)

```javascript
// Model A
ACL (session) {
    return {
        '*': {
            '*': false,
            // useful, would be treated as associated model's ACL declartion.
            'extends': {
                'extend_1': {
                    // all extend_1 of Model A can be operated anyway via Model A
                    '*': true,
                    // useless! it would be ignored
                    extends: {
                        ...
                    }
                }
            }
        }
    }
}
```
```javascript
// Model A
ACL (session) {
    return {
        '*': {
            '*': false,
            // that means act 'extends', as it's not recommended.
            'extends': true
        }
    }
}
```

`extends` 的中对某个 Model 的 ACL/OACL 判定的优先级低于该 Model 自身定义的 ACL/OACL. 关于这一点, 在[指南]的[扩展对象权限]一节有生动的说明. 我们再进一步分析, 对于具有 `Person.hasMany('pets', Pet)` 关系的 `Person` 和 `Pet` 两种对象, 对操作 read 的判定顺序为

* `pets.OACL[PET_ID -> ROLE -> *]#read`, 若为 false 则继续往下
* `person.OACL[PERSON_ID -> ROLE -> *]#read` => `extends:pets[PET_ID -> ROLE -> *]#read`, 若为 false 则继续往下
* `person.ACL[PERSON_ID -> ROLE -> *]` => `extends:pets[PET_ID -> ROLE -> *]#read`
* `pets.ACL[PERSON_ID -> ROLE -> *]`

其中, `->` 表示对操作访问性表内部的逐步降级; `=>` 表示在 OACL/ACL 之间的**许可寻找过程**.

## 身份冲突

有一种情况, 当一个访问者同时具有 rX, rY 两个身份(role), 现在他们要访问 Model A, Model A 关于 ACL 的定义如下(有且仅有一个 ACL 定义):

```javascript
// 对于 create 操作, rX, rY 都给出了**明确操作**, 但两者是冲突的. 到底是听从 rX 还是听从 rY?
ACL(session) {
    const rYActs = {
        "create": true
    }
    const rXActs = {
        "create": false
    }

    return {
        "*": {
            "*": false
        },
        "roles": {
            "rX": rXActs,
            "rY": rYActs
        }
    }
}
```

`fib-app` 内部在对 `session.roles` 的遍历中, 会用访问者的身份逐个去匹配 `ACL['roles']` 中的 roleKey(这个匹配是基于 `for...in`的); 在上述例子中, 选取 create 操作的权限, 到底是听从 rX 还是 rY 是**不可预期**的. 原因有两个:

- 访问者所携带的 `session.roles` 中的 rX/rY 的顺序是不可预期的
- 由于 javascript 固有的 `for...in` 字典遍历键名无序性, rX/rY 被访问到的顺序也是不可预期的.

当然, 你可以提前 sort `session.roles`, 并要求 `fib-app` 以有序的方式遍历 `ACL['roles']`(比如不使用 `for...in` 遍历而采取 `Object.keys(ACL['roles']).sort()` 来进行 key 遍历). 但无论如何, 当两个 role 共同在 `ACL['roles']`存在的时候, 你很难直观地看出到底那个 role 会被先访问到. 在这种情况(已知访问者的 roles)下, 应该尝试让 ACL 进行**主动降级**. 我们改进一下上述例子:

```javascript
// 这里我们假设我们希望 rY 优先于 rX
ACL(session) {
    const rYActs = {
        "*": false,
        "create": true
    }
    const rXActs = {
        "*": false,
        "create": false
    }

    return {
        '*': {
            '*': false,
            ...(session.roles.includes('rY') ? rYActs : rXActs)
        }
    }
}
```

或者这样:

```javascript
// 这里我们假设我们希望 rY 优先于 rX
ACL(session) {
    const rYActs = {
        "create": true
    }
    const rXActs = {
        "create": false
    }
    
    return {
        '*': {
            '*': false
        },
        // session.id 的匹配级别高于 session.roles, 但若其返回 undefined, 接下来会主动降级到 ACL['roles']. 
        get [session.id] () {
            return session.roles.includes('rY') ? rYActs : undefined
        },
        'roles': {
            rX: rXActs
        }
    }
}
```

主动降级可以解决身份冲突的问题, 在 ACL 中, 你可以设法在某些特殊情况下, 让返回的 ACL 主体不再是固定的模式, 而是有选择地给出你期望的 ACL 主体.

## 许可查找过程

我们以对具有 `A.hasOne('B', B)` 关系的两个 Model A 和 Model B 进行分析, 当你要对 B 的某个具有 BID 的实例进行访问的时候, 你有两个途径:

- `B/:ID` 直接访问 B
- `A/:AID/B/:BID` 通过 A 间接访问 B

当你通过第二种途径访问的时候, 在最差的情况下, 对 B 的许可查找过程如下

```javascript
// 1 => 2 => 3 => 4

// Model A
{
    ACL (session) {
        return {
            '*': {
                '*': false
                'extends': {
                    // priority: 3
                    B: {
                        'create' false
                    }
                }
            }
        }
    },
    OACL (session) {
        return {
            '*': {
                '*': false
                'extends': {
                    // priority: 2
                    B: {
                        'create' false
                    }
                }
            }
        }
    }
}
// Model B
{
    ACL (session) {
        return {
            '*': {
                // priority: 4
                'create' false
            }
        }
    },
    OACL (session) {
        return {
            '*': {
                // priority: 1
                'create' undefined
            }
        }
    }
}
```

可以看到, 基于 `fib-app` 的 ACL 系统, 你已经可以基于 `session.id` 和 `session.roles` 来控制对 `fib-app` 中一个实体的访问, 如果有更高的要求(比如引入基于 RBAC 的权限控制系统), 你还可以在 Model 的 ACL/OACL 函数中做进一步定义.

[Model Function]:./app-model-extends.html#model-function
[指南]:./guide.html
[主体]:./guide.html#主体
[权限]:./guide.html#权限
[扩展对象权限]:./guide.html#扩展对象权限
[fib-session]:https://github.com/fibjs/fib-session