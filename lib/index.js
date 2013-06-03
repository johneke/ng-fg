(function(){

angular.module('formDirect', [])
	.directive('formDirectGenerate', function($compile){
		var usedVariables = [];
		function randomString(length)
		{
			var result = '', chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
			for (var i = length; i > 0; --i)
			{
				result += chars[Math.round(Math.random() * (chars.length - 1))];
			}
			return result;
		}

		function getTemplate(field, model)
		{
			var content = '', i, j;

			switch(Object.prototype.toString.call(field))
			{
				case '[object Object]':
					content += '<div>';
					for (i in field)
					{
						switch(Object.prototype.toString.call(field[i]))
						{
							case '[object Object]':
								content += getTemplate(field[i], model + '.' + i);
								break;

							case '[object Array]':
								content += '<div><button data-ng-click="{id}.push({obj})">Add</button><br />'
												.replace(/{id}/gi, model + '.' + i)
												.replace(/{obj}/gi, JSON.stringify(field[i][0]).replace(/\"/gi, "'"));
								content += getTemplate(field[i], model + '.' + i) + '</div>';
								break;

							default:
								content += '<input data-ng-model="{model}" type="text" placeholder="{model}"><br />'.replace(/{model}/gi, model + '.' + i);
								break;
						}
					}
					content += '</div>';
					break;

				case '[object Array]':
					var item = null;
					do
					{
						item = randomString(10);
					}
					while(item in usedVariables);

					content += '<div ng-repeat="{item} in {model}">'.replace(/{item}/gi, item).replace(/{model}/gi, model);
					content += getTemplate(field[0], item);
					content += '<button data-ng-click="{model}.splice($index, 1)" data-ng-disabled="{model}.length < 2">Remove</button>'.replace(/{model}/gi, model);
					content += '</div>';
					break;

				default:
					break;
			}

			return content;
		}

		var linker = function(scope, element, attrs) {
			var template = '<form>' + getTemplate(scope.fdrData, scope.fdrModelName) + '</form>';
			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: "E",
			replace: true,
			link: linker
		};
	});
})();