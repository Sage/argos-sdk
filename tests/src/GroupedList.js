define([
    "doh/runner",
    "dojo/dom-class",
    "argos/GroupedList"
], function(
    doh,
    domClass,
    GroupedList
) {
    doh.register("argos-tests/src/GroupedList", [
        {
            name: 'AddCollapsedTagToToggledUnCollapsedNode',
            setUp: function() {
                this.groupedList = new GroupedList();
            },
            runTest: function() {
                var node = document.createElement('div');
                this.groupedList.toggleGroup({fake:'Event'}, node);

                doh.assertTrue(domClass.contains(node, 'is-collapsed'));
            },
            tearDown: function() {
                this.groupedList.destroy();
            }
        },
        {
            name: 'RemoveCollapsedTagToToggledCollapsedNode',
            setUp: function() {
                this.groupedList = new GroupedList();
            },
            runTest: function() {
                var node = document.createElement('div');
                domClass.add(node, 'is-collapsed');

                this.groupedList.toggleGroup({fake:'Event'}, node);

                doh.assertFalse(domClass.contains(node, 'is-collapsed'));
            },
            tearDown: function() {
                this.groupedList.destroy();
            }
        },
        {
            name: 'CallsOnContentChangeWhenToggleGroup',
            setUp: function() {
                this.groupedList = new GroupedList();
            },
            runTest: function() {
                var spy = doh.spyOn(this.groupedList, 'onContentChange');

                this.groupedList.toggleGroup();

                doh.assertWasCalled(spy);
            },
            tearDown: function() {
                this.groupedList.destroy();
            }
        },
    ]);
});