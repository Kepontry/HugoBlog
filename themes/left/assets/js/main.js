jQuery(function ($) {

    'use strict';

    var _Blog = window._Blog || {};

    _Blog.externalUrl = function () {
        $.expr[':'].external = function (obj) {
            return !obj.href.match(/^mailto\:/) &&
                (obj.hostname != location.hostname);
        };
        $('a:external').addClass('external');
        $(".external").attr('target', '_blank');

    }

    _Blog.changeTitle = function () {
        var currentTitle = document.title;
        window.onblur = function () {
            document.title = currentTitle;
        }
        window.onfocus = function () {
            document.title = currentTitle;
        }
    };

    _Blog.toggleTheme = function () {

    }

    _Blog.toggleMobileMenu = function () {
        $('.menu-toggle').on('click', () => {
            $('.menu-toggle').toggleClass('active')
            $('#mobile-menu').toggleClass('active')
        })
    }

    $(document).ready(function () {
        _Blog.changeTitle()
        _Blog.toggleTheme()
        _Blog.toggleMobileMenu()
    });
});