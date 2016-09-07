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
					$location.path('tab/userLogin');
				} else {
					$scope.roomList = data.roomList;
					page.totalCount = data.totalCount;
				}
			});
	};

	$scope.enterRoom = function(room){
		$location.path('tab/game/'+room.id);
		// $location.path('tab/game');
		// $location.path('tab/userLogin');
	};

	$scope.getTitle = function(room){
		return room.playerList.map(function(n){return n.playerName;}).join(' VS ');
	};

	$scope.getRelation = function(room){
		var username = localStorage.getItem('username');
		if(!username){
			return {
				isMine:false,
				isTurn:false
			};
		}

		var user = _.find(room.playerList,function(p){return p.playerName == username;});
		return {
			isMine:!!user,
			isTurn:user &&user.status ==3
		};
	};

	$scope.getRoomList();

}])

.controller('gameCtrl', ['$scope','$stateParams','karazhan',function($scope, $stateParams,karazhan) {
	console.log($stateParams.roomId);

	$scope.roomId = $stateParams.roomId;

	$scope.getRoomInfo = function(){
		var token = localStorage.getItem('token');
		var roomId = $scope.roomId;

		karazhan.getRoomInfo(token,roomId)
		.success(function(data){
			if(!data.flag){
				// 错误
			}

			console.log(data.info);
		});
	};

	// render helper START 	---

	var render = {
		all:function(info){
			// create
		},
		dispChess:function(){},
		dispChessAll:function(){},
		chooseChess:function(){},
		moveChess:function(){},
		dispSkill:function(){},
		dispSkillAll:function(){},
		chooseSkill:function(){},
		chooseSkillTarget:function(){},
		dispEffect:function(){},
		dispRound:function(){}

	};
	

	// render helper END 	---

	$scope.getRoomInfo();

}])

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
		});
	};

	$scope.login = function() {
		karazhan.login(user.username, user.password)
			.success(function(data) {
				$scope.isShowTip = !data.flag;
				if (data.flag) {
					localStorage.setItem('username',user.username);
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
		$location.path('tab/roomList');
	}

	$scope.getMyUsername();



}]);