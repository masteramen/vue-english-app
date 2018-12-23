
var fs = require('fs');
var path = require('path');
var dbUtils = require('../src/common/js/env-api');

var load = function(path, name) {
    if (name) {
        return require(path + name);
    }
    return require(path)
};

function loadDir(dir) {

    fs.readdirSync(__dirname + '/' + dir).forEach(function (filename) {
        if (!/\.js$/.test(filename)) {
            return;
        }
        var name = path.basename(filename, '.js');
      let moduleName = './' + dir + '/'+name;
      console.log(`load ${moduleName}`)
      require(moduleName);

    });

}
loadDir('../src/common/js/sites')
