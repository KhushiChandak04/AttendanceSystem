const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  const fallback = {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "zlib": require.resolve("browserify-zlib"),
    "path": require.resolve("path-browserify"),
    "process": require.resolve("process/browser")
  };

  config.resolve = {
    ...config.resolve,
    fallback,
    alias: {
      ...config.resolve.alias,
      'axios': require.resolve('axios')
    },
    extensions: ['.js', '.jsx', '.json']
  };

  // Update module rules for better ES module handling
  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      const babelLoaderRule = rule.oneOf.find(
        r => r.loader && r.loader.includes('babel-loader')
      );
      if (babelLoaderRule) {
        babelLoaderRule.options = {
          ...babelLoaderRule.options,
          presets: [
            ['@babel/preset-env', {
              modules: 'commonjs',
              targets: {
                node: 'current'
              }
            }],
            ['@babel/preset-react', {
              runtime: 'automatic'
            }]
          ],
          plugins: [
            '@babel/plugin-transform-modules-commonjs',
            'react-refresh/babel'
          ]
        };
      }
    }
    return rule;
  });
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': true
    })
  ]);

  return config;
};
