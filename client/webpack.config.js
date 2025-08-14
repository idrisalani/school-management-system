import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import ip from "ip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].bundle.js",
      chunkFilename: isProduction
        ? "chunks/[name].[contenthash].js"
        : "chunks/[name].js",
      publicPath: "/",
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              // Changed from 8 to '2015' to fix TypeScript error
              ecma: 2015,
            },
            compress: {
              ecma: 5,
              // Removed 'warnings' as it's not a valid option
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `npm.${packageName.replace("@", "")}`;
            },
            chunks: "all",
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "npm.react",
            chunks: "all",
            priority: 40,
          },
          lodash: {
            test: /[\\/]node_modules[\\/]lodash[\\/]/,
            name: "npm.lodash",
            chunks: "all",
            priority: 30,
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: "npm.recharts",
            chunks: "all",
            priority: 20,
          },
          commons: {
            name: "commons",
            minChunks: 2,
            priority: -20,
          },
        },
      },
      runtimeChunk: "single",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    modules: false,
                    useBuiltIns: "usage",
                    corejs: 3,
                  },
                ],
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
              plugins: ["@babel/plugin-transform-runtime"],
              cacheDirectory: true,
              cacheCompression: false,
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[name][ext]",
          },
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/assets/favicon.svg",
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            }
          : false,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public/assets",
            to: "assets",
            globOptions: {
              // Add this
              ignore: ["*.DS_Store"],
            },
          },
          {
            from: "public/manifest.json",
            to: "manifest.json",
          },
          {
            from: "public/fonts", // Add this if you have fonts
            to: "fonts",
          },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify({
          NODE_ENV: isProduction ? "production" : "development",
        }),
      }),
    ],
    devServer: {
      historyApiFallback: true,
      port: 3000,
      hot: true,
      host: "localhost",
      open: {
        target: ["/"],
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error("webpack-dev-server is not defined");
        }
        console.clear();
        console.log("\n🚀 App is running at:\n");
        console.log(`   Local:    \x1b[36mhttp://localhost:3000\x1b[0m`);
        console.log(
          `   Network:  \x1b[36mhttp://${ip.address()}:3000\x1b[0m\n`
        );
        return middlewares;
      },
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
          pathRewrite: { "^/api": "/api/v1" },
        },
      },
      static: {
        directory: path.join(__dirname, "public"),
        publicPath: "/", // Add this
        serveIndex: true, // Add this
      },
    },
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
      hints: false,
    },
  };
};
