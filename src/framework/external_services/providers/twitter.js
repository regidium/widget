var OAuth = require('oauth').OAuth,
    config = require("../../../../config/config/config.json");

var self = module.exports;

self.createOAuth = function (req)
{
    return new OAuth(
        "https://twitter.com/oauth/request_token",
        "https://twitter.com/oauth/access_token", 
        config.external_services.twitter.id, config.external_services.twitter.secret, 
        "1.0A", config.server.url + req.path, "HMAC-SHA1"
    );
};

self.generateAuthLink = function (oa, req, cb)
{
    oa.getOAuthRequestToken(function(err, oauth_token, oauth_token_secret, results){
        if (!err) {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            req.session.oauth.token_secret = oauth_token_secret;
            var link = 'https://twitter.com/oauth/authenticate?oauth_token='+oauth_token;
            cb(err, link);
        } else {
            cb(err);
        }
    });
};

self.getOAuthAccessToken = function (oa, req, cb)
{
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth = req.session.oauth;
        oa.getOAuthAccessToken(
            oauth.token,
            oauth.token_secret,
            oauth.verifier, 
            function(err, access_token, access_token_secret, results){
                if (!err){
                    req.session.oauth.access_token = access_token;
                    req.session.oauth,access_token_secret = access_token_secret;
                    cb(err, access_token, access_token_secret);
                    oa.twitter = results;
                    oa.access_token = access_token;
                    oa.access_token_secret = access_token_secret;
                } else {
                    cb(err);
                }
                delete req.session.oauth;
            }
        );
    }
};

self.getProfileInfo = function (oa, access_token, cb)
{

    oa.get(
        'https://api.twitter.com/1.1/users/show.json?user_id=' + oa.twitter.user_id,
        oa.access_token,
        oa.access_token_secret,
        function (err, data, response) {
            if (!err) {
                data = JSON.parse(data);
                var profile = {
                    id: data.id,
                    login: data.screen_name,
                    fullname: data.name,
                    link: 'http://twitter.com/' + data.screen_name,
                    timezone: data.time_zone
                };
                cb(err, profile);
            } else {
                cb(err, data);
            }
        }
    );
};

