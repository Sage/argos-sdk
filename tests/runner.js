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

// Shims

require(['argos/CustomizationSet'], function(CustomizationSet) {
    window.App = {
        customizations : new CustomizationSet()
    }
});


