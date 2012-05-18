define('Sage/Platform/Mobile/Charts/SageTheme', [
    'dojox/charting/Theme',
    'dojox/charting/themes/gradientGenerator'
], function(
    Theme,
    gradientGenerator
) {

    var colors = ["#00A1DE", "#c1d59f", "#a44e81", "#f8d6aa", "#55C0E9", "#69923a", "#e2afcd", "#af6200", "#80D0EF", "#35491d", "#c55e9b", "#f4c180", "#0079A7", "#86a85c", "#421f34", "#e98300", "#AAE0F4", "#4f6e2c", "#d486b4", "#754200", "#2BB1E4", "#d6e3bf", "#833f67", "#ed982b", "#00516F", "#a4bf7d", "#632f4e", "#f0ac55"],
		defaultFill = {type: "linear", space: "shape", x1: 0, y1: 0, x2: 0, y2: 100};

	var sageTheme = new Theme({
        chart: {
            titleFont: 'normal normal bold 1.5em inherit',
            titleFontColor: '#0079A7'
        },
		seriesThemes: gradientGenerator.generateMiniTheme(colors, defaultFill, 85, 65, 100)
	});

	return sageTheme;
});