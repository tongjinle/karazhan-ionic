angular
	.module('starter.directive', [])
	.directive('chessBoard', ['karazhan', '$compile', function(karazhan, $compile) {
		return {
			restrict: 'E',
			templateUrl: '/templates/chessBoard.html',
			replace: true,
			scope: {
				roomId: "="
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
								.attr('tid', [i, j].join('-'))
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
				var createChooseLayer = function() {
					var choosePosiList = scope.choosePosiList = [];
					for (var i = 0; i < scope.room.width; i++) {
						for (var j = 0; j < scope.room.height; j++) {
							choosePosiList.push({
								x: i,
								y: j
							});
						}
					}
				};

				var showTip = function() {
					var cls = scope.tipType;
					var layer = elem.find('.tip-layer');

					layer.find('.tip-box').removeClass('chess move target');
					scope.tipPosiList.forEach(function(n, i) {
						layer.find('.tip-box[tid="' + [n.x, n.y].join('-') + '"]').addClass(cls);
					});
				};


				// touch 管理器
				var touchManager = function(posi) {
					var status = getStatus(myInfo.username, room);
					var isInTip = isInTipPosiList();


					// 尚未选择棋子
					if (status == '2.0') {
						if (isInTip) {
							act.chooseChess(posi);
						}
					}
					// 已经选择了棋子
					else if (status == '2.1') {
						if (isInTip) {
							act.moveChess(posi);
						} else {
							act.unChooseChess();
						}
					}
					// 已经选择了技能
					else if (status == '2.3'){
						if(isInTip){
							act.chooseSkillTarget(posi);
						}else{
							act.unChooseSkill();
						}
					}



					// 是否在提示的格子里
					function isInTipPosiList() {
						return !!_.find(scope.tipPosiList, function(po) {
							return po.x == posi.x && po.y == posi.y;
						});
					}

				};

				// 玩家
				var act = {
					// 选择棋子
					"chooseChess": function(posi) {
						var roomId = room.id;

						karazhan.chooseChess(token, roomId, posi)
							.success(function(data) {
								if (data.flag) {
									refresh();
									return;
									var ch = _.find(room.chessList, function(ch) {
										return ch.posi.x == posi.x && ch.posi.y == posi.y;
									});
									room.currChessId = ch.id;
									ch.status = 1;


									myInfo.status = getStatus(myInfo.username, room);
									statusMachineDict[myInfo.status]();
								}
							});
					},
					// 反选棋子
					"unChooseChess": function() {
						var roomId = room.id;

						karazhan.unChooseChess(token, roomId)
							.success(function(data) {
								if (data.flag) {

									refresh();
									return;
									var ch = _.find(room.chessList, function(ch) {
										return room.currChessId == ch.id;
									});
									ch.status = 0;
									room.currChessId = null;

									myInfo.status = getStatus(myInfo.username, room);
									statusMachineDict[myInfo.status]();
								}
							});
					},
					// 移动棋子
					"moveChess": function(posi) {
						karazhan.moveChess(token, room.id, posi)
							.success(function(data) {
								if (data.flag) {
									// var ch = _.find(room.chessList,function(ch){return ch.id == room.currChessId;});
									// ch.posi = posi;
									// ch.status = data.status;

									// myInfo.status = getStatus(myInfo.username,room);
									// statusMachineDict[myInfo.status]();

									refresh();
								}
							});
					},
					// 选择技能
					// hasUnChoose -> 是否有反选
					"chooseSkill": function(skillId, hasUnChoose) {
							var arr = [];
							if (hasUnChoose) {
								arr.push(function(cb) {
									karazhan.unChooseSkill(token, room.id, skillId)
										.success(function(data) {
											cb(!data.flag);
										});
								})
							}

							if (skillId != null) {
								arr.push(function(cb) {
									karazhan.chooseSkill(token, room.id, skillId)
										.success(function(data) {
											cb(!data.flag);
										});
								});
							}

							async.series(arr,function(err) {
								!err && refresh();
							});
						},
						
					// 选择技能目标(施放技能)
					"chooseSkillTarget":function(posi){
						karazhan.chooseSkillTarget(token,room.id,posi)
						.success(function(data){
							if(data.flag){
								console.log(data.changes);
							}
						});
					}	
				};

				var animate = function(){

				};

				var refresh = function() {
					console.log('refresh');

					token = localStorage.getItem('token');
					var roomId = scope.roomId;

					karazhan.getRoomInfo(token, roomId)
						.success(function(data) {
							if (!data.flag) {
								throw 'room not exist';
							}

							room = scope.room = data.info;
							if(!isInit){
								createBasicLayer();
								createTipLayer();
								createChooseLayer();
								isInit = true;
							}



							var username = myInfo.username = localStorage.getItem('username');
							myInfo.playerColor = getColor(username, room);
							myInfo.status = getStatus(username, room);
							
							procChessList(room);

							console.log('status', myInfo.status);
							statusMachineDict[myInfo.status]();
						})
				};

				var procChessList = function(room){
					if(room.currChessId!=undefined){
						_.find(room.chessList,function(ch){
							if( ch.id == room.currChessId){
								ch.isSelected = true;
								return true;
							}
						})
					}
				};

				var isInit = false;

				var afterInitRoom = function() {
					// myInfo
					var room = scope.room;
					myInfo.playerColor = getColor(myInfo.username, room);
					myInfo.status = getStatus(myInfo.username, room);

					console.log('status', myInfo.status);
					statusMachineDict[myInfo.status]();
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
					'1': function() {
						console.log('not my turn');
					},
					// 2.x 表示都是我的回合
					// 还没有选择棋子
					'2.0': function() {
						karazhan.getActiveChessList(token, room.id)
							.success(function(data) {
								console.log(data);
								var chessIdList = data.chessIdList;
								scope.tipPosiList = chessIdList.map(function(chId) {
									return _.find(room.chessList, function(n) {
										return n.id == chId;
									}).posi;
								});
								scope.tipType = 'chess';
							})
					},
					// 棋子还没有移动
					'2.1': function() {
						karazhan.getMoveRange(token, room.id)
							.success(function(data) {
								scope.tipType = 'move';
								scope.tipPosiList = data.positionList;
							});
					},
					// 还没有选择技能
					'2.2': function() {
						karazhan.getActiveSkillList(token, room.id)
							.success(function(data) {
								scope.skillList = data.skillList;

								// if(room.currSkillId!=undefined){
								// 	_.find(scope.skillList,function(sk){
								// 		if(sk.id == room.currSkillId){
								// 			sk.isSelected = true;
								// 			return true;
								// 		}
								// 	})
								// }
								
							});
					},
					// 还没有选择技能的目标
					'2.3': function() {
						karazhan.getActiveSkillList(token, room.id)
							.success(function(data) {
								scope.skillList = data.skillList;

								if(room.currSkillId!=undefined){
									_.find(scope.skillList,function(sk){
										if(sk.id == room.currSkillId){
											sk.isSelected = true;
											return true;
										}
									})
								}
							});

						karazhan.getSkillTargetList(token, room.id)
							.success(function(data) {
								// scope.skillTargetList = data.positionList;

								scope.tipType = 'target';
								scope.tipPosiList = data.positionList;
							});

						
					},

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
						if (ch.status == 1) {
							return '2.1';
						} else if (ch.status == 2) {
							if (room.currSkillId == undefined) {
								return '2.2';
							} else {
								return '2.3';
							}
						}
					}

				};


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



				// scope.$watch('room', function(nv) {
				// 	if (nv) {
				// 		room = nv;

				// 		createBasicLayer();
				// 		createTipLayer();
				// 		createChooseLayer();

				// 		// after init room
				// 		afterInitRoom();
				// 	}
				// });


				scope.$watch('tipPosiList', function(nv) {
					if (nv) {
						console.log(scope.tipPosiList);
						showTip();
					}

				});


				scope.$on('chooseBox.touch', function(e, data) {
					touchManager({
						x: data.x,
						y: data.y
					});
				});


				scope.$on('skill.touch', function(e, data) {
					var skillList = scope.skillList;
					// 被点击的skill的id
					var skId = data;
					// 被选择的skill的id
					var skIdSelected = null;
					// 是否有反选
					var hasUnChoose = false;
					_.each(skillList, function(sk) {
						if (sk.isSelected && sk.id != skId) {
							sk.isSelected = false;
							hasUnChoose = true;
						}
					});

					var sk = _.find(skillList, function(sk) {
						return sk.id == skId;
					});
					sk.isSelected = !sk.isSelected;
					if(!sk.isSelected){
						hasUnChoose = true;
					}else{
						skIdSelected = sk.id;
					}

					act.chooseSkill(skIdSelected,hasUnChoose);
				});

				refresh();

			}
		}
	}])

