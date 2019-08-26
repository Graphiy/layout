import path from 'path'

function absolute (...args) {
  return path.join(__dirname, ...args)
}

const plugins = []
const rules = [{
  test: /\.(scss|css)$/,
  use: ['style-loader', 'css-loader', 'sass-loader'],
}, {
  test: /\.csv/,
  loader: 'raw-loader',
}]

export default () => (
  {
    mode: 'development',
    entry: {
      demo: './demo/app.js',
    },
    output: {
      path: absolute('build'),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.js'],
    },
    devtool: 'source-map',
    module: { rules },
    plugins,
  }
)
