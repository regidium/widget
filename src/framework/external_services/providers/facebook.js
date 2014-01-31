var OAuth = require('oauth').OAuth2,
    config = require("../../../../config/config/config.json");

var self = module.exports;

self.createOAuth = function ()
{
    return new OAuth(
        config.external_services.facebook.id,
        config.external_services.facebook.secret,
        "https://graph.facebook.com"
    );
};

self.generateAuthLink = function (oa, req, cb)
{
    var link = oa.getAuthorizeUrl({
        redirect_uri : config.server.url + req.path,
        scope: config.external_services.facebook.scope,
        display: 'page'
    });

    cb(null, link);
};

self.getOAuthAccessToken = function (oa, req, cb)
{
    oa.getOAuthAccessToken(
        req.query.code,
        { redirect_uri: config.server.url + req.path },
        function (err, access_token, refresh_token) {
            cb(err, access_token, refresh_token);
        }
    );
};

self.getProfileInfo = function (oa, access_token, cb)
{
    oa.getProtectedResource("https://graph.facebook.com/me", access_token, function (err, data, response) {
        if (!err) {
            data = JSON.parse(data);
            var profile = {
                id: data.id,
                login: data.username,
                email: data.email,
                email_activated: data.verified,
                fullname: data.last_name + ' ' + data.first_name,
                link: data.link,
                gender: data ? (data.gender != 2 ? 'female' : 'male') : null,
                locale: data.locale,
                timezone: data.timezone
            };
            cb(err, profile);
        } else {
            cb(err, data);
        }
    });
};
