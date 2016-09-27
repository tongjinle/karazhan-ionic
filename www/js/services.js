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
			createRoom:function(token){
				return $http({
					url:addr + '/user/createRoom',
					method:'POST',
					data:{
						token:token
					}
				});
			},
			joinRoom:function(token,roomId){
				return $http({
					url:addr + '/user/joinRoom',
					method:'POST',
					data:{
						token:token,
						roomId:roomId
					}
				});
			},
			quitRoom:function(token,roomId){
				return $http({
					url:addr+'/user/quitRoom',
					method:'POST',
					data:{
						token:token,
						roomId:roomId
					}
				});
			},
			setStatus:function(token,roomId,status){
				return $http({
					url:addr + '/user/setStatus',
					method:'POST',
					data:{
						token:token,
						roomId:roomId,
						status:status
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
			// 心跳
			heartBeat:function(token,roomId){
				return $http({
					url:addr+'/user/heartBeat',
					method:'GET',
					params:{
						token:token,
						roomId:roomId
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
			},
			rest:function(token,roomId){
				return $http({
					url:addr+'/user/rest',
					method:'POST',
					data:{
						token:token,
						roomId:roomId
					}
				});
			}



		};
	}])

.factory('karazhanDesc', function() {
	var chessDesc = [
		'步兵,4血量,移动范围周围1格,能量消耗1',
		'骑士,10血量,移动范围周围1格,能量消耗2',
		'骑兵,12血量,移动范围马步,能量消耗1',
		'牧师,8血量,移动范围周围1格,能量消耗3',
		'法师,8血量,移动范围直线4格或者斜线3格,能量消耗4',
		'国王,18血量,移动范围周围1格,能量消耗3'
	];

	var skillDesc = [
		'对单个敌人造成1点伤害',
		'对周围一圈敌人造成3点伤害',
		'对单个敌人造成3点伤害',
		'对单个友军回复6点血量,施法距离为直线4格',
		'净化,对正面三格内所有目标造成2点伤害',
		'火球,对单个目标造成8点伤害,施法距离为near*4 + slash*3',
		'冰霜新星,对周围2格所有敌人造成6点伤害',
		'顺势斩,对目标平行三格敌人造成6点伤害'
	];

	var map = [
		[0],
		[1],
		[2],
		[3,4],
		[5,6],
		[7]
	];

	return {
		getChessDesc:function(type){
			return chessDesc[type];
		},
		getSkillDesc:function(type){
			return skillDesc[type];
		},
		getSkillListByChessType(chessType){
			return map[chessType];
		}
	};
});

