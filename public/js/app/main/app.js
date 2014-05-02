(function(angular) {

    'use strict';

    var app = angular.module('regidiumApp', [
        'ngRoute',
        'ngResource',
        'ngCookies',
        'ngAnimate',
        'pascalprecht.translate'
    ]).config(['$locationProvider', '$routeProvider', '$translateProvider', '$logProvider', function($locationProvider, $routeProvider, $translateProvider, $logProvider) {
        $locationProvider.html5Mode(true);

        $routeProvider
            .when('/:uid', { templateUrl: 'js/app/main/views/index.html', controller: MainCtrl });

        $translateProvider.useStaticFilesLoader({
            prefix: 'js/app/main/translations/',
            suffix: '.json'
        });

        if (env == 'development') {
            $translateProvider.useMissingTranslationHandlerLog();
        }

        $translateProvider.useLocalStorage();
        $translateProvider.preferredLanguage('en');

        if (env == 'development') {
            $logProvider.debugEnabled(true);
        }
    }]).run(function($rootScope, $cookieStore, $translate, config, socket, $locale) {
        $rootScope.env = env || 'production';

        var lang = navigator.browserLanguage || navigator.language || navigator.userLanguage;
        lang = lang.substring(0, 2);
        $rootScope.lang = lang;
        $translate.uses(lang);

        // Получаем UID виджета
        $rootScope.widget_uid = $cookieStore.get('widget_uid');

        $rootScope.setCookie = function(name, value, options) {
              options = options || {};
              options.path = '/' + $rootScope.widget_uid;

              var expires = options.expires;

              if (typeof expires == 'number' && expires) {
                var d = new Date();
                d.setTime(d.getTime() + expires*1000);
                expires = options.expires = d;
              }

              if (expires && expires.toUTCString) { 
                options.expires = expires.toUTCString();
              }

              value = encodeURIComponent(JSON.stringify(value));

              var updatedCookie = name + "=" + value;

              for(var propName in options) {
                updatedCookie += "; " + propName;
                var propValue = options[propName];    
                if (propValue !== true) { 
                  updatedCookie += "=" + propValue;
                 }
              }

              document.cookie = updatedCookie;
        }


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