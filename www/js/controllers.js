angular.module('starter.controllers', [])

.controller('roomListCtrl', function($scope) {
	$scope.kk = {};
	$scope.kk.abc = 'abc';
	$scope.log = function() {
		console.log($scope.kk.abc);
	}
})

.controller('gameCtrl', function($scope, Chats) {
	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//
	//$scope.$on('$ionicView.enter', function(e) {
	//});

	$scope.chats = Chats.all();
	$scope.remove = function(chat) {
		Chats.remove(chat);
	};
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
	$scope.chat = Chats.get($stateParams.chatId);
})


.controller('AccountCtrl', function($scope) {
	$scope.settings = {
		enableFriends: true
	};
})

.controller('userLoginCtrl', ['$scope', '$location', 'karazhan', function($scope, $location, karazhan) {
	// 是否已经登录
	$scope.isLogin = false;
	// 登录失败之后,显示错误信息给用户
	$scope.isShowTip = false;

	var user = $scope.user = {
		username: 'cat',
		password: ''
	};


	$scope.getMyUsername = function() {
		var token = localStorage.getItem('token');
		if (!token) {
			$scope.isLogin = false;
			return;
		}

		karazhan.getMyUsername(token).success(function(data) {
			console.log(data);
			var isLogin = $scope.isLogin = data.flag;
			if (isLogin) {}
		});
	};

	$scope.login = function() {
		karazhan.login(user.username, user.password)
			.success(function(data) {
				$scope.isShowTip = !data.flag;
				if (data.flag) {
					localStorage.setItem('token', data.token);
					$scope.getMyUsername();
				}
			});
	};

	$scope.gotoRoomList = function() {
		$location.path('#/tab/roomList');
	}

	$scope.getMyUsername();



}]);