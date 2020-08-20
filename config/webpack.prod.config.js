const path = require('path')

const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

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
    filename: 'dist/scripts.[hash].js',
    chunkFilename: 'dist/chunk.[chunkhash].js',
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(srcPath, 'index.template.html'),
    }),
    new MiniCssExtractPlugin({
      filename: 'dist/styles.[hash].css',
    }),
  ],
})
