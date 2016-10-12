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

				var username = scope.username = localStorage.getItem('username');
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

				// 获取状态
				var myInfo = {};
				scope.myInfo = function(key, value) {
					if (key === undefined && value === undefined) {
						return myInfo;
					}
					if (value === undefined) {
						return myInfo[key];
					} else {
						myInfo[key] = value;
					}
				};



				// 处理changes
				// isSlient,是否以静默方式处理,如果是,则不执行动画效果
				function procChgs(changes, isSlient, cb) {
					var arr = [];
					// animate

					if (!isSlient) {
						arr.push(function(cb) {
							$timeout(cb, 250);
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
					dict[changeTypeDict.position] = function(chg) {
						var detail = chg.detail;
						var chessId = detail.sourceChessId;

						var ch = _.find(room.chessList, function(ch) {
							return ch.id == chessId;
						});
						ch.posi = detail.abs;
					};

					dict[changeTypeDict.hp] = function(chg) {
						var detail = chg.detail;
						var chessId = detail.targetChessId;

						var ch = _.find(room.chessList, function(ch) {
							return ch.id == chessId;
						});
						ch.hp = detail.abs;
					};

					dict[changeTypeDict.energy] = function(chg) {
						var playerName = chg.playerName;
						var p = _.find(room.playerList, function(p) {
							return p.name === playerName;
						});
						p.energy = chg.detail.abs;
					};

					dict[chg.type](chg);

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
						}, 200, function() {
							cb();
							scope.$apply();
						});
					};

					dict['hurt'] = function(chg, cb) {
						var currChess = _.find(room.chessList, function(ch) {
							return ch.id == chg.detail.sourceChessId;
						});
						var tagetChess = _.find(room.chessList, function(ch) {
							return ch.id == chg.detail.targetChessId;
						});

						var box = $('[chid="' + tagetChess.id + '"]');
						var orgiginLeft = box.css('left').replace('px', '') / 100;
						var orgiginTop = box.css('top').replace('px', '') / 100;
						box.addClass('inHurt');
						var arr = [];
						var count = 4;
						while (count--) {
							arr.push({
								left: (Math.random > .5 ? 1 : -1) * Math.random() / 8,
								top: (Math.random > .5 ? 1 : -1) * Math.random() / 8
							});
						};
						async.each(arr, function(posi, cb) {
							box.animate({
								left: posi.left + orgiginLeft + 'rem',
								top: posi.top + orgiginTop + 'rem'
							}, 100, cb);

						}, function(err, data) {
							box.css({
								left: orgiginLeft + 'rem',
								top: orgiginTop + 'rem'
							});
							box.removeClass('inHurt');

							cb();
						});
					};

					dict['heal'] = function(chg, cb) {
						var tagetChess = _.find(room.chessList, function(ch) {
							return ch.id == chg.detail.targetChessId;
						});

						var box = $('[chid="' + tagetChess.id + '"]');
						var orgiginTop = box.css('top').replace('px', '') / 100;
						box.addClass('inHeal');
						var arr = [];
						var count = 4;
						while (count--) {
							arr.push({
								top: Math.random() / 8
							});
						};
						async.each(arr, function(posi, cb) {
							box.animate({
								top: posi.top + orgiginTop + 'rem'
							}, 100, cb);

						}, function(err, data) {
							box.css({
								top: orgiginTop + 'rem'
							});
							box.removeClass('inHeal');
							cb();
						});
					};

					var type = chg.type;
					if (type == changeTypeDict.position) {
						dict['move'](chg, cb);
					} else if (type == changeTypeDict.hp) {
						if (chg.detail.rela < 0) {
							dict['hurt'](chg, cb);

						} else {
							dict['heal'](chg, cb);
						}
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
								scope.gameStatus = data.status;
								scope.currPlayerName = data.playerName;
								scope.room.currSkillId = data.currSkillId;
								scope.room.currChessId = data.currChessId;
								scope.room.skillList = data.skillList;
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
							scope.room.skillList = data.skillList;

						});
				}

				function setSkillTargetList(cb) {
					karazhan.getSkillTargetList(token, roomId)
						.success(function(data) {
							// scope.skillTargetList = data.positionList;
							if (data.flag) {
								scope.tipType = 'target';
								scope.tipPosiList = data.positionList;
							}
						});
				}

				// 清空
				function clear() {
					scope.currPlayerName = undefined;
					scope.room.currChessId = undefined;
					scope.room.currSkillId = undefined;
					scope.room.skillList = [];
				}

				// 刷新
				function refresh() {
					clear();
					getStatus(function() {
						gameAct(scope.gameStatus);
					});
				};


				// 系统Act
				function gameAct(status) {
					// 清空
					scope.tipPosiList.length = 0;

					if (status == statusDict.beforeStart) {

					} else if (status == statusDict.gameOver) {

					} else if (status == statusDict.notMyTurn) {
						// heartbeat
						// 发送心跳
						var heartBeat = function() {
							karazhan.heartBeat(token, roomId)
								.success(function(data) {
									if (data.flag) {
										if (!data.isNew) {
											heartBeat();
										} else {
											getChgs(chgStack.length - 1, function() {
												getStatus(function() {
													gameAct(scope.gameStatus);
												});
											});
										}
									}
								});

						};
						heartBeat();

					} else if (status == statusDict.beforeChooseChess) {
						setActiveChessList();
					} else if (status == statusDict.beforeMove) {
						if (room.currSkillId !== undefined) {

						}
						setMoveRange();
						setActiveSkillList();
					} else if (status == statusDict.beforeChooseSkill) {
						setActiveSkillList();
					} else if (status = statusDict.beforeChooseSkillTarget) {
						setSkillTargetList();
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
					"chooseSkill": function(skillId, cb) {
						karazhan.chooseSkill(token, roomId, skillId)
							.success(function(data) {
								if (data.flag) {
									cb();
								}
							});

					},
					"unChooseSkill": function(cb) {
						karazhan.unChooseSkill(token, roomId)
							.success(function(data) {
								if (data.flag) {
									cb();
								}
							});
					},

					// 选择技能目标(施放技能)
					"chooseSkillTarget": function(posi, cb) {
						var currChessId = room.currChessId;
						var currSkillId = room.currSkillId;
						karazhan.chooseSkillTarget(token, roomId, posi)
							.success(function(data) {
								if (data.flag) {
									getChgs(chgStack.length - 1, cb);
								}
							});
					},
					'rest': function() {
						karazhan.rest(token, roomId)
							.success(function(data) {
								if (data.flag) {
									refresh();
								}
							});
					},
					'surrender': function() {
						karazhan.surrender(token, roomId)
							.success(function(data) {
								if (data.flag) {
									refresh();
								}
							});
					}
				};

				function userAct(status, option) {
					// 尚未选择棋子
					if (status == statusDict.beforeChooseChess) {
						var posi = option.posi;
						var isInTip = isInTipPosiList(posi);
						if (isInTip) {
							act.chooseChess(posi, refresh);
						}
					}
					// 已经选择了棋子
					else if (status == statusDict.beforeMove) {
						var posi = option.posi;
						var isInTip = isInTipPosiList(posi);
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
						var posi = option.posi;
						var isInTip = isInTipPosiList(posi);
						if (isInTip) {
							act.chooseSkillTarget(posi, refresh);
						} else {
							act.unChooseSkill(refresh);
						}
					}



					// 是否在提示的格子里
					function isInTipPosiList(posi) {
						return !!_.find(scope.tipPosiList, function(po) {
							return po.x == posi.x && po.y == posi.y;
						});
					}
				}

				scope.rest = function() {
					act['rest']();
				};

				scope.surrender = function() {
					act['surrender']();
				};


				scope.getChessDesc = function(chessId) {
					if (chessId === undefined || !room.chessList) {
						return '';
					}
					var ch = _.find(room.chessList, function(ch) {
						return ch.id == chessId;
					});
					return karazhanDesc.getChessDesc(ch.type);
				};


				scope.getSkillTypeList = function(chType) {
					if (!room || !room.chessList || !room.currChessId) {
						return [];
					}
					var ch = _.find(room.chessList, function(ch) {
						return ch.id == room.currChessId;
					});
					return karazhanDesc.getSkillListByChessType(ch.type);
				};

				scope.getSkillDesc = function(type) {
					return karazhanDesc.getSkillDesc(type);
				};


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

								gameAct(scope.gameStatus);

								isFirstEnter = false;
							});
						});
					});

				});

				scope.$on('chooseBox.touch', function(e, data) {
					var posi = {
						x: data.x,
						y: data.y
					};
					userAct(scope.gameStatus, {
						posi: posi
					});
				});

				scope.$on('skill.touch', function(e, data) {
					var hasUnChoose = false;
					var skId = scope.room.currSkillId;
					if (skId === undefined) {
						skId = data;
					} else {
						hasUnChoose = true;
						if (skId === data) {
							skId = undefined;
						} else {
							skId = data;
						}
					}

					var arr = [];

					if (hasUnChoose) {
						arr.push(function(cb) {
							act.unChooseSkill(cb);
						});
					}

					if (skId !== undefined) {
						arr.push(function(cb) {
							act.chooseSkill(skId, cb);
						});
					}

					async.series(arr, function(err, data) {
						getStatus(function() {
							gameAct(scope.gameStatus);
						});
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