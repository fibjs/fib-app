const fs = require('fs')
const path = require('path')
const fibTypify = require('fib-typify')

const baseDir = path.resolve(__dirname, './src')
const distDir = path.resolve(__dirname, './lib')

if (fs.exists(distDir)) {
    try {
        fs.unlink(distDir)
    } catch (e) {}
}

fibTypify.compileDirectoryTo(baseDir, distDir, {
    compilerOptions: {
        target: 'es6',
        module: 'commonjs',
        // declaration: true
        // alwaysStrict: false,
        // allowJs: true,
        noImplicitUseStrict: true
    },
    extsToCopy: ['.js']
})
