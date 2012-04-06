/*
Author: Seth Thomas
GitHub: https://github.com/SethAThomas/jquery.selectall.js
*/

(function ($, undefined) {
    'use strict';

    var name = 'js-selectall';

    function SelectAll(el, opts) {
        this.$el = $(el);
        this.$el.data(name, this);

        this.defaults = {
            classFilter: '' // allows the functionality to be restricted to a specific classname
        };

        var meta = this.$el.data(name + '-opts');
        this.opts = $.extend(this.defaults, opts, meta);

        var classFilter = (this.opts.classFilter ? '.' + this.opts.classFilter.split(' ').join('.') : '');

        // pre-calculate the selectors, but do not cache the jQuery sets;
        // this way, content can be added and removed from the markup

        // ex:
        // selectAll = 'input[type="checkbox"].foo.js-selectall-selectall'
        this.selectors = {
            wrappers: '.' + name + '-wrapper',
            anyCheckbox: 'input[type="checkbox"]' + classFilter,
            selectAll: 'input[type="checkbox"]' + classFilter + '.' + name + '-selectall',
            nonSelectAll: 'input[type="checkbox"]' + classFilter + ':not(.' + name + '-selectall)'
        };

        this.init();
    }

    SelectAll.prototype.init = function _a_init() {
        var self = this;

        // this handlers non-sense is necessary so that we can
        // retain a reference to the event handlers for 
        // undelegating. In jQuery 1.6+ we can undelegate using
        // the namespace.
        this.handlers = {
            onClickSelectAll: function _a_onClickSelectAll(evt) {
                var $el = $(this);

                if ($el.is(':checked')) {
                    self.selectAll();
                } else {
                    self.selectNone();
                }

                evt.stopImmediatePropagation();
            },
            onClickNonSelectAll: function _a_onClickNonSelectAll(evt) {
                self.nonSelectAllChanged();

                evt.stopImmediatePropagation();
            },
            onClickWrapper: function _a_onClickWrapper(evt) {
                var $wrapper = $(this),
                    nonSelectAllChanged = false;

                // toggle all checkboxes inside the wrapper
                // WARNING: this may cause very weird results if more than one checkbox
                // is inside a wrapper, especially if it's a select-all checkbox
                $(self.selectors.anyCheckbox, $wrapper).each(function _a_toggleCheckboxes() {
                    var $el = $(this);
                    if ($el.hasClass(name + '-selectall')) {
                        if ($el.is(':checked')) {
                            self.selectNone();
                        } else {
                            self.selectAll();
                        }
                    } else {
                        if ($el.is(':checked')) {
                            $el.removeAttr('checked');
                        } else {
                            $el.attr('checked', true);
                        }
                        nonSelectAllChanged = true;
                    }
                });

                if (nonSelectAllChanged) {
                    self.nonSelectAllChanged();
                }

                evt.stopImmediatePropagation();
            }
        };

        // clicking the 'select all / none'
        this.$el.delegate(this.selectors.selectAll, 'click.' + name, this.handlers.onClickSelectAll);

        // clicking any other checkbox
        this.$el.delegate(this.selectors.nonSelectAll, 'click.' + name, this.handlers.onClickNonSelectAll);

        // clicking any of the wrappers
        this.$el.delegate(this.selectors.wrappers, 'click.' + name, this.handlers.onClickWrapper);

        // if any of the select-all checkboxes are initially checked then
        // select everything
        if ($(this.selectors.selectAll, this.$el).filter(':checked').length) {
            this.selectAll();
        }
        // pretend that a non-select was changed, so that the select-all's
        // will be updated if all / none of the non-selects are initially
        // checked
        this.nonSelectAllChanged();
    };

    SelectAll.prototype.check = function _a_check(selector, value) {
        // checks or unchecks (based on value) everything in the selector
        if (value) {
            $(selector, this.$el).attr('checked', true);
        } else {
            $(selector, this.$el).removeAttr('checked');
        }
    };

    SelectAll.prototype.selectAll = function _a_selectAll() {
        // check all of the select-all checkboxes (there could be multiple)
        this.check(this.selectors.selectAll, true);

        // check all of the non-select-all checkboxes
        this.check(this.selectors.nonSelectAll, true);
    };

    SelectAll.prototype.selectNone = function _a_selectNone() {
        // uncheck all of the select-all checkboxes (there could be multiple)
        this.check(this.selectors.selectAll, false);

        // uncheck all of the non-select-all checkboxes
        this.check(this.selectors.nonSelectAll, false);
    };

    SelectAll.prototype.nonSelectAllChanged = function _a_nonSelectAllChanged() {
        var $checked = $(this.selectors.nonSelectAll, this.$el);

        if ($checked.length === $checked.filter(':checked').length) {
            // all of the non-select-all checkboxes are checked, so also check the select-all checkboxes
            this.check(this.selectors.selectAll, true);
        } else {
            // not all of the non-select-all checkboxes are checked, so uncheck all select-all checkboxes
            this.check(this.selectors.selectAll, false);
        }
    };

    SelectAll.prototype.destroy = function _a_destroy() {
        // removes the SelectAll functionality w/o harming the markup

        // in jQuery 1.6+ we'll be able to undelegate using the namespace
        this.$el.undelegate(this.selectors.selectAll, 'click', this.handlers.onClickSelectAll);
        this.$el.undelegate(this.selectors.nonSelectAll, 'click', this.handlers.onClickNonSelectAll);
        this.$el.undelegate(this.selectors.wrappers, 'click', this.handlers.onClickWrapper);

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
