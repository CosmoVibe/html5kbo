var logData = true;

// decides what time it is in the song
class Timeline {
	constructor(src, offset) {
		this.src = src;
		// set this to true once the song is fully loaded
		this.readyToPlay = false;
		
		// the time at which the chart begins
		// customizable, as it can be set based on the chart's gap
		this.start = 0;
		// end of the chart
		this.end = 1000;
		
		this.offset = offset;
		
		// current position of the music track (in milliseconds)
		this.position = 0;
		// tracks where the song should have started had we started playing from the beginning
		this.lastStart = -1;
		// tracks whether the timeline should be playing
		this.playing = false;
		// tracks whether the song should be playing
		this.posSign = true;
		
		// this allows the callback function to point to this Timeline instance
		var ref = this;
		
		// initialize music instance
		this.song = createjs.Sound.createInstance(src);
		ref.readyToPlay = true;
	}
	
	// play the song
	play() {
		this.playing = true;

		// calculate when the song would have started playing
		this.lastStart = Date.now()-this.position;

		// song should not be playing just yet
		if (this.position < 0) {
			// stop the song immediately
			createjs.Sound.stop();
			this.posSign = false;
		} else {
			// if the song is to play, set it to the correct position and play it
			this.song.play();
			this.song.position = this.position;
			this.posSign = true;
		}
	}
	
	// stop the song
	stop() {
		createjs.Sound.stop();
		this.playing = false;
	}
	
	// skip ahead a certain amount of time
	skip(seconds) {
		this.setPosition(this.position+seconds-this.offset);
	}

	// set the position of the timeline
	setPosition(pos) {
		this.position = pos + this.offset;
		this.play();
	}
	// get the position of the timeline
	getPosition() {
		return this.position - this.offset;
	}
	// tick update by frame
	update() {
		// if the timeline is playing, update position and check to see if it should be playing
		if (this.playing) {
			// calculate the current time in the timeline
			this.position = Date.now()-this.lastStart;
			// song isn't playing and it should be
			if (this.posSign == false && this.position >= 0) {
				this.play();
			}
		}
		// stop once we reach the end
		if (this.position > this.end) {
			this.position = this.end;
			this.stop();
		}
		// prevent seeking before the beginning
		if (this.position < this.start) {
			this.position = this.start;
		}
	}
}


// Note object
//
// Holds information about the note relative to the level data as well as its current state during gameplay
//
// Depending on the note type, will require different properties:
//	tap/mine:
//		pos (required):			position of the note on the notetrack
//		div (required):			what beat division it is
//		col (required):			which column it appears in
//		time (required):		the time in the song that the note appears
//		alive:					used during gameplay, track if the note has been hit (combo'ed) already
//		registered:				used during gameplay, track if there has been an attempt hit on the note
//		onScreen:				used during gameplay, track if the note is currently visible on the screen
//	hold:
//		pos (required):			position of the hold's start on the notetrack
//		div (required):			what beat division it is
//		col (required):			which column it appears in
//		time (required):		the time in the song that the hold appears
//		end (required*):		where the hold ends (position on the notetrack)
//		endtime (required*):	the time in the song that the hold ends
//		alive:					used during gameplay, track if the note has been hit (combo'ed) already
//		registered:				used during gameplay, track if there has been an attempt hit on the note
//		active:					used during gameplay, tells if the beginning of the hold is registered and the hold is not yet completed
//		held:					used during gameplay, tells if it is currently being held down
//		lastRelease:			used during gameplay, tracks the last time the hold was released
//		onScreen:				used during gameplay, track if the note is currently visible on the screen
//
// * - indicates that while the property is required, does not need to be declared on initialization, can be updated later
//
class Note {
	constructor(type, props) {
		this.type = type;
		this.pos = props.pos;
		this.div = props.div;
		this.col = props.col;
		this.time = props.time;
		this.alive = true;
		this.registered = false;
		this.onScreen = false;	// we don't draw everything to begin with

		// special properties depending on note type
		switch (type) {
			case 'tap':
				break;
			case 'hold':
				//this.end = props.end;
				//this.endTime = props.endTime;
				this.active = false;
				this.held = false;
				this.lastRelease = -1;
				break;
			case 'mine':
				break;
			default:
				break;
		}
	}
	
