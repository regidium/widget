var self = module.exports = {};

var index = require('./routes/index');

self.init = function(app) {
    app.get('*', index.index);
}