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
    port: 3000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },

    // --- PERBAIKAN DIMULAI DI SINI ---
    // Menambahkan blok proxy yang hilang
    proxy: [
      {
        context: ["/register", "/login", "/v1"], // Tangkap semua path API
        target: "https://story-api.dicoding.dev",
        changeOrigin: true,
      },
    ],
    // --- PERBAIKAN SELESAI ---
  },
});
