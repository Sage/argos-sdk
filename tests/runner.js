require({
    packages: [
        {
            name: 'argos',
            location: '../../../src'
        },
        {
            name: 'moment',
            location: '../../moment',
            main: 'moment'
        },
        {
            name: 'Simplate',
            location: '../../../libraries',
            main: 'Simplate'
        }
    ]
});

// Globals
require(['Simplate'], function() {
});


// Plugins / extensions
require(['doh/runner', 'dojo/_base/lang', 'dojo/aspect', 'argos-tests/lib/Spy'], function(doh, lang, aspect, Spy) {
    lang.mixin(doh, {
        spies: [],
        /**
         * The best tests are the ones that test only a single aspect, often functions call other functions and makes
         * this goal hard to achieve. That's where spyOn comes in - you "spy on" a given objects method then when your
         * test code calls that spied function instead of calling the original it calls the empty spy method.
         *
         * This allows tracking to take place, then asserting that a spy was called/not called or called with certain
         * arguments.
         *
         * Further, instead of calling an empty spy function you can customize that to:
         *
         * * call empty function
         * * call and return a specific value (i.e. just return true or false)
         * * call a completely different function
         * * call and raise an exception
         *
         * Examples:
         *
         *     // foo.js
         *     var foo = { bar: function() { alert('I am executing');  } };
         *
         *     // tests/foo.js With empty function
         *     runTest: function() {
         *         var myFoo = this.foo; // or new foo(), however your object is
         *
         *         var spy = doh.spyOn(myFoo, 'bar');
         *
         *         foo.bar(); // no alert happens!
         *
         *         doh.assertWasCalled(spy); // is true, and test passes
         *     }
         *
         *     // tests/foo.js With explicit return
         *     runTest: function() {
         *         var myFoo = this.foo; // or new foo(), however your object is
         *
         *         var spy = doh.spyOn(myFoo, 'bar').andReturn('Explicit');
         *
         *         var result = foo.bar(); // no alert happens!
         *
         *         doh.assertWasCalled(spy); // is true
         *         doh.assertEqual(result, 'Explicit'); // also true, test passes
         *     }
         *
         *
         * @param o
         * @param methodName
         * @return {Function}
         */
        spyOn: function(o, methodName) {
            if (!o)
                throw doh._AssertFailure("spyOn could not find an object to spy upon for: " + methodName + "()");
            if (!o[methodName])
                throw doh._AssertFailure("spyOn could not find method: " + methodName + "() on given object");
            if (o[methodName].isSpy)
                throw doh._AssertFailure("spyOn cannot spy on an existing spy for " + methodName + "() on given object");

            var spyObj = function() {
                spyObj.wasCalled = true;
                spyObj.callCount++;
                var args = Array.prototype.slice.call(arguments);
                spyObj.mostRecentCall.object = this;
                spyObj.mostRecentCall.args = args;
                spyObj.argsForCall.push(args);
                spyObj.calls.push({object: this, args: args});
                return spyObj.plan.apply(this, arguments);
            };

            var spy = new Spy(methodName);

            for (var prop in spy)
            {
                spyObj[prop] = spy[prop];
            }

            spyObj.reset();

            this.spies.push(spyObj);
            spyObj.baseObj = o;
            spyObj.methodName = methodName;
            spyObj.originalValue = o[methodName];

            o[methodName] = spyObj;

            return spyObj;
        },
        removeAllSpies: function() {
            for (var i  = 0; i < this.spies.length; i++)
            {
                var spy = this.spies[i];
                spy.baseObj[spy.methodName] = spy.originalValue;
            }
            this.spies = [];
        },
        assertWasCalled: function(spy) {
            if (arguments.length > 1)
                throw doh._AssertFailure("assertWasCalled failed because it only handles 1 argument (a Spy), use assertWasCalledWith");
            if (!spy || !spy.isSpy)
                throw doh._AssertFailure("assertWasCalled must be called on a Spy (argos-test.lib.Spy)");

            return spy.wasCalled;
        },
        assertWasNotCalled: function(spy) {
            if (!spy || !spy.isSpy)
                throw doh._AssertFailure("assertWasNotCalled must be called on a Spy (argos-test.lib.Spy)");

            return !spy.wasCalled;
        },
        assertWasCalledWith: function(spy, args) {
            if (!spy || !spy.isSpy)
                throw doh._AssertFailure("assertWasCalledWith must be called on a Spy (argos-test.lib.Spy)");
            if (arguments.length !== 2)
                throw doh._AssertFailure("assertWasCalledWith failed because it must have 2 arguments (a Spy and array of args)");
            if (!spy.wasCalled)
                throw doh._AssertFailure("assertWasCalledWith failed because the Spy was never called");

            return doh._arrayEq(args, spy.argsForCall);
        }
    });
    aspect.after(doh, '_testFinished', lang.hitch(doh, doh.removeAllSpies));

});


// Shims
require(['argos/CustomizationSet'], function(CustomizationSet) {
    window.App = {
        customizations : new CustomizationSet()
    }
});

