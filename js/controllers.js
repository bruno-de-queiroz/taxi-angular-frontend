/**
 * Created by bruno on 29/09/15.
 */
angular.module('taxiApp.controllers', [])
    .controller('ApplicationController', [
        '$scope'
        , '$rootScope'
        , '$timeout'
        , '$window'
        , '$ionicLoading'
        , function ($scope, $rootScope, $timeout, $window, $ionicLoading) {

            $scope.message = null;

            $scope.isInPath = function (path) {

                var regex = new RegExp('^' + path);
                regex.test($window.location.pathname);

            };

            $scope.$on('newMessage', function (event, data) {

                $scope.message = data;

                $timeout(function () {
                    $scope.message = null;
                }, 3000);

            });

            $rootScope.$on('showLoading', function (event, text) {

                $ionicLoading.show({
                    template: text || "Processando..."
                });

            });

            $rootScope.$on('hideLoading', function (event, data) {

                $scope.$broadcast('scroll.resize');
                $ionicLoading.hide();

            });
        }
    ])
    .controller('LoginController', [
        '$scope'
        , '$state'
        , '$ionicHistory'
        , 'TaxiApiService'
        , function ($scope, $state, $ionicHistory, $api) {

            $ionicHistory.clearHistory();

            $scope.login = {
                type: 0
                , user: {}
            };

            $scope.facebook = function () {
                return $facebook.login()
            };

            $scope.submit = function () {

                $scope.$emit('showLoading', 'Autenticando...');

                $api.login($scope.user).then(
                    function () {

                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });

                        $state.go('main.map');
                    }
                    , function (error) {

                        $scope.$emit('newMessage', {
                            type: 'alert',
                            text: error.data ? error.data.error : "Confira os dados do usuário e senha."
                        });

                    }).finally(function () {

                        $scope.$emit('hideLoading');

                    });
            }
        }
    ])
    .controller('ResetController', [
        '$scope'
        , '$state'
        , 'TaxiApiService'
        , '$ionicScrollDelegate'
        , '$ionicHistory'
        , function ($scope, $state, $api, $ionicScrollDelegate, $ionicHistory) {

            $scope.user = {
                email: ""
            };

            $scope.submit = function () {

                $scope.errors = null;

                $scope.$emit('showLoading');

                $api.reset($scope.user).then(
                    function (resp) {

                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });

                        $state.go('auth.login').then(function () {

                            $scope.$emit('newMessage', {
                                type: 'notice',
                                text: "Confira seu email e verique as instruções para alterar sua senha."
                            });

                        });

                    }, function (error) {

                        $scope.errors = error.data;

                        $scope.$emit('newMessage', {
                            type: 'alert',
                            text: error.data ? error.data.error : "Confira se os dados foram inseridos corretamente."
                        });

                    }).finally(function () {

                        $scope.$emit('hideLoading');

                    });
            };
        }
    ])
    .controller('PasswordController', [
        '$scope'
        , '$state'
        , '$stateParams'
        , 'TaxiApiService'
        , '$ionicScrollDelegate'
        , '$ionicHistory'
        , function ($scope, $state, $stateParams, $api, $ionicScrollDelegate, $ionicHistory) {

            $scope.user = {
                password: ""
                , passwordConfirmation: ""
                , token: $stateParams.token
            };

            $scope.submit = function () {

                $scope.errors = null;

                $scope.$emit('showLoading');

                $api.change($scope.user).then(
                    function (resp) {

                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });

                        $state.go('auth.login').then(function () {

                            $scope.$emit('newMessage', {
                                type: 'notice',
                                text: "Senha alterada com sucesso."
                            });

                        });

                    }, function (error) {

                        $scope.errors = error.data;

                        $scope.$emit('newMessage', {
                            type: 'alert',
                            text: error.data ? error.data.error : "Confira se os dados foram inseridos corretamente."
                        });

                    }).finally(function () {

                        $scope.$emit('hideLoading');

                    });
            };
        }
    ])
    .controller('MapController', [
        '$scope'
        , '$log'
        , 'TaxiApiService'
        , '$ionicLoading'
        , function ($scope, $log, $api) {

            $scope.center = {latitude: -23.547776, longitude: -46.641991};

            function setCenter(data) {
                $scope.center = data
            }

            $scope.taxis = [];

            function setTaxis(data) {
                var n = _.merge($scope.taxis, data);
                $scope.taxis = _.uniq(n, function (a) {
                    return a.id;
                });
            }

            $scope.map = {
                center: $scope.center
                , zoom: 14
                , events: {
                    tilesloaded: function (map) {
                        $api.find(map.getBounds()).then(setTaxis)
                    }
                }
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (data) {
                        setCenter({latitude: data.coords.latitude, longitude: data.coords.longitude})
                    }, function (err) {
                        $log.error(err)
                    }
                );
            }
        }
    ]);