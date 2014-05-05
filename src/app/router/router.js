var p3p  = require('p3p');
var self = module.exports = {};

var index = require('./routes/index');

self.init = function(app) {
    app.all('*', p3p(p3p.recommended), function(req, res, next) {
        var ref = req.header('Referer');
        if (ref) {
            next();
        } else {
            res.status(500);
            res.render('common/error', { error: 'Hack detected' });
        }
    });

    app.get('/:widget_uid', index.index);
}