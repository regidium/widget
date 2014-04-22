var http           = require('http');
var consolidate    = require('consolidate');
var express        = require('express');
var staticFavicon  = require('static-favicon');
var compression    = require('compression');
var bodyParser     = require('body-parser');
var cookieParser   = require('cookie-parser');
var cookieSession  = require('cookie-session');
var methodOverride = require('method-override');
var morgan         = require('morgan');
var config         = require('./config/config/config.json');
var router         = require('./src/app/router/router');

var app    = express();
var server = http.createServer(app);

var env = config.env || 'development';
app.set(env);

app.locals.env = config.env;
app.locals.config = config;

app.set('port', config.server.port);

app.set('views', './src/app/views');
app.set('view engine', 'jade');
app.set('view cache', config.view.cache);
app.engine('.jade', consolidate.jade);

app.use(staticFavicon());
app.use(compression());
app.use(bodyParser());
app.use(cookieParser());
app.use(methodOverride());
app.use(cookieSession({ key: config.session.key, secret: config.session.secret, cookie: { maxAge: config.session.max_age * 1000 } }));
app.use(express.static('./public'));

app.use(function(err, req, res, next) {
    if (!err) {
        return next();
    }

    if (req.xhr || req.headers['xhr']) {
        res.json({error: err});
    } else {
        res.status(500);
        res.render('common/error', { error: err });
    }
});

if ('development' == env) {
    app.use(morgan('dev'));
}

if ('production' == env) {}

// Routes
router.init(app);

server.listen(app.get('port'), function() {
    console.log('Widget server listening on port ' + app.get('port'));
});