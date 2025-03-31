const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          stream: require.resolve('stream-browserify'),
          crypto: require.resolve('crypto-browserify'),
          assert: require.resolve('assert'),
          url: require.resolve('url'),
          util: require.resolve('util'),
          buffer: require.resolve('buffer'),
          process: require.resolve('process/browser'),
        }
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  },
};
