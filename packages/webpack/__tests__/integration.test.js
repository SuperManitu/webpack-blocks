import test from 'ava'
import path from 'path'
import { createConfig, entryPoint, match, setOutput, sourceMaps } from '../index'
import { css, file, url } from '@webpack-blocks/assets'
import babel from '@webpack-blocks/babel6'
import devServer from '@webpack-blocks/dev-server'
import postcss from '@webpack-blocks/postcss'
import sass from '@webpack-blocks/sass'

test('complete webpack config creation', t => {
  const images = ['*.gif', '*.jpg', '*.jpeg', '*.png', '*.webp']
  const fonts = ['*.eot', '*.ttf', '*.woff', '*.woff2']

  const webpackConfig = createConfig([
    entryPoint('./src/main.js'),
    setOutput('./build/bundle.js'),
    babel(),
    sourceMaps(),
    devServer(),
    devServer.proxy({
      '/api/*': { target: 'http://localhost:8080' }
    }),
    match('*.scss', [
      css.modules({
        localIdentName: '[name]--[local]--[hash:base64:5]'
      }),
      postcss(),
      sass()
    ]),
    match(images, { exclude: /node_modules/ }, [
      url({
        limit: 10000
      })
    ]),
    match(fonts, [
      file()
    ])
  ])

  t.is(webpackConfig.module.rules.length, 4)
  t.deepEqual(webpackConfig.module.rules[0], {
    test: /^.*\.scss$/,
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          localIdentName: '[name]--[local]--[hash:base64:5]',
          modules: true,
          sourceMap: false
        }
      },
      {
        loader: 'postcss-loader',
        options: {}
      },
      {
        loader: 'sass-loader',
        options: {}
      }
    ]
  })
  t.deepEqual(webpackConfig.module.rules[1], {
    test: [
      /^.*\.gif$/,
      /^.*\.jpg$/,
      /^.*\.jpeg$/,
      /^.*\.png$/,
      /^.*\.webp$/
    ],
    exclude: /node_modules/,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  })
  t.deepEqual(webpackConfig.module.rules[2], {
    test: [
      /^.*\.eot$/,
      /^.*\.ttf$/,
      /^.*\.woff$/,
      /^.*\.woff2$/
    ],
    use: [
      {
        loader: 'file-loader',
        options: {}
      }
    ]
  })
  t.deepEqual(webpackConfig.module.rules[3], {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: [ {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    } ]
  })

  t.deepEqual(webpackConfig.entry, { main: [ './src/main.js' ] })

  t.deepEqual(webpackConfig.devServer, {
    hot: true,
    hotOnly: true,
    historyApiFallback: true,
    inline: true,
    proxy: {
      '/api/*': { target: 'http://localhost:8080' }
    }
  })

  t.deepEqual(webpackConfig.output, {
    filename: 'bundle.js',
    path: path.resolve('./build')
  })

  t.is(webpackConfig.devtool, 'cheap-module-source-map')

  t.deepEqual(Object.keys(webpackConfig).sort(), [
    'devServer', 'devtool', 'entry', 'module', 'output', 'plugins', 'resolve'
  ])
})

test('createConfig() creates a minimal configuration', t => {
  const webpackConfig = createConfig([
    entryPoint('./src/main.js'),
    setOutput('./build/bundle.js')
  ])

  t.deepEqual(webpackConfig, {
    entry: {
      main: [ './src/main.js' ]
    },
    module: {
      rules: []
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve('./build')
    },
    plugins: [],
    resolve: {
      extensions: ['.js', '.json']
    }
  })
})

test('context contains necessary properties', t => {
  t.plan(10)

  createConfig([
    context => {
      // context.fileType
      t.is(typeof context.fileType, 'function')
      t.is(typeof context.fileType.add, 'function')
      t.is(typeof context.fileType.all, 'function')
      t.is(typeof context.fileType.get, 'function')
      t.is(typeof context.fileType.has, 'function')

      // context.webpack
      t.is(typeof context.webpack, 'function')
      t.is(typeof context.webpack.EnvironmentPlugin, 'function')

      // context.webpackVersion
      t.is(typeof context.webpackVersion, 'object')
      t.is(typeof context.webpackVersion.major, 'number')
      t.is(typeof context.webpackVersion.minor, 'number')

      return prevConfig => prevConfig
    }
  ])
})
