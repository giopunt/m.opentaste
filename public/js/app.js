var OptApp = angular.module('OptApp', ['ngTouch'], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
});

OptApp.directive('touchClick', ['$parse', function ($parse) {
    return function (scope, element, attr) {
        var fn = $parse(attr['touchClick']);
        var initX, initY, endX, endY;
        var elem = element;
        var maxMove = 4;

        elem.bind('touchstart', function (event) {
            event.preventDefault();
            initX = endX = event.originalEvent.touches[0].clientX;
            initY = endY = event.originalEvent.touches[0].clientY;
            elem.bind('touchend', onTouchEnd);
            elem.bind('touchmove', onTouchMove);
        });

        function onTouchMove(event) {
            endX = event.originalEvent.touches[0].clientX;
            endY = event.originalEvent.touches[0].clientY;
        };

        function onTouchEnd(event) {
            elem.unbind('touchmove');
            elem.unbind('touchend');
            if (Math.abs(endX - initX) > maxMove) return;
            if (Math.abs(endY - initY) > maxMove) return;
            scope.$apply(function () { fn(scope, { $event: event }); });
        };
    };
} ]);

function MenuCntrl($scope) {
    $scope.show_menu = false;
    $scope.lang = "en";
    $scope.show_search = false;

    $scope.closeMenu = function() {
        if($scope.show_menu){
            $scope.show_menu = false;
        }
    }

    $scope.openSearch = function() {
        if(!$scope.show_search){
            $scope.show_search = true;
        }else{
            $scope.show_search = false;
        }
    }

    $scope.openMenu = function(){
        $scope.show_menu = true;
    }

}

function HomeTimelineCtrl($scope, $http) {
    $scope.type_list='lastes';
    $scope.list_recipes=[];
    $scope.allow_scroll = true;
    $scope.lang = lang;

    $scope.timeline_by_filter = function(type) {
        $scope.type_list=type;
        var params = {
            count: 8,
            language: $scope.lang,
            'since-page': 0,
            taste: 'no',
            views: 'no'
        };

        if($scope.type_list=='tasty'){
            params.taste = 'ok';
            params.views = 'no';
        }else if($scope.type_list=='views'){
            params.taste = 'no';
            params.views = 'ok';
        }
        $http.get('/api/1.0/timeline/home.json', {params:params}).success(function(data) {
            $scope.list_recipes = [];
            for (var i=0; i < data.recipes.length; i++) {
                $scope.list_recipes.push(data.recipes[i]);
            }
        }).error(function(data) {
            console.log('error on load');
        });
    }


    $scope.timeline_by_filter($scope.type_list);
}

function SearchTimelineCtrl($scope){

}

function RecipeCntl($scope) {

}

function ContainerCntrl($scope) {


}
