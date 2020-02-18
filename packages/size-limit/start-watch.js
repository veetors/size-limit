let path = require('path')
let watch = require('node-watch')

function filter (filePath) {
  let extnames = ['.js', '.json']
  let condition = (
    extnames.includes(path.extname(filePath)) &&
    !filePath.includes('node_modules')
  )

  return condition ? filePath : null
}

module.exports = (root, cb) => watch(
  root,
  {
    recursive: true,
    filter
  },
  cb
)
