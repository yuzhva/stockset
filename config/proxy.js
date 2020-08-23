module.exports = {
  '/api-tiingo/': {
    target: process.env.API_TIINGO_URL,
    pathRewrite: { '^/api-tiingo/': '/' },
    changeOrigin: true,
  },
};
