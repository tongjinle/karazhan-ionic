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
			logout:function(token){
				return $http({
					url:addr+'/logout',
					method:'POST',
					data:{
						token:token
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

			getRoomList: function(token, isMine,status, pageIndex, pageSize) {
				return $http({
					url: addr + '/user/roomList',
					method: 'GET',
					params: {
						token: token,
						isMine: isMine,
						status:status,
						pageIndex: pageIndex,
						pageSize: pageSize
					}
				});
			},
			getRoomInfo:function(token,roomId){
				return $http({
					url:addr+'/user/getRoomInfo/'+roomId,
					method:'GET',
					params:{
						token:token
					}
				});
			}

		};
	}])

.factory('gameUtil', function() {
	return{};
});