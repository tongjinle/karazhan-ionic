angular
	.module('starter.directive', [])
	.directive('chess', [function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/chess.html',
			replace: true,
			link: function(scope, elem, attrs) {
				console.log(scope.ch);
			}
		};
	}])