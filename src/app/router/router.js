var self = module.exports = {};

var index = require('./routes/index');

self.init = function(app) {
    app.get('/:widget_uid', index.index);
    //app.get('*', index.index);
}