.directive('chooseBox', [function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/chooseBox.html',
			replace: true,
			link: function(scope, elem, attrs) {
				// console.log(scope.ch);
				scope.boxSize = 50;

				scope.touch = function() {
					scope.$emit('chooseBox.touch', scope.posi);
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
				let ch = scope.ch;

				scope.boxSize = 50;

				scope.chessTypeDict = {
					'0': 'footman',
					'1': 'knight',
					'2': 'cavalry',
					'3': 'minister',
					'4': 'magic',
					'5': 'king'
				};

				scope.chessColor = ch.isSelected ? 'chess-color-selected'
				: ch.color == 0 ? 'chess-color-red'
				: ch.color == 1 ? 'chess-color-black'
				: '';

			}
		};
	}])
	.directive('skill', [function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/skill.html',
			replace: true,
			link: function(scope, elem, attrs) {
				console.log(scope.sk);
				scope.skillTypeDict = {
					'0': 'attack',
					'1': 'storm',
					'2': 'crash',
					'3': 'heal',
					'4': 'purge',
					'5': 'fire',
					'6': 'nova',
					'7': 'cleave'
				};

				scope.skillStatusDict = {
					'true': 'active',
					'false': 'passive'
				};

				scope.touch = function() {
					console.log(scope.sk);
					scope.$emit('skill.touch', scope.sk.id);
				};

				// scope.$watch('sk.isActive',function(nv){
				// 	if(nv!=undefined){
				// 		elem.addClass(nv?'active':'passive');
				// 	}
				// });
			}
		}
	}]);



;