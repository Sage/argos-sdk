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

    var slideWithCssAnimation = function(container, next, current, options, deferred) {
        deferred = deferred || new Deferred();

        domClass.remove(next.domNode, 'is-visible');

        next.placeAt(container);

        deferred.progress(0);

        var onCompleteSignal = on(next.domNode, animationEnd, function() {
            onCompleteSignal.remove();

            if (current)
            {
                domClass.remove(current.domNode, 'is-visible fx-slide-h-out');
            }

            domClass.add(next.domNode, 'is-visible');
            domClass.remove(next.domNode, 'fx-slide-h-in');

            deferred.progress(1);
            deferred.resolve(true);
        });

        if (current)
        {
            domClass.add(current.domNode, 'fx-slide-h-out');
        }

        domClass.add(next.domNode, 'fx-slide-h-in');

        return deferred;
    };

    return lang.setObject('Sage.Platform.Mobile.Transition', {
        START: 0,
        END: 1,
        basic: basic,
        slideWithCssAnimation: slideWithCssAnimation
    });
});