(function(angular) {

    'use strict';

    /* Directives */
    angular.module('regidiumApp.commonDirectives', [])
        .directive('uiEqualTo', function() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elm, attrs, ctrl) {

                    function validateEqual(myValue, otherValue) {
                        if (myValue === otherValue) {
                            ctrl.$setValidity('equal', true);
                            return myValue;
                        } else if (myValue == undefined && otherValue == undefined) {
                            return true;
                        } else {
                            ctrl.$setValidity('equal', false);
                            return myValue;
                        }
                    }

                    scope.$watch(attrs.uiEqualTo, function (otherModelValue) {
                        validateEqual(ctrl.$viewValue, otherModelValue);
                    });

                    ctrl.$parsers.unshift(function (viewValue) {
                        return validateEqual(viewValue, scope.$eval(attrs.uiEqualTo));
                    });

                    ctrl.$formatters.unshift(function (modelValue) {
                        return validateEqual(modelValue, scope.$eval(attrs.uiEqualTo));
                    });
                }
            };
        })
        .directive('autoScroll', function () {
            return {
                restrict: 'A',
                link: function(scope, $el, attrs) {
                    scope.$watch(function() {
                        $el[0].scrollTop = $el[0].scrollHeight;
                    });
                }
            };
        })
    ;

})(angular);