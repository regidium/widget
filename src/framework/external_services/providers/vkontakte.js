var _ = require('underscore'),
    OAuth = require('oauth').OAuth2,
    config = require("../../../../config/config/config.json");

var self = module.exports;

self.createOAuth = function ()
{
    return new OAuth(
        config.external_services.vkontakte.id,
        config.external_services.vkontakte.secret,
        "https://api.vk.com"
    );
};

self.generateAuthLink = function (oa, req, cb)
{
    var link = oa.getAuthorizeUrl({
        redirect_uri : config.server.url + req.path,
        scope: config.external_services.vkontakte.scope,
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
    oa.getProtectedResource('https://api.vk.com/method/users.get?fields=nickname,screen_name,sex,bdate,city,country,timezone,photo,photo_medium,photo_big,has_mobile,contacts,online,counters,last_seen,status', access_token, function (err, data, response) {
        if (!err) {
            data = (JSON.parse(data)).response[0];
            var profile = {
                id: data.uid,
                login: data.screen_name,
                fullname: data.last_name + ' ' + data.first_name,
                link: 'http://vk.com/id' + data.uid,
                gender: data ? (data.sex != 2 ? 'female' : 'male') : null
            };
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
    query = query + ('v=5');
    oa.getProtectedResource("https://api.vk.com/method/"+method+query, access_token, function (err, data, response) {
        if (!err) {
            if ((JSON.parse(data)).error) cb((JSON.parse(data)).error, data);
            data = (JSON.parse(data)).response;
            cb(null, data);
        } else {
            cb(err, data);
        }
    });
};