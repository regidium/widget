(function() {

    'use strict';

    /* Services */
    angular.module('regidiumApp')
        .factory('Users', function ($rootScope, $resource) {
            return $resource($rootScope.config.apiUrl + 'users', null, {
                one: { method: 'GET', url: $rootScope.config.apiUrl + 'users/:uid' },
                create: { method: 'POST', url: $rootScope.config.apiUrl + 'users' },
                edit: { method: 'PUT', url: $rootScope.config.apiUrl + 'users/:uid' }
            });
        })
        .factory('Widgets', function($rootScope, $resource) {
            return $resource($rootScope.config.apiUrl + 'widgets', null, {
                one: { method: 'GET', url: $rootScope.config.apiUrl + 'widgets/:uid' },
                saveUser: { method: 'PUT', params: { uid: "@uid", user: "@user" }, url: $rootScope.config.apiUrl + 'widgets/:uid/users/:user' },
                createChat: { method: 'POST', params: { uid: "@uid", user: "@user" }, url: $rootScope.config.apiUrl + 'widgets/:uid/users/:user/chats' },
                createChatMessage: { method: 'POST', params: { uid: "@uid", chat: "@chat" }, url: $rootScope.config.apiUrl + 'widgets/:uid/chats/:chat/messages' }
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