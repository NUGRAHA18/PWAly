// webpack.dev.js

const path = require("path");
const common = require("./webpack.common.js");
const { merge } = require("webpack-merge");
const webpack = require("webpack"); // ✅ TAMBAHKAN

module.exports = merge(common, {
  mode: "development",

  // ✅ Source maps untuk debugging
  devtool: "eval-source-map",

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  plugins: [
    // ✅ TAMBAHKAN: Define NODE_ENV untuk development
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),
  ],

  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 1000,

    // ✅ Hot Module Replacement
    hot: true,

    client: {
      overlay: {
        errors: true,
        warnings: false, // ✅ Ubah ke false agar tidak terlalu noisy
      },
    },

    // ✅ PROXY ke API Dicoding (SUDAH BENAR)
    proxy: [
      {
        context: ["/register", "/login", "/v1"], // Tangkap semua path API
        target: "https://story-api.dicoding.dev",
        changeOrigin: true,
        secure: true,

        // ✅ TAMBAHAN: Log untuk debugging
        onProxyReq: (proxyReq, req, res) => {
          console.log(
            `🔀 Proxying: ${req.method} ${req.url} → https://story-api.dicoding.dev${req.url}`
          );
        },

        onProxyRes: (proxyRes, req, res) => {
          console.log(`✅ Response: ${proxyRes.statusCode} from ${req.url}`);
        },

        onError: (err, req, res) => {
          console.error(`❌ Proxy Error for ${req.url}:`, err.message);
        },
      },
    ],
  },
});
