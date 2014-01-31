var express = require('express');
var async = require('async');
var backend = require('./backend/backend');
var authorizer = require('./authorizer/authorizer');

var self = module.exports = {};

self.init = function () {
    self.app = express();
    self.async = async;
    self.backend = backend;
    self.authorizer = authorizer;
    self.express = express;
    return self.app;
};
