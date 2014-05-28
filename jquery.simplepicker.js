/*
 * Very simple jQuery Picker
 *
 * Original project was made exclusively for colors. Enhanced to be used for
 * any <select> element.
 *
 * https://github.com/tkrotoff/jquery-simplecolorpicker
 * Copyright (C) 2012-2013 Tanguy Krotoff <tkrotoff@gmail.com>
 *
 * https://github.com/ushahidi/jquery-simplepicker
 * Copyright (C) 2014 Ushahidi <http://ushahidi.com/>
 *
 * Licensed under the MIT license
 */

(function($) {
  'use strict';

  /**
   * Constructor.
   */
  var SimplePicker = function(select, options) {
    this.init('simplepicker', select, options);
  };

  /**
   * SimplePicker class.
   */
  SimplePicker.prototype = {
    constructor: SimplePicker,

    init: function(type, select, options) {
      var self = this;

      self.type = type;

      self.$select = $(select);
      self.$select.hide();

      self.options = $.extend({}, $.fn.simplepicker.defaults, options);

      self.$optionList = null;

      if (self.options.picker === true) {
        var selectText = self.$select.find('> option:selected').text();
        self.$icon = $('<span class="simplepicker icon"' 
                      + ' title="' + selectText + '"' 
                      + ' role="button" tabindex="0">' 
                      + '</span>').insertAfter(self.$select);
        self.$icon.on('click.' + self.type, $.proxy(self.showPicker, self));
        self.$icon.on('keydown.' + self.type, function(e) {
          if (e.which === 13) {
            self.showPicker();
          }
        });

        self.options.onChangeIcon(self.$icon, self.$select.val());

        self.$picker = $('<span class="simplepicker picker ' + self.options.theme + '"></span>').appendTo(document.body);
        self.$optionList = self.$picker;

        // Hide picker when clicking outside
        $(document).on('mousedown.' + self.type, $.proxy(self.hidePicker, self));
        self.$picker.on('mousedown.' + self.type, $.proxy(self.mousedown, self));
        self.$picker.on('keydown.' + self.type, function(e) {
          if (e.which === 27) {
            e.preventDefault();
            e.stopPropagation();
            self.hidePicker();
          }
        });
      } else {
        self.$inline = $('<span class="simplepicker inline ' + self.options.theme + '"></span>').insertAfter(self.$select);
        self.$optionList = self.$inline;
      }

      // Build the list of colors
      // <span class="color selected" title="Green" style="background-color: #7bd148;" role="button"></span>
      self.$select.find('> option').each(function() {
        var $option = $(this);
        var color = $option.val();

        var isSelected = $option.is(':selected');
        var isDisabled = $option.is(':disabled');

        var selected = '';
        if (isSelected === true) {
          selected = ' data-selected';
        }

        var disabled = '';
        if (isDisabled === true) {
          disabled = ' data-disabled';
        }

        var title = '';
        if (isDisabled === false) {
          title = ' title="' + $option.text() + '"';
        }

        var role = '';
        if (isDisabled === false) {
          role = ' role="button" tabindex="0"';
        }

        var $colorSpan = $('<span class="color"' 
                          + title 
                          + ' style="background-color: ' + color + ';"' 
                          + ' data-color="' + color + '"' 
                          + selected 
                          + disabled 
                          + role + '>' 
                          + '</span>');

        self.$optionList.append($colorSpan);
        $colorSpan.on('click.' + self.type, $.proxy(self.optionSpanClicked, self));
        $colorSpan.on('keydown.' + self.type, function(e) {
          if (e.which === 13) {
            e.preventDefault();
            e.stopPropagation();
            self.optionSpanClicked(e);
          }
        });

        var $next = $option.next();
        if ($next.is('optgroup') === true) {
          // Vertical break, like hr
          self.$optionList.append('<span class="vr"></span>');
        }
      });

      // This sets the focus to the first button in the picker dialog
      // It also enables looping of the tabs both forward and reverse direction.
      if (self.options.picker === true) {
        var $buttons = self.$picker.find('[role=button]');
        var $firstButton = $buttons.first();
        var $lastButton = $buttons.last();

        $firstButton.on('keydown', function(e) {
          if (e.which === 9 && e.shiftKey) {
            e.preventDefault();
            $lastButton.focus();
          }
        });

        $lastButton.on('keydown', function(e) {
          if (e.which === 9 && !e.shiftKey) {
            e.preventDefault();
            $firstButton.focus();
          }
        });
      }
    },

    /**
     * Changes the selected color.
     *
     * @param color the hexadecimal color to select, ex: '#fbd75b'
     */
    selectOption: function(color) {
      var self = this;

      var $colorSpan = self.$optionList.find('> span.color').filter(function() {
        return $(this).data('color').toLowerCase() === color.toLowerCase();
      });

      if ($colorSpan.length > 0) {
        self.selectOptionSpan($colorSpan);
      } else {
        console.error("The given color '" + color + "' could not be found");
      }
    },

    showPicker: function() {
      var self = this;
      var pos = this.$icon.offset();
      this.$picker.css({
        // Remove some pixels to align the picker icon with the icons inside the dropdown
        left: pos.left - 6,
        top: pos.top + this.$icon.outerHeight()
      });

      this.$picker.show(this.options.pickerDelay, function() {
        self.$picker.find('[role=button]').first().focus();
      });
    },

    hidePicker: function() {
      var self = this;
      var isVisible = this.$picker.is(":visible");
      if (isVisible) {
        this.$picker.hide(this.options.pickerDelay, function() {        
          self.$icon.focus();
        });
      }
    },

    /**
     * Selects the given span inside $optionList.
     *
     * The given span becomes the selected one.
     * It also changes the HTML select value, this will emit the 'change' event.
     */
    selectOptionSpan: function($colorSpan) {
      var color = $colorSpan.data('color');
      var title = $colorSpan.prop('title');

      // Mark this span as the selected one
      $colorSpan.siblings().removeAttr('data-selected');
      $colorSpan.attr('data-selected', '');

      if (this.options.picker === true) {
        this.$icon.css('background-color', color);
        this.$icon.prop('title', title);
        this.hidePicker();
      }

      // Change HTML select value
      this.$select.val(color);
    },

    /**
     * The user clicked on a color inside $optionList.
     */
    optionSpanClicked: function(e) {
      // When a color is clicked, make it the new selected one (unless disabled)
      if ($(e.target).is('[data-disabled]') === false) {
        this.selectOptionSpan($(e.target));
        this.$select.trigger('change');
      }
    },

    /**
     * Prevents the mousedown event from "eating" the click event.
     */
    mousedown: function(e) {
      e.stopPropagation();
      e.preventDefault();
    },

    destroy: function() {
      if (this.options.picker === true) {
        this.$icon.off('.' + this.type);
        this.$icon.remove();
        $(document).off('.' + this.type);
      }

      this.$optionList.off('.' + this.type);
      this.$optionList.remove();

      this.$select.removeData(this.type);
      this.$select.show();
    }
  };

  /**
   * Plugin definition.
   * How to use: $('#id').simplepicker()
   */
  $.fn.simplepicker = function(option) {
    var args = $.makeArray(arguments);
    args.shift();

    // For HTML element passed to the plugin
    return this.each(function() {
      var $this = $(this), 
        data = $this.data('simplepicker'), 
        options = typeof option === 'object' && option;
      if (data === undefined) {
        $this.data('simplepicker', (data = new SimplePicker(this, options)));
      }
      if (typeof option === 'string') {
        data[option].apply(data, args);
      }
    });
  };

  /**
   * Default options.
   */
  $.fn.simplepicker.defaults = {
    // No theme by default
    theme: '',

    // Show the picker or make it inline
    picker: false,

    // Animation delay in milliseconds
    pickerDelay: 0,

    // Change the icon value
    onChangeIcon: function ($icon, value) {
        $icon.css('background-color', value);
    }

  };

})(jQuery);
