var env = 'production';

head.load(
    // Common
    "//cdnjs.cloudflare.com/ajax/libs/json2/20130526/json2.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-route.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-resource.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-cookies.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-animate.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/bower-angular-translate/2.0.1/angular-translate.min.js",
    "/js/libs/angular/angular-translate/angular-translate-interpolation-messageformat/angular-translate-interpolation-messageformat.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-local/angular-translate-storage-local.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/bower-angular-translate-loader-static-files/2.0.0/angular-translate-loader-static-files.min.js",
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