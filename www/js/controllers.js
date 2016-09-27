angular.module('starter.controllers', [])

.controller('roomListCtrl', ['$scope', '$location', 'karazhan',  function($scope, $location, karazhan) {

	$scope.roomList = [];

	$scope.statusDict = {
		'0': 'ion-ios-plus',
		'1': 'ion-ios-cog-outline',
		'2': 'ion-ios-cog-outline',
		'3': 'ion-ios-checkmark'
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
		$scope.selectedRoom = undefined;
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

	$scope.enterRoom = function(room) {
		$location.path('tab/game/' + room.id);
	};

	$scope.getTitle = function(room) {
		return room.playerList.map(function(n) {
			return n.playerName;
		}).join(' VS ');
	};

	$scope.getRelation = function(room) {
		var username = localStorage.getItem('username');
		if (!username) {
			return {
				isMine: false,
				isTurn: false
			};
		}

		var user = _.find(room.playerList, function(p) {
			return p.playerName == username;
		});
		return {
			isMine: !!user,
			isTurn: user && user.status == 3
		};
	};

	$scope.selectedRoom = undefined;
	// 选择房间
	$scope.selectRoom = function(room){
		var selectedRoom = $scope.selectedRoom = room;
		
		var status = undefined;
		var playerStatus = undefined;

		status = selectedRoom.status;
		if(status === 0){
			var username = localStorage.getItem('username');
			var p = _.find(selectedRoom.playerList,function(p){return p.playerName == username;});
			// 非游戏玩家选择,自然无效
			if(p){
				playerStatus = p.status;
			}
		}
		
		$scope.selectedRoomStatus = status;
		$scope.selectedRoomPlayerStatus = playerStatus;
		
	};

	$scope.createRoom = function(){
		var token = localStorage.getItem('token');

		karazhan.createRoom(token)
		.success(function(data){
			if(data.flag){
				$scope.getRoomList();
			}else{
				alert('create room fail!');
			}
		});
	};

	$scope.joinRoom = function(){
		var selectedRoom = $scope.selectedRoom;

		// 没有选择房间 或者 房间不是未开始状态
		// join显然应该无效
		if(!selectedRoom || selectedRoom.status !==0){
			return;
		}

		var token = localStorage.getItem('token');
		var roomId = selectedRoom.id;
		
		karazhan.joinRoom(token,roomId)
		.success(function(data){
			if(data.flag){
				$scope.getRoomList();
			}else{
				alert('join room fail!');
			}
		});
	};

	$scope.quitRoom = function () {
		var selectedRoom = $scope.selectedRoom;

		// 没有选择房间 或者 房间不是未开始状态
		// join显然应该无效
		if(!selectedRoom || selectedRoom.status !==0){
			return;
		}

		var token = localStorage.getItem('token');
		var roomId = selectedRoom.id;

		karazhan.quitRoom(token,roomId)
		.success(function(data){
			if(data.flag){
				$scope.getRoomList();
			}else{
				alert('quit room fail!');
			}
		});
	};

	$scope.setStatus = function(){
		var selectedRoom = $scope.selectedRoom;

		// 没有选择房间 或者 房间不是未开始状态
		// join显然应该无效
		if(!selectedRoom || selectedRoom.status !==0){
			return;
		}

		var token = localStorage.getItem('token');
		var username = localStorage.getItem('username');
		var p = _.find(selectedRoom.playerList,function(p){return p.playerName == username;});
		// 非游戏玩家选择,自然无效
		if(!p){
			return;
		}
		var playerStatus = p.status == 0 ? 1 : 0;
		karazhan.setStatus(token,selectedRoom.id, playerStatus)
		.success(function(data){
			if(!data.flag){
				alert('setStatus fail!');
			}else{
				$scope.selectedRoomPlayerStatus = p.status = (p.status+1)%2;
			}
		})
	};


	$scope.getRoomList();

}])

.controller('gameCtrl', ['$scope', '$stateParams', 'karazhan', function($scope, $stateParams, karazhan) {
	console.log($stateParams.roomId);

	$scope.roomId = $stateParams.roomId;
	$scope.room;

	$scope.getRoomInfo = function() {
		var token = localStorage.getItem('token');
		var roomId = $scope.roomId;

		karazhan.getRoomInfo(token, roomId)
			.success(function(data) {
				if (!data.flag) {
					// 错误
				}

				$scope.room = data.info;
				$scope.$broadcast('room.change',$scope.room);
				console.log(data.info);
			});
	};

	$scope.getTitle = function(room) {
		return room ?
			room.playerList.map(function(n) {
				return n.playerName;
			}).join(' VS ') :
			'';
	};

	

	// $scope.getRoomInfo();

}])

.controller('userLoginCtrl', ['$scope', '$location', 'karazhan', function($scope, $location, karazhan) {
	// 是否已经登录
	$scope.isLogin = false;
	// 登录失败之后,显示错误信息给用户
	$scope.isShowTip = false;

	var user = $scope.user = {
		username: 'falcon',
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
					localStorage.setItem('username', user.username);
					localStorage.setItem('token', data.token);
					$scope.getMyUsername();
				}
			});
	};

	$scope.logout = function() {
		var token = localStorage.getItem('token');
		if (!token) {
			$scope.isLogin = true;
			return;
		}

		karazhan.logout(token)
			.success(function(data) {
				$scope.isLogin = !data.flag;
			});
	};

	$scope.gotoRoomList = function() {
		$location.path('tab/roomList');
	}

	$scope.getMyUsername();



}]);