	// use this to update holds with "end" and "endTime" properties
	updateProps(props) {
		for (var prop in props) {
			this[prop] = props[prop];
		}
	}
	
	// attach graphics to the note
	attachGfx(gfxObj) {
		this.gfxObj = gfxObj;
	}
	
	// reset the note's gameplay states
	resetState() {
		this.alive = true;
		this.registered = false;
		if (this.type === 'hold') {
			this.active = false;
			this.held = false;
			this.lastRelease = -1;
		}
	}
}


// holds the positions of all of the notes
//
// The general process is thus:
//		1. use the sync BPM change and stops to find the time at which the notes appear
//		2. map that time data to the custom scroll speed and scroll stops, which mark the position of the entire notetrack
//		(future optimization) using both the sync and the notetrack position to calculate the checkpoints at where the notes will be
//		3. calculate the note positions
//
// How the methods and properties are used:
//		- timeToTrackPosition(time): gives you the notetrack position for a given point in time
//		- notes: gives all of the note data, including the time at which the note appears 
class Notetrack {
	constructor(
		notedata,
		gap=0,
		syncBPMList=[[0,60]],
		syncStopList=[],
		scrollModList=[[0,1]],
		scrollStopList=[]
	) {
		this.position = 0;						// notetrack position used for scroll speed mod
		this.notedata = notedata;				// holds information about every note
		this.gap = gap;							// defined as what position in time does the notetrack begin
		this.syncBPMList = syncBPMList;			// array of [beat, BPM] for sync alignment of notes
		this.syncStopList = syncStopList;		// array of [beat, seconds] for sync alignment of notes
		this.scrollModList = scrollModList;		// array of [beat, multiplier] for scroll speed modulation
		this.scrollStopList = scrollStopList;	// array of [beat, beats] for scroll speed modulation
	
		// process level data
		
		// generation functions (pre-calculations)
		this.syncTiming = this.generateSync();					// (time in sec, beat, syncBPM)
		this.scrollTiming = this.generateTrackPositions();		// (beat, position of track, scroll speed)
		//this.notePositions = this.generateNotePositions();	// (beat, position of note, scroll speed)
		
		// calculation functions
		this.mines = [];										// holds the mines separate from the notes
		this.lastBeat = 0;
		this.notes = this.calculateNotes();						// calculate the positions and properties of all note objects
		
	}

	// generate the times at which each beat lines up
	// returns elements (time in sec, beat, syncBPM)
	generateSync() {
		// record all the sync timings
		var syncTiming = [];
		// hold reference to the current instance
		var ref = this;
		
		var curTime = -this.gap;							// tracks the current time
		var curBeat = 0;									// tracks the current beat
		var curBPM = this.syncBPMList[0][1];				// tracks the current BPM

		var i_max = this.syncBPMList.length-1;				// very last sync bpm change
		var j = 0;											// sync stop index
		var j_max = this.syncStopList.length;				// very last sync stop
		
		syncTiming.push([curTime, curBeat, curBPM]);		// initialize the first timing entry

		// go through each bpm change
		for(var i = 0; i < this.syncBPMList.length; i++){

			// hold the old values for convenience
			var bpmStart = curTime;		// time at which this bpm starts
			var timeStopped = 0;		// sum of all the time stops for this bpm

			// this condition checks if we calculate the next sync stop
			while(
				(j < j_max) &&												// there are more sync stops to be calculated
				((i == i_max) ||											// we are at the last bpm change, finish calculating the rest of the sync stops
				(this.syncStopList[j][0] <= this.syncBPMList[i+1][0]))		// found sync stop before next bpm change
			){
				// update current beat number
				timeStopped += ref.syncStopList[j][1];
				// calculate the time where the sync stop starts
				curTime += elapsed( ref.syncStopList[j][0] - curBeat, ref.syncBPMList[i][1] );
				curBeat = ref.syncStopList[j][0];
				syncTiming.push([curTime, curBeat, 0]);
				// calculate the time where the sync stop ends
				curTime += ref.syncStopList[j][1];
				if ( // if the stop is on top of the bpm change, we don't need to include the end  (immediately overwritten)
					!((i != i_max) && (ref.syncStopList[j][0] == ref.syncBPMList[i+1][0]))
				) {
					syncTiming.push([curTime, curBeat, curBPM]);
				}
				j++;
			}
			
			// if we are not at the end of the sync bpm changes, calcuate the start time of the next one
			if (i != i_max) {
				curTime += elapsed(this.syncBPMList[i+1][0]-curBeat,curBPM);
				curBeat = this.syncBPMList[i+1][0];
				curBPM = this.syncBPMList[i+1][1];
				syncTiming.push([curTime, curBeat, curBPM]);
			}
		}

		if (logData) {
			console.log('sync timing: (time in sec, beat, syncBPM)');
			console.log(syncTiming);		
		}
		return syncTiming;
	}
	
