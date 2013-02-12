/**
 * Defines a Spy object that contains and tracks references of the stub it is spying on
 *
 * Adopted from: https://github.com/pivotal/jasmine, MIT Licensed (https://github.com/pivotal/jasmine/blob/master/MIT.LICENSE)
 *
 */
define('argos-tests/lib/Spy', [
    'dojo/_base/declare'
], function(
    declare
) {
    return declare('argos-tests.lib.Spy', [], {
        /**
         * Generic id
         */
        name: null,

        /**
         * Function to be called, defaults to empty stub can also be faked or original function it is spying on
         */
        plan: function() {},

        mostRecentCall: {},
        argsForCall: [],
        calls: [],

        /**
         * Host original object that contains the method being spied on
         */
        baseObj: null,

        /**
         * String name of the method being spied on
         */
        methodName: null,

        /**
         * Reference to the original non modified method that is being spied on
         */
        originalValue: null,

        /**
         * Flag for determining it is indeed a Spy, quicker than testing instanceOf
         */
        isSpy: true,

        constructor: function(name) {
            this.name = name;
        },

        /**
         * Spies but still calls the original function. This allows for the function to execute as normal but
         * we also get to track the calls.
         * @return {*}
         */
        andCallThrough: function() {
            this.plan = this.originalValue;
            return this;
        },

        /**
         * Instead of an empty stub, force the stub to return a given value. Useful for mocking functions and testing
         * different results.
         * @param value
         * @return {*}
         */
        andReturn: function(value) {
            this.plan = function() {
                return value;
            };
            return this;
        },

        /**
         * Forces the function to throw an exception
         * @param exceptionMsg
         * @return {*}
         */
        andThrow: function(exceptionMsg) {
            this.plan = function() {
                throw exceptionMsg;
            };
            return this;
        },

        /**
         * Instead of calling the original function, or an empty stub it instead calls the passed function in its place
         * @param fakeFunc
         * @return {*}
         */
        andCallFake: function(fakeFunc) {
            this.plan = fakeFunc;
            return this;
        },

        /**
         * Clears all values
         */
        reset: function() {
            this.wasCalled = false;
            this.callCount = 0;
            this.argsForCall = [];
            this.calls = [];
            this.mostRecentCall = {};
        }
    });
});