angular.module('starter.controllers', [])

.controller('roomListCtrl', ['$scope', '$location', 'karazhan', function($scope, $location, karazhan) {

	$scope.roomList = [];

	$scope.statusDict = {
		'0':'ion-ios-plus',
		'1':'ion-ios-cog-outline',
		'2':'ion-ios-cog-outline',
		'3':'ion-ios-checkmark'
	};

	$scope.statusTxtDict = {

	};

	var page = $scope.page = {
		isMine: 0,
		status: -1,
		pageIndex: 0,
		pageSize: 8,
		totalCount: 0
	};
	$scope.getRoomList = function(isMine, status, pageIndex, pageSize) {
		var token = localStorage.getItem('token');
		karazhan.getRoomList(token, page.isMine, page.status, page.pageIndex, page.pageSize)
			.success(function(data) {
				if (!data.flag) {
					$location.path('#/tab/userLogin');
				} else {
					$scope.roomList = data.roomList;
					page.totalCount = data.totalCount;
				}
			});
	};

	$scope.enterRoom = function(roomId){

	};

	$scope.getRoomList();

}])

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

	$scope.logout = function(){
		var token = localStorage.getItem('token');
		if(!token){
			$scope.isLogin = true;
			return;
		}

		karazhan.logout(token)
		.success(function(data){
			$scope.isLogin = !data.flag;
		});
	};

	$scope.gotoRoomList = function() {
		$location.path('#/tab/roomList');
	}

	$scope.getMyUsername();



}]);