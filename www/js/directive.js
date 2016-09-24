angular
	.module('starter.directive', [])
	.directive('chessBoard', ['karazhan','karazhanDesc', '$compile', function(karazhan,karazhanDesc, $compile) {
		return {
			restrict: 'E',
			templateUrl: '/templates/chessBoard.html',
			replace: true,
			scope: {
				roomId: "="
			},
			link: function(scope, elem, attrs) {
				// 单位rem
				scope.roundLayerHeight = .6;
				var boxSize = scope.boxSize = .5;
				var room;
				var token = localStorage.getItem('token');


				// create chessBoard ground
				var createBasicLayer = function() {
					var layer = elem.find('.basic-layer').empty();
					for (var i = 0; i < scope.room.width; i++) {
						for (var j = 0; j < scope.room.height; j++) {
							var node = $('<div/>')
								.css({
									left: boxSize * i + 'rem',
									top: boxSize * j + 'rem'
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
									left: boxSize * i + 'rem',
									top: boxSize * j + 'rem'
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
					scope.tipPosiList && scope.tipPosiList.forEach(function(n, i) {
						layer.find('.tip-box[tid="' + [n.x, n.y].join('-') + '"]').addClass(cls);
					});
				};

				scope.getChessDesc = function(chessId){
					if(!chessId || !room.chessList){
						return '';
					}
					var ch = _.find(room.chessList,function(ch){
						return ch.id == chessId;
					});
					return karazhanDesc.getChessDesc(ch.type);
				};


				scope.getSkillList = function(chType){
					if(!room || !room.chessList || !room.currChessId){
						return [];
					}
					var ch = _.find(room.chessList,function(ch){return ch.id == room.currChessId;});
					return karazhanDesc.getSkillListByChessType(ch.type);
				};

				scope.getSkillDesc = function(type){
					return karazhanDesc.getSkillDesc(type);
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
							if(!room.currSkillId){
								act.moveChess(posi);

							}else{
								act.chooseSkillTarget(posi);
								
							}
						} else {
							act.unChooseChess();
						}
					}
					// 已经选择了技能
					else if (status == '2.3') {
						if (isInTip) {
							act.chooseSkillTarget(posi);
						} else {
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
									
								}
							});
					},
					// 移动棋子
					"moveChess": function(posi) {
						karazhan.moveChess(token, room.id, posi)
							.success(function(data) {
								if (data.flag) {
									animate('move', {
										chessId: room.currChessId,
										position: posi
									}, function() {
										refresh();
									});
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

						async.series(arr, function(err) {
							!err && refresh();
						});
					},

					// 选择技能目标(施放技能)
					"chooseSkillTarget": function(posi) {
						var currChessId = room.currChessId;
						var currSkillId = room.currSkillId;
						karazhan.chooseSkillTarget(token, room.id, posi)
							.success(function(data) {
								if (data.flag) {
									console.log(data.changes);
									var options = {
										currChessId:currChessId,
										currSkillId:currSkillId,
										changes: data.changes
									};
									var arr = [];
									_.each(data.changes,function(chg){
										var fn;
										if(chg.type == 1){
											fn = function(cb){
												animate('hurt',chg.detail,cb);
											};
										}else if(chg.type == 2){
											fn = function(cb){
												animate('heal',chg.detail,cb);
											}
										}
										arr.push(fn);
									});
									async.series(arr,function(err,cb){
										refresh();
									});
									
								}
							});
					},
					'rest': function() {
						karazhan.rest(token, room.id)
							.success(function(data) {
								if (data.flag) {
									refresh();
								}
							});
					}
				};


				scope.rest = function() {
					act['rest']();
				};

				var animate = function(method, option, cb) {
					var dict = {};
					dict['move'] = function(option) {
						var chessId = option.chessId;
						var position = option.position;

						var ch = _.find(room.chessList, function(ch) {
							return ch.id == chessId;
						});

						var chBox = $('[chid="' + chessId + '"]');
						var dist = Math.abs(ch.posi.x - position.x) + Math.abs(ch.posi.y - position.y);
						chBox.animate({
							left: position.x * boxSize + 'rem',
							top: position.y * boxSize + 'rem'
						}, /*dist**/ 500, cb);
					};

					dict['hurt'] = function(option) {
						var currChess = _.find(room.chessList,function(ch){return ch.id == option.sourceChessId;});
						var tagetChess = _.find(room.chessList,function(ch){return ch.id == option.targetChessId;});

						var box = $('[chid="'+tagetChess.id+'"]');
						var orgiginLeft = box.css('left').replace('px','')/100;
						var orgiginTop = box.css('top').replace('px','')/100;
						box.addClass('inHurt');
						var arr = [];
						var count =4;
						while(count--){
							arr.push({
								left:(Math.random>.5?1:-1)* Math.random()/8,
								top:(Math.random>.5?1:-1)*Math.random()/8
							});
						};
						async.each(arr,function(posi,cb){
							box.animate({
								left:posi.left+orgiginLeft+'rem',
								top:posi.top+orgiginTop+'rem'
							},50,cb);
							
						},function(err,data){
							box.css({
								left:orgiginLeft+'rem',
								top:orgiginTop+'rem'
							});
							box.removeClass('inHurt');
							cb();
						});
					};

					dict['heal'] = function(option) {
						var tagetChess = _.find(room.chessList,function(ch){return ch.id == option.targetChessId;});

						var box = $('[chid="'+tagetChess.id+'"]');
						var orgiginTop = box.css('top').replace('px','')/100;
						box.addClass('inHeal');
						var arr = [];
						var count =4;
						while(count--){
							arr.push({
								top:Math.random()/8
							});
						};
						async.each(arr,function(posi,cb){
							box.animate({
								top:posi.top+orgiginTop+'rem'
							},50,cb);
							
						},function(err,data){
							box.css({
								top:orgiginTop+'rem'
							});
							box.removeClass('inHeal');
							cb();
						});
					};

					dict[method](option);
				};

				var refresh = function() {
					console.log('refresh');

					token = localStorage.getItem('token');
					var roomId = scope.roomId;

					scope.skillList = undefined;

					karazhan.getRoomInfo(token, roomId)
						.success(function(data) {
							if (!data.flag) {
								throw 'room not exist';
							}

							room = scope.room = data.info;

							console.log('refresh',room);

							if (!isInit) {
								createBasicLayer();
								createTipLayer();
								createChooseLayer();
								isInit = true;
							}



							var username = myInfo.username = localStorage.getItem('username');
							myInfo.playerColor = getColor(username, room);
							myInfo.status = getStatus(username, room);

							scope.tipPosiList && (scope.tipPosiList.length = 0);
							showTip();

							procRound(room);
							procChessList(room);

							console.log('status', myInfo.status);
							statusMachineDict[myInfo.status]();
						})
				};

				var procChessList = function(room) {
					if (room.currChessId != undefined) {
						_.find(room.chessList, function(ch) {
							if (ch.id == room.currChessId) {
								ch.isSelected = true;
								return true;
							}
						})
					}
				};

				var procRound = function(room) {
					var playerList = room.playerList;
					var redPlayer = _.find(playerList, function(p) {
						return p.playerColor == 0;
					});
					if (redPlayer) {
						scope.red = {
							status: redPlayer.status,
							playerName: redPlayer.playerName,
							energy: redPlayer.energy
						};
					}
					var blackPlayer = _.find(playerList, function(p) {
						return p.playerColor == 1;
					});
					if (blackPlayer) {
						scope.black = {
							status: blackPlayer.status,
							playerName: blackPlayer.playerName,
							energy: blackPlayer.energy
						};
					}

				};

				var isInit = false;

				var afterInitRoom = function() {
					// myInfo
					console.log('afterInitRoom');
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
					'0': function(){},
					// 不是我的回合
					'1': function() {
						console.log('not my turn');
						// 发送心跳
						var heartBeat =function(){
							karazhan.heartBeat(token,room.id)
								.success(function(data){
									if(data.flag){
										if(data.isNew){
											refresh();
										}else{
											heartBeat();
										}
									}
								});

						};
						heartBeat();
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

						karazhan.getActiveSkillList(token, room.id)
							.success(function(data) {
								scope.skillList = data.skillList;

								if (room.currSkillId != undefined) {
									_.find(scope.skillList, function(sk) {
										if (sk.id == room.currSkillId) {
											sk.isSelected = true;
											return true;
										}
									});

									karazhan.getSkillTargetList(token, room.id)
										.success(function(data) {
											// scope.skillTargetList = data.positionList;

											scope.tipType = 'target';
											scope.tipPosiList = data.positionList;
										});
								}
							});
					},
					// 还没有选择技能
					'2.2': function() {
						karazhan.getActiveSkillList(token, room.id)
							.success(function(data) {
								scope.skillList = data.skillList;
							});
					},
					// 还没有选择技能的目标
					'2.3': function() {
						karazhan.getActiveSkillList(token, room.id)
							.success(function(data) {
								scope.skillList = data.skillList;

								if (room.currSkillId != undefined) {
									_.find(scope.skillList, function(sk) {
										if (sk.id == room.currSkillId) {
											sk.isSelected = true;
											return true;
										}
									});

									karazhan.getSkillTargetList(token, room.id)
										.success(function(data) {
											// scope.skillTargetList = data.positionList;

											scope.tipType = 'target';
											scope.tipPosiList = data.positionList;
										});
								}
							});



					},

					// server给的status
					// beforeStart,
					// red,
					// black,
					// gameOver



					// 已经结束
					'3': null
				};

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



				// 个人信息
				var myInfo = scope.myInfo = {
					username: localStorage.getItem('username'),
					playerColor: null,
					status: null
				};





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
					if (!sk.isSelected) {
						hasUnChoose = true;
					} else {
						skIdSelected = sk.id;
					}

					act.chooseSkill(skIdSelected, hasUnChoose);
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
				scope.boxSize = .5;

				scope.touch = function() {
					scope.$emit('chooseBox.touch', scope.posi);
				};


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

				scope.boxSize = .5;

				scope.chessTypeDict = {
					'0': 'footman',
					'1': 'knight',
					'2': 'cavalry',
					'3': 'minister',
					'4': 'magic',
					'5': 'king'
				};

				scope.chessColor = ch.isSelected ? 'chess-color-selected' : ch.color == 0 ? 'chess-color-red' : ch.color == 1 ? 'chess-color-black' : '';

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