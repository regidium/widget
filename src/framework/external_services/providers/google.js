var _ = require('underscore'),
    OAuth = require('oauth').OAuth2,
    config = require("../../../../config/config/config.json");

var self = module.exports;

self.createOAuth = function ()
{
    return new OAuth(
        config.external_services.google.id,
        config.external_services.google.secret,
        "https://accounts.google.com/o",
        "/oauth2/auth",
        "/oauth2/token"
    );
};

self.generateAuthLink = function (oa, req, cb)
{
    var link = oa.getAuthorizeUrl({
        response_type: "code",
        scope: config.external_services.google.scope,
        redirect_uri : config.server.url + req.path
    });
    cb(null, link);
};

self.getOAuthAccessToken = function (oa, req, cb)
{
    oa.getOAuthAccessToken(
        req.query.code,
        {
          grant_type: 'authorization_code',
          redirect_uri: config.server.url + req.path
        },
        function (err, access_token, refresh_token, results) {
            cb(err, access_token, refresh_token, results);
        }
    );
};

self.getProfileInfo = function (oa, access_token, cb)
{
    oa.getProtectedResource("https://www.googleapis.com/plus/v1/people/me", access_token, function (err, data, response) {
        if (!err) {
            data = (JSON.parse(data));
            var profile = {
                id: data.id,
                fullname: data.displayName,
                link: data.url,
                gender: data.gender
            };
            if (data.nickname) {
              profile.login = data.nickname;
            }
            cb(err, profile);
        } else {
            cb(err, data);
        }
    });
};

/**
* @param oa            object         OAuth2
* @param access_token  string         Access token
* @param method        string         Выполняемый метод
* @param params        object         Параметры метода
* @param cb            function       Callback
*/
self.callMethod = function (oa, access_token, method, params, cb)
{
    var query = '?';
    if (_.size(params) > 0) {
      _.each(params, function(value, key, list){
        query = query + (key+'='+value+'&');
      });
    }
    query = query + 'key='+config.external_services.google.api_key;

    oa.getProtectedResource('https://www.googleapis.com/drive/v2/'+method+query, access_token, function (err, data, response) {
        if (!err) {
            if ((JSON.parse(data)).error) cb((JSON.parse(data)).error, data);
            data = (JSON.parse(data));
            cb(null, data);
        } else {
            cb(err, data);
        }
    });
};