	// convert a beat number to its corresponding time
	beatToTime(beat){
		// find the particular sync timing entry that is relevant
		var i = 1;
		while(i < this.syncTiming.length && this.syncTiming[i][1] < beat){
			i++;
		}
		// beat is exactly at a sync bpm change or sync stop
		if(this.syncTiming[i-1][1] === beat){
			return this.syncTiming[i-1][0];
		}
		// beat is not exactly at a change, and needs to be calculated
		else{
			var startingTime = this.syncTiming[i-1][0];
			var beatsSinceStartingTime = beat - this.syncTiming[i-1][1];
			var timeOfBeats = 60*beatsSinceStartingTime/this.syncTiming[i-1][2];
			return startingTime + timeOfBeats;
		}
	}

	// generate the positions and speeds of the note track
	// returns elements (beat, position of track, scroll speed, time)
	generateTrackPositions() {
		var scrollTiming = [];
		
		// hold reference to the current instance
		var ref = this;
		
		var curBeat = 0;							// track current beat
		var curSpeed = this.scrollModList[0][1];	// track current speed
		var curTime = this.beatToTime(0);			// track current time
		var curPos = 0;								// track current pixel position
		
		var i_max = this.scrollModList.length-1;	// last scroll speed change
		var j = 0;									// index of scroll stop
		var j_max = this.scrollStopList.length;		// amount of scroll stops
		
		// first entry
		scrollTiming.push([curBeat, curPos, curSpeed, curTime]);
		
		// go through each scroll speed change
		for (var i=0; i <= i_max; i++) {
			// update the current speed
			curSpeed = this.scrollModList[i][1];
			
			// check for scroll stops
			while (
				(j < j_max) &&													// there are more scroll stops to be calculated
				((i == i_max) ||												// we are at the last scroll change, finish calculating the rest of the scroll stops
				(this.scrollStopList[j][0] <= this.scrollModList[i+1][0]))		// found sync stop before next bpm change
			) {
				// update the current position
				var newBeat = this.scrollStopList[j][0];
				var newTime = this.beatToTime(newBeat);
				var timeElapsed = newTime - curTime;
				curPos += timeElapsed*1000*curSpeed;
				
				// update the current beat and time
				curBeat = newBeat;
				curTime = newTime;
				
				// add the new scroll stop entry
				scrollTiming.push([curBeat, curPos, 0, curTime]);

				// calculate the new beat and time
				curBeat += this.scrollStopList[j][1];
				curTime = this.beatToTime(curBeat);
				
				// add the continuation of the track scroll
				if ( // if the stop is on top of the next scroll speed change, we don't need to include it (immediately overwritten)
					!((i != i_max) && (ref.scrollStopList[j][0] == ref.scrollModList[i+1][0]))
				) {
					scrollTiming.push([curBeat, curPos, curSpeed, curTime]);
				}
				j++;
			}
			
			// if we are not at the end of the scroll speed changes, calcuate the start position of the next one
			if (i != i_max) {
				// make sure we haven't already extended into the next speed change due to the scroll stop
				if (curBeat < this.scrollModList[i+1][0]) {
					// update the current position
					var newTime = this.beatToTime(this.scrollModList[i+1][0]);
					var timeElapsed = newTime - curTime;
					curPos += timeElapsed*1000*curSpeed;
					// update the current beat and time
					curBeat = this.scrollModList[i+1][0];
					curTime = this.beatToTime(curBeat);
				}
				scrollTiming.push([curBeat, curPos, this.scrollModList[i+1][1], curTime]);
			}
		}
		
		if (logData) {
			console.log('scroll timing: (beat, position of track, scroll speed, time)');
			console.log(scrollTiming);
		}
		return scrollTiming;
	}
	
	
	// this will be used every frame to determine where the note track should be
	// convert a time to a position of the note track
	timeToTrackPosition(time){
		// first find the scroll timing entry for the beat we want
		function checkRange(low, high, sT) {
			if (low == high) return low;
			
			var mid = Math.trunc((high+low)/2);
			
			if (sT[mid][3] <= time) {
				return checkRange(mid+1, high, sT);
			} else {
				return checkRange(low, mid, sT);
			}
		}
		var i = checkRange(0, this.scrollTiming.length, this.scrollTiming);
		if (i > 0) {
			i--;
		}
		// start from the position of the last scroll position we know
		var startPos = this.scrollTiming[i][1];
		var scrollSpeed = this.scrollTiming[i][2];
		// calculate the difference in time
		var timeDiff = time - this.scrollTiming[i][3];
		// calculate the final position
		return startPos + timeDiff*scrollSpeed*1000;
	}

