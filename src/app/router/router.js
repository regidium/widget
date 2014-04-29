var self = module.exports = {};

var index = require('./routes/index');

self.init = function(app) {
    app.all('*', function(req, res, next) {
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