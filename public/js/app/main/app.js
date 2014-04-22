(function(angular) {

    'use strict';

    var app = angular.module('regidiumApp', [
        'ngRoute',
        'ngResource',
        'ngCookies',
        'pascalprecht.translate'
    ]).config(['$locationProvider', '$routeProvider', '$translateProvider', function($locationProvider, $routeProvider, $translateProvider) {
        $locationProvider.html5Mode(true);

        $routeProvider
            .when('/:uid', { templateUrl: 'js/app/main/views/index.html', controller: MainCtrl });
            //.otherwise({ redirectTo: '/:uid' });

        $translateProvider.useStaticFilesLoader({
            prefix: 'js/app/main/translations/',
            suffix: '.json'
        });

        $translateProvider.useMissingTranslationHandlerLog();

        $translateProvider.useLocalStorage();
        $translateProvider.preferredLanguage('en');
    }]).run(function($rootScope, $cookieStore, $translate, config, socket) {
        /** @todo форматировать языки (ru_RU в ru) */
        var lang = navigator.browserLanguage || navigator.language || navigator.userLanguage;
        $rootScope.lang = lang;
        $translate.uses(lang);

        $rootScope.url = document.location.host;
        // Получаем текущий URL пользователя
        $rootScope.ref = $cookieStore.get('referrer');
        // Если текущий URL пользователя не найден - добавляем его
        $rootScope.ref || $cookieStore.put('referrer', document.referrer);

        // Константы
        $rootScope.c = {};

        $rootScope.c.CHAT_STATUS_ONLINE   = 1;
        $rootScope.c.CHAT_STATUS_CHATTING = 2;
        $rootScope.c.CHAT_STATUS_OFFLINE  = 3;
        $rootScope.c.CHAT_STATUS_ARCHIVED = 4; // @depricated
        $rootScope.c.CHAT_STATUS_DELETED  = 5; // @depricated

        $rootScope.c.TRIGGER_EVENT_WIDGET_CREATED = 1;
        $rootScope.c.TRIGGER_EVENT_WORD_SEND = 2;
        $rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE = 3;
        $rootScope.c.TRIGGER_EVENT_VISIT_PAGE = 4;
        $rootScope.c.TRIGGER_EVENT_VISIT_FROM_URL = 5;
        $rootScope.c.TRIGGER_EVENT_VISIT_FROM_KEY_WORD = 6;
        $rootScope.c.TRIGGER_EVENT_CHAT_OPENED = 7;
        $rootScope.c.TRIGGER_EVENT_CHAT_CLOSED = 8;
        $rootScope.c.TRIGGER_EVENT_MESSAGE_START = 9;
        $rootScope.c.TRIGGER_EVENT_MESSAGE_SEND = 10;

        $rootScope.c.TRIGGER_RESULT_MESSAGE_SEND = 1;
        $rootScope.c.TRIGGER_RESULT_AGENTS_ALERT = 2;
        $rootScope.c.TRIGGER_RESULT_WIDGET_OPEN = 3;
        $rootScope.c.TRIGGER_RESULT_WIDGET_BELL = 4;

        $rootScope.c.MESSAGE_SENDER_TYPE_USER = 1;
        $rootScope.c.MESSAGE_SENDER_TYPE_AGENT = 2;
        $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT = 3;
    });

})(angular);