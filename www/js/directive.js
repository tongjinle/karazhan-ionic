angular
	.module('starter.directive', [])
	.directive('chessBoard', ['karazhan', '$compile', function(karazhan, $compile) {
		return {
			restrict: 'E',
			templateUrl: '/templates/chessBoard.html',
			replace: true,
			scope: {
				room: "="
			},
			link: function(scope, elem, attrs) {
				var boxSize = 50;
				var room;
				var token = localStorage.getItem('token');


				// create chessBoard ground
				var createBasicLayer = function() {
					var layer = elem.find('.basic-layer').empty();
					for (var i = 0; i < scope.room.width; i++) {
						for (var j = 0; j < scope.room.height; j++) {
							var node = $('<div/>')
								.css({
									left: boxSize * i,
									top: boxSize * j
								})
								.addClass('basic-box')
								.addClass((i + j) % 2 ? 'white' : 'black');

							layer.append(node);

							// var node = $compile('<bbox></bbox>')({x:i,y:j,room:scope.room});
							// layer.append(node);
						}
					}
				};

				// create tip 
				var createTipLayer = function() {
					var layer = elem.find('.tip-layer').empty();
					for (var i = 0; i < scope.room.width; i++) {
						for (var j = 0; j < scope.room.height; j++) {
							var node = $('<div/>')
								.attr('tid',[i,j].join('-'))
								.css({
									left: boxSize * i,
									top: boxSize * j
								})
								.addClass('tip-box');

							layer.append(node);
						}
					}
				};

				// create choose layer
				var createChooseLayey = function(){
					var choosePosiList = scope.choosePosiList = [];
					for (var i = 0; i < scope.room.width; i++) {
						for (var j = 0; j < scope.room.height; j++) {
							choosePosiList.push({x:i,y:j});
						}
					}
				};

				var showTip = function(){
					var cls = scope.tipType ;
					var layer = elem.find('.tip-layer');

					layer.find('.tip-box').removeClass('chess move target');
					scope.tipPosiList.forEach(function(n,i){
						layer.find('.tip-box[tid="'+[n.x,n.y].join('-')+'"]').addClass(cls);
					});
				};


				// touch 管理器
				var touchManager = function(posi){
					var status = getStatus(myInfo.username,room);
					var isInTip = isInTipPosiList();


					// 尚未选择棋子
					if(status == '2.0'){
						if(isInTip){
							act.chooseChess(posi);
						}
					}
					// 已经选择了棋子
					else if(status == '2.1'){
						if(isInTip){
							act.moveChess(posi);
						}else{
							act.unChooseChess();
						}
					}


					// 是否在提示的格子里
					function isInTipPosiList(){
						return !!_.find(scope.tipPosiList,function(po){
							return po.x == posi.x && po.y == posi.y;
						});
					}
				};

				// 玩家
				var act = {
					// 选择棋子
					"chooseChess":function(posi){
						var roomId = room.id;

						karazhan.chooseChess(token,roomId,posi)
						.success(function(data){
							if(data.flag){
								var ch = _.find(room.chessList,function(ch){return ch.posi.x == posi.x && ch.posi.y == posi.y;});
								room.currChessId = ch.id;
								ch.status = 1;


								myInfo.status = getStatus(myInfo.username,room);
								statusMachineDict[myInfo.status]();
							}
						});
					},
					// 反选棋子
					"unChooseChess":function(){
						var roomId = room.id;
						
						karazhan.unChooseChess(token,roomId)
						.success(function(data){
							if(data.flag){
								var ch = _.find(room.chessList,function(ch){return room.currChessId == ch.id;});
								ch.status = 0;
								room.currChessId = null;

								myInfo.status = getStatus(myInfo.username,room);
								statusMachineDict[myInfo.status]();
							}
						});
					}
				};

				var afterInitRoom = function() {
					// myInfo
					var room = scope.room;
					myInfo.playerColor = getColor(myInfo.username, room);
					myInfo.status = getStatus(myInfo.username, room);

					console.log(myInfo);

					statusMachineDict[myInfo.status] && statusMachineDict[myInfo.status]();
				};


				var getColor = function(playerName, room) {
					var p = _.find(room.playerList, function(p) {
						return p.playerName == myInfo.username;
					});

					return p ? p.playerColor : null;
				}

				var statusMachineDict = {
					// 尚未开始
					'0': null,
					// 不是我的回合
					'1': null,
					// 2.x 表示都是我的回合
					// 还没有选择棋子
					'2.0': function(){
						karazhan.getActiveChessList(token,room.id)
						.success(function(data){
							console.log(data);
							var chessIdList = data.chessIdList;
							scope.tipPosiList = chessIdList.map(function(chId){
								return _.find(room.chessList,function(n){return n.id == chId;}).posi;
							});
							scope.tipType = 'chess';
						})
					},
					// 棋子还没有移动
					'2.1':function(){
						karazhan.getMoveRange(token,room.id)
						.success(function(data){
							scope.tipType = 'move';
							scope.tipPosiList = data.positionList;
						});
					},
					// 还没有选择技能
					'2.2':null,
					// 还没有选择技能的目标
					'2.3':null,

					// server给的status
					// beforeStart,
					// red,
					// black,
					// gameOver

					

					// 已经结束
					'3': null
				}

				var getStatus = function(playerName, room) {
					// 如果游戏尚未开始,或者已经结束
					if (room.status == 0 || room.status == 3) {
						return room.status;
					}
					// 不是我的回合
					if (room.currPlayerName != playerName) {
						return 1;
					}

					// 我的回合
					// 包括其中的所有状态
					if (room.currChessId == undefined) {
						return '2.0';
					} else {
						var ch = _.find(room.chessList, function(ch) {
							return ch.id == room.currChessId;
						});
						if (!ch) {
							throw "chess not exist";
						}

						/*
							// 被选择前
							beforeChoose,
							// 移动前
							beforeMove,
							// 使用技能前
							beforeCast,
							rest
						*/
						if(ch.status == 1){
							return '2.1';
						} else if( ch.status == 2){
							if(room.currSkillId==undefined){
								return '2.2';
							}else{
								return '2.3';
							}
						}
					}

				}


				// scope.$on('room.change', function(e, v) {
				// 	scope.room = v;
				// 	createBasicLayer();
				// 	createTipLayer();
				// 	// setTimeout(createBasicBox,2000);
				// 	// createBasicBox();
				// });

				// 个人信息
				var myInfo = scope.myInfo = {
					username: localStorage.getItem('username'),
					playerColor: null,
					status: null
				};



				scope.$watch('room', function(nv) {
					if (nv) {
						room = nv;

						createBasicLayer();
						createTipLayer();
						createChooseLayey();

						// after init room
						afterInitRoom();
					}
				});

				scope.$watch('tipPosiList',function(nv){
					if(nv){
						console.log(scope.tipPosiList);
						showTip();
					}
					
				});


				scope.$on('chooseBox.touch',function(e,data){
					touchManager({x:data.x,y:data.y});
				});

			}
		}
	}])
	.directive('bbox', [function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/bbox.html',
			replace: true,
			link: function(scope, elem, attrs) {
				// console.log(scope.ch);
				console.log(scope);


			}
		};
	}])
	.directive('chooseBox',[function(){
		return {
			restrict: 'E',
			templateUrl: '/templates/chooseBox.html',
			replace: true,
			link: function(scope, elem, attrs) {
				// console.log(scope.ch);
				scope.boxSize = 50;

				scope.touch = function(){
					scope.$emit('chooseBox.touch',scope.posi);
				}


			}
		};

	}])
	.directive('chess', [function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/chess.html',
			replace: true,
			link: function(scope, elem, attrs) {
				// console.log(scope.ch);

				scope.boxSize = 50;

				scope.chessTypeDict = {
					'0': 'footman',
					'1': 'knight',
					'2': 'cavalry',
					'3': 'minister',
					'4': 'magic',
					'5': 'king'
				};

			}
		};
	}])