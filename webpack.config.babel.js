import path from 'path'

export default () => (
  {
    mode: 'production',
    entry: {
      layout: './index.js',
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
    },
    devtool: 'source-map',
  }
)
