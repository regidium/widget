(function() {

    'use strict';

    /* Services */
    angular.module('regidiumApp')
        .factory('Chats', function($rootScope, $resource) {
            return $resource($rootScope.apiUrl + 'chats', null, {
                all: { method: 'GET', url: $rootScope.config.apiUrl + 'chats', isArray:true },
                one: { method: 'GET', url: $rootScope.config.apiUrl + 'chats/:uid' },
                create: { method: 'POST', url: $rootScope.config.apiUrl + 'chats' },
                edit: { method: 'PUT', url: $rootScope.config.apiUrl + 'chats/:uid' },
                remove: { method: 'DELETE', url: $rootScope.config.apiUrl + 'chats/:uid' }
            });
        })
        .factory('ChatsMessages', function($rootScope, $resource) {
            return $resource($rootScope.apiUrl + 'chats/messages', null, {
                all: { method: 'GET', url: $rootScope.config.apiUrl + 'chats/messages', isArray:true },
                one: { method: 'GET', url: $rootScope.config.apiUrl + 'chats/messages/:uid' },
                create: { method: 'POST', url: $rootScope.config.apiUrl + 'chats/messages' },
                edit: { method: 'PUT', url: $rootScope.config.apiUrl + 'chats/messages/:uid' },
                remove: { method: 'DELETE', url: $rootScope.config.apiUrl + 'chats/messages/:uid' }
            });
        })
    ;

})();