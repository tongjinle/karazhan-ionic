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
			}

		};
	}])

.factory('Chats', function() {
	// Might use a resource here that returns a JSON array

	// Some fake testing data
	var chats = [{
		id: 0,
		name: 'Ben Sparrow',
		lastText: 'You on your way?',
		face: 'img/ben.png'
	}, {
		id: 1,
		name: 'Max Lynx',
		lastText: 'Hey, it\'s me',
		face: 'img/max.png'
	}, {
		id: 2,
		name: 'Adam Bradleyson',
		lastText: 'I should buy a boat',
		face: 'img/adam.jpg'
	}, {
		id: 3,
		name: 'Perry Governor',
		lastText: 'Look at my mukluks!',
		face: 'img/perry.png'
	}, {
		id: 4,
		name: 'Mike Harrington',
		lastText: 'This is wicked good ice cream.',
		face: 'img/mike.png'
	}];

	return {
		all: function() {
			return chats;
		},
		remove: function(chat) {
			chats.splice(chats.indexOf(chat), 1);
		},
		get: function(chatId) {
			for (var i = 0; i < chats.length; i++) {
				if (chats[i].id === parseInt(chatId)) {
					return chats[i];
				}
			}
			return null;
		}
	};
});