	// convert a beat number to its position on the notetrack
	beatToNotePosition(beat){
		
		// first find the note position entry for the beat we want
		var i = 0;
		while(i < this.scrollTiming.length && this.scrollTiming[i][0] < beat){
			i++;
		}
				
		// the beat is exactly at the note position entry already
		if (i < this.scrollTiming.length && this.scrollTiming[i][1] === beat) {
			return this.scrollTiming[i][1];
		}

		// otherwise, get the previous entry
		if (i > 0) {
			i--;
		}
		
		// get the starting values at the beginning of the entry
		var startingBeat = this.scrollTiming[i][0];
		var startingPos = this.scrollTiming[i][1];
		var scrollSpeed = this.scrollTiming[i][2];
		// calculate the dist travelled until the beat we want
		var timeDiff = this.beatToTime(beat)-this.beatToTime(startingBeat);
		var dist = timeDiff*scrollSpeed*1000;
		
		return startingPos + dist;
	}
	
	
	// return all of the notes on the notetrack
	//
	// return format:
	//	array of length equal to key count: each element holds all the note objects for the corresponding column
	//		each array element holds an array of Note objects
	calculateNotes() {
		// determine the number of keys
		this.keyCount = this.notedata[0][0].length;
		var notes = [];
		for (var k = 0; k < this.keyCount; k++) {
			notes.push([]);
			this.mines.push([]);
		}
		
		// reference to the level object
		var ref = this;
		
		// iterate through all measures
		for (var m = 0; m < this.notedata.length; m++) {
			// hold the measure data (array of divs)
			var measure = this.notedata[m];

			// iterate through all divs
			for (var d = 0; d < measure.length; d++) {
				// hold the div (array of notes for a given beat position)
				var div = measure[d];

				// calculate the number of beats up to this point
				var beats = 4*m + 4*d/measure.length;
				if (beats > this.lastBeat) {
					this.lastBeat = beats;
				}
				var position = this.beatToNotePosition(beats);

				// iterate through columns
				for (var col = 0; col < div.length; col++) {

					// end of a hold note
					if (div[col] === '3') {
						var lastNote = notes[col][notes[col].length-1];
						lastNote.updateProps({
							'end': position,							// this is where the hold ends
							'endTime': ref.beatToTime(beats)			// this is when the hold ends
						});
						
						continue;
					}

					// create the note baseline
					var noteProps = {
						pos: position,									// calculate position of the note on the notetrack
						div: measure.length / gcd(measure.length/4, d),	// calculate what note division it is
						col: col,										// log which column the note is on, just in case
						time: ref.beatToTime(beats),					// the time in the song that the note appears
					};
					
					// tap notes
					if (div[col] === '1') {
						notes[col].push(new Note('tap',noteProps));
					}
					// hold notes
					else if (div[col] === '2') {
						notes[col].push(new Note('hold',noteProps));
					}
					// mines
					else if (div[col] === 'M') {
						this.mines[col].push(new Note('mine',noteProps));
					}
				}
			}
		}
		
		if (logData) {
			console.log('note data:')
			console.log(notes);
			console.log(this.mines);
		}
		return notes;
	}


