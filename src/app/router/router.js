var self = module.exports = {};

var index = require('./routes/index');
var auth = require('./routes/auth');

self.init = function(app) {
    // Регистрация пользователя
    app.get('/:uid', index.index);
    app.post('/registration/:uid', auth.registration);
    //app.get('*', index.index);
}