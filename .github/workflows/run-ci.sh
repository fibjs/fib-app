if [[ "$RUNNER_OS" == "Linux" ]]; then
    echo "test mysql";
    sudo systemctl start mysql.service;
    export MYSQL_USER=root;
    export MYSQL_PASSWORD=root;
else
    echo "test sqlite";
    export WEBX_TEST_SQLITE=1;
fi
npm install;
npm list fib-graphql;
npm list graphql;
npm run ci;