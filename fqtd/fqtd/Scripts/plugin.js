
; (function ($, window, undefined) {
    var pluginName = 'smSlideChart';
    var privateVar = null;
    var privateMethod = function () {

    };

    function Plugin(element, options) {
        this.element = $(element);
        this.options = $.extend({}, $.fn[pluginName].defaults, options);
        this.init();
    };

    Plugin.prototype = {
        init: function () {
            var that = this;
            var options = this.options;
            var currIndex = 0;
            var flag = true;
            var spanContainerLength = that.element.find('div.inner').length;
            that.containerWidth = that.element.find('div.inner').outerWidth(true);
            if (spanContainerLength <= 1) {
                options.btnNext.css('display', 'none');
            }
            options.btnPrev.css('display', 'none');

            options.btnNext.unbind('click.' + pluginName).bind('click.' + pluginName, function () {
                if (flag) {
                    flag = false
                    currIndex++;
                    that.gotoSlide(currIndex, function () {
                        checkBtn();
                        flag = true;
                        //options.textChange.text('Step ' + (currIndex + 1) + ':');
                    }, currIndex - 1);
                }
            });

            options.btnPrev.unbind('click.' + pluginName).bind('click.' + pluginName, function () {
                if (flag) {
                    flag = false
                    currIndex--;
                    that.gotoSlide(currIndex, function () {
                        checkBtn();
                        flag = true;
                        //options.textChange.text('Step ' + (currIndex + 1) + ':');
                    }, currIndex + 1);
                }
            });
            options.thumbs.unbind('click.' + pluginName).bind('click.' + pluginName, function () {
                if (flag) {
                    flag = false
                    index = options.thumbs.index($(this))
                    that.gotoSlide(index, function () {
                        currIndex = index;
                        flag = true;
                        checkBtn();
                        //options.textChange.text('Step ' + (currIndex + 1) + ':');
                    }, currIndex);
                }
            });
            function checkBtn() {
                if (currIndex <= 0) {
                    options.btnPrev.css('display', 'none');
                    options.btnNext.css('display', 'block');
                } else {
                    if (currIndex == spanContainerLength - 1) {
                        options.btnNext.css('display', 'none');
                        options.btnPrev.css('display', 'block');
                    } else {
                        options.btnNext.css('display', 'block');
                        options.btnPrev.css('display', 'block');
                    }
                }
            }

        },
        gotoSlide: function (index, callback, last) {
            var that = this;
            var options = this.options;
            options.callback(index, last);
            that.element.animate({
                'margin-left': -that.containerWidth * index
            }, options.duration, 'easeOutQuint', function () {
                $.isFunction(callback) && callback();
                //options.callback(index, last);
            });
            options.thumbs.each(function () {
                if (options.thumbs.index($(this)) == index) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        },
        destroy: function () {
            $.removeData(this.element, pluginName);
        }
    };

    $.fn[pluginName] = function (options, params) {
        return this.each(function () {
            var instance = $.data(this, pluginName);
            if (!instance) {
                $.data(this, pluginName, new Plugin(this, options));
            } else if (instance[options]) {
                instance[options](params);
            } else {
                alert(options ? options + ' method is not exists in ' + pluginName : pluginName + ' plugin has been initialized');
            }
        });
    };

    $.fn[pluginName].defaults = {
        btnNext: '',
        btnPrev: '',
        thumbs: '',
        duration: 1000,
        textChange: '',
        callback: function () { }
    };
}(jQuery, window));

; (function ($, window, undefined) {

    var
        // String constants for data names
        dataFlag = "watermark",
        dataClass = "watermarkClass",
        dataFocus = "watermarkFocus",
        dataFormSubmit = "watermarkSubmit",
        dataMaxLen = "watermarkMaxLength",
        dataPassword = "watermarkPassword",
        dataText = "watermarkText",

        // Copy of native jQuery regex use to strip return characters from element value
        rreturn = /\r/g,

        // Used to determine if type attribute of input element is a non-text type (invalid)
        rInvalidType = /^(button|checkbox|hidden|image|radio|range|reset|submit)$/i,

        // Includes only elements with watermark defined
        selWatermarkDefined = "input:data(" + dataFlag + "),textarea:data(" + dataFlag + ")",

        // Includes only elements capable of having watermark
        selWatermarkAble = ":watermarkable",

        // triggerFns:
        // Array of function names to look for in the global namespace.
        // Any such functions found will be hijacked to trigger a call to
        // hideAll() any time they are called.  The default value is the
        // ASP.NET function that validates the controls on the page
        // prior to a postback.
        // 
        // Am I missing other important trigger function(s) to look for?
        // Please leave me feedback:
        // http://code.google.com/p/jquery-watermark/issues/list
        triggerFns = [
            "Page_ClientValidate"
        ],

        // Holds a value of true if a watermark was displayed since the last
        // hideAll() was executed. Avoids repeatedly calling hideAll().
        pageDirty = false,

        // Detects if the browser can handle native placeholders
        hasNativePlaceholder = ("placeholder" in document.createElement("input"));

    // Best practice: this plugin adds only one method to the jQuery object.
    // Also ensures that the watermark code is only added once.
    $.watermark = $.watermark || {

        // Current version number of the plugin
        version: "3.1.4",

        runOnce: true,

        // Default options used when watermarks are instantiated.
        // Can be changed to affect the default behavior for all
        // new or updated watermarks.
        options: {

            // Default class name for all watermarks
            className: "watermark",

            // If true, plugin will detect and use native browser support for
            // watermarks, if available. (e.g., WebKit's placeholder attribute.)
            useNative: true,

            // If true, all watermarks will be hidden during the window's
            // beforeunload event. This is done mainly because WebKit
            // browsers remember the watermark text during navigation
            // and try to restore the watermark text after the user clicks
            // the Back button. We can avoid this by hiding the text before
            // the browser has a chance to save it. The regular unload event
            // was tried, but it seems the browser saves the text before
            // that event kicks off, because it didn't work.
            hideBeforeUnload: true
        },

        // Hide one or more watermarks by specifying any selector type
        // i.e., DOM element, string selector, jQuery matched set, etc.
        hide: function (selector) {
            $(selector).filter(selWatermarkDefined).each(
                function () {
                    $.watermark._hide($(this));
                }
            );
        },

        // Internal use only.
        _hide: function ($input, focus) {
            var elem = $input[0],
                inputVal = (elem.value || "").replace(rreturn, ""),
                inputWm = $input.data(dataText) || "",
                maxLen = $input.data(dataMaxLen) || 0,
                className = $input.data(dataClass);

            if ((inputWm.length) && (inputVal == inputWm)) {
                elem.value = "";

                // Password type?
                if ($input.data(dataPassword)) {

                    if (($input.attr("type") || "") === "text") {
                        var $pwd = $input.data(dataPassword) || [],
                            $wrap = $input.parent() || [];

                        if (($pwd.length) && ($wrap.length)) {
                            $wrap[0].removeChild($input[0]); // Can't use jQuery methods, because they destroy data
                            $wrap[0].appendChild($pwd[0]);
                            $input = $pwd;
                        }
                    }
                }

                if (maxLen) {
                    $input.attr("maxLength", maxLen);
                    $input.removeData(dataMaxLen);
                }

                if (focus) {
                    $input.attr("autocomplete", "off");  // Avoid NS_ERROR_XPC_JS_THREW_STRING error in Firefox

                    window.setTimeout(
                        function () {
                            $input.select();  // Fix missing cursor in IE
                        }
                    , 1);
                }
            }

            className && $input.removeClass(className);
        },

        // Display one or more watermarks by specifying any selector type
        // i.e., DOM element, string selector, jQuery matched set, etc.
        // If conditions are not right for displaying a watermark, ensures that watermark is not shown.
        show: function (selector) {
            $(selector).filter(selWatermarkDefined).each(
                function () {
                    $.watermark._show($(this));
                }
            );
        },

        // Internal use only.
        _show: function ($input) {
            var elem = $input[0],
                val = (elem.value || "").replace(rreturn, ""),
                text = $input.data(dataText) || "",
                type = $input.attr("type") || "",
                className = $input.data(dataClass);

            if (((val.length == 0) || (val == text)) && (!$input.data(dataFocus))) {
                pageDirty = true;

                // Password type?
                if ($input.data(dataPassword)) {

                    if (type === "password") {
                        var $pwd = $input.data(dataPassword) || [],
                            $wrap = $input.parent() || [];

                        if (($pwd.length) && ($wrap.length)) {
                            $wrap[0].removeChild($input[0]); // Can't use jQuery methods, because they destroy data
                            $wrap[0].appendChild($pwd[0]);
                            $input = $pwd;
                            $input.attr("maxLength", text.length);
                            elem = $input[0];
                        }
                    }
                }

                // Ensure maxLength big enough to hold watermark (input of type="text" or type="search" only)
                if ((type === "text") || (type === "search")) {
                    var maxLen = $input.attr("maxLength") || 0;

                    if ((maxLen > 0) && (text.length > maxLen)) {
                        $input.data(dataMaxLen, maxLen);
                        $input.attr("maxLength", text.length);
                    }
                }

                className && $input.addClass(className);
                elem.value = text;
            }
            else {
                $.watermark._hide($input);
            }
        },

        // Hides all watermarks on the current page.
        hideAll: function () {
            if (pageDirty) {
                $.watermark.hide(selWatermarkAble);
                pageDirty = false;
            }
        },

        // Displays all watermarks on the current page.
        showAll: function () {
            $.watermark.show(selWatermarkAble);
        }
    };

    $.fn.watermark = $.fn.watermark || function (text, options) {
        ///	<summary>
        ///		Set watermark text and class name on all input elements of type="text/password/search" and
        /// 	textareas within the matched set. If className is not specified in options, the default is
        /// 	"watermark". Within the matched set, only input elements with type="text/password/search"
        /// 	and textareas are affected; all other elements are ignored.
        ///	</summary>
        ///	<returns type="jQuery">
        ///		Returns the original jQuery matched set (not just the input and texarea elements).
        /// </returns>
        ///	<param name="text" type="String">
        ///		Text to display as a watermark when the input or textarea element has an empty value and does not
        /// 	have focus. The first time watermark() is called on an element, if this argument is empty (or not
        /// 	a String type), then the watermark will have the net effect of only changing the class name when
        /// 	the input or textarea element's value is empty and it does not have focus.
        ///	</param>
        ///	<param name="options" type="Object" optional="true">
        ///		Provides the ability to override the default watermark options ($.watermark.options). For backward
        /// 	compatibility, if a string value is supplied, it is used as the class name that overrides the class
        /// 	name in $.watermark.options.className. Properties include:
        /// 		className: When the watermark is visible, the element will be styled using this class name.
        /// 		useNative (Boolean or Function): Specifies if native browser support for watermarks will supersede
        /// 			plugin functionality. If useNative is a function, the return value from the function will
        /// 			determine if native support is used. The function is passed one argument -- a jQuery object
        /// 			containing the element being tested as the only element in its matched set -- and the DOM
        /// 			element being tested is the object on which the function is invoked (the value of "this").
        ///	</param>
        /// <remarks>
        ///		The effect of changing the text and class name on an input element is called a watermark because
        ///		typically light gray text is used to provide a hint as to what type of input is required. However,
        ///		the appearance of the watermark can be something completely different: simply change the CSS style
        ///		pertaining to the supplied class name.
        ///		
        ///		The first time watermark() is called on an element, the watermark text and class name are initialized,
        ///		and the focus and blur events are hooked in order to control the display of the watermark.  Also, as
        /// 	of version 3.0, drag and drop events are hooked to guard against dropped text being appended to the
        /// 	watermark.  If native watermark support is provided by the browser, it is detected and used, unless
        /// 	the useNative option is set to false.
        ///		
        ///		Subsequently, watermark() can be called again on an element in order to change the watermark text
        ///		and/or class name, and it can also be called without any arguments in order to refresh the display.
        ///		
        ///		For example, after changing the value of the input or textarea element programmatically, watermark()
        /// 	should be called without any arguments to refresh the display, because the change event is only
        /// 	triggered by user actions, not by programmatic changes to an input or textarea element's value.
        /// 	
        /// 	The one exception to programmatic updates is for password input elements:  you are strongly cautioned
        /// 	against changing the value of a password input element programmatically (after the page loads).
        /// 	The reason is that some fairly hairy code is required behind the scenes to make the watermarks bypass
        /// 	IE security and switch back and forth between clear text (for watermarks) and obscured text (for
        /// 	passwords).  It is *possible* to make programmatic changes, but it must be done in a certain way, and
        /// 	overall it is not recommended.
        /// </remarks>

        if (!this.length) {
            return this;
        }

        var hasClass = false,
            hasText = (typeof (text) === "string");

        if (hasText) {
            text = text.replace(rreturn, "");
        }

        if (typeof (options) === "object") {
            hasClass = (typeof (options.className) === "string");
            options = $.extend({}, $.watermark.options, options);
        }
        else if (typeof (options) === "string") {
            hasClass = true;
            options = $.extend({}, $.watermark.options, { className: options });
        }
        else {
            options = $.watermark.options;
        }

        if (typeof (options.useNative) !== "function") {
            options.useNative = options.useNative ? function () { return true; } : function () { return false; };
        }

        return this.each(
            function () {
                var $input = $(this);

                if (!$input.is(selWatermarkAble)) {
                    return;
                }

                // Watermark already initialized?
                if ($input.data(dataFlag)) {

                    // If re-defining text or class, first remove existing watermark, then make changes
                    if (hasText || hasClass) {
                        $.watermark._hide($input);

                        if (hasText) {
                            $input.data(dataText, text);
                        }

                        if (hasClass) {
                            $input.data(dataClass, options.className);
                        }
                    }
                }
                else {

                    // Detect and use native browser support, if enabled in options
                    if (
                        (hasNativePlaceholder)
                        && (options.useNative.call(this, $input))
                        && (($input.attr("tagName") || "") !== "TEXTAREA")
                    ) {
                        // className is not set because current placeholder standard doesn't
                        // have a separate class name property for placeholders (watermarks).
                        if (hasText) {
                            $input.attr("placeholder", text);
                        }

                        // Only set data flag for non-native watermarks
                        // [purposely commented-out] -> $input.data(dataFlag, 1);
                        return;
                    }

                    $input.data(dataText, hasText ? text : "");
                    $input.data(dataClass, options.className);
                    $input.data(dataFlag, 1); // Flag indicates watermark was initialized

                    // Special processing for password type
                    if (($input.attr("type") || "") === "password") {
                        var $wrap = $input.wrap("<span>").parent(),
                            $wm = $($wrap.html().replace(/type=["']?password["']?/i, 'type="text"'));

                        $wm.data(dataText, $input.data(dataText));
                        $wm.data(dataClass, $input.data(dataClass));
                        $wm.data(dataFlag, 1);
                        $wm.attr("maxLength", text.length);

                        $wm.focus(
                            function () {
                                $.watermark._hide($wm, true);
                            }
                        ).bind("dragenter",
                            function () {
                                $.watermark._hide($wm);
                            }
                        ).bind("dragend",
                            function () {
                                window.setTimeout(function () { $wm.blur(); }, 1);
                            }
                        );

                        $input.blur(
                            function () {
                                $.watermark._show($input);
                            }
                        ).bind("dragleave",
                            function () {
                                $.watermark._show($input);
                            }
                        );

                        $wm.data(dataPassword, $input);
                        $input.data(dataPassword, $wm);
                    }
                    else {

                        $input.focus(
                            function () {
                                $input.data(dataFocus, 1);
                                $.watermark._hide($input, true);
                            }
                        ).blur(
                            function () {
                                $input.data(dataFocus, 0);
                                $.watermark._show($input);
                            }
                        ).bind("dragenter",
                            function () {
                                $.watermark._hide($input);
                            }
                        ).bind("dragleave",
                            function () {
                                $.watermark._show($input);
                            }
                        ).bind("dragend",
                            function () {
                                window.setTimeout(function () { $.watermark._show($input); }, 1);
                            }
                        ).bind("drop",
                            // Firefox makes this lovely function necessary because the dropped text
                            // is merged with the watermark before the drop event is called.
                            function (evt) {
                                var elem = $input[0],
                                    dropText = evt.originalEvent.dataTransfer.getData("Text");

                                if ((elem.value || "").replace(rreturn, "").replace(dropText, "") === $input.data(dataText)) {
                                    elem.value = dropText;
                                }

                                $input.focus();
                            }
                        );
                    }

                    // In order to reliably clear all watermarks before form submission,
                    // we need to replace the form's submit function with our own
                    // function.  Otherwise watermarks won't be cleared when the form
                    // is submitted programmatically.
                    if (this.form) {
                        var form = this.form,
                            $form = $(form);

                        if (!$form.data(dataFormSubmit)) {
                            $form.submit($.watermark.hideAll);

                            // form.submit exists for all browsers except Google Chrome
                            // (see "else" below for explanation)
                            if (form.submit) {
                                $form.data(dataFormSubmit, form.submit);

                                form.submit = (function (f, $f) {
                                    return function () {
                                        var nativeSubmit = $f.data(dataFormSubmit);

                                        $.watermark.hideAll();

                                        if (nativeSubmit.apply) {
                                            nativeSubmit.apply(f, Array.prototype.slice.call(arguments));
                                        }
                                        else {
                                            nativeSubmit();
                                        }
                                    };
                                })(form, $form);
                            }
                            else {
                                $form.data(dataFormSubmit, 1);

                                // This strangeness is due to the fact that Google Chrome's
                                // form.submit function is not visible to JavaScript (identifies
                                // as "undefined").  I had to invent a solution here because hours
                                // of Googling (ironically) for an answer did not turn up anything
                                // useful.  Within my own form.submit function I delete the form's
                                // submit function, and then call the non-existent function --
                                // which, in the world of Google Chrome, still exists.
                                form.submit = (function (f) {
                                    return function () {
                                        $.watermark.hideAll();
                                        delete f.submit;
                                        f.submit();
                                    };
                                })(form);
                            }
                        }
                    }
                }

                $.watermark._show($input);
            }
        );
    };

    // The code included within the following if structure is guaranteed to only run once,
    // even if the watermark script file is included multiple times in the page.
    if ($.watermark.runOnce) {
        $.watermark.runOnce = false;

        $.extend($.expr[":"], {

            // Extends jQuery with a custom selector - ":data(...)"
            // :data(<name>)  Includes elements that have a specific name defined in the jQuery data
            // collection. (Only the existence of the name is checked; the value is ignored.)
            // A more sophisticated version of the :data() custom selector originally part of this plugin
            // was removed for compatibility with jQuery UI. The original code can be found in the SVN
            // source listing in the file, "jquery.data.js".
            data: $.expr.createPseudo ?
                $.expr.createPseudo(function (dataName) {
                    return function (elem) {
                        return !!$.data(elem, dataName);
                    };
                }) :
                // support: jQuery <1.8
                function (elem, i, match) {
                    return !!$.data(elem, match[3]);
                },

            // Extends jQuery with a custom selector - ":watermarkable"
            // Includes elements that can be watermarked, including textareas and most input elements
            // that accept text input.  It uses a "negative" test (i.e., testing for input types that DON'T
            // work) because the HTML spec states that you can basically use any type, and if it doesn't
            // recognize the type it will default to type=text.  So if we only looked for certain type attributes
            // we would fail to recognize non-standard types, which are still valid and watermarkable.
            watermarkable: function (elem) {
                var type,
                    name = elem.nodeName;

                if (name === "TEXTAREA") {
                    return true;
                }

                if (name !== "INPUT") {
                    return false;
                }

                type = elem.getAttribute("type");

                return ((!type) || (!rInvalidType.test(type)));
            }
        });

        // Overloads the jQuery .val() function to return the underlying input value on
        // watermarked input elements.  When .val() is being used to set values, this
        // function ensures watermarks are properly set/removed after the values are set.
        // Uses self-executing function to override the default jQuery function.
        (function (valOld) {

            $.fn.val = function () {
                var args = Array.prototype.slice.call(arguments);

                // Best practice: return immediately if empty matched set
                if (!this.length) {
                    return args.length ? this : undefined;
                }

                // If no args, then we're getting the value of the first element;
                // else we're setting values for all elements in matched set
                if (!args.length) {

                    // If element is watermarked, get the underlying value;
                    // else use native jQuery .val()
                    if (this.data(dataFlag)) {
                        var v = (this[0].value || "").replace(rreturn, "");
                        return (v === (this.data(dataText) || "")) ? "" : v;
                    }
                    else {
                        return valOld.apply(this);
                    }
                }
                else {
                    valOld.apply(this, args);
                    $.watermark.show(this);
                    return this;
                }
            };

        })($.fn.val);

        // Hijack any functions found in the triggerFns list
        if (triggerFns.length) {

            // Wait until DOM is ready before searching
            $(function () {
                var i, name, fn;

                for (i = triggerFns.length - 1; i >= 0; i--) {
                    name = triggerFns[i];
                    fn = window[name];

                    if (typeof (fn) === "function") {
                        window[name] = (function (origFn) {
                            return function () {
                                $.watermark.hideAll();
                                return origFn.apply(null, Array.prototype.slice.call(arguments));
                            };
                        })(fn);
                    }
                }
            });
        }

        $(window).bind("beforeunload", function () {
            if ($.watermark.options.hideBeforeUnload) {
                $.watermark.hideAll();
            }
        });
    }

})(jQuery, window);

//Validation form
; (function (defaults, $, window, undefined) {

    var

		type = ['input:not([type]),input[type="color"],input[type="date"],input[type="datetime"],input[type="datetime-local"],input[type="email"],input[type="file"],input[type="hidden"],input[type="month"],input[type="number"],input[type="password"],input[type="range"],input[type="search"],input[type="tel"],input[type="text"],input[type="time"],input[type="url"],input[type="week"],textarea', 'select', 'input[type="checkbox"],input[type="radio"]'],

		// All field types
		allTypes = type.join(','),

		extend = {},

		// Method to validate each fields
		validateField = function (event, options) {

		    var

				// Field status
				status = {
				    pattern: true,
				    conditional: true,
				    required: true
				},

				// Current field
				field = $(this),

				// Current field value
				fieldValue = field.val() || '',

				// An index of extend
				fieldValidate = field.data('validate'),

				// A validation object (jQuery.fn.validateExtend)
				validation = fieldValidate !== undefined ? extend[fieldValidate] : {},

				// One index or more separated for spaces to prepare the field value
				fieldPrepare = field.data('prepare') || validation.prepare,

				// A regular expression to validate field value
				fieldPattern = (field.data('pattern') || ($.type(validation.pattern) == 'regexp' ? validation.pattern : /(?:)/)),

				// Is case sensitive? (Boolean)
				fieldIgnoreCase = field.attr('data-ignore-case') || field.data('ignoreCase') || validation.ignoreCase,

				// A field mask
				fieldMask = field.data('mask') || validation.mask,

				// A index in the conditional object containing a function to validate the field value
				fieldConditional = field.data('conditional') || validation.conditional,

				// Is required?
				fieldRequired = field.data('required'),

				// The description element id
				fieldDescribedby = field.data('describedby') || validation.describedby,

				// An index of description object
				fieldDescription = field.data('description') || validation.description,

                // An index of description object
				fieldDisplayinside = field.data('displayinside') || validation.displayinside,

				// Trim spaces?
				fieldTrim = field.data('trim'),

				reTrue = /^(true|)$/i,

				reFalse = /^false$/i,

				// The description object
				fieldDescription = $.isPlainObject(fieldDescription) ? fieldDescription : (options.description[fieldDescription] || {}),

				name = 'validate';

		    fieldRequired = fieldRequired != '' ? (fieldRequired || !!validation.required) : true;

		    fieldTrim = fieldTrim != '' ? (fieldTrim || !!validation.trim) : true;

		    // Trim spaces?
		    if (reTrue.test(fieldTrim)) {

		        fieldValue = $.trim(fieldValue);
		    }

		    // The fieldPrepare is a function?
		    if ($.isFunction(fieldPrepare)) {

		        // Updates the fieldValue variable
		        fieldValue = String(fieldPrepare.call(field, fieldValue));
		    } else {

		        // Is a function?
		        if ($.isFunction(options.prepare[fieldPrepare])) {

		            // Updates the fieldValue variable
		            fieldValue = String(options.prepare[fieldPrepare].call(field, fieldValue));
		        }
		    }

		    // Is not RegExp?
		    if ($.type(fieldPattern) != 'regexp') {

		        fieldIgnoreCase = !reFalse.test(fieldIgnoreCase);

		        // Converts to RegExp
		        fieldPattern = fieldIgnoreCase ? RegExp(fieldPattern, 'i') : RegExp(fieldPattern);
		    }

		    // The conditional exists?
		    if (fieldConditional != undefined) {

		        // The fieldConditional is a function?
		        if ($.isFunction(fieldConditional)) {

		            status.conditional = !!fieldConditional.call(field, fieldValue, options);
		        } else {

		            var

						// Splits the conditionals in an array
						conditionals = fieldConditional.split(/[\s\t]+/);

		            // Each conditional
		            for (var counter = 0, len = conditionals.length; counter < len; counter++) {

		                if (options.conditional.hasOwnProperty(conditionals[counter]) && !options.conditional[conditionals[counter]].call(field, fieldValue, options)) {

		                    status.conditional = false;
		                }
		            }
		        }
		    }

		    fieldRequired = reTrue.test(fieldRequired);

		    // Is required?
		    if (fieldRequired) {

		        // Verifies the field type
		        if (field.is(type[0] + ',' + type[1])) {

		            // Is empty?
		            if (!fieldValue.length > 0) {

		                status.required = false;
		            }
		        } else if (field.is(type[2])) {

		            if (field.is('[name]')) {

		                // Is checked?
		                if ($('[name="' + field.prop('name') + '"]:checked').length == 0) {

		                    status.required = false;
		                }
		            } else {

		                status.required = field.is(':checked');
		            }
		        }
		    }

		    // Verifies the field type
		    if (field.is(type[0])) {

		        // Test the field value pattern
		        if (fieldPattern.test(fieldValue)) {

		            // If the event type is not equals to keyup
		            if (event.type != 'keyup' && fieldMask !== undefined) {

		                var matches = fieldValue.match(fieldPattern);

		                // Each characters group
		                for (var i = 0, len = matches.length; i < len; i++) {

		                    // Replace the groups
		                    fieldMask = fieldMask.replace(RegExp('\\$\\{' + i + '(?::`([^`]*)`)?\\}', 'g'), (matches[i] !== undefined ? matches[i] : '$1'));
		                }

		                fieldMask = fieldMask.replace(/\$\{\d+(?::`([^`]*)`)?\}/g, '$1');

		                // Test the field value pattern
		                if (fieldPattern.test(fieldMask)) {

		                    // Update the field value
		                    field.val(fieldMask);
		                }
		            }
		        } else {

		            // If the field is required
		            if (fieldRequired) {

		                status.pattern = false;
		            } else {

		                if (fieldValue.length > 0) {

		                    status.pattern = false;
		                }
		            }
		        }
		    }

		    var

				describedby = $('[id="' + fieldDescribedby + '"]'),

				log = fieldDescription.valid;

		    if (describedby.length > 0 && event.type != 'keyup') {

		        if (!status.required) {

		            log = fieldDescription.required;
		        } else if (!status.pattern) {

		            log = fieldDescription.pattern;
		        } else if (!status.conditional) {

		            log = fieldDescription.conditional;
		        }

		        describedby.html(log || '');
		    }

		    // Check if display message in the textbox
		    if (fieldDisplayinside) {
		        if (!status.required) {
		            field.val(fieldDescription.required);
		        }
		    }


		    if (typeof (validation.each) == 'function') {

		        validation.each.call(field, event, status, options);
		    }

		    // Call the eachField callback
		    options.eachField.call(field, event, status, options);

		    // If the field is valid
		    if (status.required && status.pattern && status.conditional) {

		        // If WAI-ARIA is enabled
		        if (!!options.waiAria) {

		            field.prop('aria-invalid', false);
		        }

		        if (typeof (validation.valid) == 'function') {

		            validation.valid.call(field, event, status, options);
		        }

		        // Call the eachValidField callback
		        options.eachValidField.call(field, event, status, options);
		    } else {

		        // If WAI-ARIA is enabled
		        if (!!options.waiAria) {

		            field.prop('aria-invalid', true);
		        }

		        if (typeof (validation.invalid) == 'function') {

		            validation.invalid.call(field, event, status, options);
		        }

		        // Call the eachInvalidField callback
		        options.eachInvalidField.call(field, event, status, options);
		    }

		    // Returns the field status
		    return status;
		};

    $.extend({

        // Method to extends validations
        validateExtend: function (options) {

            return $.extend(extend, options);
        },

        // Method to change the default properties of jQuery.fn.validate method
        validateSetup: function (options) {

            return $.extend(defaults, options);
        }
    }).fn.extend({

        // Method to validate forms
        validate: function (options) {

            options = $.extend({}, defaults, options);

            return $(this).validateDestroy().each(function () {

                var form = $(this);

                // This is a form?
                if (form.is('form')) {

                    form.data(name, {
                        options: options
                    });

                    var

						fields = form.find(allTypes),

						// Events namespace
						namespace = options.namespace;

                    if (form.is('[id]')) {

                        fields = fields.add('[form="' + form.prop('id') + '"]').filter(allTypes);
                    }

                    fields = fields.filter(options.filter);

                    // If onKeyup is enabled
                    if (!!options.onKeyup) {

                        fields.filter(type[0]).on('keyup.' + namespace, function (event) {

                            validateField.call(this, event, options);
                        });
                    }

                    // If onBlur is enabled
                    if (!!options.onBlur) {

                        fields.on('blur.' + namespace, function (event) {

                            validateField.call(this, event, options);
                        });
                    }

                    // If onChange is enabled
                    if (!!options.onChange) {

                        fields.on('change.' + namespace, function (event) {

                            validateField.call(this, event, options);
                        });
                    }

                    // If onSubmit is enabled
                    if (!!options.onSubmit) {

                        form.on('submit.' + namespace, function (event) {

                            var formValid = true;

                            fields.each(function () {

                                var status = validateField.call(this, event, options);

                                if (!status.pattern || !status.conditional || !status.required) {

                                    formValid = false;

                                }
                            });
                            // If form is valid
                            if (formValid) {

                                // Send form post?
                                if (!options.sendFormPost) {

                                    event.preventDefault();
                                                                        
                                }

                                // Is a function?
                                if ($.isFunction(options.valid)) {

                                    options.valid.call(form, event, options);
                                }

                            } else {

                                event.preventDefault();

                                // Is a function?
                                if ($.isFunction(options.invalid)) {

                                    options.invalid.call(form, event, options);
                                }
                            }
                            
                        });
                    }
                }
            });
        },

        // Method to destroy validations
        validateDestroy: function () {

            var

				form = $(this),

				dataValidate = form.data(name);

            // If this is a form
            if (form.is('form') && $.isPlainObject(dataValidate) && typeof (dataValidate.options.nameSpace) == 'string') {

                var fields = form.removeData(name).find(allTypes).add(form);

                if (form.is('[id]')) {

                    fields = fields.add($('[form="' + form.prop('id') + '"]').filter(allTypes));
                }

                fields.off('.' + dataValidate.options.nameSpace);
            }

            return form;
        }
    });
})({

    // Send form if is valid?
    sendFormPost: true,

    // Use WAI-ARIA properties
    waiAria: true,

    // Validate on submit?
    onSubmit: true,

    // Validate on onKeyup?
    onKeyup: false,

    // Validate on onBlur?
    onBlur: false,

    // Validate on onChange?
    onChange: false,

    // Default namespace
    nameSpace: 'validate',

    // Conditional functions
    conditional: {},

    // Prepare functions
    prepare: {},

    // Fields descriptions
    description: {},

    // Callback
    eachField: $.noop,

    // Callback
    eachInvalidField: $.noop,

    // Callback
    eachValidField: $.noop,

    // Callback
    invalid: $.noop,

    // Callback
    valid: $.noop,

    // A fielter to the fields
    filter: '*'
}, jQuery, window);

//auto complete GEO textbox
; (function ($, window, document, undefined) {

    // ## Options
    // The default options for this plugin.
    //
    // * `map` - Might be a selector, an jQuery object or a DOM element. Default is `false` which shows no map.
    // * `details` - The container that should be populated with data. Defaults to `false` which ignores the setting.
    // * `location` - Location to initialize the map on. Might be an address `string` or an `array` with [latitude, longitude] or a `google.maps.LatLng`object. Default is `false` which shows a blank map.
    // * `bounds` - Whether to snap geocode search to map bounds. Default: `true` if false search globally. Alternatively pass a custom `LatLngBounds object.
    // * `detailsAttribute` - The attribute's name to use as an indicator. Default: `"name"`
    // * `mapOptions` - Options to pass to the `google.maps.Map` constructor. See the full list [here](http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions).
    // * `mapOptions.zoom` - The inital zoom level. Default: `14`
    // * `mapOptions.scrollwheel` - Whether to enable the scrollwheel to zoom the map. Default: `false`
    // * `mapOptions.mapTypeId` - The map type. Default: `"roadmap"`
    // * `markerOptions` - The options to pass to the `google.maps.Marker` constructor. See the full list [here](http://code.google.com/apis/maps/documentation/javascript/reference.html#MarkerOptions).
    // * `markerOptions.draggable` - If the marker is draggable. Default: `false`. Set to true to enable dragging.
    // * `markerOptions.disabled` - Do not show marker. Default: `false`. Set to true to disable marker.
    // * `maxZoom` - The maximum zoom level too zoom in after a geocoding response. Default: `16`
    // * `types` - An array containing one or more of the supported types for the places request. Default: `['geocode']` See the full list [here](http://code.google.com/apis/maps/documentation/javascript/places.html#place_search_requests).

    var defaults = {
        bounds: true,
        country: null,
        map: false,
        details: false,
        detailsAttribute: "name",
        location: false,

        mapOptions: {
            zoom: 14,
            scrollwheel: false,
            mapTypeId: "roadmap"
        },

        markerOptions: {
            draggable: false
        },

        maxZoom: 16,
        types: ['geocode']
    };

    // See: [Geocoding Types](https://developers.google.com/maps/documentation/geocoding/#Types)
    // on Google Developers.
    var componentTypes = ("street_address route intersection political " +
      "country administrative_area_level_1 administrative_area_level_2 " +
      "administrative_area_level_3 colloquial_area locality sublocality " +
      "neighborhood premise subpremise postal_code natural_feature airport " +
      "park point_of_interest post_box street_number floor room " +
      "lat lng viewport location " +
      "formatted_address location_type bounds").split(" ");

    // See: [Places Details Responses](https://developers.google.com/maps/documentation/javascript/places#place_details_responses)
    // on Google Developers.
    var placesDetails = ("id url website vicinity reference name rating " +
      "international_phone_number icon formatted_phone_number").split(" ");

    // The actual plugin constructor.
    function GeoComplete(input, options) {

        this.options = $.extend(true, {}, defaults, options);

        this.input = input;
        this.$input = $(input);

        this._defaults = defaults;
        this._name = 'geocomplete';

        this.init();
    }

    // Initialize all parts of the plugin.
    $.extend(GeoComplete.prototype, {
        init: function () {
            this.initMap();
            this.initMarker();
            this.initGeocoder();
            this.initDetails();
            this.initLocation();
        },

        // Initialize the map but only if the option `map` was set.
        // This will create a `map` within the given container
        // using the provided `mapOptions` or link to the existing map instance.
        initMap: function () {
            if (!this.options.map) { return; }

            if (typeof this.options.map.setCenter == "function") {
                this.map = this.options.map;
                return;
            }

            this.map = new google.maps.Map(
              $(this.options.map)[0],
              this.options.mapOptions
            );

            // add click event listener on the map
            google.maps.event.addListener(
              this.map,
              'click',
              $.proxy(this.mapClicked, this)
            );
        },

        // Add a marker with the provided `markerOptions` but only
        // if the option was set. Additionally it listens for the `dragend` event
        // to notify the plugin about changes.
        initMarker: function () {
            if (!this.map) { return; }
            var options = $.extend(this.options.markerOptions, { map: this.map });

            if (options.disabled) { return; }

            this.marker = new google.maps.Marker(options);

            google.maps.event.addListener(
              this.marker,
              'dragend',
              $.proxy(this.markerDragged, this)
            );
        },

        // Associate the input with the autocompleter and create a geocoder
        // to fall back when the autocompleter does not return a value.
        initGeocoder: function () {

            var options = {
                types: this.options.types,
                bounds: this.options.bounds === true ? null : this.options.bounds,
                componentRestrictions: this.options.componentRestrictions
            };

            if (this.options.country) {
                options.componentRestrictions = { country: this.options.country }
            }

            this.autocomplete = new google.maps.places.Autocomplete(
              this.input, options
            );

            this.geocoder = new google.maps.Geocoder();

            // Bind autocomplete to map bounds but only if there is a map
            // and `options.bindToMap` is set to true.
            if (this.map && this.options.bounds === true) {
                this.autocomplete.bindTo('bounds', this.map);
            }

            // Watch `place_changed` events on the autocomplete input field.
            google.maps.event.addListener(
              this.autocomplete,
              'place_changed',
              $.proxy(this.placeChanged, this)
            );

            // Prevent parent form from being submitted if user hit enter.
            this.$input.keypress(function (event) {
                if (event.keyCode === 13) { return false; }
            });

            // Listen for "geocode" events and trigger find action.
            this.$input.bind("geocode", $.proxy(function () {
                this.find();
            }, this));
        },

        // Prepare a given DOM structure to be populated when we got some data.
        // This will cycle through the list of component types and map the
        // corresponding elements.
        initDetails: function () {
            if (!this.options.details) { return; }

            var $details = $(this.options.details),
              attribute = this.options.detailsAttribute,
              details = {};

            function setDetail(value) {
                details[value] = $details.find("[" + attribute + "=" + value + "]");
            }

            $.each(componentTypes, function (index, key) {
                setDetail(key);
                setDetail(key + "_short");
            });

            $.each(placesDetails, function (index, key) {
                setDetail(key);
            });

            this.$details = $details;
            this.details = details;
        },

        // Set the initial location of the plugin if the `location` options was set.
        // This method will care about converting the value into the right format.
        initLocation: function () {

            var location = this.options.location, latLng;

            if (!location) { return; }

            if (typeof location == 'string') {
                this.find(location);
                return;
            }

            if (location instanceof Array) {
                latLng = new google.maps.LatLng(location[0], location[1]);
            }

            if (location instanceof google.maps.LatLng) {
                latLng = location;
            }

            if (latLng) {
                if (this.map) { this.map.setCenter(latLng); }
                if (this.marker) { this.marker.setPosition(latLng); }
            }
        },

        // Look up a given address. If no `address` was specified it uses
        // the current value of the input.
        find: function (address) {
            this.geocode({
                address: address || this.$input.val()
            });
        },

        // Requests details about a given location.
        // Additionally it will bias the requests to the provided bounds.
        geocode: function (request) {
            if (this.options.bounds && !request.bounds) {
                if (this.options.bounds === true) {
                    request.bounds = this.map && this.map.getBounds();
                } else {
                    request.bounds = this.options.bounds;
                }
            }

            if (this.options.country) {
                request.region = this.options.country;
            }

            this.geocoder.geocode(request, $.proxy(this.handleGeocode, this));
        },

        // Handles the geocode response. If more than one results was found
        // it triggers the "geocode:multiple" events. If there was an error
        // the "geocode:error" event is fired.
        handleGeocode: function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var result = results[0];
                this.$input.val(result.formatted_address);
                this.update(result);

                if (results.length > 1) {
                    this.trigger("geocode:multiple", results);
                }

            } else {
                this.trigger("geocode:error", status);
            }
        },

        // Triggers a given `event` with optional `arguments` on the input.
        trigger: function (event, argument) {
            this.$input.trigger(event, [argument]);
        },

        // Set the map to a new center by passing a `geometry`.
        // If the geometry has a viewport, the map zooms out to fit the bounds.
        // Additionally it updates the marker position.
        center: function (geometry) {

            if (geometry.viewport) {
                this.map.fitBounds(geometry.viewport);
                if (this.map.getZoom() > this.options.maxZoom) {
                    this.map.setZoom(this.options.maxZoom);
                }
            } else {
                this.map.setZoom(this.options.maxZoom);
                this.map.setCenter(geometry.location);
            }

            if (this.marker) {
                this.marker.setPosition(geometry.location);
                this.marker.setAnimation(this.options.markerOptions.animation);
            }
        },

        // Update the elements based on a single places or geoocoding response
        // and trigger the "geocode:result" event on the input.
        update: function (result) {

            if (this.map) {
                this.center(result.geometry);
            }

            if (this.$details) {
                this.fillDetails(result);
            }

            this.trigger("geocode:result", result);
        },

        // Populate the provided elements with new `result` data.
        // This will lookup all elements that has an attribute with the given
        // component type.
        fillDetails: function (result) {

            var data = {},
              geometry = result.geometry,
              viewport = geometry.viewport,
              bounds = geometry.bounds;

            // Create a simplified version of the address components.
            $.each(result.address_components, function (index, object) {
                var name = object.types[0];
                data[name] = object.long_name;
                data[name + "_short"] = object.short_name;
            });

            // Add properties of the places details.
            $.each(placesDetails, function (index, key) {
                data[key] = result[key];
            });

            // Add infos about the address and geometry.
            $.extend(data, {
                formatted_address: result.formatted_address,
                location_type: geometry.location_type || "PLACES",
                viewport: viewport,
                bounds: bounds,
                location: geometry.location,
                lat: geometry.location.lat(),
                lng: geometry.location.lng()
            });

            // Set the values for all details.
            $.each(this.details, $.proxy(function (key, $detail) {
                var value = data[key];
                this.setDetail($detail, value);
            }, this));

            this.data = data;
        },

        // Assign a given `value` to a single `$element`.
        // If the element is an input, the value is set, otherwise it updates
        // the text content.
        setDetail: function ($element, value) {

            if (value === undefined) {
                value = "";
            } else if (typeof value.toUrlValue == "function") {
                value = value.toUrlValue();
            }

            if ($element.is(":input")) {
                $element.val(value);
            } else {
                $element.text(value);
            }
        },

        // Fire the "geocode:dragged" event and pass the new position.
        markerDragged: function (event) {
            this.trigger("geocode:dragged", event.latLng);
        },

        mapClicked: function (event) {
            this.trigger("geocode:click", event.latLng);
        },

        // Restore the old position of the marker to the last now location.
        resetMarker: function () {
            this.marker.setPosition(this.data.location);
            this.setDetail(this.details.lat, this.data.location.lat());
            this.setDetail(this.details.lng, this.data.location.lng());
        },

        // Update the plugin after the user has selected an autocomplete entry.
        // If the place has no geometry it passes it to the geocoder.
        placeChanged: function () {
            var place = this.autocomplete.getPlace();

            if (!place.geometry) {
                this.find(place.name);
            } else {
                this.update(place);
            }
        }
    });

    // A plugin wrapper around the constructor.
    // Pass `options` with all settings that are different from the default.
    // The attribute is used to prevent multiple instantiations of the plugin.
    $.fn.geocomplete = function (options) {

        var attribute = 'plugin_geocomplete';

        // If you call `.geocomplete()` with a string as the first parameter
        // it returns the corresponding property or calls the method with the
        // following arguments.
        if (typeof options == "string") {

            var instance = $(this).data(attribute) || $(this).geocomplete().data(attribute),
              prop = instance[options];

            if (typeof prop == "function") {
                prop.apply(instance, Array.prototype.slice.call(arguments, 1));
                return $(this);
            } else {
                if (arguments.length == 2) {
                    prop = arguments[1];
                }
                return prop;
            }
        } else {
            return this.each(function () {
                // Prevent against multiple instantiations.
                var instance = $.data(this, attribute);
                if (!instance) {
                    instance = new GeoComplete(this, options)
                    $.data(this, attribute, instance);
                }
            });
        }
    };

})(jQuery, window, document);

//iCheckbox
; (function ($, _iCheck, _checkbox, _radio, _checked, _disabled, _type, _click, _touch, _add, _remove, _cursor) {

    // Create a plugin
    $.fn[_iCheck] = function (options, fire) {

        // Cached vars
        var user = navigator.userAgent,
          ios = /ipad|iphone|ipod/i.test(user),
          handle = ':' + _checkbox + ', :' + _radio,
          stack = $(),
          walker = function (object) {
              object.each(function () {
                  var self = $(this);

                  if (self.is(handle)) {
                      stack = stack.add(self);
                  } else {
                      stack = stack.add(self.find(handle));
                  };
              });
          };

        // Check if we should operate with some method
        if (/^(check|uncheck|toggle|disable|enable|update|destroy)$/.test(options)) {

            // Find checkboxes and radio buttons
            walker(this);

            return stack.each(function () {
                var self = $(this);

                if (options == 'destroy') {
                    tidy(self, 'ifDestroyed');
                } else {
                    operate(self, true, options);
                };

                // Fire method's callback
                if ($.isFunction(fire)) {
                    fire();
                };
            });

            // Customization
        } else if (typeof options == 'object' || !options) {

            //  Check if any options were passed
            var settings = $.extend({
                checkedClass: _checked,
                disabledClass: _disabled,
                labelHover: true
            }, options),

              selector = settings.handle,
              hoverClass = settings.hoverClass || 'hover',
              focusClass = settings.focusClass || 'focus',
              activeClass = settings.activeClass || 'active',
              labelHover = !!settings.labelHover,
              labelHoverClass = settings.labelHoverClass || 'hover',

              // Setup clickable area
              area = ('' + settings.increaseArea).replace('%', '') | 0;

            // Selector limit
            if (selector == _checkbox || selector == _radio) {
                handle = ':' + selector;
            };

            // Clickable area limit
            if (area < -50) {
                area = -50;
            };

            // Walk around the selector
            walker(this);

            return stack.each(function () {
                var self = $(this);

                // If already customized
                tidy(self);

                var node = this,
                  id = node.id,

                  // Layer styles
                  offset = -area + '%',
                  size = 100 + (area * 2) + '%',
                  layer = {
                      position: 'absolute',
                      top: offset,
                      left: offset,
                      display: 'block',
                      width: size,
                      height: size,
                      margin: 0,
                      padding: 0,
                      background: '#fff',
                      border: 0,
                      opacity: 0
                  },

                  // Choose how to hide input
                  hide = ios || /android|blackberry|windows phone|opera mini/i.test(user) ? {
                      position: 'absolute',
                      visibility: 'hidden'
                  } : area ? layer : {
                      position: 'absolute',
                      opacity: 0
                  },

                  // Get proper class
                  className = node[_type] == _checkbox ? settings.checkboxClass || 'i' + _checkbox : settings.radioClass || 'i' + _radio,

                  // Find assigned labels
                  label = $('label[for="' + id + '"]').add(self.closest('label')),

                  // Wrap input
                  parent = self.wrap('<div class="' + className + '"/>').trigger('ifCreated').parent().append(settings.insert),

                  // Layer addition
                  helper = $('<ins class="' + _iCheck + '-helper"/>').css(layer).appendTo(parent);

                // Finalize customization
                self.data(_iCheck, { o: settings, s: self.attr('style') }).css(hide);
                !!settings.inheritClass && parent[_add](node.className);
                !!settings.inheritID && id && parent.attr('id', _iCheck + '-' + id);
                parent.css('position') == 'static' && parent.css('position', 'relative');
                operate(self, true, 'update');

                // Label events
                if (label.length) {
                    label.on(_click + '.i mouseenter.i mouseleave.i ' + _touch, function (event) {
                        var type = event[_type],
                          item = $(this);

                        // Do nothing if input is disabled
                        if (!node[_disabled]) {

                            // Click
                            if (type == _click) {
                                operate(self, false, true);

                                // Hover state
                            } else if (labelHover) {
                                if (/ve|nd/.test(type)) {
                                    // mouseleave|touchend
                                    parent[_remove](hoverClass);
                                    item[_remove](labelHoverClass);
                                } else {
                                    parent[_add](hoverClass);
                                    item[_add](labelHoverClass);
                                };
                            };

                            if (ios) {
                                event.stopPropagation();
                            } else {
                                return false;
                            };
                        };
                    });
                };

                // Input events
                self.on(_click + '.i focus.i blur.i keyup.i keydown.i keypress.i', function (event) {
                    var type = event[_type],
                      key = event.keyCode;

                    // Click
                    if (type == _click) {
                        return false;

                        // Keydown
                    } else if (type == 'keydown' && key == 32) {
                        if (!(node[_type] == _radio && node[_checked])) {
                            if (node[_checked]) {
                                off(self, _checked);
                            } else {
                                on(self, _checked);
                            };
                        };

                        return false;

                        // Keyup
                    } else if (type == 'keyup' && node[_type] == _radio) {
                        !node[_checked] && on(self, _checked);

                        // Focus/blur
                    } else if (/us|ur/.test(type)) {
                        parent[type == 'blur' ? _remove : _add](focusClass);
                    };
                });

                // Helper events
                helper.on(_click + ' mousedown mouseup mouseover mouseout ' + _touch, function (event) {
                    var type = event[_type],

                      // mousedown|mouseup
                      toggle = /wn|up/.test(type) ? activeClass : hoverClass;

                    // Do nothing if input is disabled
                    if (!node[_disabled]) {

                        // Click
                        if (type == _click) {
                            operate(self, false, true);

                            // Active and hover states
                        } else {

                            // State is on
                            if (/wn|er|in/.test(type)) {
                                // mousedown|mouseover|touchbegin
                                parent[_add](toggle);

                                // State is off
                            } else {
                                parent[_remove](toggle + ' ' + activeClass);
                            };

                            // Label hover
                            if (label.length && labelHover && toggle == hoverClass) {

                                // mouseout|touchend
                                label[/ut|nd/.test(type) ? _remove : _add](labelHoverClass);
                            };
                        };

                        if (ios) {
                            event.stopPropagation();
                        } else {
                            return false;
                        };
                    };
                });
            });
        } else {
            return this;
        };
    };

    // Do something with inputs
    function operate(input, direct, method) {
        var node = input[0];

        // disable|enable
        state = /ble/.test(method) ? _disabled : _checked,
        active = method == 'update' ? { checked: node[_checked], disabled: node[_disabled] } : node[state];

        // Check and disable
        if (/^ch|di/.test(method) && !active) {
            on(input, state);

            // Uncheck and enable
        } else if (/^un|en/.test(method) && active) {
            off(input, state);

            // Update
        } else if (method == 'update') {

            // Both checked and disabled states
            for (var state in active) {
                if (active[state]) {
                    on(input, state, true);
                } else {
                    off(input, state, true);
                };
            };

        } else if (!direct || method == 'toggle') {

            // Helper or label was clicked
            if (!direct) {
                input.trigger('ifClicked');
            };

            // Toggle checked state
            if (active) {
                if (node[_type] !== _radio) {
                    off(input, state);
                };
            } else {
                on(input, state);
            };
        };
    };

    // Set checked or disabled state
    function on(input, state, keep) {
        var node = input[0],
          parent = input.parent(),
          remove = state == _disabled ? 'enabled' : 'un' + _checked,
          regular = option(input, remove + capitalize(node[_type])),
          specific = option(input, state + capitalize(node[_type]));

        // Prevent unnecessary actions
        if (node[state] !== true && !keep) {

            // Toggle state
            node[state] = true;

            // Trigger callbacks
            input.trigger('ifChanged').trigger('if' + capitalize(state));

            // Toggle assigned radio buttons
            if (state == _checked && node[_type] == _radio && node.name) {
                var form = input.closest('form'),
                  stack = 'input[name="' + node.name + '"]';

                stack = form.length ? form.find(stack) : $(stack);

                stack.each(function () {
                    if (this !== node && $(this).data(_iCheck)) {
                        off($(this), state);
                    };
                });
            };
        };

        // Add proper cursor
        if (node[_disabled] && !!option(input, _cursor, true)) {
            parent.find('.' + _iCheck + '-helper').css(_cursor, 'default');
        };

        // Add state class
        parent[_add](specific || option(input, state));

        // Remove regular state class
        parent[_remove](regular || option(input, remove) || '');
    };

    // Remove checked or disabled state
    function off(input, state, keep) {
        var node = input[0],
          parent = input.parent(),
          callback = state == _disabled ? 'enabled' : 'un' + _checked,
          regular = option(input, callback + capitalize(node[_type])),
          specific = option(input, state + capitalize(node[_type]));

        // Prevent unnecessary actions
        if (node[state] !== false && !keep) {

            // Toggle state
            node[state] = false;

            // Trigger callbacks
            input.trigger('ifChanged').trigger('if' + capitalize(callback));
        };

        // Add proper cursor
        if (!node[_disabled] && !!option(input, _cursor, true)) {
            parent.find('.' + _iCheck + '-helper').css(_cursor, 'pointer');
        };

        // Remove state class
        parent[_remove](specific || option(input, state) || '');

        // Add regular state class
        parent[_add](regular || option(input, callback));
    };

    // Remove all traces of iCheck
    function tidy(input, callback) {
        if (input.data(_iCheck)) {

            // Remove everything except input
            input.parent().html(input.attr('style', input.data(_iCheck).s || '').trigger(callback || ''));

            // Unbind events
            input.off('.i').unwrap();
            $('label[for="' + input[0].id + '"]').add(input.closest('label')).off('.i');
        };
    };

    // Get some option
    function option(input, state, regular) {
        if (input.data(_iCheck)) {
            return input.data(_iCheck).o[state + (regular ? '' : 'Class')];
        };
    };

    // Capitalize some string
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
})(jQuery, 'iCheck', 'checkbox', 'radio', 'checked', 'disabled', 'type', 'click', 'touchbegin.i touchend.i', 'addClass', 'removeClass', 'cursor');

//lightbox
; (function () {
    var $, Lightbox, LightboxOptions;

    $ = jQuery;

    LightboxOptions = (function () {
        function LightboxOptions() {
            this.fadeDuration = 500;
            this.fitImagesInViewport = true;
            this.resizeDuration = 700;
            this.showImageNumberLabel = true;
            this.wrapAround = false;
        }

        LightboxOptions.prototype.albumLabel = function (curImageNum, albumSize) {
            return "Image " + curImageNum + " of " + albumSize;
        };

        return LightboxOptions;

    })();

    Lightbox = (function () {
        function Lightbox(options) {
            this.options = options;
            this.album = [];
            this.currentImageIndex = void 0;
            this.init();
        }

        Lightbox.prototype.init = function () {
            this.enable();
            return this.build();
        };

        Lightbox.prototype.enable = function () {
            var _this = this;
            return $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]', function (e) {
                _this.start($(e.currentTarget));
                return false;
            });
        };

        Lightbox.prototype.build = function () {
            var _this = this;
            $("<div id='lightboxOverlay' class='lightboxOverlay'></div><div id='lightbox' class='lightbox'><div class='lb-outerContainer'><div class='lb-container'><img class='lb-image' src='' /><div class='lb-nav'><a class='lb-prev' href='' ></a><a class='lb-next' href='' ></a></div><div class='lb-loader'><a class='lb-cancel'></a></div></div></div><div class='lb-dataContainer'><div class='lb-data'><div class='lb-details'><span class='lb-caption'></span><span class='lb-number'></span></div><div class='lb-closeContainer'><a class='lb-close'></a></div></div></div></div>").appendTo($('body'));
            this.$lightbox = $('#lightbox');
            this.$overlay = $('#lightboxOverlay');
            this.$outerContainer = this.$lightbox.find('.lb-outerContainer');
            this.$container = this.$lightbox.find('.lb-container');
            this.containerTopPadding = parseInt(this.$container.css('padding-top'), 10);
            this.containerRightPadding = parseInt(this.$container.css('padding-right'), 10);
            this.containerBottomPadding = parseInt(this.$container.css('padding-bottom'), 10);
            this.containerLeftPadding = parseInt(this.$container.css('padding-left'), 10);
            this.$overlay.hide().on('click', function () {
                _this.end();
                return false;
            });
            this.$lightbox.hide().on('click', function (e) {
                if ($(e.target).attr('id') === 'lightbox') {
                    _this.end();
                }
                return false;
            });
            this.$outerContainer.on('click', function (e) {
                if ($(e.target).attr('id') === 'lightbox') {
                    _this.end();
                }
                return false;
            });
            this.$lightbox.find('.lb-prev').on('click', function () {
                if (_this.currentImageIndex === 0) {
                    _this.changeImage(_this.album.length - 1);
                } else {
                    _this.changeImage(_this.currentImageIndex - 1);
                }
                return false;
            });
            this.$lightbox.find('.lb-next').on('click', function () {
                if (_this.currentImageIndex === _this.album.length - 1) {
                    _this.changeImage(0);
                } else {
                    _this.changeImage(_this.currentImageIndex + 1);
                }
                return false;
            });
            return this.$lightbox.find('.lb-loader, .lb-close').on('click', function () {
                _this.end();
                return false;
            });
        };

        Lightbox.prototype.start = function ($link) {
            var $window, a, dataLightboxValue, i, imageNumber, left, top, _i, _j, _len, _len1, _ref, _ref1;
            $(window).on("resize", this.sizeOverlay);
            $('select, object, embed').css({
                visibility: "hidden"
            });
            this.$overlay.width($(document).width()).height($(document).height()).fadeIn(this.options.fadeDuration);
            this.album = [];
            imageNumber = 0;
            dataLightboxValue = $link.attr('data-lightbox');
            if (dataLightboxValue) {
                _ref = $($link.prop("tagName") + '[data-lightbox="' + dataLightboxValue + '"]');
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                    a = _ref[i];
                    this.album.push({
                        link: $(a).attr('href'),
                        title: $(a).attr('title')
                    });
                    if ($(a).attr('href') === $link.attr('href')) {
                        imageNumber = i;
                    }
                }
            } else {
                if ($link.attr('rel') === 'lightbox') {
                    this.album.push({
                        link: $link.attr('href'),
                        title: $link.attr('title')
                    });
                } else {
                    _ref1 = $($link.prop("tagName") + '[rel="' + $link.attr('rel') + '"]');
                    for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
                        a = _ref1[i];
                        this.album.push({
                            link: $(a).attr('href'),
                            title: $(a).attr('title')
                        });
                        if ($(a).attr('href') === $link.attr('href')) {
                            imageNumber = i;
                        }
                    }
                }
            }
            $window = $(window);
            top = $window.scrollTop() + $window.height() / 10;
            left = $window.scrollLeft();
            this.$lightbox.css({
                top: top + 'px',
                left: left + 'px'
            }).fadeIn(this.options.fadeDuration);
            this.changeImage(imageNumber);
        };

        Lightbox.prototype.changeImage = function (imageNumber) {
            var $image, preloader,
              _this = this;
            this.disableKeyboardNav();
            $image = this.$lightbox.find('.lb-image');
            this.sizeOverlay();
            this.$overlay.fadeIn(this.options.fadeDuration);
            $('.lb-loader').fadeIn('slow');
            this.$lightbox.find('.lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption').hide();
            this.$outerContainer.addClass('animating');
            preloader = new Image();
            preloader.onload = function () {
                var $preloader, imageHeight, imageWidth, maxImageHeight, maxImageWidth, windowHeight, windowWidth;
                $image.attr('src', _this.album[imageNumber].link);
                $preloader = $(preloader);
                $image.width(preloader.width);
                $image.height(preloader.height);
                if (_this.options.fitImagesInViewport) {
                    windowWidth = $(window).width();
                    windowHeight = $(window).height();
                    maxImageWidth = windowWidth - _this.containerLeftPadding - _this.containerRightPadding - 20;
                    maxImageHeight = windowHeight - _this.containerTopPadding - _this.containerBottomPadding - 110;
                    if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
                        if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
                            imageWidth = maxImageWidth;
                            imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
                            $image.width(imageWidth);
                            $image.height(imageHeight);
                        } else {
                            imageHeight = maxImageHeight;
                            imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
                            $image.width(imageWidth);
                            $image.height(imageHeight);
                        }
                    }
                }
                return _this.sizeContainer($image.width(), $image.height());
            };
            preloader.src = this.album[imageNumber].link;
            this.currentImageIndex = imageNumber;
        };

        Lightbox.prototype.sizeOverlay = function () {
            return $('#lightboxOverlay').width($(document).width()).height($(document).height());
        };

        Lightbox.prototype.sizeContainer = function (imageWidth, imageHeight) {
            var newHeight, newWidth, oldHeight, oldWidth,
              _this = this;
            oldWidth = this.$outerContainer.outerWidth();
            oldHeight = this.$outerContainer.outerHeight();
            newWidth = imageWidth + this.containerLeftPadding + this.containerRightPadding;
            newHeight = imageHeight + this.containerTopPadding + this.containerBottomPadding;
            this.$outerContainer.animate({
                width: newWidth,
                height: newHeight
            }, this.options.resizeDuration, 'swing');
            setTimeout(function () {
                _this.$lightbox.find('.lb-dataContainer').width(newWidth);
                _this.$lightbox.find('.lb-prevLink').height(newHeight);
                _this.$lightbox.find('.lb-nextLink').height(newHeight);
                _this.showImage();
            }, this.options.resizeDuration);
        };

        Lightbox.prototype.showImage = function () {
            this.$lightbox.find('.lb-loader').hide();
            this.$lightbox.find('.lb-image').fadeIn('slow');
            this.updateNav();
            this.updateDetails();
            this.preloadNeighboringImages();
            this.enableKeyboardNav();
        };

        Lightbox.prototype.updateNav = function () {
            this.$lightbox.find('.lb-nav').show();
            if (this.album.length > 1) {
                if (this.options.wrapAround) {
                    this.$lightbox.find('.lb-prev, .lb-next').show();
                } else {
                    if (this.currentImageIndex > 0) {
                        this.$lightbox.find('.lb-prev').show();
                    }
                    if (this.currentImageIndex < this.album.length - 1) {
                        this.$lightbox.find('.lb-next').show();
                    }
                }
            }
        };

        Lightbox.prototype.updateDetails = function () {
            var _this = this;
            if (typeof this.album[this.currentImageIndex].title !== 'undefined' && this.album[this.currentImageIndex].title !== "") {
                this.$lightbox.find('.lb-caption').html(this.album[this.currentImageIndex].title).fadeIn('fast');
            }
            if (this.album.length > 1 && this.options.showImageNumberLabel) {
                this.$lightbox.find('.lb-number').text(this.options.albumLabel(this.currentImageIndex + 1, this.album.length)).fadeIn('fast');
            } else {
                this.$lightbox.find('.lb-number').hide();
            }
            this.$outerContainer.removeClass('animating');
            this.$lightbox.find('.lb-dataContainer').fadeIn(this.resizeDuration, function () {
                return _this.sizeOverlay();
            });
        };

        Lightbox.prototype.preloadNeighboringImages = function () {
            var preloadNext, preloadPrev;
            if (this.album.length > this.currentImageIndex + 1) {
                preloadNext = new Image();
                preloadNext.src = this.album[this.currentImageIndex + 1].link;
            }
            if (this.currentImageIndex > 0) {
                preloadPrev = new Image();
                preloadPrev.src = this.album[this.currentImageIndex - 1].link;
            }
        };

        Lightbox.prototype.enableKeyboardNav = function () {
            $(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
        };

        Lightbox.prototype.disableKeyboardNav = function () {
            $(document).off('.keyboard');
        };

        Lightbox.prototype.keyboardAction = function (event) {
            var KEYCODE_ESC, KEYCODE_LEFTARROW, KEYCODE_RIGHTARROW, key, keycode;
            KEYCODE_ESC = 27;
            KEYCODE_LEFTARROW = 37;
            KEYCODE_RIGHTARROW = 39;
            keycode = event.keyCode;
            key = String.fromCharCode(keycode).toLowerCase();
            if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
                this.end();
            } else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
                if (this.currentImageIndex !== 0) {
                    this.changeImage(this.currentImageIndex - 1);
                }
            } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
                if (this.currentImageIndex !== this.album.length - 1) {
                    this.changeImage(this.currentImageIndex + 1);
                }
            }
        };

        Lightbox.prototype.end = function () {
            this.disableKeyboardNav();
            $(window).off("resize", this.sizeOverlay);
            this.$lightbox.fadeOut(this.options.fadeDuration);
            this.$overlay.fadeOut(this.options.fadeDuration);
            return $('select, object, embed').css({
                visibility: "visible"
            });
        };

        return Lightbox;

    })();

    $(function () {
        var lightbox, options;
        options = new LightboxOptions();
        return lightbox = new Lightbox(options);
    });

}).call(this);

