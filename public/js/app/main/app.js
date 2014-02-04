(function(angular) {

    'use strict';

    var app = angular.module('regidiumApp', [
        'ngRoute',
        'ngResource',
        'ngCookies',
        'pascalprecht.translate',
        'regidiumApp.commonDirectives'
    ]).config(['$locationProvider', '$routeProvider', '$translateProvider', function($locationProvider, $routeProvider, $translateProvider) {
        $locationProvider.html5Mode(true);

        $routeProvider
            .when('/', { templateUrl: 'js/app/main/views/index.html', controller: MainCtrl })
            .otherwise({ redirectTo: '/' });

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
        // Если текущий URL пользователя не найден - сохраняем его
        $rootScope.ref || $cookieStore.put('referrer', document.referrer);

/*
        $cookieStore.remove("token");
        $cookieStore.remove("cliId");
        $cookieStore.remove("entId");
        $cookieStore.remove("me");
        $cookieStore.remove("messages");
        $cookieStore.remove("hypertext");
        $cookieStore.remove("opened")
*/
    });

})(angular);