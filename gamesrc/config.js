// timing windows

var judgmentWindows = {
	'Marvelous': 22.5,
	'Perfect': 45,
	'Great': 90,
	'Good': 135,
	'Bad': 180,
	'Hold': 250,
	'Roll': 500,
	'Mine': 75
}

function timingToJudgment(time) {
	var diff = Math.abs(time);
	if (diff > judgmentWindows['Bad']) {
		return {
			name: 'Miss',
			color: 'red',
			combo: false
		};
	} else if (diff <= judgmentWindows['Marvelous']) {
		return {
			name: 'Marvelous',
			color: 'white',
			combo: true
		};
	} else if (diff <= judgmentWindows['Perfect']) {
		return {
			name: 'Perfect',
			color: 'yellow',
			combo: true
		};
	} else if (diff <= judgmentWindows['Great']) {
		return {
			name: 'Great',
			color: 'green',
			combo: true
		};
	} else if (diff <= judgmentWindows['Good']) {
		return {
			name: 'Good',
			color: 'cyan',
			combo: false
		};
	} else if (diff <= judgmentWindows['Bad']) {
		return {
			name: 'Bad',
			color: 'purple',
			combo: false
		};
	}
}

// note rhythm colors
function divisionToColor(value) {
	switch (value) {
		case 4:
			// red
			return '#ff3300';
		case 8:
			// blue
			return '#3385ff';
		case 16:
			return 'yellow';
		case 32:
			return 'orange';
		case 12:
			// purple
			return '#cc33ff';
		case 24:
			// pink
			return '#ff99ff';
		case 48:
			return 'cyan';
		default:
			// green
			return '#00e600';
	}
}