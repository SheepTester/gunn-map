// working at gunn-map/:
// node ./map-making/pathmaker.js

const {read, write} = require('../fs-helper.js');
const path = require('path');

(async () => {
  const paths = [];
  let currentMode = 'n_building';
  (await read(path.resolve(__dirname, './rectancles.txt')))
    .replace(/\[([a-z_]+)\]|^([RP])((?: \d+)+)/gm, (_, mode, type, params) => {
      if (mode) {
        currentMode = mode;
        return;
      }
      params = params.slice(1).split(' ').map(Number);
      if (type === 'R') {
        const [x, y, width, height, rotation] = params;
        if (+rotation === 0) {
          paths.push([currentMode, x, y, x + width, y]);
          paths.push([currentMode, x + width, y, x + width, y + height]);
          paths.push([currentMode, x + width, y + height, x, y + height]);
          paths.push([currentMode, x, y + height, x, y]);
        }
      } else if (type === 'P') {
        for (let i = 0; i < params.length; i += 2) {
          paths.push([currentMode, params[i], params[i + 1], params[(i + 2) % params.length], params[(i + 3) % params.length]]);
        }
      }
    });
  write(path.resolve(__dirname, './walls.json'), JSON.stringify(paths));
})();
