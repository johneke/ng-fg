(function(){

angular.module('fg', [])
	.directive('fgForm', function($compile, utils){

		var linker = function(scope, element, attrs) {
			scope[attrs.name] = utils.objectFromSchema(attrs.name, scope[attrs.schema]);
			var template =	utils.templates.form
								.replace(/{schema}/gi, attrs.schema)
								.replace(/{name}/gi, attrs.name)
								.replace(/{model}/gi, attrs.name);

			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.directive('fgObject', function($compile, getobject, inflect, utils){

		var linker = function(scope, element, attrs) {
			var schema = getobject.get(scope, attrs.schema);
			var template = '';
			var content = '';
			var i;

			switch (schema.type.toLowerCase())
			{
				case 'object':
					for (i in schema.properties)
					{
						var field = schema.properties[i];
						content += utils.getDirectiveForSchema(field, attrs.schema + '.properties.' + i, i, attrs.model + '.' + i);
					}
					template =	utils.templates.object
									.replace(/{content}/gi, content)
									.replace(/{legend}/gi, attrs.name);
					break;

				case 'array':
					template =	utils.templates.object
									.replace(/{content}/gi, utils.directives.arrayItem)
									.replace(/{legend}/gi, attrs.name)
									.replace(/{schema}/gi, attrs.schema + '.items')
									.replace(/{name}/gi, inflect.singularize(attrs.name))
									.replace(/{model}/gi, attrs.model);
					break;

				default:
					console.error('fgObject cannot be used with ' + schema.type + ' schema type');
					template = '';
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
	.directive('fgArrayItem', function($compile, getobject, utils, inflect){

		var linker = function(scope, element, attrs) {
			var schema = getobject.get(scope, attrs.schema);
			var content = utils.getDirectiveForSchema(schema, attrs.schema, attrs.name, inflect.singularize(attrs.name));
			var template =	utils.templates.arrayItem
								.replace(/{content}/gi, content)
								.replace(/{item}/gi, inflect.singularize(attrs.name))
								.replace(/{model}/gi, attrs.model);

			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.directive('fgControl', function($compile, getobject, utils){

		var linker = function(scope, element, attrs) {
			var template = null;
			var options = null;
			
			switch (attrs.type)
			{
				case 'boolean':
					template = utils.templates.checkbox;
					break;

				case 'integer':
				case 'number':
				case 'string':
					template = utils.templates.textbox;
					break;

				case 'enum':
					options = getobject.get(scope, attrs.schema);
					if (options.length)
					{
						if (Object.prototype.toString.call(options[0]) === "[object Object]")
						{
							template = 	utils.templates.enumObj;
						}
						else
						{
							template = 	utils.templates.enum;
						}
					}
					else
					{
						template = '';
					}
					break;

				default:
					template = '';
					break;
			}

			template =	template
							.replace(/{schema}/gi, attrs.schema)
							.replace(/{name}/gi, attrs.name)
							.replace(/{model}/gi, attrs.model);

			element.html(template);
			$compile(element.contents())(scope);
		};

		return {
			restrict: 'E',
			replace: true,
			link: linker
		};
	})
	.service('utils', function(){
		var directives = {};
		directives.object = 	'<fg-object schema="{schema}" name="{name}" model="{model}"></fg-object>';
		directives.arrayItem = 	'<fg-array-item schema="{schema}" name="{name}" model="{model}"></fg-array-item>';
		directives.control = 	'<fg-control schema="{schema}" name="{name}" type="{type}" model="{model}"></fg-control>';

		var templates = {};
		templates.object = 		'<fieldset><legend>{legend}</legend>{content}</fieldset>';
		templates.form =		'<form>{content}</form>'
									.replace(/{content}/gi, directives.object);
		templates.arrayItem = 	'<div ng-repeat="{item} in {model}">{content}</div>';
		templates.textbox = 	'<input type="text" placeholder="{name}" ng-model="{model}" />';
		templates.checkbox = 	'<input type="text" placeholder="{name}" ng-model="{model}" />';
		templates.enum = 		'<select ng-model="{model}" ng-options="opt for opt in {schema} track by opt"><option value="">Select {name}...</option></select>';
		templates.enumObj = 	'<select ng-model="{model}"><option value="">Select {name}...</option><option ng-repeat="opt in {schema}" value="{{opt.id}}">{{opt.label}}</option></select>';

		var getDirectiveForSchema = function(schema, path, name, model){
			var content = '';
			if (schema.enum)
			{
				content = 	directives.control
								.replace(/{schema}/gi, path + '.enum')
								.replace(/{type}/gi, 'enum')
								.replace(/{name}/gi, name)
								.replace(/{model}/gi, model);
			}
			else if(schema.type)
			{
				switch(schema.type.toLowerCase())
				{
					case 'object':
					case 'array':
						content =	directives.object
										.replace(/{schema}/gi, path)
										.replace(/{name}/gi, name)
										.replace(/{model}/gi, model);
						break;

					case 'boolean':
					case 'integer':
					case 'number':
					case 'string':
						content = 	directives.control
										.replace(/{type}/gi, schema.type.toLowerCase())
										.replace(/{name}/gi, name)
										.replace(/{model}/gi, model);
						break;

					default:
						console.error('fgArrayItem cannot be used with ' + schema.type + ' schema type');
						content = '';
						break;
				}
			}
			else
			{
				console.error('property is not supported: \n' + JSON.stringify(schema));
				content = '';
			}

			return content;
		};

		var objectFromSchema = function(name, schema) {
			var type = schema.type;
			var _enum = schema.enum;
			var obj = (type === 'array') ? [] : {};
			var i = null;

			function addSubObj(key, subObj)
			{
				if (type === 'array')
				{
					obj.push(subObj);
				}
				else
				{
					obj[key] = subObj;
				}
			}

			if (_enum)
			{
				obj = '';
			}
			else if (type)
			{
				switch(type.toLowerCase())
				{
					case 'boolean':
					case 'integer':
					case 'number':
					case 'string':
						obj = '';
						break;

					case 'object':
						for (i in schema.properties)
						{
							var field = schema.properties[i];
							addSubObj(i, objectFromSchema(i, field));
						}
						break;

					case 'array':
						addSubObj(null, objectFromSchema(null, schema.items));
						break;

					default:
						break;
				}
			}
			else
			{
				return null;
			}

			return obj;
		};

		return {
			templates: templates,
			directives: directives,
			getDirectiveForSchema: getDirectiveForSchema,
			objectFromSchema: objectFromSchema
		};
	})
	.service('inflect', function(){
		/*
		* inflect
		* https://github.com/MSNexploder/inflect
		*
		* Copyright © 2011 Stefan Huber
		* Licensed under the MIT license.
		*/
		var inflect = null;
		(function(){var e=function(t,n){var r=e.resolve(t,n||"/"),i=e.modules[r];if(!i)throw new Error("Failed to resolve module "+t+", tried "+r);var s=e.cache[r],o=s?s.exports:i();return o};e.paths=[],e.modules={},e.cache={},e.extensions=[".js",".coffee",".json"],e._core={assert:!0,events:!0,fs:!0,path:!0,vm:!0},e.resolve=function(){return function(t,n){function u(t){t=r.normalize(t);if(e.modules[t])return t;for(var n=0;n<e.extensions.length;n++){var i=e.extensions[n];if(e.modules[t+i])return t+i}}function a(t){t=t.replace(/\/+$/,"");var n=r.normalize(t+"/package.json");if(e.modules[n]){var i=e.modules[n](),s=i.browserify;if(typeof s=="object"&&s.main){var o=u(r.resolve(t,s.main));if(o)return o}else if(typeof s=="string"){var o=u(r.resolve(t,s));if(o)return o}else if(i.main){var o=u(r.resolve(t,i.main));if(o)return o}}return u(t+"/index")}function f(e,t){var n=l(t);for(var r=0;r<n.length;r++){var i=n[r],s=u(i+"/"+e);if(s)return s;var o=a(i+"/"+e);if(o)return o}var s=u(e);if(s)return s}function l(e){var t;e==="/"?t=[""]:t=r.normalize(e).split("/");var n=[];for(var i=t.length-1;i>=0;i--){if(t[i]==="node_modules")continue;var s=t.slice(0,i+1).join("/")+"/node_modules";n.push(s)}return n}n||(n="/");if(e._core[t])return t;var r=e.modules.path();n=r.resolve("/",n);var i=n||"/";if(t.match(/^(?:\.\.?\/|\/)/)){var s=u(r.resolve(i,t))||a(r.resolve(i,t));if(s)return s}var o=f(t,i);if(o)return o;throw new Error("Cannot find module '"+t+"'")}}(),e.alias=function(t,n){var r=e.modules.path(),i=null;try{i=e.resolve(t+"/package.json","/")}catch(s){i=e.resolve(t,"/")}var o=r.dirname(i),u=(Object.keys||function(e){var t=[];for(var n in e)t.push(n);return t})(e.modules);for(var a=0;a<u.length;a++){var f=u[a];if(f.slice(0,o.length+1)===o+"/"){var l=f.slice(o.length);e.modules[n+l]=e.modules[o+l]}else f===o&&(e.modules[n]=e.modules[o])}},function(){var t={},n=typeof window!="undefined"?window:{},r=!1;e.define=function(i,s){!r&&e.modules.__browserify_process&&(t=e.modules.__browserify_process(),r=!0);var o=e._core[i]?"":e.modules.path().dirname(i),u=function(t){var n=e(t,o),r=e.cache[e.resolve(t,o)];return r&&r.parent===null&&(r.parent=a),n};u.resolve=function(t){return e.resolve(t,o)},u.modules=e.modules,u.define=e.define,u.cache=e.cache;var a={id:i,filename:i,exports:{},loaded:!1,parent:null};e.modules[i]=function(){return e.cache[i]=a,s.call(a.exports,u,a,a.exports,o,i,t,n),a.loaded=!0,a.exports}}}(),e.define("path",function(e,t,n,r,i,s,o){function u(e,t){var n=[];for(var r=0;r<e.length;r++)t(e[r],r,e)&&n.push(e[r]);return n}function a(e,t){var n=0;for(var r=e.length;r>=0;r--){var i=e[r];i=="."?e.splice(r,1):i===".."?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n--;n)e.unshift("..");return e}var f=/^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;n.resolve=function(){var e="",t=!1;for(var n=arguments.length;n>=-1&&!t;n--){var r=n>=0?arguments[n]:s.cwd();if(typeof r!="string"||!r)continue;e=r+"/"+e,t=r.charAt(0)==="/"}return e=a(u(e.split("/"),function(e){return!!e}),!t).join("/"),(t?"/":"")+e||"."},n.normalize=function(e){var t=e.charAt(0)==="/",n=e.slice(-1)==="/";return e=a(u(e.split("/"),function(e){return!!e}),!t).join("/"),!e&&!t&&(e="."),e&&n&&(e+="/"),(t?"/":"")+e},n.join=function(){var e=Array.prototype.slice.call(arguments,0);return n.normalize(u(e,function(e,t){return e&&typeof e=="string"}).join("/"))},n.dirname=function(e){var t=f.exec(e)[1]||"",n=!1;return t?t.length===1||n&&t.length<=3&&t.charAt(1)===":"?t:t.substring(0,t.length-1):"."},n.basename=function(e,t){var n=f.exec(e)[2]||"";return t&&n.substr(-1*t.length)===t&&(n=n.substr(0,n.length-t.length)),n},n.extname=function(e){return f.exec(e)[3]||""}}),e.define("__browserify_process",function(e,t,n,r,i,s,o){var s=t.exports={};s.nextTick=function(){var e=typeof window!="undefined"&&window.setImmediate,t=typeof window!="undefined"&&window.postMessage&&window.addEventListener;if(e)return window.setImmediate;if(t){var n=[];return window.addEventListener("message",function(e){if(e.source===window&&e.data==="browserify-tick"){e.stopPropagation();if(n.length>0){var t=n.shift();t()}}},!0),function(t){n.push(t),window.postMessage("browserify-tick","*")}}return function(t){setTimeout(t,0)}}(),s.title="browser",s.browser=!0,s.env={},s.argv=[],s.binding=function(t){if(t==="evals")return e("vm");throw new Error("No such module. (Possibly not yet loaded)")},function(){var t="/",n;s.cwd=function(){return t},s.chdir=function(r){n||(n=e("path")),t=n.resolve(r,t)}}()}),e.define("/inflect/index.coffee",function(e,t,n,r,i,s,o){(function(){var t,r,i,s,o;t=e("./inflections").Inflections,r=function(e){return e!=null&&e.call(this,t.instance()),t.instance()},n.Inflections=t,n.inflections=r,i=e("./methods"),n.camelize=i.camelize,n.underscore=i.underscore,n.dasherize=i.dasherize,n.titleize=i.titleize,n.capitalize=i.capitalize,n.decapitalize=i.decapitalize,n.pluralize=i.pluralize,n.singularize=i.singularize,n.humanize=i.humanize,n.ordinalize=i.ordinalize,n.parameterize=i.parameterize,o=e("./string_extensions"),s=e("./number_extensions"),n.enableStringExtensions=o.enableStringExtensions,n.enableNumberExtensions=s.enableNumberExtensions,n.enableExtensions=function(){return o.enableStringExtensions(),s.enableNumberExtensions()},e("./default_inflections")}).call(this)}),e.define("/inflect/inflections.coffee",function(e,t,n,r,i,s,o){(function(){var e,t=[].slice;e=function(){function e(){this.plurals=[],this.singulars=[],this.uncountables=[],this.humans=[]}return e.instance=function(){return this.__instance__||(this.__instance__=new this)},e.prototype.plural=function(e,t){var n;return typeof e=="string"&&(n=this.uncountables.indexOf(e))!==-1&&this.uncountables.splice(n,1),(n=this.uncountables.indexOf(t))!==-1&&this.uncountables.splice(n,1),this.plurals.unshift([e,t])},e.prototype.singular=function(e,t){var n;return typeof e=="string"&&(n=this.uncountables.indexOf(e))!==-1&&this.uncountables.splice(n,1),(n=this.uncountables.indexOf(t))!==-1&&this.uncountables.splice(n,1),this.singulars.unshift([e,t])},e.prototype.irregular=function(e,t){var n;return(n=this.uncountables.indexOf(e))!==-1&&this.uncountables.splice(n,1),(n=this.uncountables.indexOf(t))!==-1&&this.uncountables.splice(n,1),e[0].toUpperCase()===t[0].toUpperCase()?(this.plural(new RegExp("("+e[0]+")"+e.slice(1)+"$","i"),"$1"+t.slice(1)),this.plural(new RegExp("("+t[0]+")"+t.slice(1)+"$","i"),"$1"+t.slice(1)),this.singular(new RegExp("("+t[0]+")"+t.slice(1)+"$","i"),"$1"+e.slice(1))):(this.plural(new RegExp(""+e[0].toUpperCase()+e.slice(1)+"$"),t[0].toUpperCase()+t.slice(1)),this.plural(new RegExp(""+e[0].toLowerCase()+e.slice(1)+"$"),t[0].toLowerCase()+t.slice(1)),this.plural(new RegExp(""+t[0].toUpperCase()+t.slice(1)+"$"),t[0].toUpperCase()+t.slice(1)),this.plural(new RegExp(""+t[0].toLowerCase()+t.slice(1)+"$"),t[0].toLowerCase()+t.slice(1)),this.singular(new RegExp(""+t[0].toUpperCase()+t.slice(1)+"$"),e[0].toUpperCase()+e.slice(1)),this.singular(new RegExp(""+t[0].toLowerCase()+t.slice(1)+"$"),e[0].toLowerCase()+e.slice(1)))},e.prototype.uncountable=function(){var e;return e=1<=arguments.length?t.call(arguments,0):[],this.uncountables=this.uncountables.concat(e)},e.prototype.human=function(e,t){return this.humans.unshift([e,t])},e.prototype.clear=function(e){return e==null&&(e="all"),e==="all"?(this.plurals=[],this.singulars=[],this.uncountables=[],this.humans=[]):this[e]=[]},e}(),n.Inflections=e}).call(this)}),e.define("/inflect/methods.coffee",function(e,t,n,r,i,s,o){(function(){var t,r,i,s,o,u,a,f,l,c,h,p;u=e("../inflect").inflections,t=function(e,t){var n;return t==null&&(t=!0),n=e.replace(/_./g,function(e){return e.slice(1).toUpperCase()}),t?e[0].toUpperCase()+n.slice(1):e[0].toLowerCase()+n.slice(1)},p=function(e){var t;return t=e.toString(),t=t.replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2"),t=t.replace(/([a-z\d])([A-Z])/g,"$1_$2"),t=t.replace(/-/g,"_"),t=t.toLowerCase(),t},i=function(e){return e.replace(/_/g,"-")},h=function(e){return o(p(e)).replace(/\b('?[a-z])/g,function(e){return r(e)})},r=function(e){return(e[0]||"").toUpperCase()+(e.slice(1)||"").toLowerCase()},s=function(e){return(e[0]||"").toLowerCase()+(e.slice(1)||"")},l=function(e){var t,n,r,i,s,o,a;r=e.toString();if(e.length===0||u().uncountables.indexOf(r.toLowerCase())!==-1)return r;a=u().plurals;for(s=0,o=a.length;s<o;s++){t=a[s],i=t[0],n=t[1];if(r.search(i)!==-1){r=r.replace(i,n);break}}return r},c=function(e){var t,n,r,i,s,o,a,f,l,c,h,p;r=e.toString(),o=!1,h=u().uncountables;for(a=0,l=h.length;a<l;a++){t=h[a];if(r.search(new RegExp("\\b"+t+"$","i"))!==-1){o=!0;break}}if(e.length===0||o)return r;p=u().singulars;for(f=0,c=p.length;f<c;f++){s=p[f],i=s[0],n=s[1];if(r.search(i)!==-1){r=r.replace(i,n);break}}return r},o=function(e){var t,n,i,s,o,a,f;i=e.toString(),f=u().humans;for(o=0,a=f.length;o<a;o++){t=f[o],s=t[0],n=t[1];if(i.search(s)!==-1){i=i.replace(s,n);break}}return r(i.replace(/_id$/,"").replace(/_/g," "))},a=function(e){var t;t=parseInt(e,10);if([11,12,13].indexOf(t%100)!==-1)return""+e+"th";switch(t%10){case 1:return""+e+"st";case 2:return""+e+"nd";case 3:return""+e+"rd";default:return""+e+"th"}},f=function(e,t){var n;return t==null&&(t="-"),n=e.toString(),n=n.replace(/[^a-z0-9\-_]+/gi,t),t!=null&&(n=n.replace(new RegExp(""+t+"{2,}","g"),t),n=n.replace(new RegExp("^"+t+"|"+t+"$","gi"),"")),n.toLowerCase()},n.camelize=t,n.underscore=p,n.dasherize=i,n.titleize=h,n.capitalize=r,n.decapitalize=s,n.pluralize=l,n.singularize=c,n.humanize=o,n.ordinalize=a,n.parameterize=f}).call(this)}),e.define("/inflect/string_extensions.coffee",function(e,t,n,r,i,s,o){(function(){var t,r;r=e("../inflect"),t=function(){return String.prototype.pluralize=function(){return r.pluralize(this)},String.prototype.singularize=function(){return r.singularize(this)},String.prototype.camelize=function(e){return e==null&&(e=!0),r.camelize(this,e)},String.prototype.capitalize=function(){return r.capitalize(this)},String.prototype.decapitalize=function(){return r.decapitalize(this)},String.prototype.titleize=function(){return r.titleize(this)},String.prototype.underscore=function(){return r.underscore(this)},String.prototype.dasherize=function(){return r.dasherize(this)},String.prototype.parameterize=function(e){return e==null&&(e="-"),r.parameterize(this,e)},String.prototype.humanize=function(){return r.humanize(this)}},n.enableStringExtensions=t}).call(this)}),e.define("/inflect/number_extensions.coffee",function(e,t,n,r,i,s,o){(function(){var t,r;r=e("../inflect"),t=function(){return Number.prototype.ordinalize=function(){return r.ordinalize(this)}},n.enableNumberExtensions=t}).call(this)}),e.define("/inflect/default_inflections.coffee",function(e,t,n,r,i,s,o){(function(){var t;t=e("../inflect"),t.inflections(function(e){return e.plural(/$/,"s"),e.plural(/s$/i,"s"),e.plural(/(ax|test)is$/i,"$1es"),e.plural(/(octop|vir)us$/i,"$1i"),e.plural(/(octop|vir)i$/i,"$1i"),e.plural(/(alias|status)$/i,"$1es"),e.plural(/(bu)s$/i,"$1ses"),e.plural(/(buffal|tomat)o$/i,"$1oes"),e.plural(/([ti])um$/i,"$1a"),e.plural(/([ti])a$/i,"$1a"),e.plural(/sis$/i,"ses"),e.plural(/(?:([^f])fe|([lr])f)$/i,"$1$2ves"),e.plural(/(hive)$/i,"$1s"),e.plural(/([^aeiouy]|qu)y$/i,"$1ies"),e.plural(/(x|ch|ss|sh)$/i,"$1es"),e.plural(/(matr|vert|ind)(?:ix|ex)$/i,"$1ices"),e.plural(/([m|l])ouse$/i,"$1ice"),e.plural(/([m|l])ice$/i,"$1ice"),e.plural(/^(ox)$/i,"$1en"),e.plural(/^(oxen)$/i,"$1"),e.plural(/(quiz)$/i,"$1zes"),e.singular(/s$/i,""),e.singular(/(n)ews$/i,"$1ews"),e.singular(/([ti])a$/i,"$1um"),e.singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i,"$1$2sis"),e.singular(/(^analy)ses$/i,"$1sis"),e.singular(/([^f])ves$/i,"$1fe"),e.singular(/(hive)s$/i,"$1"),e.singular(/(tive)s$/i,"$1"),e.singular(/([lr])ves$/i,"$1f"),e.singular(/([^aeiouy]|qu)ies$/i,"$1y"),e.singular(/(s)eries$/i,"$1eries"),e.singular(/(m)ovies$/i,"$1ovie"),e.singular(/(x|ch|ss|sh)es$/i,"$1"),e.singular(/([m|l])ice$/i,"$1ouse"),e.singular(/(bus)es$/i,"$1"),e.singular(/(o)es$/i,"$1"),e.singular(/(shoe)s$/i,"$1"),e.singular(/(cris|ax|test)es$/i,"$1is"),e.singular(/(octop|vir)i$/i,"$1us"),e.singular(/(alias|status)es$/i,"$1"),e.singular(/^(ox)en/i,"$1"),e.singular(/(vert|ind)ices$/i,"$1ex"),e.singular(/(matr)ices$/i,"$1ix"),e.singular(/(quiz)zes$/i,"$1"),e.singular(/(database)s$/i,"$1"),e.irregular("person","people"),e.irregular("man","men"),e.irregular("child","children"),e.irregular("move","moves"),e.irregular("she","they"),e.irregular("he","they"),e.irregular("myself","ourselves"),e.irregular("yourself","ourselves"),e.irregular("himself","themselves"),e.irregular("herself","themselves"),e.irregular("themself","themselves"),e.irregular("mine","ours"),e.irregular("hers","theirs"),e.irregular("his","theirs"),e.irregular("its","theirs"),e.irregular("theirs","theirs"),e.irregular("sex","sexes"),e.irregular("cow","kine"),e.irregular("zombie","zombies"),e.uncountable("advice","energy","excretion","digestion","cooperation","health","justice","jeans"),e.uncountable("labour","machinery","equipment","information","pollution","sewage","paper","money"),e.uncountable("species","series","rain","rice","fish","sheep","moose","deer","bison","proceedings"),e.uncountable("shears","pincers","breeches","hijinks","clippers","chassis","innings","elk"),e.uncountable("rhinoceros","swine","you","news")})}).call(this)}),e.define("/index.coffee",function(e,t,n,r,i,s,o){(function(){t.exports=e("./inflect")}).call(this)}),e("/index.coffee"),inflect=e("./inflect")})();
		return inflect;
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
