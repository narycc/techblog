const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const fs = require('fs');
const _domain = 'http://testapp.money.dafy.com/yundai/';

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css",
  disable: process.env.NODE_ENV === "development"
});

let htmlPlugins = [];
let appEntry = {
  vendor: ['./src/js/zepto']
};

function readDirSync(dir) {
  let pa;
  try {
    pa = fs.readdirSync(dir);
  } catch (e) {
  }
  pa && pa.forEach((fileName) => {
    let currentPath = path.join(dir, fileName);
    let info;
    try {
      info = fs.statSync(currentPath);
    } catch (e) {
    }
    if (info && info.isDirectory()) {
      // 循环遍历src下面的文件夹找html文件 每个html文件就是一个入口
      readDirSync(currentPath);
    } else if (info && info.isFile()) {

      if (/\.html$/.test(fileName)) {

        let entryPath = currentPath.replace(path.join(__dirname, '/src/'), '');
        let entryName;

        // 找html文件的入口js文件是否存在 优先找同名的js文件 找不到就取当前文件夹的index.js
        let entryFile = currentPath.replace(/\.html$/, '.js');
        let entryFileInfo;
        try {
          entryFileInfo = fs.statSync(entryFile)
        } catch (e) {
        }

        if (!entryFileInfo || !entryFileInfo.isFile()) {
          entryFile = path.join(dir, 'index.js');
          try {
            entryFileInfo = fs.statSync(entryFile)
          } catch (e) {
          }
        }

        if (entryFileInfo && entryFileInfo.isFile()) {
          // 找到了入口js
          entryName = entryPath.replace(/\.html$/, '');
          appEntry[entryName] = entryFile;
        }

        let conf = {
          inject: 'head',
          filename: entryPath,
          template: currentPath,
          chunks: entryName ? ['common', 'vendor', entryName] : []
        };
        htmlPlugins.push(new HtmlWebpackPlugin(conf));

      }
    }

  });
}

readDirSync(path.join(__dirname, 'src'));

module.exports = {
  entry: appEntry,
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.css'],
    alias: {
      '$': 'zepto'
    }
  },
  devtool: 'inline-source-map',
  devServer: {
    publicPath: '/yundai/'
  },
  output: {
    filename: '[name].[chunkhash:8].bundle.js',
    path: path.resolve(__dirname, 'debug')
  },
  module: {

    rules: [

      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [{
            loader: "css-loader"
          }, {
            loader: "sass-loader"
          }],
          fallback: "style-loader"
        })
      },

      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: ['env']
          }
        }
      },


      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              minimize: true
            }
          }
        ]
      },

      {
        test: /\.(svg|png|jpg|gif)$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        loader: 'url-loader',
        options: {
          outputPath: str => str.replace('src/', ''),
          name: '[path][name].[hash:8].[ext]',
          publicPath: _domain,
          limit: 10000
        }
      },

      {
        test: /\.(eot|ttf|woff|woff2)$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: str => str.replace('src/', ''),
              name: '[path][name].[hash:8].[ext]',
              publicPath: _domain,
            }
          }
        ]
      },

      {
        test: require.resolve('zepto'),
        loader: 'exports-loader?window.Zepto!script-loader'
      },

    ]
  },
  plugins: [
    new ManifestPlugin(),
    new CleanWebpackPlugin(['debug']),
    ...htmlPlugins,
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common'
    }),
  ]
};
