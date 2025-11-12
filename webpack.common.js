const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// --- TAMBAHKAN IMPOR INI ---
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
// -----------------------------

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src/scripts/index.js"),
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/index.html"),
      excludeChunks: ["sw"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/public/"),
          to: path.resolve(__dirname, "dist/"),
        },
        {
          from: path.resolve(__dirname, "src/manifest.json"),
          to: path.resolve(__dirname, "dist/"),
        },
        // Pastikan service-worker.js TIDAK ada di sini
      ],
    }),

    // --- TAMBAHKAN BLOK PLUGIN INI ---
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: path.resolve(__dirname, "src/service-worker.js"),
      swDest: "service-worker.js",
    }),
    // ---------------------------------
  ],
};
