module.exports.registration = function (req, res) {
    res.async.waterfall([

        function (callback) {
            if (req.person && req.person.model_type == 'person') {
                return res.send('ERROR');
                //return res.redirect('/');
            }
            callback(null);
        },

        function (callback) {
            if (req.method != 'POST') {
                return res.send('ERROR2');
                //return res.redirect('/');
            }
            callback(null);
        },

        function (callback) {
            var data = req.body;
            data.fullname = req.body.fullname;
            data.email = req.body.email;
            data.password = req.body.password;
            data.remember = req.body.remember;
            data.ip = req.ips.reverse()[0];

            res.backend.post({
                path: 'widgets/'+req.params.uid+'/users',
                data: data,
                onSuccess: function (body) {
                    callback(null, body);
                },
                onErrors: function (body) {
                    /** @todo Сделать обработчик ошибок */
                    console.log(body);
                    callback(body);
                    //res.send(body);
                }
            });
        }

    ], function (err, data) {
        if (data && data.model_type == 'person') {
            res.authorizer.login(res, data, req.body.remember);
            if (req.headers['xhr']) {
                res.send(data);
            } else {
                res.redirect('/');
            }
        } else {
            /** @todo Сделать обработчик ошибок */
            if (req.headers['xhr']) {
                res.send({ errors: ['Backend return bad data!'] });
            } else {
                res.redirect('/registration');
            }
        }
    });
};