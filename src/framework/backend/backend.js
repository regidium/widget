var _ = require('underscore'),
    qs = require('qs'),
    request = require('request'),
    config = require('../../../config/config/config.json');

var self = module.exports;

self.request = function (options) {
    var request_callback = function (errors, options, body, statusCode) {
        if (errors) {
            if (typeof(errors) == 'object' && errors instanceof Error) {
                console.error('Error backend request: ' + statusCode + ' ' + errors.message);
                console.error(errors.stack);
            } else {
                console.error('Error backend request: ' + errors);
            }
        }
    };

    if (!options) {
        throw new Error('no options');
    }
    if (!options.path) {
        throw new Error('no path');
    }
    if (!options.method) {
        throw new Error('no method');
    }
    if (!options.data) {
        options.data = {};
    }

    self.do_request(options, request_callback);
};

self.do_request = function (options, cb) {
    var path = options.path
    if (options.method == 'get' && options.data) {
        path += ('?' + qs.stringify(options.data));
    }

    request[options.method]({
        url:  config.backend.url + path,
        form: options.data
    }, function (err, response, body) {
        self.handle_response(err, response.statusCode, body, options, cb);
    });
};

self.handle_response = function (err, statusCode, body, options, cb) {
    var rawBody = body;
    var requestErrors = null;
    if (err) {
        console.error('Error handle backend request: ' + err);
        options.onRequestError(err, body);
        requestErrors = err;
        return;
    }

    try {
        body = JSON.parse(body);
    } catch (e) {
        // DEBUG
        //console.log(body);
        requestErrors = 'parse-error';
        if (_.isFunction(options.onRequestError)) options.onRequestError(e, body);
        body = null;
    }

    if (body) {
        try {
            if (!body.errors) {
                if (_.isFunction(options.onSuccess)) options.onSuccess(body);
            } else {
                if (_.isFunction(options.onErrors)) options.onErrors(body);
            }

            if (_.isFunction(options.onComplete)) options.onComplete(body);

            if (statusCode == 403 && _.isFunction(options.onNoAccess)) options.onNoAccess();
        } catch (e) {
            requestErrors = e;
        }
    }

    cb(requestErrors, options, rawBody, statusCode);
};


self.get = function (options) {
    options.method = 'get';
    return self.request(options);
};

self.post = function (options) {
    options.method = 'post';
    return self.request(options);
};

self.path = function (options) {
    options.method = 'path';
    return self.request(options);
};

self.put = function (options) {
    options.method = 'put';
    return self.request(options);
};

self.delete = function (options) {
    options.method = 'delete';
    return self.request(options);
};
