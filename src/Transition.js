/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('Sage/Platform/Mobile/Transition', [
    'dojo/_base/lang',
    'dojo/_base/Deferred',
    'dojo/dom-class',
    'dojo/on'
], function(
    lang,
    Deferred,
    domClass,
    on
) {
    var isWebKit = /webkit/i.test(navigator.userAgent),
        isMoz = /firefox/i.test(navigator.userAgent),
        isOpera = /opera/i.test(navigator.userAgent),
        isIE = /MSIE/i.test(navigator.userAgent);

    var cssPropertyPrefix = isWebKit ? '-webkit-' : isMoz ? '-moz-' : isOpera ? '-o-' : isIE ? '-ms-' : '',
        transitionEnd = isWebKit ? 'webkitTransitionEnd' : isMoz ? 'transitionend' : isOpera ? 'oTransitionEnd' : isIE ? 'MSTransitionEnd' : '',
        animationEnd = isWebKit ? 'webkitAnimationEnd' : isMoz ? 'animationend' : isOpera ? 'oAnimationEnd' : isIE ? 'MSAnimationEnd' : '';

    var wait = setTimeout,
        bind = addEventListener,
        unbind = removeEventListener;

    var basic = function(container, next, current, options, deferred) {
        deferred = deferred || new Deferred();

        domClass.remove(next.domNode, 'is-visible');

        next.placeAt(container);

        deferred.progress(0);

        wait(function() {
            if (current)
            {
                domClass.remove(current.domNode, 'is-visible');
            }

            domClass.add(next.domNode, 'is-visible');

            deferred.progress(1);
            deferred.resolve(true);
        }, 0);

        return deferred;
    };

    var singleAxisAnimationTransition = function(inCls, outCls, revInCls, revOutCls) {
        return function(container, next, current, options, deferred) {
            options = options || {};
            deferred = deferred || new Deferred();

            var slideInCls = options.reverse
                    ? revInCls
                    : inCls,
                slideOutCls = options.reverse
                    ? revOutCls
                    : outCls;

            if (next)
            {
                domClass.remove(next.domNode, 'is-visible');

                next.placeAt(container);
            }

            deferred.progress(0);

            var onCompleteSignal = on((next || current).domNode, animationEnd, function() {
                onCompleteSignal.remove();

                if (current)
                {
                    domClass.remove(current.domNode, slideOutCls);
                }

                if (next)
                {
                    domClass.replace(next.domNode, 'is-visible', slideInCls);
                }

                deferred.progress(1);
                deferred.resolve(true);
            });

            if (current)
            {
                domClass.replace(current.domNode, slideOutCls, 'is-visible');
            }

            if (next)
            {
                domClass.add(next.domNode, slideInCls);
            }

            return deferred;
        };
    };

    var slideAnimationTransition = singleAxisAnimationTransition('fx-slide-r-in', 'fx-slide-r-out', 'fx-slide-l-in', 'fx-slide-l-out');
    var zoomAnimationTransition = singleAxisAnimationTransition('', 'fx-zoom-out', '', '');

    return lang.setObject('Sage.Platform.Mobile.Transition', {
        START: 0,
        END: 1,
        basic: basic,
        slide: slideAnimationTransition,
        zoom: zoomAnimationTransition,

        /**
         *
         * @param name
         * @param [fallback]
         * @return {*}
         */
        findByName: function(name, fallback) {
            return this[name] || ((fallback !== false) && basic);
        }
    });
});