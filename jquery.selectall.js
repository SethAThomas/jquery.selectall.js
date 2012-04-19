/*
Author: Seth Thomas
GitHub: https://github.com/SethAThomas/jquery.selectall.js
*/

(function ($, undefined) {
    'use strict';

    var name = 'js-selectall';

    function setChecked($checkboxes, value) {
        $checkboxes.each(function () {
            if (value === undefined) {
                this.checked = !this.checked;
            } else {
                this.checked = value;
            }
        });
    }

    function SelectAll(el, opts) {
        this.$el = $(el);
        this.$el.data(name, this);

        this.defaults = {
            classFilter: '' // allows the functionality to be restricted to a specific classname
        };

        var meta = this.$el.data(name + '-opts');
        this.opts = $.extend(this.defaults, opts, meta);

        var classFilter = $.trim(this.opts.classFilter || '').replace(/\s+/g, ' ');
        classFilter = classFilter ? '.' + classFilter.replace(' ', '.') : '';

        // pre-calculate the selectors, but do not cache the jQuery sets;
        // this way, content can be added and removed from the markup

        // ex:
        // selectAlls = 'input[type="checkbox"].foo.js-selectall-selectall'
        
        var cWrapper   = '.' + name + '-wrapper',
            cSelectAll = '.' + name + '-selectall';

        this.selectors = {};
        this.selectors.wrappers      = cWrapper;
        this.selectors.all           = 'input[type="checkbox"]' + classFilter;
        this.selectors.selectAlls    = this.selectors.all + cSelectAll;
        this.selectors.nonSelectAlls = this.selectors.all + ':not(' + cSelectAll + ')';

        var self = this;

        this._handlers = {};
        this._handlers.checkboxChanged = function _a_checkboxChanged(evt) {
            var $el = $(this);
            if ($el.is(cSelectAll)) {
                self.setAll(this.checked);
            } else {
                self.update(true);
            }
        };
        this._handlers.wrapperClicked = function _a_wrapperClicked(evt) {
            if ($(evt.target).is(self.selectors.all)) {
                // ignore clicks directly on a checkbox
                return;
            }

            var $wrapper = $(this),
                $checkboxes = self.$getAll($wrapper);
            setChecked($checkboxes); // toggle the checked property for each checkbox
            $checkboxes.change();
        };

        this.$el
            .delegate(this.selectors.wrappers, 'click.' + name,  this._handlers.wrapperClicked)
            .delegate(this.selectors.all,      'change.' + name, this._handlers.checkboxChanged)
        ;

        this.update();
    }

    SelectAll.prototype.$getSelectAlls = function _a_$getSelectAlls($context) {
        return $(this.selectors.selectAlls, $context || this.$el);
    };

    SelectAll.prototype.$getNonSelectAlls = function _a_$getNonSelectAlls($context) {
        return $(this.selectors.nonSelectAlls, $context || this.$el);
    };

    SelectAll.prototype.$getAll = function _a_$getAll($context) {
        return $(this.selectors.all, $context || this.$el);
    };

    SelectAll.prototype.setAll = function _a_setAll(value) {
        setChecked(this.$getAll(), value);
    };

    SelectAll.prototype.update = function _a_update(ignoreSelectAllsCheck) {
        var $selectAlls = this.$getSelectAlls();
        
        if (!ignoreSelectAllsCheck && $selectAlls.filter(':checked').length) {
            // if any select-alls are checked, then everything gets checked
            this.setAll(true);
        } else {
            var $nonSelectAlls = this.$getNonSelectAlls(),
                len = $nonSelectAlls.length;

            if (len) {
                if (len === $nonSelectAlls.filter(':checked').length) {
                    // if all the non-select-alls are checked, then check all of the
                    // select-alls
                    setChecked($selectAlls, true);
                } else if (ignoreSelectAllsCheck) {
                    setChecked($selectAlls, false);
                }
            }
        }
    };

    SelectAll.prototype.destroy = function _a_destroy() {
        // removes the SelectAll functionality w/o harming the markup

        // in jQuery 1.6+ we'll be able to undelegate using the namespace
        // pre-1.6, we must undelegate each handler by function reference
        this.$el
            .undelegate(this.selectors.wrappers, 'click',  this._handlers.wrapperClicked)
            .undelegate(this.selectors.all,      'change', this._handlers.checkboxChanged)
        ;

        // .undelegate(namespace) requires jQuery 1.6+
        //this.$el.undelegate('.' + name);
        //this.$el.find('*').undelegate('.' + name);

        this.$el.removeData(name);
        this.$el = null;
    };

    $.fn.selectall = function _a_selectall(opts) {
        return this.each(function _a_selectall_constructor() {
            new SelectAll(this, opts);
        });
    };
})(jQuery);
