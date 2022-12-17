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

/**
 * now we can get/find/put/delete person table via http rest, e.g. we can use curl:
 * 
 * 
 * ```bash
 * curl --location --request POST 'http://127.0.0.1:1234/1.0/person' \
        --header 'Content-Type: application/json' \
        --data-raw '{"name": "Jack", "age": 12, "gender": "male"}'
   ```

    maybe you will get successful response like:

    ```json
    {
    "id": 1,
    "createdAt": "2022-12-17T13:06:41.592Z"
    }
    ```

    then you can get the person info by:
    ```bash
    curl --location --request GET 'http://127.0.0.1:1234/1.0/person/1'
    ```
    result:

    ```json
    {
        "name": "Jack",
        "age": 12,
        "gender": "male"
        "createdAt": "2022-12-17T13:06:41.592Z",
        "updatedAt": "2022-12-17T13:06:41.592Z",
        "id":1
    }
    ```

    but if you try to get person with non-exist id(such as 9999):
    ```bash
    curl --location --request GET 'http://127.0.0.1:1234/1.0/person/9999'
    ```
    result:

    ```json
    {
        "code":4040102,
        "message":"Object '9999' not found in class 'person'."
    }
    ```

    you can also list person:
    
    ```bash
    curl --location --request GET 'http://127.0.0.1:1234/1.0/person/9999'
    ```
    result:

    ```json
    [
        {"name":"Jack","age":12,"gender":"male","createdAt":"2022-12-17T13:06:41.592Z","updatedAt":"2022-12-17T13:06:41.592Z","id":1}
    ]
    ```

    you can update the person's info:
    
    ```bash
    curl --location --request PUT 'http://127.0.0.1:1234/1.0/person/1' \
            --header 'Content-Type: application/json' \
            --data-raw '{"age": 13}'
    ```

    result:

    ```json
    {"id":1}
    ```

    re fetch the person's info, you will see the age of Jack has been updated:

    ```json
    {
        "name": "Jack",
        "age":13,
        "gender": "male",
        "createdAt": "2022-12-17T13:06:41.592Z",
        "updatedAt": "2022-12-17T13:10:16.266Z",
        "id": 1
    }
    ```

    and the property `updatedAt` has been refreshed!

    also, we can delete the information of Jack from database:

    ```bash
    curl --location --request DELETE 'http://127.0.0.1:1234/1.0/person/1'
    ```

    result: 
    ```json
    {"id":1}
    ```
 */
// 
