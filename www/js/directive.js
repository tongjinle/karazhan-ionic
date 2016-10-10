angular
	.module('starter.directive', [])
	.directive('chessBoard', ['karazhan', 'karazhanDesc', '$timeout', function(karazhan, karazhanDesc, $timeout) {
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


				var statusDict = {
					beforeStart: 0,
					notMyTurn: 1,
					beforeChooseChess: 2,
					beforeMove: 3,
					beforeChooseSkill: 4,
					beforeChooseSkillTarget: 5,
					gameOver: 6,
				};

				var changeTypeDict = {
					position: 0,
					hp: 1,
					energy: 2
				};

				var token = localStorage.getItem('token');
				var roomId = scope.roomId;
				var room;
				var chgStack = [];
				var gameStatus;
				var lastAnimateRoundIndex = -1;
				var lastProcDataIndex = -1;
				// 是否静默方式处理changes
				var isSlient = true;
				var isFirstEnter = true;

				window.ss = scope;

				// tip
				var tipPosiList = scope.tipPosiList = [];
				scope.tipType = undefined;
				window.tpl = tipPosiList;

				// 获取初始状态


				// 处理changes
				// isSlient,是否以静默方式处理,如果是,则不执行动画效果
				function procChgs(changes, isSlient, cb) {
					var arr = [];
					// animate

					if (!isSlient) {
						arr.push(function(cb) {
							$timeout(cb, 500);
						});

						arr.push(function(cb) {
							async.eachSeries(changes, function(chg, cb) {
								animate(chg, cb);
							}, cb);
						});
					}

					// proc data		
					arr.push(function(cb) {
						_.each(changes, procChgData);
						cb();
					});



					async.series(arr, cb);



					chgStack = chgStack.concat(changes);
				}



				// proc data
				function procChgData(chg) {
					var dict = {};
					dict['position'] = function(detail) {
						var chessId = detail.sourceChessId;

						var ch = _.find(room.chessList, function(ch) {
							return ch.id == chessId;
						});
						ch.posi = detail.abs;
					};

					if (chg.type == changeTypeDict.position) {
						dict['position'](chg.detail);
					}

				}

				// 动画
				function animate(chg, cb) {
					var dict = {};
					dict['move'] = function(chg, cb) {
						var chessId = chg.detail.sourceChessId;
						var position = chg.detail.abs;

						var chBox = $('[chid="' + chessId + '"]');
						chBox.animate({
							left: position.x * boxSize + 'rem',
							top: position.y * boxSize + 'rem'
						}, 500, function() {
							cb();
							scope.$apply();
						});
					};

					var type = chg.type;
					if (type == changeTypeDict.position) {
						dict['move'](chg, cb);
					} else {
						cb();
					}
				}

				function getSnapshot(cb) {
					karazhan.getSnapshot(token, roomId)
						.success(function(data) {
							if (data.flag) {
								room = scope.room = data.info;
								console.log(room);
								window.room = room;
								cb && cb();
							}
						});
				}

				// 获取status
				function getStatus(cb) {
					karazhan.getStatus(token, roomId)
						.success(function(data) {
							if (data.flag) {
								gameStatus = data.status;
								cb();
							}
						});
				}


				// 获取changes
				function getChgs(roundIndex, cb) {
					karazhan.getChanges(token, roomId, roundIndex)
						.success(function(data) {
							if (data.flag) {
								if (isFirstEnter) {
									var parts = sliceChangesByRound(data.changes);
									var arr = [];
									arr.push(function(cb) {
										procChgs(parts.prev, true, cb);

									});
									arr.push(function(cb) {
										procChgs(parts.last, false, cb);
									});

									async.series(arr, cb);

								} else {
									procChgs(data.changes, false, cb);
								}


							}
						});

					function sliceChangesByRound(changes) {
						var maxRound = _.max(changes, function(chg) {
							return chg.round;
						});
						var maxRoundIndex = maxRound ? maxRound.round : 0;

						var prev = _.filter(changes, function(chg) {
							return chg.round < maxRoundIndex;
						});
						var last = _.filter(changes, function(chg) {
							return chg.round == maxRoundIndex;
						});
						return {
							prev: prev,
							last: last
						};
					}
				}

				function setTipPosiList(list) {
					scope.tipPosiList.length = 0;
					scope.tipPosiList = scope.tipPosiList.concat(list);
				}

				// 设置可以活动的chess
				function setActiveChessList(cb) {
					karazhan.getActiveChessList(token, roomId)
						.success(function(data) {
							if (data.flag) {
								var chessIdList = data.chessIdList;
								setTipPosiList(chessIdList.map(function(chId) {
									return _.find(room.chessList, function(n) {
										return n.id == chId;
									}).posi;
								}));

								scope.tipType = 'chess';
							}
							cb && cb();
						});
				}

				function setMoveRange(cb) {
					karazhan.getMoveRange(token, roomId)
						.success(function(data) {
							if (data.flag) {
								scope.tipType = 'move';
								scope.tipPosiList = data.positionList;
							}
							cb && cb();
						});

				}

				function setActiveSkillList(cb) {
					karazhan.getActiveSkillList(token, roomId)
						.success(function(data) {
							scope.skillList = data.skillList;

							if (room.currSkillId != undefined) {
								_.find(scope.skillList, function(sk) {
									if (sk.id == room.currSkillId) {
										sk.isSelected = true;
										return true;
									}
								});


							}
						});
				}

				function setSkillTargetList(cb) {
					karazhan.getSkillTargetList(token, room.id)
						.success(function(data) {
							// scope.skillTargetList = data.positionList;
							if (data.flag)
								scope.tipType = 'target';
							scope.tipPosiList = data.positionList;
						});
				}

				// 系统Act
				function gameAct(status) {
					// 清空
					scope.tipPosiList.length = 0;

					if (gameStatus == statusDict.beforeStart) {

					} else if (gameStatus == statusDict.gameOver) {

					} else if (gameStatus == statusDict.notMyTurn) {
						// todo
						room.currChessId = undefined;
						room.currSkillId = undefined;
						scope.tipPosiList.length = 0;
						// heartbeat
					} else if (gameStatus == statusDict.beforeChooseChess) {
						setActiveChessList();
					} else if (gameStatus == statusDict.beforeMove) {
						setMoveRange();
					} else if (gameStatus == statusDict.beforeChooseSkill) {
						getSkillTargetList();
					}
				}

				// 用户Act,主要是touch
				var act = {
					// 选择棋子
					"chooseChess": function(posi, cb) {
						karazhan.chooseChess(token, roomId, posi)
							.success(function(data) {
								if (data.flag) {
									var ch = _.find(room.chessList, function(ch) {
										return ch.posi.x == posi.x && ch.posi.y == posi.y
									});
									room.currChessId = ch.id;

									cb && cb();
								}
							});
					},
					// 反选棋子
					"unChooseChess": function(cb) {
						karazhan.unChooseChess(token, roomId)
							.success(function(data) {
								if (data.flag) {
									room.currChessId = undefined;
									cb && cb();
								}
							});
					},
					// 移动棋子
					"moveChess": function(posi, cb) {
						karazhan.moveChess(token, roomId, posi)
							.success(function(data) {
								if (data.flag) {
									getChgs(chgStack.length - 1, cb);
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
									chgStack.push(data.changes);
									animateByChgs(data.changes, refresh);
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
					},
					'surrender': function() {
						karazhan.surrender(token, room.id)
							.success(function(data) {
								if (data.flag) {
									refresh();
								}
							});
					}
				};

				function userAct(status, posi, cb) {
					var isInTip = isInTipPosiList(posi);

					var refresh = function() {
						getStatus(function() {
							gameAct(gameStatus);
						});
					};
					// 尚未选择棋子
					if (status == statusDict.beforeChooseChess) {
						if (isInTip) {
							act.chooseChess(posi, refresh);
						}
					}
					// 已经选择了棋子
					else if (status == statusDict.beforeMove) {
						if (isInTip) {
							if (!room.currSkillId) {
								act.moveChess(posi, refresh);

							}
						} else {
							act.unChooseChess(refresh);
						}
					}
					// 已经选择了技能
					else if (status == statusDict.beforeChooseSkillTarget) {
						if (isInTip) {
							act.chooseSkillTarget(posi);
						} else {
							act.unChooseSkill();
						}
					}



					// 是否在提示的格子里
					function isInTipPosiList(posi) {
						return !!_.find(scope.tipPosiList, function(po) {
							return po.x == posi.x && po.y == posi.y;
						});
					}
				}

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


				getSnapshot(function() {
					// create layers
					createBasicLayer();
					createChooseLayer();
					createTipLayer();


					$timeout(function() {
						getChgs(chgStack.length - 1, function() {
							getStatus(function() {
								gameAct(gameStatus);

								isFirstEnter = false;
							});
						});
					});

				});

				scope.$on('chooseBox.touch', function(e, data) {
					userAct(gameStatus, {
						x: data.x,
						y: data.y
					});
				});



				scope.$watch('tipPosiList', function(nv) {
					if (nv) {
						console.log(scope.tipPosiList);
						showTip();
					}

				}, true);



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