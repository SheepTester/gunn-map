const fs = require('fs');

exports.read = (file) => new Promise((res, rej) => {
  fs.readFile(file, 'utf8', (err, data) => err ? rej(err) : res(data));
});
exports.write = (file, contents) => new Promise((res, rej) => {
  fs.writeFile(file, contents, 'utf8', err => err ? rej(err) : res());
});
exports.readdir = (dir, contents) => new Promise((res, rej) => {
  fs.readdir(dir, (err, files) => err ? rej(err) : res(files));
});
