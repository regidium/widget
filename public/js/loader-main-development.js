var env = 'development';

head.load(
    // Common
    "/js/libs/json2/json2.js",
    "/js/libs/jquery/jquery.js",
    "/js/libs/jquery/jquery-cookie/jquery.cookie.min.js",
    "/js/libs/underscore/underscore.js",
    "/js/libs/angular/angular.js",
    "/js/libs/angular/angular-route/angular-route.js",
    "/js/libs/angular/angular-resource/angular-resource.js",
    "/js/libs/angular/angular-cookies/angular-cookies.js",
    "/js/libs/angular/angular-animate/angular-animate.js",
    "/js/libs/angular/angular-translate/angular-translate.min.js",
    "/js/libs/angular/angular-translate/angular-translate-interpolation-messageformat/angular-translate-interpolation-messageformat.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-local/angular-translate-storage-local.min.js",
    "/js/libs/angular/angular-translate/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js",
    "/js/libs/angular/angular-translate/angular-translate-handler-log/angular-translate-handler-log.min.js",
    "/js/libs/ua-parser/ua-parser.min.js",
    "/js/libs/angular/angular-underscore/angular-underscore.js",
    // Main
    "/js/app/main/app.js",
    "/js/app/main/controllers.js",
    "/js/app/common/config/config.js",
    "/js/app/common/services.js",
    function() {
        console.log("Done loading main JS. Environment: "+env);
        angular.bootstrap(document, ['regidiumApp']);
    }
);