	// WORK IN PROGRESS
	// Low priority - the purpose of this function is to dramatically reduce the number of calculations required in the precalculation of note positions
	//
	// generate the outline for where note positions are
	// returns elements (beat, position of note, scroll speed)
	/*generateNotePositions() {
		var notePositions = [];
		
		// setup intial values
		var curBeat = 0;							// tracks current beat
		var curTime = this.syncTiming[0][0];		// tracks current time
		var curSpeed = this.scrollTiming[0][2];		// tracks current scroll speed
		var curPos = 0;								// tracks current position in pixels
		
		var j = 1;									// index of scroll speed changes
		var i_max = this.syncTiming.length;			// number of sync timing entries
		var j_max = this.scrollTiming.length;		// number of scroll timing entries
		
		// first entry
		notePositions.push([0, curPos, curSpeed]);
		
		// iterate through each sync timing entry
		for (var i = 0; i < i_max; i++) {

			// check for changes in the scroll speed
			while (
				(j < j_max) &&													// there are more scroll changes to be calculated
				((i+1 === i_max) ||												// we are at the last scroll change, finish calculating the rest of the scroll changes
				(this.scrollTiming[j][0] <= this.syncTiming[i+1][1]))			// found scroll speed change before next sync timing change
			) {

				// update new values
				curBeat = this.scrollTiming[j][0];
				var newTime = this.beatToTime(curBeat);
				curPos += (newTime-curTime)*curSpeed*1000;
				curTime = newTime;
				curSpeed = this.scrollTiming[j][2];

				// add the new entry
				notePositions.push([curBeat, curPos, curSpeed]);

				// next scroll speed change
				j++;
			}
			
			// add the next entry
			if (i !== i_max-1) {	// make sure something comes after this
				curPos += (this.syncTiming[i+1][0]-curTime)*curSpeed*1000;
				curTime = this.syncTiming[i+1][0];
				curBeat = this.syncTiming[i+1][1];

				// make sure we're not doubling up on entries we've already put in
				var lastNotePosition = notePositions[notePositions.length-1];
				var newNotePosition = [curBeat, curPos, curSpeed];
				var same = true;
				for (var k = 0; k < lastNotePosition.length; k++) {
					if (lastNotePosition[k] !== newNotePosition[k]) {
						same = false;
						break;
					}
				}
				if (!same) {
					notePositions.push([curBeat, curPos, curSpeed]);
				}
			}
		}
		
		console.log('note position timings: (beat, position of note, scroll speed)');		
		console.log(notePositions);
		return notePositions;
	}*/
}


/*

NEED TO UPDATE THIS


==========Inputs==========

gap : 			time position from which the beginning of the level occurs

scrollspeed : 		the base rate of number of pixels the note track will travel per second

syncBPMList : 		an array of BPM changes, each BPM change is represented as an array of length 2, sorted by time position
	[ beatPosition, BPM ]
		beatPosition : 	decimal representing the beat number at which the BPM change occurs
		BPM : 		BPM value that will be set for the given beat position until the end of the level or the next BPM change, whichever comes first
		
syncStopList : 		an array of stop intervals, each stop interval is represented as an array of length 2, sorted by time position
	[ beatPosition, stopInterval ]
		beatPosition : 	decimal representing the beat number at which the stop interval occurs
		stopInterval : 	the number of beats to add to the current time count
		
scrollModList : 	an array of BPM changes, each BPM change is represented as an array of length 2, sorted by time position
	[ beatPosition, rate ]
		beatPosition : 	decimal representing the beat number at which the BPM change occurs
		rate : 		multiplier of the base scroll speed set to change the scroll speed of the note track
		
scrollStopList : 	an array of stop intervals, each stop interval is represented as an array of length 2, sorted by time position
	[ beatPosition, stopInterval ]
		beatPosition : 	decimal representing the beat number at which the stop interval occurs
		stopInterval : 	the number of beats to freeze the note track for

*/