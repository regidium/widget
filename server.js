var http = require('http');
var consolidate = require('consolidate');
var express = require('express');
var config = require('./config/config/config.json');
var router = require('./src/app/router/router');

var app = express();

var server = http.createServer(app);

app.set(config.env);
app.locals.env = config.env;
app.locals.config = config;

app.configure(function() {
    app.set('port', config.server.port);

    app.set('views', './src/app/views');
    app.set('view engine', 'jade');
    app.set('view cache', config.view.cache);
    app.engine('.jade', consolidate.jade);

    app.use(express.favicon());
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.cookieSession({ key: config.session.key, secret: config.session.secret, cookie: { maxAge: config.session.max_age * 1000 } }));
    app.use(express.methodOverride());
    app.use(express.static('./public'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.logger('dev'));
    app.use(function(err, req, res, next) {
        if (!err) {
            return next();
        }

        if (req.headers['xhr']) {
            res.json({error: err});
        } else {
            res.status(500);
            res.render('common/error', { error: err });
        }
    });
});

app.configure('production', function() {});

// Routes
router.init(app);

server.listen(app.get('port'), function() {
    console.log('Widget server listening on port ' + app.get('port'));
});