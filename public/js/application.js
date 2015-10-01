/**
 * Created by bruno on 29/09/15.
 */

var app = angular.module("taxiApp", [
    'ngFacebook',
    'uiGmapgoogle-maps',
    'ionic',
    "taxiApp.controllers",
    "taxiApp.services"
]);
app.run([
    '$ionicPlatform'
    , '$ionicHistory'
    , '$rootScope'
    , '$state'
    , '$window'
    , 'TaxiApiService'
    , 'EVENTS'
    , function ($ionicPlatform, $ionicHistory, $rootScope, $state, $window, $api, EVENTS) {

        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            if (window.StatusBar)
                StatusBar.styleDefault();
        });

        $rootScope.$on(EVENTS.authenticated, function (event, data) {
            $rootScope.$root.logged = true;
            $rootScope.$root.logout = function () {
                $api.logout().then(function () {
                    $ionicHistory.nextViewOptions({
                        disableBack: true,
                        historyRoot: true
                    });
                    $rootScope.$root.logged = false;
                    $state.go('auth.login');
                });
            }
        });

        $rootScope.$on(EVENTS.notAuthenticated, function (event, data) {
            $rootScope.$root.logged = false;
            $state.go('auth.login', {reload: true});
        });

        $rootScope.$on(EVENTS.notFound, function (event, data) {
            $state.go('auth.login', {reload: true});
            $rootScope.$broadcast('newMessage', {
                type: 'alert',
                text: 'O recurso que você está procurando não foi encontrado.'
            });
        });

        $rootScope.$on(EVENTS.notAuthorized, function (event, data) {
            $rootScope.$broadcast('newMessage', {type: 'alert', text: 'Você não tem permissão para executar essa ação'})
        });

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                return;
            }
            js = d.createElement(s);
            js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

    }
]);

app.config([
    '$stateProvider'
    , "$locationProvider"
    , '$urlRouterProvider'
    , '$httpProvider'
    , '$ionicConfigProvider'
    , 'uiGmapGoogleMapApiProvider'
    , '$facebookProvider'
    , function ($stateProvider, $location, $urlRouterProvider, $httpProvider, $ionicConfigProvider, $uiGmapGoogleMapApiProvider, $facebookProvider) {

        $location.html5Mode(true)
        $ionicConfigProvider.views.maxCache(5);
        $ionicConfigProvider.tabs.position("bottom");
        $ionicConfigProvider.navBar.alignTitle("center");

        $uiGmapGoogleMapApiProvider.configure({
            v: '3.20',
            libraries: 'visualization'
        });

        $stateProvider
            .state('auth', {
                url: '/auth/'
                , abstract: true
                , views: {
                    'base-tab': {
                        templateUrl: 'auth.html'
                        , controller: ['$ionicHistory', function ($ionicHistory) {
                            $ionicHistory.clearHistory();
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                        }]
                    }
                }
            })
            .state('auth.login', {
                url: 'login'
                , views: {
                    'auth-tab': {
                        templateUrl: 'login.html'
                        , controller: 'LoginController'
                    }
                }
            })
            .state('auth.reset', {
                url: 'reset'
                , views: {
                    'auth-tab': {
                        templateUrl: 'reset.html'
                        , controller: 'ResetController'
                    }
                }
            })
            .state('auth.password', {
                url: 'reset/:token'
                , views: {
                    'auth-tab': {
                        templateUrl: 'password.html'
                        , controller: 'PasswordController'
                    }
                }
            })
            .state('main', {
                url: '/'
                , abstract: true
                , resolve: {
                    status: Resolvers.Status
                }
                , views: {
                    'base-tab': {
                        templateUrl: 'main.html'
                    }
                }
            })
            .state('main.map', {
                url: ''
                , views: {
                    'main-tab': {
                        templateUrl: 'map.html'
                        , controller: 'MapController'
                    }
                }
            });

        $urlRouterProvider.otherwise('/');

        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $httpProvider.interceptors.push('AuthInterceptor');
    }
]);

app.constant('EVENTS',
    {
        authenticated: 'auth-authenticated'
        , notFound: 'not-found'
        , notAuthenticated: 'auth-not-authenticated'
        , notAuthorized: 'auth-not-authorized'
    }
);

var Resolvers = {
    Status: [
        'TaxiApiService'
        , '$q'
        , '$window'
        , '$rootScope'
        , 'EVENTS'
        , function ($api, $q, $window, $rootScope, EVENTS) {

            $rootScope.$broadcast('showLoading');

            var p = $q.defer();

            function authorized(data) {
                $rootScope.$broadcast(EVENTS.authenticated);
                p.resolve(data)
            }

            $api.status().then(authorized, p.reject).finally(
                function () {
                    $rootScope.$broadcast('hideLoading');
                }
            );

            return p.promise
        }
    ]
};
