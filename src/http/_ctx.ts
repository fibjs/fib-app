const capabilities = {
    'fib-push': false
}
try { capabilities['fib-push'] = !!require('fib-push') } catch (error) {}

export { capabilities }

export const ROOT_PATH = '/'
