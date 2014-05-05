(function(angular) {

    'use strict';

    /* Services */
    angular.module('regidiumApp')
        .factory('sound', function () {
            return {
                init: function(name) {
                    var sound = document.createElement('audio');

                    var types = [
                        {type: 'audio/ogg; codecs="vorbis"', file: '/sound/' + name + '.ogg'},
                        {type: 'audio/wav; codecs="1"', file: '/sound/' + name + '.wav'},
                        {type: 'audio/mpeg;', file: '/sound/' + name + '.mp3'}
                    ];

                    var audio_file = '';
                    _.each(types, function(type) {
                        var e = sound.canPlayType(type.type);
                        if ('probably' === e || 'maybe' === e) {
                            audio_file = type.file;
                        }
                    });

                    if (audio_file) {
                        sound.setAttribute('src', audio_file);
                    }

                    return sound;
                }
            };
        })
        .factory('socket', function ($rootScope) {
            var socket = io.connect($rootScope.config.server.io_url + ':' + $rootScope.config.server.io_port);
            return {
                on: function (eventName, callback) {
                    socket.on(eventName, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    });
                },
                emit: function (eventName, data, callback) {
                    socket.emit(eventName, data, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback.apply(socket, args);
                            }
                        });
                    })
                }
            };
        });

})(angular);