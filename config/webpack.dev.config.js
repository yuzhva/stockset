const path = require('path')

const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const commonConfig = require('./common.config.js')

const rootPath = path.join(__dirname, '..')
const srcPath = path.join(rootPath, 'src')

module.exports = merge(commonConfig, {
  entry: [
    '@babel/polyfill',
    path.join(srcPath, 'index.js'),
    path.join(srcPath, 'styles', 'main.scss'),
  ],
  output: {
    path: path.join(rootPath, 'public'),
  },
  devtool: 'inline-source-map',
  devServer: {
    port: process.env.PORT || 8080,
    contentBase: srcPath,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(srcPath, 'index.template.html'),
    }),
    new MiniCssExtractPlugin({
      filename: 'dist/styles.css',
    }),
  ],
})
