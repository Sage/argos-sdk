define([
    'doh/runner',
    'argos/TitleBar'
], function(
    doh,
    TitleBar
) {
    doh.register('argos-tests.src.TitleBar', [
        {
            name: 'Can clear counts of left/right items on clear',
            runTest: function() {
                var bar = new TitleBar();
                bar._count = {left: 6, right: 3};

                bar.clear();

                doh.assertEqual(bar._count.left, 0);
                doh.assertEqual(bar._count.right, 0);
            }
        }
    ]);
});