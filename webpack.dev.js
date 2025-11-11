const path = require("path");
const common = require("./webpack.common.js");
const { merge } = require("webpack-merge");

module.exports = merge(common, {
  mode: "development",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 4000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    proxy: [
      {
        // Tentukan semua path API yang perlu di-proxy
        context: ["/register", "/login", "/v1"],
        target: "https://story-api.dicoding.dev",
        changeOrigin: true,
        // Kita tidak butuh pathRewrite lagi
      },
    ],
  },
});
