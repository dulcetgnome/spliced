/*!
 * angular-canvas-painter - v0.4.0
 *
 * Copyright (c) 2015, Philipp Wambach
 * Released under the MIT license.
 */
'use strict';
(function(window) {
angular.module('pw.canvas-painter', []);
(function(module) {
try {
  module = angular.module('pw.canvas-painter');
} catch (e) {
  module = angular.module('pw.canvas-painter', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('../templates/canvas.html',
    '<div class="pwCanvasPaint" style="position:relative"></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('pw.canvas-painter');
} catch (e) {
  module = angular.module('pw.canvas-painter', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('../templates/color-selector.html',
    '<ul class="pwColorSelector"><li ng-repeat="color in colorList track by $index" class="pwColor" ng-class="{\'active\': (selectedColor === color)}" ng-style="{\'background-color\':color}" ng-click="setColor(color)"></li></ul>');
}]);
})();

(function(module) {
try {
  module = angular.module('pw.canvas-painter');
} catch (e) {
  module = angular.module('pw.canvas-painter', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('../templates/tool-selector.html',
    '<ul class="pwToolSelector"><li ng-repeat="tool in toolList track by $index" class="pwTool" ng-class="{\'active\': (selectedTool === tool)}" ng-click="setTool(tool)">{{ tool }}</li></ul>');
}]);
})();



angular.module('pw.canvas-painter')
	.directive('pwCanvas', function () {
		return {
			restrict: 'AE',
			scope: {
				options: '=',
				version: '='
			},
			templateUrl: '../templates/canvas.html',
			link: function postLink(scope, elm) {

				var isTouch = !!('ontouchstart' in window);

				var PAINT_START = isTouch ? 'touchstart' : 'mousedown';
				var PAINT_MOVE = isTouch ? 'touchmove' : 'mousemove';
				var PAINT_END = isTouch ? 'touchend' : 'mouseup';

				//set default options
				var options = scope.options;
				options.canvasId = options.customCanvasId || 'pwCanvasMain';
				options.tmpCanvasId = options.customCanvasId ? (options.canvasId + 'Tmp') : 'pwCanvasTmp';
				options.width = options.width || 400;
				options.height = options.height || 300;
				options.backgroundColor = options.backgroundColor || '#fff';
				options.color = options.color || '#000';
				options.undoEnabled = options.undoEnabled || false;
				options.opacity = options.opacity || 0.9;
				options.lineWidth = options.lineWidth || 1;
				options.undo = options.undo || false;
				options.imageSrc = options.imageSrc || false;
				options.tool = options.tool || 'paint';

				// background image
				if(options.imageSrc){
					var image = new Image();
					image.onload = function(){
						ctx.drawImage(this, 0, 0);
					};
					image.src = options.imageSrc;
				}

				//undo
				if(options.undo){
					var undoCache = [];
					scope.$watch(function(){
						return undoCache.length;
					}, function(newVal){
						scope.version = newVal;
					});

					scope.$watch('version', function(newVal){
						if(newVal < 0){
							scope.version = 0;
							return;
						}
						if(newVal >= undoCache.length){
							scope.version = undoCache.length;
							return;
						}
						undo(newVal);
					});
				}

				//create canvas and context
				var canvas = document.createElement('canvas');
				canvas.id = options.canvasId;
				var canvasTmp = document.createElement('canvas');
				canvasTmp.id = options.tmpCanvasId;
				angular.element(canvasTmp).css({
					position: 'absolute',
					top: 0,
					left: 0
				});
				elm.find('div').append(canvas);
				elm.find('div').append(canvasTmp);
				var ctx = canvas.getContext('2d');
				var ctxTmp = canvasTmp.getContext('2d');

				//inti variables
				var point = {x: 0, y: 0};
				var ppts = [];

				//set canvas size
				canvas.width = canvasTmp.width = options.width;
				canvas.height = canvasTmp.height = options.height;

				//set context style
				ctx.fillStyle = options.backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctxTmp.globalAlpha = options.opacity;
				ctxTmp.lineJoin = ctxTmp.lineCap = 'round';
				ctxTmp.lineWidth = 10;
				ctxTmp.strokeStyle = options.color;
				ctxTmp.fillStyle = options.color;


				//Watch options
				scope.$watch('options.lineWidth', function(newValue){
					if(typeof newValue === 'string'){
						newValue = parseInt(newValue, 10);
					}
					if(newValue && typeof newValue === 'number'){
						ctxTmp.lineWidth = options.lineWidth = newValue;
					}
				});

				scope.$watch('options.color', function(newValue){
					if(newValue){
						//ctx.fillStyle = newValue;
						ctxTmp.strokeStyle = ctxTmp.fillStyle = newValue;
					}
				});

				scope.$watch('options.opacity', function(newValue){
					if(newValue){
						ctxTmp.globalAlpha = newValue;
					}
				});

				scope.$watch('options.tool', function(newValue){
					if(newValue){
						options.tool = newValue;
					}
				});


				/* var clearCanvas = function(){
				 ctx.clearRect(0, 0, canvasTmp.width, canvasTmp.height);
				 ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);
				 };*/

			 var getOffset = function( elem ) {
					 var offsetTop = 0;
			     var offsetLeft = 0;
			     do {
			       if ( !isNaN( elem.offsetLeft ) )
			       {
								 offsetTop += elem.offsetTop;
			           offsetLeft += elem.offsetLeft;
			       }
						 elem = elem.offsetParent;
			     } while( elem );
			     return {
							left:offsetLeft,
						 	top: offsetTop
					 };
			 };

				var setPointFromEvent = function(point, e) {
					if(isTouch){
						point.x = e.changedTouches[0].pageX - getOffset(e.target).left;
						point.y = e.changedTouches[0].pageY - getOffset(e.target).top;
					} else {
						point.x = e.offsetX !== undefined ? e.offsetX : e.layerX;
						point.y = e.offsetY !== undefined ? e.offsetY : e.layerY;
					}
				};


				var paint = function (e){
					if(e){
						e.preventDefault();
						setPointFromEvent(point, e);
					}

					// Saving all the points in an array
					ppts.push({x: point.x, y: point.y});

					if (ppts.length === 3) {
						var b = ppts[0];
						ctxTmp.beginPath();
						ctxTmp.arc(b.x, b.y, ctxTmp.lineWidth / 2, 0, Math.PI * 2, !0);
						ctxTmp.fill();
						ctxTmp.closePath();
						return;
					}

					// Tmp canvas is always cleared up before drawing.
					ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);

					ctxTmp.beginPath();
					ctxTmp.moveTo(ppts[0].x, ppts[0].y);

					for (var i = 1; i < ppts.length - 2; i++) {
						var c = (ppts[i].x + ppts[i + 1].x) / 2;
						var d = (ppts[i].y + ppts[i + 1].y) / 2;
						ctxTmp.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
					}

					// For the last 2 points
					ctxTmp.quadraticCurveTo(
						ppts[i].x,
						ppts[i].y,
						ppts[i + 1].x,
						ppts[i + 1].y
					);
					ctxTmp.stroke();
				};

				var setPixel = function(ctx, x, y) {
						ctx.fillRect(x,y,1,1)
				};


				var getPixelColor = function(ctx, x, y) {
						return ctx.getImageData(x,y,1,1).data.toString();
				};

				var fill = function(e){
					if(e){
						e.preventDefault();
						setPointFromEvent(point, e);
					}

					// Tmp canvas is always cleared up before drawing.
					ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);

					var startColor = getPixelColor(ctx, point.x, point.y);
					var pixelStack = [point];
					while(pixelStack.length) {
						var b = pixelStack.pop();
						while(b.y-1 >= 0 && getPixelColor(ctx, b.x, b.y-1) === startColor) {
							b.y--;
						}
						var reachLeft = false;
						var reachRight = false;
						while(b.y < canvas.height && getPixelColor(ctx, b.x, b.y) === startColor) {
							setPixel(ctxTmp,b.x,b.y);
							if(b.x > 0) {
								if(getPixelColor(ctx, b.x-1, b.y) === startColor && getPixelColor(ctxTmp, b.x-1, b.y) === '0,0,0,0') {
									if(!reachLeft) {
										pixelStack.push({x:b.x-1, y:b.y});
										reachLeft = true;
									}
								} else if(reachLeft) {
									reachLeft = false;
								}
							}
							if(b.x < canvas.width) {
								if(getPixelColor(ctx, b.x+1, b.y) === startColor && getPixelColor(ctxTmp, b.x+1, b.y) === '0,0,0,0') {
									if(!reachRight) {
										pixelStack.push({x:b.x+1, y:b.y});
										reachRight = true;
									}
								} else if(reachRight) {
									reachRight = false;
								}
							}
							b.y++;
						}
					}
				};

				var copyTmpImage = function(){
					if(options.undo){
						scope.$apply(function(){
							undoCache.push(ctx.getImageData(0, 0, canvasTmp.width, canvasTmp.height));
							if(angular.isNumber(options.undo) && options.undo > 0){
								undoCache = undoCache.slice(-1 * options.undo);
							}
						});
					}
					canvasTmp.removeEventListener(PAINT_MOVE, paint, false);
					ctx.drawImage(canvasTmp, 0, 0);
					ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);
					ppts = [];
				};

				var fillTmpImage = function(e){
					e.preventDefault();

					fill(e);
				};

				var paintTmpImage = function(e){
					e.preventDefault();
					canvasTmp.addEventListener(PAINT_MOVE, paint, false);

					setPointFromEvent(point, e);
					ppts.push({x: point.x, y: point.y});
					ppts.push({x: point.x, y: point.y});

					paint();
				};

				var paintStartFn = function(e){
					if(options.tool === 'paint'){
						paintTmpImage(e);
					} else if(options.tool === 'fill'){
						fillTmpImage(e);
					}
				};

				var paintEndFn = function(e){
					copyTmpImage();
				};

				var initListeners = function(){
					canvasTmp.addEventListener(PAINT_START, paintStartFn, false);
					canvasTmp.addEventListener('mouseenter', function(e){
						// If the mouse is down when it enters the canvas, start a path
						if(e.which === 1){
							paintStartFn(e);
						}
					}, false);
					canvasTmp.addEventListener(PAINT_END, paintEndFn, false);
					canvasTmp.addEventListener('mouseleave', function(e){
						// If the mouse is down when it leaves the canvas, end the path
						if(e.which === 1){
							paintEndFn(e);
						}
					}, false);
				};
				initListeners();



				var undo = function(version){
					if(undoCache.length > 0){
						ctx.putImageData(undoCache[version], 0, 0);
						undoCache = undoCache.slice(0,version);
					}
				};

			}
		};
	});



angular.module('pw.canvas-painter')
	.directive('pwColorSelector', function () {
		return {
			restrict: 'AE',
			scope: {
				colorList: '=pwColorSelector',
				selectedColor: '=color'
			},
			templateUrl: '../templates/color-selector.html',
			link: function(scope){
				scope.setColor = function(col){
					scope.selectedColor = col;
				};
			}
		};
	});

angular.module('pw.canvas-painter')
	.directive('pwToolSelector', function () {
		return {
			restrict: 'AE',
			scope: {
				toolList: '=pwToolSelector',
				selectedTool: '=tool'
			},
			templateUrl: '../templates/tool-selector.html',
			link: function(scope){
				scope.setTool = function(tool){
					scope.selectedTool = tool;
				};
			}
		};
	});

}(this));