//encrypt decrypt
(function ($) {
    $.fn.rc4 = function (settings) {
        var defaults = { key: null, method: "encrypt", callback: null };
        var options = $.extend(defaults, settings);
        if ($.fn.rc4.ctrlrInst == null) { $.fn.rc4.ctrlrInst = new $.fn.rc4.ctrlr(options); }
        return this.each(function () {
            $.fn.rc4.ctrlrInst.settings = options;
            $.fn.rc4.ctrlrInst.container = this; $.fn.rc4.ctrlrInst.initialise(this);
        });
    }
    $.extend({
        hexEncode: function (data) {
            var b16D = '0123456789abcdef'; var b16M = new Array();
            for (var i = 0; i < 256; i++) { b16M[i] = b16D.charAt(i >> 4) + b16D.charAt(i & 15); }
            var result = new Array(); for (var i = 0; i < data.length; i++) { result[i] = b16M[data.charCodeAt(i)]; }
            return result.join('');
        }, hexDecode: function (data) {
            var b16D = '0123456789abcdef'; var b16M = new Array();
            for (var i = 0; i < 256; i++) { b16M[b16D.charAt(i >> 4) + b16D.charAt(i & 15)] = String.fromCharCode(i); }
            if (!data.match(/^[a-f0-9]*$/i)) return false; if (data.length % 2) data = '0' + data;
            var result = new Array(); var j = 0; for (var i = 0; i < data.length; i += 2) { result[j++] = b16M[data.substr(i, 2)]; }
            return result.join('');
        }, rc4Encrypt: function (key, pt) {
            s = new Array(); for (var i = 0; i < 256; i++) { s[i] = i; }; var j = 0; var x;
            for (i = 0; i < 256; i++) { j = (j + s[i] + key.charCodeAt(i % key.length)) % 256; x = s[i]; s[i] = s[j]; s[j] = x; }
            i = 0; j = 0; var ct = ''; for (var y = 0; y < pt.length; y++) {
                i = (i + 1) % 256; j = (j + s[i]) % 256; x = s[i]; s[i] = s[j]; s[j] = x;
                ct += String.fromCharCode(pt.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
            } return ct;
        }, rc4Decrypt: function (key, ct) {
            return $.rc4Encrypt(key, ct);
        }, rc4EncryptStr: function (str, key) {
            return $.hexEncode($.rc4Encrypt(key, unescape(encodeURIComponent(str))));
        }, rc4DecryptStr: function (hexStr, key) { return decodeURIComponent(escape($.rc4Decrypt(key, $.hexDecode(hexStr)))); }
    });
    $.rc4 = {}; $.fn.rc4.ctrlrInst = null; $.fn.rc4.ctrlr = function (settings) { this.settings = settings; }; var ctrlr = $.fn.rc4.ctrlr;
    ctrlr.prototype.initialise = function () {
        if (this.settings.key) {
            if (this.settings.method) {
                if ($.trim(this.settings.method.toUpperCase()) == "ENCRYPT") {
                    this.setObjectValue($.hexEncode($.rc4Encrypt(this.settings.key, this.getObjectValue())))
                }
                if ($.trim(this.settings.method.toUpperCase()) == "DECRYPT") {
                    this.setObjectValue($.rc4Decrypt(this.settings.key, $.hexDecode(this.getObjectValue())));
                }
            }
        };
    }
    ctrlr.prototype.getObjectValue = function () {
        if ($.fn.rc4.ctrlrInst.container.innerHTML) { return $.fn.rc4.ctrlrInst.container.innerHTML; }
        if ($.fn.rc4.ctrlrInst.container.value) { return $.fn.rc4.ctrlrInst.container.value; }
    }
    ctrlr.prototype.setObjectValue = function (data) {
        if ($.fn.rc4.ctrlrInst.container.innerHTML) { $.fn.rc4.ctrlrInst.container.innerHTML = data; }
        if ($.fn.rc4.ctrlrInst.container.value) { $.fn.rc4.ctrlrInst.container.value = data; }
    }
})(jQuery);

//pagination
jQuery.fn.pagination = function (maxentries, opts) {
    opts = jQuery.extend({
        items_per_page: 10,
        num_display_entries: 10,
        current_page: 0,
        num_edge_entries: 0,
        link_to: "javascript:void(0);",
        prev_text: "Sau",
        next_text: "Trước",
        ellipse_text: "...",
        prev_show_always: true,
        next_show_always: true,
        callback: function () { return false; }
    }, opts || {});

    return this.each(function () {
        /**
		 * Calculate the maximum number of pages
		 */
        function numPages() {
            return Math.ceil(maxentries / opts.items_per_page);
        }

        /**
		 * Calculate start and end point of pagination links depending on 
		 * current_page and num_display_entries.
		 * @return {Array}
		 */
        function getInterval() {
            var ne_half = Math.ceil(opts.num_display_entries / 2);
            var np = numPages();
            var upper_limit = np - opts.num_display_entries;
            var start = current_page > ne_half ? Math.max(Math.min(current_page - ne_half, upper_limit), 0) : 0;
            var end = current_page > ne_half ? Math.min(current_page + ne_half, np) : Math.min(opts.num_display_entries, np);
            return [start, end];
        }

        /**
		 * This is the event handling function for the pagination links. 
		 * @param {int} page_id The new page number
		 */
        function pageSelected(page_id, evt) {
            current_page = page_id;
            drawLinks();
            var continuePropagation = opts.callback(page_id, panel);
            if (!continuePropagation) {
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                else {
                    evt.cancelBubble = true;
                }
            }
            return continuePropagation;
        }

        /**
		 * This function inserts the pagination links into the container element
		 */
        function drawLinks() {
            panel.empty();
            var interval = getInterval();
            var np = numPages();
            // This helper function returns a handler function that calls pageSelected with the right page_id
            var getClickHandler = function (page_id) {
                return function (evt) { return pageSelected(page_id, evt); }
            }
            // Helper function for generating a single link (or a span tag if it's the current page)
            var appendItem = function (page_id, appendopts) {
                page_id = page_id < 0 ? 0 : (page_id < np ? page_id : np - 1); // Normalize page id to sane value
                appendopts = jQuery.extend({ text: page_id + 1, classes: "" }, appendopts || {});
                if (page_id == current_page) {
                    var lnk = jQuery("<span class='current'>" + (appendopts.text) + "</span>");
                }
                else {
                    var lnk = jQuery("<a>" + (appendopts.text) + "</a>")
						.bind('click', getClickHandler(page_id))
						.attr('href', opts.link_to.replace(/__id__/, page_id))
                        .attr('title', (appendopts.text));
                }
                if (appendopts.classes) { lnk.addClass(appendopts.classes); }
                panel.append(lnk);
            }
            // Generate "Previous"-Link
            if (opts.prev_text && (current_page > 0 || opts.prev_show_always)) {
                appendItem(current_page - 1, { text: opts.prev_text, classes: "prev" });
            }
            // Generate starting points
            if (interval[0] > 0 && opts.num_edge_entries > 0) {
                var end = Math.min(opts.num_edge_entries, interval[0]);
                for (var i = 0; i < end; i++) {
                    appendItem(i);
                }
                if (opts.num_edge_entries < interval[0] && opts.ellipse_text) {
                    jQuery("<span>" + opts.ellipse_text + "</span>").appendTo(panel);
                }
            }
            // Generate interval links
            for (var i = interval[0]; i < interval[1]; i++) {
                appendItem(i);
            }
            // Generate ending points
            if (interval[1] < np && opts.num_edge_entries > 0) {
                if (np - opts.num_edge_entries > interval[1] && opts.ellipse_text) {
                    jQuery("<span>" + opts.ellipse_text + "</span>").appendTo(panel);
                }
                var begin = Math.max(np - opts.num_edge_entries, interval[1]);
                for (var i = begin; i < np; i++) {
                    appendItem(i);
                }

            }
            // Generate "Next"-Link
            if (opts.next_text && (current_page < np - 1 || opts.next_show_always)) {
                appendItem(current_page + 1, { text: opts.next_text, classes: "next" });
            }
        }

        // Extract current_page from options
        var current_page = opts.current_page;
        // Create a sane value for maxentries and items_per_page
        maxentries = (!maxentries || maxentries < 0) ? 1 : maxentries;
        opts.items_per_page = (!opts.items_per_page || opts.items_per_page < 0) ? 1 : opts.items_per_page;
        // Store DOM element for easy access from all inner functions
        var panel = jQuery(this);
        // Attach control functions to the DOM element 
        this.selectPage = function (page_id) { pageSelected(page_id); }
        this.prevPage = function () {
            if (current_page > 0) {
                pageSelected(current_page - 1);
                return true;
            }
            else {
                return false;
            }
        }
        this.nextPage = function () {
            if (current_page < numPages() - 1) {
                pageSelected(current_page + 1);
                return true;
            }
            else {
                return false;
            }
        }
        // When all initialisation is done, draw the links
        drawLinks();
        // call callback function
        opts.callback(current_page, this);
    });
}

