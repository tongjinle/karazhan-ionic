angular.module('starter.services', [])
	.factory('karazhan', ['$http', function($http) {
		var addr = 'http://localhost:3000';


		return {
			login: function(username, password) {
				return $http({
					url: addr + '/login',
					method: 'POST',
					data: {
						username: username,
						password: password
					}
				});
			},
			logout: function(token) {
				return $http({
					url: addr + '/logout',
					method: 'POST',
					data: {
						token: token
					}
				});
			},
			getMyUsername: function(token) {
				return $http({
					url: addr + '/user/getMyUsername',
					method: 'GET',
					params: {
						token: token
					}
				});
			},

			getRoomList: function(token, isMine, status, pageIndex, pageSize) {
				return $http({
					url: addr + '/user/roomList',
					method: 'GET',
					params: {
						token: token,
						isMine: isMine,
						status: status,
						pageIndex: pageIndex,
						pageSize: pageSize
					}
				});
			},
			getRoomInfo: function(token, roomId) {
				return $http({
					url: addr + '/user/getRoomInfo/' + roomId,
					method: 'GET',
					params: {
						token: token
					}
				});
			},
			getActiveChessList: function(token, roomId) {
				return $http({
					url: addr + '/user/getActiveChessList',
					method: 'GET',
					params: {
						token: token,
						roomId: roomId
					}
				});
			},
			chooseChess: function(token, roomId, position) {
				return $http({
					url: addr + '/user/chooseChess',
					method: 'POST',
					data: {
						token: token,
						roomId: roomId,
						position: position
					}
				});
			},
			unChooseChess: function(token, roomId) {
				return $http({
					url: addr + '/user/unChooseChess',
					method: 'POST',
					data: {
						token: token,
						roomId: roomId
					}
				});
			},
			getMoveRange: function(token, roomId) {
				return $http({
					url: addr + '/user/getMoveRange',
					method: 'GET',
					params: {
						token: token,
						roomId: roomId
					}
				});
			},
			moveChess:function(token,roomId,posi){
				return $http({
					url:addr+'/user/moveChess',
					method:'POST',
					data:{
						token:token,
						roomId:roomId,
						position:posi
					}
				});
			},
			getActiveSkillList:function(token,roomId){
				return $http({
					url:addr+'/user/getActiveSkillList',
					method:'GET',
					params: {
						token: token,
						roomId: roomId
					}
				});
			},
			chooseSkill:function(token,roomId,skillId){
				return $http({
					url:addr+'/user/chooseSkill',
					method:'POST',
					data:{
						token:token,
						roomId:roomId,
						skillId:skillId
					}
				});
			},
			unChooseSkill:function(token,roomId){
				return $http({
					url:addr+'/user/unChooseSkill',
					method:'POST',
					data:{
						token:token,
						roomId:roomId
					}
				});
			},
			getSkillTargetList:function(token,roomId){
				return $http({
					url:addr+'/user/getSkillTargetList',
					method:'GET',
					params:{
						token:token,
						roomId:roomId
					}
				});
			},
			chooseSkillTarget:function(token,roomId,posi){
				return $http({
					url:addr+'/user/chooseSkillTarget',
					method:'POST',
					data:{
						token:token,
						roomId:roomId,
						position:posi
					}
				});
			}



		};
	}])

.factory('gameUtil', function() {
	return {};
});