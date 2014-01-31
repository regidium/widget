var http = require('http');
var consolidate = require('consolidate');
var config = require('./config/config/config.json');
var framework = require('./src/framework/framework');
var router = require('./src/app/router/router');

var app = framework.init();
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

    app.use(framework.express.favicon());
    app.use(framework.express.compress());
    app.use(framework.express.bodyParser());
    app.use(framework.express.cookieParser());
    app.use(framework.express.cookieSession({ key: config.session.key, secret: config.session.secret, cookie: { maxAge: config.session.max_age * 1000 } }));
    app.use(framework.express.methodOverride());
    app.use(framework.express.static('./public'));
    app.use(framework.authorizer.check);
    app.use(app.router);
});

app.configure('development', function() {
    app.use(framework.express.logger('dev'));
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

var response = require('http').ServerResponse.prototype;
response.backend = framework.backend;
response.async = framework.async;
response.authorizer = framework.authorizer;

server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});