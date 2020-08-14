// reads the raw text file
function readTextFile(file) {
	var output;
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function ()
	{
		if(rawFile.readyState === 4)
		{
			if(rawFile.status === 200 || rawFile.status == 0)
			{
				output = rawFile.responseText;
			}
		}
	}
	rawFile.send(null);
	if (output) return [output, rawFile.getResponseHeader('Last-Modified')];
}

// PropertyProcessing
// processes a .sm file and turns it into an object with properties
// should formally revise this later on with technical spec:
//	https://github.com/DeltaEpsilon7787/SimfileLibrary/blob/master/sm_grammar.lark
function processSM(filepath) {
	// object that will hold all the properties
	var props = {};

	// split the raw data into lines
	var raw = readTextFile(filepath);
	var lines = raw[0].split('\n');
	
	props.lastUpdated = raw[1];
	props.levels = {'4k': [], '6k': []}
	
	// file path related properties
	var rootpath = filepath.split('/');
	props.foldername = rootpath[rootpath.length-2];
	props.smfile = rootpath[rootpath.length-1];
	props.dwifile = props.smfile.substring(0,props.smfile.length-2)+'dwi';
	rootpath[rootpath.length-1] = '';
	props.rootpath = rootpath.join('/');
	
	// bool for breaking out
	var stopProcessing = false;
	for (var k in lines) {
		if (stopProcessing) break;
		// check lines with properties
		lines[k] = lines[k].trim();
		if (lines[k][0] === '#' && lines[k].includes(':') ) {
			var pv = lines[k].split(':');
			// trim the # and ; from the beginning and end
			pv[0] = pv[0].replace('#','').trim();
			if (lines[k][lines[k].length-1] === ';') {
				pv[1] = pv[1].slice(0,pv[1].length-1);
			}
			// take action depending on the property name
			switch (pv[0]) {
				case 'TITLE':
					props['name'] = pv[1];
					break;
				case 'SUBTITLE':
					props['subtitle'] = pv[1];
					break;
				case 'ARTIST':
					props['artist'] = pv[1];
					break;
				case 'BANNER':
					props['bn-filepath'] = pv[1];
					break;
				case 'BACKGROUND':
					if (pv[1]) props['bg-filepaths'] = [pv[1]];
					else props['bg-filepaths'] = [];
					break;
				case 'CDTITLE':
					props['cdtitle-filepath'] = pv[1];
					break;
				case 'MUSIC':
					props['music-filepath'] = pv[1];
					break;
				case 'OFFSET':
					props['offset'] = +pv[1];
					break;
				case 'BPMS':
					var bpms = pv[1].split(',');
					for (var j = 0; j < bpms.length; j++) {
						bpms[j] = bpms[j].split('=');
						bpms[j][0] = +bpms[j][0];
						bpms[j][1] = +bpms[j][1];
					}
					props['bpms'] = bpms;
					break;
				case 'STOPS':
					if (!pv[1]) {
						props['stops'] = [];
						break;
					}
					// check if we need to keep looking at the next line for more stops
					var checkMoreStops = false;
					if (pv[1][pv[1].length-1] !== ';') {
						checkMoreStops = true;
					}
					var rawStr = pv[1];
					if (checkMoreStops) {
						k++;
						while (lines[k].trim()[lines[k].trim().length-1] !== ';') {
							rawStr += lines[k];
							k++;
						}
						rawStr += lines[k];
					}
					var stops = rawStr.split(';')[0].split(',');
					for (var j = 0; j < stops.length; j++) {
						stops[j] = stops[j].split('=');
						stops[j][0] = +stops[j][0];
						stops[j][1] = +stops[j][1];
					}
					props['stops'] = stops;
					break;
				case 'BGCHANGES':
					// if there are bgchanges, grab all the file names
					if (pv[1]) {
						var str = pv[1];
						do {
							var bgfile = str.split('=')[1];
							if (bgfile != '-nosongbg-') {
								props['bg-filepaths'].push(bgfile);
							}
							k++;
							str = lines[k];
						} while (lines[k].trim() !== ';');
					}
					// for now, just stop all processing here
					//stopProcessing = true;
					break;
				case 'NOTES':
					// figure out what difficulties and modes have charts
					k++;
					var type;
					if (lines[k].includes('single')) type = '4k';
					else if (lines[k].includes('solo')) type = '6k';
					else console.log(props['name'] + ' has a type that is not 4k or 6k, please look into this.');
					k += 2;
					var level = lines[k].trim().replace(':', '');
					k++;
					var diff = lines[k].trim().replace(':', '');
					k += 2;
					// now we record the actual notes
					var notes = [];
					// skip bad lines
					while (lines[k][0] === ' ') {
						k++;
					}
					k--;
					// body of notes
					while (lines[k][0] !== ';') {
						k++;
						var measure = [];
						while (lines[k][0] !== ',' && lines[k][0] !== ';') {
							if (lines[k].trim()) {
								measure.push(lines[k].trim());
							}
							k++;
						}
						notes.push(measure);
					}
					// compile the full chart object
					var chart = {};
					chart.level = level;
					chart.diff = diff;
					chart.notes = notes;
					if (type) {
						props.levels[type].push(chart);
					}
					break;
			}
		}
	}
	return props;
}