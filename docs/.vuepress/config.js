// @reference https://v1.vuepress.vuejs.org/zh/config/

// .vuepress/config.js
module.exports = {
    extend: '@vuepress/theme-default',
    base: '/fib-app/',
    title: 'fib-app',
    description: 'fibjs-based application resources(RESTful API, SSR, Other resources) management framework',
    head: [

    ],
    port: 8080,
    themeConfig: {
        displayAllHeaders: true,
        nav: [
            { text: '首页', link: '/' },
            { text: '指南', link: '/zh/guide' },
            { text: 'GITHUB', link: 'http://github.com/fibjs/fib-app' },
            { text: 'FIBJS', link: 'http://fibjs.org' },
        //   {
        //     text: 'Languages',
        //     items: [
        //       { text: 'Group1', items: [/*  */] },
        //       { text: 'Group2', items: [/*  */] }
        //     ]
        //   }
        ],
        sidebar: [
            // ['/', '首页'],
            ['/zh/getting-started', '快速开始'],
            ['/zh/guide', '指南'],
            '/zh/app-acl',
            ['/zh/app-model-extends', 'ORM 扩展选项'],
            ['/zh/app-internal-api', '内部 API'],
        ]
    }
}