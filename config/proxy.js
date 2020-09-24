module.exports = {
  '/api-tiingo/': {
    target: process.env.API_TIINGO_URL,
    pathRewrite: { '^/api-tiingo/': '/' },
    changeOrigin: true,
  },
  '/api-ib/': {
    target: process.env.API_LOCAL_IB_URL,
    pathRewrite: { '^/api-ib/': '/' },
    changeOrigin: true,
    secure: false,
  },
};
