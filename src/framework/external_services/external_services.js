var self = module.exports = function (provider, req, res) {

    var self = this;
    var provider = require('./providers/' + provider);
    var oa = provider.createOAuth(req);

    self.connect = function (cb) {
        if (!req.query.code && !req.session.oauth) {
            /** First step */
            provider.generateAuthLink(oa, req, function(err, link) {
                if (link) {
                    res.send({link: link});
                } else {
                    cb(err);
                }
            });
        } else {
            /** Second step */
            provider.getOAuthAccessToken(oa, req, function(err, access_token, refresh_token, results) {
                cb(err, access_token, refresh_token, results);
            });
        }
    };

    self.callMethod = function (access_token, method, params, cb) {
        provider.callMethod(oa, access_token, method, params, function (err, data) {
            cb(err, data);
        });
    };

    self.getProfileInfo = function (access_token, cb) {
        provider.getProfileInfo(oa, access_token, function (err, data) {
            cb(err, data);
        });
    }

};