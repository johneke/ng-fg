(function(){

angular.module('formDirect', [])
	.directive('formDirectGenerate', function($compile){
		var linker = function(scope, element, attrs) {

			function getTemplate(field, model)
			{
				var content = '', i, j;

				switch(Object.prototype.toString.call(field))
				{
					case '[object Object]':
						content += '<fieldset>';
						content += '<legend>{legend}</legend>'.replace(/{legend}/gi, inflect.humanize(model.split('.').pop()));
						for (i in field)
						{
							switch(Object.prototype.toString.call(field[i]))
							{
								case '[object Object]':
									content += getTemplate(field[i], model + '.' + i);
									break;

								case '[object Array]':
									content += '<fieldset>';
									content += '<legend>{legend}<button data-ng-click="{id}.push({obj})">Add</button></legend>'
													.replace(/{legend}/gi, inflect.humanize(i))
													.replace(/{id}/gi, model + '.' + i)
													.replace(/{obj}/gi, JSON.stringify(field[i][0]).replace(/\"/gi, "'"));
									content += getTemplate(field[i], model + '.' + i) + '</fieldset>';
									break;

								default:

									if (typeof field[i] !== 'string')
									{
										content += '{label}<input id="{id}" data-ng-model="{model}" type="text" {placeholder}><br />';
									}
									else
									{
										switch(field[i].toLowerCase())
										{
											case 'boolean':
												content += '{label}<input id="{id}" data-ng-model="{model}" type="checkbox"><br />';
												break;

											case 'area':
												content += '{label}<textarea id="{id}" data-ng-model="{model}" {placeholder}></textarea><br />';
												break;

											default:
												content += '{label}<input id="{id}" data-ng-model="{model}" type="text" {placeholder}><br />';
												break;
										}
									}

									var title = inflect.humanize(i), label, placeholder;
									if (attrs.hasOwnProperty('fdrShowLabel'))
									{
										label = '<label for="{id}">{title}</label>';
									}
									else
									{
										label = '';
									}

									if (attrs.hasOwnProperty('fdrShowPlaceholder'))
									{
										placeholder = 'placeholder="{title}"';
									}
									else
									{
										placeholder = '';
									}

									content = content
													.replace(/{model}/gi, model + '.' + i)
													.replace(/{placeholder}/gi, placeholder)
													.replace(/{label}/gi, label)
													.replace(/{title}/gi, title)
													.replace(/{id}/gi, model + '.' + i);
									break;
							}
						}
						content += '</fieldset>';
						break;

					case '[object Array]':
						var item = inflect.singularize(model.split('.').pop());

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

			var template = '<form{class}>' + getTemplate(scope.fdrData, scope.fdrModelName) + '</form>';
			if (attrs.fdrClass)
			{
				template = template.replace(/{class}/gi, ' class="' + attrs.fdrClass + '"');
			}
			else
			{
				template = template.replace(/{class}/gi, '');
			}
			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	});
})();