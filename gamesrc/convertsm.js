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

	// get the raw data
	var raw = readTextFile(filepath);
<<<<<<< Updated upstream
	var lines = raw[0].split(';');
	
=======
	
	// remove comments and split by line
	var rawlines = raw[0].split('\n');
	for (var k = 0; k < rawlines.length; k++) {
		rawlines[k] = rawlines[k].split('//')[0].trim();
	}
	var rawtext = rawlines.join('\n');
	var lines = rawtext.split(';');
	
>>>>>>> Stashed changes
	props.lastUpdated = raw[1];													// last updated
	
	// file path related properties
	var rootpath = filepath.split('/');
	props.foldername = rootpath[rootpath.length-2];								// folder name
	props.smfile = rootpath[rootpath.length-1];									// sm file name
	props.dwifile = props.smfile.substring(0,props.smfile.length-2)+'dwi';		// dwi file name
	rootpath[rootpath.length-1] = '';
	props.rootpath = rootpath.join('/');										// root folder
	
	props.levels = {
		'4k': [],
		'6k': [],
		'8k': []
	};
	
	for (var rawline of lines) {
		var line = rawline.trim();
		line = line.split(':');
		var prop = line[0].split('#');
		prop = prop[prop.length-1];
		var value = line.slice(1,line.length).join(':').trim();
		
		// get rid of blank property
		if (!prop) {
			continue;
		}
		
		// specific properties that require more handling
		switch (prop) {
			case 'BPMS':
				var bpms = [];
				var rawbpms = value.split(',');
				for (var rawbpm of rawbpms) {
					var bpm = rawbpm.trim().split('=');
					bpm[0] = +bpm[0];
					bpm[1] = +bpm[1];
					bpms.push(bpm);
				}
				props[prop] = bpms;
				break;
			case 'STOPS':
				var stops = [];
				var rawstops = value.split(',');
				for (var rawstop of rawstops) {
					var stop = rawstop.trim().split('=');
					if (stop.length === 1) {
						continue;
					}
					stop[0] = +stop[0];
					stop[1] = +stop[1];
					stops.push(stop);
				}
				props[prop] = stops;
				break;
			case 'XMODBPMS':
				var bpms = [];
				var rawbpms = value.split(',');
				for (var rawbpm of rawbpms) {
					var bpm = rawbpm.trim().split('=');
					bpm[0] = +bpm[0];
					bpm[1] = +bpm[1];
					bpms.push(bpm);
				}
				props[prop] = bpms;
				break;
			case 'XMODSTOPS':
				var stops = [];
				var rawstops = value.split(',');
				for (var rawstop of rawstops) {
					var stop = rawstop.trim().split('=');
					if (stop.length === 1) {
						continue;
					}
					stop[0] = +stop[0];
					stop[1] = +stop[1];
					stops.push(stop);
				}
				props[prop] = stops;
				break;
			case 'NOTES':
				var chart = {};
				// split out the chart properties first
				var setup = value.split(':');
				var type = setup[0].trim();
				// check for number of columns
				switch (type) {
					case 'dance-single':
						var cols = 4;
						break;
					case 'dance-solo':
						var cols = 6;
						break;
					case 'dance-double':
						var cols = 8;
						break;
					default:
						var cols = 6;
						break;
				}
				// other properties
				chart.level = setup[2].trim();
				chart.diff = +(setup[3].trim());
				// notes
				var rawmeasures = setup[setup.length-1].split(',');
				var measures = [];
				for (var rawmeasure of rawmeasures) {
					var measureraw = '';
					// concat all lines after trimming
					var rawmeasurelines = rawmeasure.split('\n');
					for (var rawmeasureline of rawmeasurelines) {
						measureraw += rawmeasureline.trim();
					}
					// split by number of columns
					var measure = [];
					for (var k = 0; k < measureraw.length; k+=cols) {
						measure.push(measureraw.slice(k,k+cols));
					}
					measures.push(measure);
				}
				chart.notes = measures;
				// add it to the final object
				var mode = ''+cols+'k';
				props.levels[mode].push(chart);
				break;
			case 'OFFSET':
			case 'SAMPLELENGTH':
			case 'SAMPLESTART':
				props[prop] = +value;
				break;
			default:
				props[prop] = value;
				break;
		}
	}
	
	return props;
}