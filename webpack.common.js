const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// App directory
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/index.js"),
    output: {
        filename: "js/babylonBundle.js",
        path: path.resolve("./dist/"),
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            fs: false,
            path: false, // require.resolve("path-browserify")
        },
    },
    module: {
        rules: [
            {
                test: /\.m?js/,
            },
            {
                test: /\.(js|mjs|jsx|ts|tsx)$/,
                loader: "source-map-loader",
                enforce: "pre",
            },
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                // sideEffects: true
            },
            {
                test: /\.(glsl|vs|fs)$/,
                loader: "ts-shader-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.(mp3|wav|ogg|mp4)$/i,
                use: [
                    {
                        loader: "file-loader",
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif|env|glb|gltf|stl|json)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 4096,
                        },
                    },
                ],
                type: 'javascript/auto'
            },
        ],
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            inject: true,
            favicon: "public/favicon.ico",
            template: path.resolve(appDirectory, "public/index.html"),
        }),
    ],
};
