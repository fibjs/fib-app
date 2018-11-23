import http = require('http')

export function graphqlRequest(url: string, body: string) {
    return http.post(url, 
        {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: body
        }
    );
}

export function shuffleArray (arr: any[] = []) {
    let m = arr.length,
        temp, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        temp = arr[m];
        arr[m] = arr[i];
        arr[i] = temp;
    }
    return arr;
}
