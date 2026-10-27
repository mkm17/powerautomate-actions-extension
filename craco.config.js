const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            return {
                ...webpackConfig,
                entry: {
                    main: [env === 'development' &&
                        require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(Boolean),
                    content: paths.appSrc + '/chrome/Content.ts',
                    background: paths.appSrc + '/chrome/Background.ts'
                },
                output: {
                    ...webpackConfig.output,
                    filename: (pathData) => {
                        const name = pathData.chunk.name.toLowerCase();
                        return `static/js/${name}.js`;
                    },
                },
                optimization: {
                    ...webpackConfig.optimization,
                    runtimeChunk: false,
                },
                plugins: [
                    ...webpackConfig.plugins,
                    new HtmlWebpackPlugin({
                        inject: true,
                        chunks: ["options"],
                        template: paths.appHtml,
                        filename: 'options.html',
                    }),
                ]
            }
        },
    }
}