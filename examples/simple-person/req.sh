# create
curl --location -X POST 'http://127.0.0.1:1234/1.0/person' \
        -H 'Content-Type: application/json' \
        -d '{"name": "Jack", "age": 12, "gender": "male"}'

# get existed
curl --location -X GET 'http://127.0.0.1:1234/1.0/person/1'

# get non-existed
curl --location -X GET 'http://127.0.0.1:1234/1.0/person/9999'

# find
curl --location -X GET 'http://127.0.0.1:1234/1.0/person'

# update
curl --location -X POST 'http://127.0.0.1:1234/1.0/person/1' \
        -H 'Content-Type: application/json' \
        -d '{"age": 13}'

# del
curl --location -X DELETE 'http://127.0.0.1:1234/1.0/person/1'