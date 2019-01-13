const {read, write} = require('../fs-helper.js');
const path = require('path');

(async () => {
  const paths = [];
  let currentMode = 'n_building';
  (await read(path.resolve(__dirname, './rectancles.txt')))
    .replace(/\[([a-z_]+)\]|(\d+) (\d+) (\d+) (\d+) (\d+)/g, (_, mode, x, y, width, height, rotation) => {
      if (mode) {
        currentMode = mode;
        return;
      }
      if (+rotation === 0) {
        paths.push([currentMode, +x, +y, +x + +width, +y]);
        paths.push([currentMode, +x + +width, +y, +x + +width, +y + +height]);
        paths.push([currentMode, +x + +width, +y + +height, +x, +y + +height]);
        paths.push([currentMode, +x, +y + +height, +x, +y]);
      }
    });
  write(path.resolve(__dirname, './walls.json'), JSON.stringify(paths));
})();
