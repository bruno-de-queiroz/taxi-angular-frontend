/**
 * Created by bruno on 29/09/15.
 */
angular.module('taxiApp.services', [])
    .factory('AuthInterceptor', [
        "$rootScope"
        , "$q"
        , "EVENTS"
        , function ($rootScope, $q, EVENTS) {
            return {
                request: function (config) {
                    console.log
                    if ($rootScope.accessToken) {
                        config.headers["Authorization"] = "Bearer " + $rootScope.accessToken
                    }
                    return config || $q.when(config)
                },
                responseError: function (response) {
                    $rootScope.$broadcast({
                        401: EVENTS.notAuthenticated
                        , 403: EVENTS.notAuthorized
                        , 419: EVENTS.notAuthenticated
                        , 440: EVENTS.notAuthenticated
                        , 404: EVENTS.notFound
                    }[response.status], response);
                    return $q.reject(response);
                }
            }

        }
    ])
    .factory('TaxiApiService', [
        "$rootScope"
        , "$q"
        , "$window"
        , "$http"
        , "EVENTS"
        , function ($rootScope, $q, $window, $http, EVENTS) {

            function TaxiApi() {
                this.key = "taxiAppAccessToken";
                this.token = $window.sessionStorage.getItem(this.key);
                this.url = "http://api.taxiapp.com";
            }

            TaxiApi.prototype = {
                status: function () {

                    $rootScope.accessToken = this.token;
                    var p;

                    p = $q.defer();

                    $http.get([this.url, '/profile'].join('')).then(
                        function (response) {

                            $rootScope.$broadcast(EVENTS.authenticated);
                            p.resolve()

                        }, function (err) {

                            $rootScope.$broadcast(EVENTS.notAuthenticated);
                            p.reject(err)

                        }
                    ).finally(function () {
                            $rootScope.accessToken = null;
                        });
                    return p.promise
                },
                login: function (user) {
                    var $t, p;

                    $t = this;
                    p = $q.defer();

                    $http.post([this.url, '/login'].join(''), user).then(
                        function (response) {

                            $rootScope.$broadcast(EVENTS.authenticated);
                            $t.token = response.data.token;
                            $window.sessionStorage.setItem($t.key, $t.token);
                            p.resolve()

                        }, function (err) {

                            $rootScope.$broadcast(EVENTS.notAuthenticated);
                            p.reject(err)

                        }
                    );
                    return p.promise
                },
                change: function (data) {
                    var p, t;

                    p = $q.defer();
                    t = data.token;
                    delete data.token;

                    $http.post([this.url, '/reset/', t].join(''), data).then(
                        function (response) {

                            $rootScope.$broadcast(EVENTS.notAuthenticated);
                            p.resolve()

                        }, function (err) {

                            p.reject(err)

                        }
                    );
                    return p.promise
                },
                reset: function (data) {
                    var $t, p;

                    $t = this;
                    p = $q.defer();

                    $http.post([this.url, '/reset'].join(''), data).then(
                        function (response) {

                            $rootScope.$broadcast(EVENTS.notAuthenticated);
                            $t.token = null;
                            p.resolve()

                        }, function (err) {
                            p.reject(err)

                        }
                    );
                    return p.promise
                },
                logout: function () {
                    $rootScope.accessToken = this.token;
                    var $t, p;

                    $t = this;
                    p = $q.defer();

                    $http.delete([this.url, '/logout'].join('')).then(
                        function (response) {

                            $rootScope.$broadcast(EVENTS.notAuthenticated);
                            $t.token = null;
                            $window.sessionStorage.removeItem($t.key);
                            p.resolve()

                        }, function (err) {
                            p.reject(err)

                        }
                    ).finally(function () {
                            $rootScope.accessToken = null;
                        });
                    return p.promise
                },
                find: function (bounds) {
                    $rootScope.accessToken = this.token;
                    var sw, ne, p;

                    p = $q.defer();
                    sw = bounds.getSouthWest();
                    ne = bounds.getNorthEast();

                    $http.get([this.url, '/drivers/inArea?sw=', sw.H, ',', sw.L, '&ne=', ne.H, ',', ne.L].join("")).then(
                        function (response) {

                            var data = _.map(response.data, function (i) {
                                return {
                                    icon: i.driverAvailable ? "/images/g_pin.png" : "/images/r_pin.png",
                                    id: i.driverId,
                                    latitude: i.latitude,
                                    longitude: i.longitude
                                }
                            });

                            p.resolve(data);

                        }, function (err) {
                            p.resolve([]);
                        }
                    ).finally(function () {
                            $rootScope.accessToken = null;
                        });

                    return p.promise
                }
            };

            return new TaxiApi()

        }
    ]);