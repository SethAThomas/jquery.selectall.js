/*jshint multistr:true */
/*global $, QUnit*/

$(function () {
    var tests = {},
        content = '                                                              \
<ol class="myList">                                                              \
  <li class="js-selectall-wrapper">                                              \
    <input type="checkbox" class="js-selectall-selectall special special2" />    \
    <span> all</span>                                                            \
  </li>                                                                          \
  <li><input type="checkbox" class="special special2" /> A</li>                  \
  <li><input type="checkbox" class="special special2" /> B</li>                  \
  <li class="js-selectall-wrapper">                                              \
    <input type="checkbox" />                                                    \
    <b> C</b>                                                                    \
  </li>                                                                          \
  <li><input type="checkbox" class="special" /> D</li>                           \
  <li><input type="checkbox" class="js-selectall-selectall special2" /> all</li> \
  <li>                                                                           \
      <input type="radio" id="radioA" name="someRadio" />                        \
      <input type="radio" id="radioB" name="someRadio" />                        \
  </li>                                                                          \
</ol>                                                                            \
        ',
        dynamicContent = '                                                       \
  <li><input type="checkbox" /></li>                                             \
  <li><input type="checkbox" class="special" /></li>                             \
  <li>                                                                           \
    <input type="checkbox" class="js-selectall-selectall special" /> dynamic all \
  </li>                                                                          \
        ';

    function addUtClasses() {
        // add some classes to the contents that will make testing easier
        // "ut-" stands for unit test; indicates that the class is strictly for
        // unit testing purposes

        var allSelector = '.js-selectall-selectall',
            nonAllSelector = 'input[type="checkbox"]:not(.js-selectall-selectall)';

        if (this.opts.classFilter) {
            allSelector += '.' + this.opts.classFilter.split(' ').join('.');
            nonAllSelector += '.' + this.opts.classFilter.split(' ').join('.');
        }

        // add the classes 'ut-all' and 'ut-allX', where X is the index 0..n
        this.$content.find(allSelector).each(function (index) {
            var $el = $(this);
            if (!$el.hasClass('ut-all')) {
                $el.addClass('ut-all ut-all' + index);
            }
        });
        // add the classes 'ut-non' and 'ut-nonX', where X is the index 0..n
        this.$content.find(nonAllSelector).each(function (index) {
            var $el = $(this);
            if (!$el.hasClass('ut-non')) {
                $el.addClass('ut-non ut-non' + index);
            }
        });
    }

    function construct(fn) {
        if (fn === undefined) {
            fn = $.noop;
        }

        addUtClasses.call(this);

        fn.call(this);
        this.$content.selectall(this.opts);
        return this.$content;
    }

    function toggle(el) {
        // checks / uncheckes the element
        // will also click the element to trigger any
        // .selectall() behaviour on the element (.selectall() may
        // not be applied to the fragment yet)

        // normally, the browser click event will have already toggled
        // the "checked" property; .selectall() uses delegates, so it is
        // too late to prevent the browser default behaviour; that means
        // that .selectall() doesn't try to meddle in setting the checked
        // setting, but instead just reacts to it being changed; we're
        // mimicing the browser default behaviour here by explicitly changing
        // the checked property

        var $el = $(el);

        if ($el.is(':checked')) {
            $el.removeAttr('checked');
        } else {
            $el.attr('checked', true);
        }
        $el.click();
    }

    $.fn.ut_toggle = function () {
        return this.each(function () {
            toggle(this);
        });
    };

    function assertChecked($content, expected, expectedLength) {
        // test that only the expected inputs are checked
        // expected - a list of the HTML elements that should be checked
        // expectedLength - sanity check to ensure that expected has the
        //   correct number of elements

        // this doesn't distinguish between checkbox inputs and other types
        // this is intentional; it helps us ensure that only the
        // checkboxes were affected
        var $areChecked = $content.find(':checked');

        // sanity check
        QUnit.strictEqual(expected.length, expectedLength);

        QUnit.deepEqual($areChecked.get(), expected);
    }

    function toggleTest(expectedQuery, numExpected, opts) {
        // expectedQuery - query to find the expected "checked" elements
        // numExpected - sanity check; the expected number of "checked" elements
        opts = $.extend({
            noConstruct: false, // set to true to prevent calling construct()
            pre: '', // toggles query matches before .selectall() has been applied
            post: '' // toggles query matches after .selectall() has been applied
        }, opts || {});

        if (!this.$content.data('js-selectall') && !opts.noConstruct) {
            construct.call(this, function () {
                this.$content.find(opts.pre).ut_toggle();
            });
        }

        this.$content.find(opts.post).ut_toggle();

        var expected = this.$content.find(expectedQuery).get();
        assertChecked(this.$content, expected, numExpected);
    }

    tests.defaults = (function () {
        QUnit.module('jquery.selectall with default options', {
            setup: function () {
                this.$content = $(content);
                this.opts = {};
                this.MAX = 6;
            }
        });

        QUnit.test('constructor - no checkboxes initially checked', function () {
            toggleTest.call(this, '', 0);
        });

        QUnit.test('constructor - some non-selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-non1, .ut-non3', 2, {
                pre: '.ut-non1, .ut-non3'
            });
        });

        QUnit.test('constructor - all non-selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-non'
            });
        });

        QUnit.test('constructor - some selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-all0'
            });
        });

        QUnit.test('constructor - all checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-all, .ut-non'
            });
        });

        QUnit.test('toggling - selectall -> checked -> unchecked -> checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '', 0, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
        });

        QUnit.test('toggling - different selectall ', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all1'
            });
        });

        QUnit.test('toggling - some non-selectall', function () {
            toggleTest.call(this, '.ut-non0, .ut-non2', 2, {
                post: '.ut-non0, .ut-non2'
            });
        });

        QUnit.test('toggling - all non-selectall', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
        });

        QUnit.test('toggling - all non-selectall checked -> some unchecked -> all checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
            toggleTest.call(this, '.ut-non0, .ut-non1', 2, {
                post: '.ut-non:gt(1)'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non:not(:checked)'
            });
        });

        QUnit.test('destroy', function () {
            toggleTest.call(this, '', 0);

            this.$content.data('js-selectall').destroy();

            // should now longer be any .selectall() functionality, so toggling a select-all should do nothing
            // more than checking that single checkbox
            toggleTest.call(this, '.ut-all0', 1, {
                noConstruct: true,
                post: '.ut-all0'
            });
        });
    });

    tests.dynamicContent = (function () {
        QUnit.module('jquery.selectall with new checkboxes added dynamicly', {
            setup: function () {
                this.$content = $(content);
                this.opts = {};

                toggleTest.call(this, '', 0);

                this.$content.append(dynamicContent);
                addUtClasses.call(this);
                this.MAX = 9;
            }
        });

        QUnit.test('toggling - selectall -> checked -> unchecked -> checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '', 0, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
        });

        QUnit.test('toggling - different selectall ', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all2'
            });
        });

        QUnit.test('toggling - some non-selectall', function () {
            toggleTest.call(this, '.ut-non0, .ut-non2, .ut-non:last', 3, {
                post: '.ut-non0, .ut-non2, .ut-non:last'
            });
        });

        QUnit.test('toggling - all non-selectall', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
        });

        QUnit.test('toggling - all non-selectall checked -> some unchecked -> all checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
            toggleTest.call(this, '.ut-non0, .ut-non1, .ut-non:last', 3, {
                post: '.ut-non:gt(1):not(:last)'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non:not(:checked)'
            });
        });
    });

    tests.classFilter = (function () {
        QUnit.module('jquery.selectall with classFilter option', {
            setup: function () {
                this.$content = $(content);
                this.opts = {classFilter: 'special'};
                this.MAX = 4;
            }
        });

        QUnit.test('constructor - no checkboxes initially checked', function () {
            toggleTest.call(this, '', 0);
        });

        QUnit.test('constructor - some non-selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-non1', 1, {
                pre: '.ut-non1'
            });
        });

        QUnit.test('constructor - all non-selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-non'
            });
        });

        QUnit.test('constructor - some selectall checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-all0'
            });
        });

        QUnit.test('constructor - all checkboxes initially checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                pre: '.ut-all, .ut-non'
            });
        });

        QUnit.test('toggling - selectall -> checked -> unchecked -> checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '', 0, {
                post: '.ut-all0'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-all0'
            });
        });

        QUnit.test('toggling - different selectall ', function () {
            toggleTest.call(this, '', 0);

            // mark another select-all as part of the restricted classFilter set of .selectall()
            this.$content.find('.js-selectall-selectall:not(.ut-all):first').addClass('special');
            addUtClasses.call(this);

            toggleTest.call(this, '.ut-all, .ut-non', this.MAX + 1, {
                post: '.ut-all1'
            });
        });

        QUnit.test('toggling - some non-selectall', function () {
            toggleTest.call(this, '.ut-non0, .ut-non:last', 2, {
                post: '.ut-non0, .ut-non:last'
            });
        });

        QUnit.test('toggling - all non-selectall', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
        });

        QUnit.test('toggling - all non-selectall checked -> some unchecked -> all checked', function () {
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non'
            });
            toggleTest.call(this, '.ut-non:lt(2)', 2, {
                post: '.ut-non:gt(1)'
            });
            toggleTest.call(this, '.ut-all, .ut-non', this.MAX, {
                post: '.ut-non:not(:checked)'
            });
        });

        QUnit.test('destroy', function () {
            toggleTest.call(this, '', 0);

            this.$content.data('js-selectall').destroy();

            // should now longer be any .selectall() functionality, so toggling a select-all should do nothing
            // more than checking that single checkbox
            toggleTest.call(this, '.ut-all0', 1, {
                noConstruct: true,
                post: '.ut-all0'
            });
        });
        
        QUnit.test('multi class classFilter: toggling - all non-selectall checked -> some unchecked -> all checked', function () {
            this.opts.classFilter = 'special special2';

            // prove that using multiple classes in the classFilter works
            
            var max = this.$content.find('.special.special2').length;

            toggleTest.call(this, '.ut-all, .ut-non', max, {
                post: '.ut-non'
            });
            toggleTest.call(this, '.ut-non:lt(1)', 1, {
                post: '.ut-non:gt(0)'
            });
            toggleTest.call(this, '.ut-all, .ut-non', max, {
                post: '.ut-non:not(:checked)'
            });
        });
    });

    function testRunner(tests) {
        for (var testName in tests) {
            if ($.isFunction(tests[testName])) {
                tests[testName]();
            }
        }
    }

    testRunner(tests);
});
