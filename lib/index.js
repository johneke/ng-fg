(function(){

angular.module('formDirect', [])
	.directive('formDirectGenerate', function($compile){

		var linker = function(scope, element, attrs) {

			function extractLabel(obj)
			{
				var labelFields = ['name', 'title', 'label'];
				for (var i in labelFields)
				{
					var field = labelFields[i];
					if (_.has(obj, field))
					{
						return obj[field];
					}
				}

				return (obj._id) ? obj._id : obj.id;
			}

			function getTemplate(field, model, isArrayItem, arrayModel)
			{
				var content = '', i, j, k;

				if (_.isPlainObject(field))
				{
					content += '<fieldset {group-class}>';
					if (isArrayItem)
					{
						content += '<legend {group-title-class}>{legend}<button {remove-btn-class} data-ng-click="{model}.splice($index, 1)">Remove</button></legend>'.replace(/{model}/gi, arrayModel);
					}
					else
					{
						content += '<legend {group-title-class}>{legend}</legend>';
					}
					content = content.replace(/{legend}/gi, inflect.humanize(model.split('.').pop()));

					for (i in field)
					{
						// single options are handled below
						if (_.isPlainObject(field[i]) && (_.isUndefined(field[i].type) || field[i].type !== 'select'))
						{
							content += getTemplate(field[i], model + '.' + i, false, null);
						}
						else if (_.isArray(field[i]) && field[i].length > 0 && (_.isUndefined(field[i][0].type) || field[i][0].type !== 'select'))
						{
							if (_.isString(field[i][0]))
							{
								content += '<fieldset {group-class}>';
								content += '<legend {group-title-class}>{legend}<button {add-btn-class} data-ng-click="{id}.push(\'\')">Add</button></legend>';
								content += '<span data-ng-repeat="str in {id} track by $id($index)">'
								content += '<input id="{id}{{$index}}" type="text" {placeholder}>';
								content += '<button {remove-btn-class} data-ng-click="{id}.splice($index, 1)">Remove</button><br />';
								content += '</span>';
								content += '</fieldset>';
								content = content
											.replace(/{legend}/gi, inflect.humanize(i))
											.replace(/{id}/gi, model + '.' + i)
											.replace(/{obj}/gi, JSON.stringify(field[i][0]).replace(/\"/gi, "'"));
							}
							else
							{
								content += '<fieldset {group-class}>';
								content += '<legend {group-title-class}>{legend}<button {add-btn-class} data-ng-click="{id}.push({obj})">Add</button></legend>'
												.replace(/{legend}/gi, inflect.humanize(i))
												.replace(/{id}/gi, model + '.' + i)
												.replace(/{obj}/gi, JSON.stringify(field[i][0]).replace(/\"/gi, "'"));
								content += getTemplate(field[i], model + '.' + i, false, null) + '</fieldset>';
							}
						}
						else
						{
							if (field[i] === 'boolean')
							{
								content += '{label}<input {checkbox-input-class} id="{id}" data-ng-model="{model}" type="checkbox"><br />';
							}
							else if (field[i] === 'area')
							{
								content += '{label}<textarea {textarea-class} id="{id}" data-ng-model="{model}" {placeholder}></textarea><br />';
							}
							else if (_.isPlainObject(field[i]) && field[i].type === 'select')
							{
								var options = field[i].options.map(function(option){
									return {
										label: extractLabel(option),
										_id: option._id
									};
								});

								var item = inflect.singularize(i);
								content += '<select data-ng-init=\'{item}_options = {options};\' data-ng-options="option._id as option.label for option in {item}_options" {select-input-class} id="{id}{{$index}}" data-ng-model="{model}"><option value="">Select {item}...</option></select><br />'
									.replace(/{options}/gi, JSON.stringify(options))
									.replace(/{item}/gi, item);
							}
							else if (_.isArray(field[i]) && field[i].length > 0 && field[i][0].type === 'select')
							{
								var options = field[i][0].options.map(function(option){
									return {
										label: extractLabel(option),
										_id: option._id
									};
								});

								var item = inflect.singularize(i);
								content += '<button data-ng-init=\'{item}_options = {options};\' {add-btn-class} data-ng-click="{model}.push(\'\')">Add {item}</button><br />';
								content += '<span data-ng-repeat="{item} in {model} track by $id($index)">';
								content += '<select data-ng-options="option._id as option.label for option in {item}_options" data-ng-model="{model}[$index]" {select-input-class} id="{id}{{$index}}"><option value="">Select {item}...</option></select>';
								content += '<button {remove-btn-class} data-ng-click="{model}.splice($index, 1)">Remove</button><br />';
								content += '</span>';
								content = content
												.replace(/{options}/gi, JSON.stringify(options))
												.replace(/{item}/gi, item);
							}
							else
							{
								content += '{label}<input id="{id}" data-ng-model="{model}" type="text" {placeholder}><br />';
							}

							var title = inflect.humanize(i),
							label = attrs.hasOwnProperty('fdrShowLabel') ? '<label {label-class} for="{id}">{title}</label>' : '',
							placeholder = attrs.hasOwnProperty('fdrShowPlaceholder') ? 'placeholder="{title}"' : '';

							content = content
											.replace(/{model}/gi, model + '.' + i)
											.replace(/{placeholder}/gi, placeholder)
											.replace(/{label}/gi, label)
											.replace(/{title}/gi, title)
											.replace(/{id}/gi, model + '.' + i);
						}
					}
					content += '</fieldset>';
				}
				else if (_.isArray(field))
				{
					var item = inflect.singularize(model.split('.').pop());

					content += '<div ng-repeat="{item} in {model} track by $id($index)">'.replace(/{item}/gi, item).replace(/{model}/gi, model);
					content += getTemplate(field[0], item, true, model);
					content += '</div>';
				}

				return content;
			}

			var template = '<form {form-class}>' + getTemplate(scope.fdrModel, attrs.fdrModelName, false, null) + '</form>';
			var fdrFormClass = attrs.fdrFormClass ? 'class="'+attrs.fdrFormClass+'"' : '',
				fdrGroupClass = attrs.fdrGroupClass ? 'class="'+attrs.fdrGroupClass+'"' : '',
				fdrGroupTitleClass = attrs.fdrGroupTitleClass ? 'class="'+attrs.fdrGroupTitleClass+'"' : '',
				fdrLabelClass = attrs.fdrLabelClass ? 'class="'+attrs.fdrLabelClass+'"' : '',
				fdrAddBtnClass = attrs.fdrAddBtnClass ? 'class="'+attrs.fdrAddBtnClass+'"' : '',
				fdrRemoveBtnClass = attrs.fdrRemoveBtnClass ? 'class="'+attrs.fdrRemoveBtnClass+'"' : '',
				fdrTextInputClass = attrs.fdrTextInputClass ? 'class="'+attrs.fdrTextInputClass+'"' : '',
				fdrCheckboxInputClass = attrs.fdrCheckboxInputClass ? 'class="'+attrs.fdrCheckboxInputClass+'"' : '',
				fdrSelectInputClass = attrs.fdrSelectInputClass ? 'class="'+attrs.fdrSelectInputClass+'"' : '',
				fdrTextareaClass = attrs.fdrTextareaClass ? 'class="'+attrs.fdrTextareaClass+'"' : '';

			template = template
							.replace(/{form-class}/gi, fdrFormClass)
							.replace(/{group-class}/gi, fdrGroupClass)
							.replace(/{group-title-class}/gi, fdrGroupTitleClass)
							.replace(/{label-class}/gi, fdrLabelClass)
							.replace(/{add-btn-class}/gi, fdrAddBtnClass)
							.replace(/{remove-btn-class}/gi, fdrRemoveBtnClass)
							.replace(/{text-input-class}/gi, fdrTextInputClass)
							.replace(/{checkbox-input-class}/gi, fdrCheckboxInputClass)
							.replace(/{select-input-class}/gi, fdrSelectInputClass)
							.replace(/{textarea-class}/gi, fdrTextareaClass);

			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.directive('formDirectForm', function(){
		return {
			restrict: 'E',
			template: '<form><form-direct-object form-direct-schema="fdrSchema" form-direct-object-name="sample"></form-direct-object></form>',
			replace: true
		};
	})
	.directive('formDirectObject', function($compile, getobject){

		var linker = function(scope, element, attrs) {
			var schema = getobject.get(scope, attrs.formDirectSchema);
			var template = null;
			var content = null;
			var i;

			switch (schema.type.toLowerCase())
			{
				case 'object':
					template = '<fieldset><legend>{legend}</legend>{content}</fieldset>';
					content = '';
					for (i in schema.properties)
					{
						var field = schema.properties[i];
						switch (field.type.toLowerCase())
						{
							case 'object':
							case 'array':
								content +=	'<form-direct-object form-direct-schema="{schema}" form-direct-object-name="{name}"></form-direct-object>'
												.replace(/{schema}/gi, attrs.formDirectSchema + '.properties.' + i)
												.replace(/{name}/gi, i);
								break;

							default:
								console.log(field);
								content += '<span>{leaf}</span><br />'.replace(/{leaf}/gi, i);
								break;
						}
					}
					template =	template
									.replace(/{content}/gi, content)
									.replace(/{legend}/gi, attrs.formDirectObjectName);
					break;

				case 'array':
					template =	'<fieldset><legend>{legend}</legend><form-direct-array-item form-direct-schema="{schema}" form-direct-object-name="{name}"></form-direct-array-item></fieldset>'
									.replace(/{schema}/gi, attrs.formDirectSchema + '.items')
									.replace(/{name}/gi, inflect.singularize(attrs.formDirectObjectName))
									.replace(/{legend}/gi, attrs.formDirectObjectName);
					break;

				default:
					template = '<span>{leaf}</span><br />'.replace(/{leaf}/gi, attrs.formDirectObjectName);
					break;
			}
			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.directive('formDirectArrayItem', function($compile, getobject){

		var linker = function(scope, element, attrs) {
			var schema = getobject.get(scope, attrs.formDirectSchema);
			var template = '<div>{content}</div>';
			var content = null;
			var i;

			switch(schema.type.toLowerCase())
			{
				case 'object':
				case 'array':
					content =	'<form-direct-object form-direct-schema="{schema}" form-direct-object-name="{name}"></form-direct-object>'
									.replace(/{schema}/gi, attrs.formDirectSchema)
									.replace(/{name}/gi, attrs.formDirectObjectName);
					break;

				default:
					content = '<span>Leaf Field Array Item</span><br />';
					break;
			}

			template = template.replace(/{content}/gi, content);

			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.service('getobject', function(){
		/*
		* getobject
		* https://github.com/cowboy/node-getobject
		*
		* Copyright (c) 2013 "Cowboy" Ben Alman
		* Licensed under the MIT license.
		*/

		var getobject = {};

		// Split strings on dot, but only if dot isn't preceded by a backslash. Since
		// JavaScript doesn't support lookbehinds, use a placeholder for "\.", split
		// on dot, then replace the placeholder character with a dot.
		function getParts(str) {
			return str.replace(/\\\./g, '\uffff').split('.').map(function(s) {
				return s.replace(/\uffff/g, '.');
			});
		}

		// Get the value of a deeply-nested property exist in an object.
		getobject.get = function(obj, parts, create) {
			if (typeof parts === 'string') {
				parts = getParts(parts);
			}

			var part;
			while (typeof obj === 'object' && obj && parts.length) {
				part = parts.shift();
				if (!(part in obj) && create) {
					obj[part] = {};
				}
				obj = obj[part];
			}

			return obj;
		};

		// Set a deeply-nested property in an object, creating intermediary objects
		// as we go.
		getobject.set = function(obj, parts, value) {
			parts = getParts(parts);

			var prop = parts.pop();
			obj = getobject.get(obj, parts, true);
			if (obj && typeof obj === 'object') {
				return (obj[prop] = value);
			}
		};

		// Does a deeply-nested property exist in an object?
		getobject.exists = function(obj, parts) {
			parts = getParts(parts);

			var prop = parts.pop();
			obj = getobject.get(obj, parts);

			return typeof obj === 'object' && obj && prop in obj;
		};

		return getobject;
	});
})();
