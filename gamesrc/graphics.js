class Noteskin {
	constructor(name='default') {
		this.name = name;
		
		// depending on name of noteskin, load different graphics
		switch(name) {
			// when using these, you need to create a new shape object and import copies of these shapes
			case 'bar':
				this.baseGfx = function (color="#999999") {
					return new createjs.Graphics().beginFill("#999999").drawRoundRect(-30,-12,60,24,5,5,5,5);
				};
				this.centerGfx = function (color="#DDDDDD") {
					return new createjs.Graphics().beginFill(color).drawRoundRect(-25,-7,50,14,5,5,5,5);
				};
				this.holdGfx = function (height, color="#555555") {
					var shape = new createjs.Graphics().beginFill("#555555").drawRoundRect(-30,-12,60,24+height,5,5,5,5);
					shape.regX = -30;
					shape.height = height;
					return shape;
				};
				this.holdCenterGfx = function (height, color="#888888") {
					var shape = new createjs.Graphics().beginFill("#888888").drawRoundRect(-25,-7,50,14+height,5,5,5,5);
					shape.regX = -20;
					shape.height = height;
					return shape;
				};
				this.burstGfx = function(color="yellow") {
					var r = 35;
					var b = 23;
					var shape = new createjs.Graphics().beginFill(color);
					shape.mt(-r,-r).bt(-b,-b,-b,b,-r,r).bt(-b,b,b,b,r,r).bt(b,b,b,-b,r,-r).bt(b,-b,-b,-b,-r,-r).cp();
					return shape;
				};
				// for now, this returns the entire container rather than just the shape
				this.mineGfx = function() {
					var container = new createjs.Container();
					var orb = new createjs.Shape();
					orb.graphics.beginFill('#DDDDDD');
					orb.graphics.drawCircle(0,0,12);
					container.addChild(orb);
					var border = new createjs.Shape();
					border.graphics.beginFill('#000000');
					border.graphics.drawCircle(0,0,11);
					container.addChild(border);
					var mount = new createjs.Shape();
					mount.graphics.beginFill('#DDDDDD');
					mount.graphics.drawCircle(0,0,10);
					container.addChild(mount);
					var charge = new createjs.Shape();
					charge.graphics.beginFill('#FF0000');
					charge.graphics.drawCircle(0,0,5);
					container.addChild(charge);
					
					// caching this early creates white corners :(
					// container.cache(-7,-7,14,14);
					return container;
				};
				this.mineBurstGfx = function(color='red') {
					var r = 30;
					var w = 8;
					var shape = new createjs.Graphics().beginFill(color);
					shape.mt(-r+w,-r).lt(0,-w).lt(r-w,-r).lt(r,-r+w).lt(w,0).lt(r,r-w).lt(r-w,r).lt(0,w).lt(-r+w,r).lt(-r,r-w).lt(-w,0).lt(-r,-r+w).cp();
					return shape;
				};
				break;
			default:	// orb
				this.baseGfx = function (color="#FFFFFF") {
					var shape = new createjs.Graphics().beginFill("#FFFFFF").drawCircle(0,0,30);
					return shape;
				};
				this.centerGfx = function (color="#DDDDDD") {
					var shape = new createjs.Graphics().beginFill(color).drawCircle(0,0,25);
					return shape;
				};
				this.holdGfx = function (height, color="#555555", radius=30) {
					var shape = new createjs.Graphics().beginFill(color);
					shape.arc(0,0,radius,-Math.PI,0).lt(radius,height).arc(0,height,radius,0,Math.PI).cp();
					shape.regX = -radius;
					return shape;
				};
				this.holdCenterGfx = function (height, color="#888888") {
					var shape = new createjs.Graphics().beginFill(color);
					shape.arc(0,0,20,-Math.PI,0).lt(20,height).arc(0,height,20,0,Math.PI).cp();
					shape.regX = -20;
					return shape;
				};
				this.burstGfx = function(color="yellow") {
					var r = 35;
					var b = 23;
					var shape = new createjs.Graphics().beginFill(color);
					shape.mt(-r,-r).bt(-b,-b,-b,b,-r,r).bt(-b,b,b,b,r,r).bt(b,b,b,-b,r,-r).bt(b,-b,-b,-b,-r,-r).cp();
					return shape;
				};
				// for now, this returns the entire container rather than just the shape
				this.mineGfx = function() {
					var container = new createjs.Container();
					var orb = new createjs.Shape();
					orb.graphics.beginFill('#DDDDDD');
					orb.graphics.drawCircle(0,0,12);
					container.addChild(orb);
					var border = new createjs.Shape();
					border.graphics.beginFill('#000000');
					border.graphics.drawCircle(0,0,11);
					container.addChild(border);
					var mount = new createjs.Shape();
					mount.graphics.beginFill('#DDDDDD');
					mount.graphics.drawCircle(0,0,10);
					container.addChild(mount);
					var charge = new createjs.Shape();
					charge.graphics.beginFill('#FF0000');
					charge.graphics.drawCircle(0,0,5);
					container.addChild(charge);
					
					// caching this early creates white corners :(
					// container.cache(-7,-7,14,14);
					return container;
				};
				this.mineBurstGfx = function(color='red') {
					var r = 30;
					var w = 8;
					var shape = new createjs.Graphics().beginFill(color);
					shape.mt(-r+w,-r).lt(0,-w).lt(r-w,-r).lt(r,-r+w).lt(w,0).lt(r,r-w).lt(r-w,r).lt(0,w).lt(-r+w,r).lt(-r,r-w).lt(-w,0).lt(-r,-r+w).cp();
					return shape;
				};
				break;
		}
	}
	
	// output a copy of the shape with the graphics
	base(color="default") {
		var container = new createjs.Container();
		// add regular note graphics
		if (color != "default") {
			container.addChild(new createjs.Shape(this.baseGfx(color)), new createjs.Shape(this.centerGfx(color)));
		} else {
			container.addChild(new createjs.Shape(this.baseGfx()), new createjs.Shape(this.centerGfx()));
		}
		container.cache(-30,-30,60,60);
		
		// reset the graphics
		container.resetGfx = function() {
			this.visible = true;
			this.alpha = 1;
		}
		
		return container;
	}
	
	// output a copy of the hold shape with the graphics
	hold(height, color="default") {
		var container = new createjs.Container();
		container.noteskin = this.name;

		// add the hold's tail
		var tailContainer = new createjs.Container();
		tailContainer.addChild(new createjs.Shape(this.holdGfx(height)), new createjs.Shape(this.holdCenterGfx(height)));
		container.addChild(tailContainer);
		container.tail = tailContainer;

		// add regular note graphics
		var noteContainer = new createjs.Container();
		if (color != "default") {
			noteContainer.addChild(new createjs.Shape(this.baseGfx(color)), new createjs.Shape(this.centerGfx(color)));
		} else {
			noteContainer.addChild(new createjs.Shape(this.baseGfx()), new createjs.Shape(this.centerGfx()));
		}
		container.addChild(noteContainer);
		container.note = noteContainer;
		
		// add a function that adjusts the drawing of holds as they are held down
		container.setTailBottom = function(bottom) {
			if (this.noteskin === 'bar') {
				try {
					this.tail.children[0].graphics._instructions[1].y = bottom-12;
					this.tail.children[0].graphics._instructions[1].h = 24+this.tail.children[0].graphics.height-bottom;
					this.tail.children[1].graphics._instructions[1].y = bottom-7;
					this.tail.children[1].graphics._instructions[1].h = 14+this.tail.children[1].graphics.height-bottom;
				} catch {
				}
			}
			else {	// orb
				// wtf is going on, why would this error out sometimes
				try {
					this.tail.children[0].graphics._instructions[1].y = bottom;
					this.tail.children[1].graphics._instructions[1].y = bottom;
				} catch {
				}
			}
		}
		
		// reset the graphics
		container.resetGfx = function() {
			this.visible = true;
			this.alpha = 1;
			this.setTailBottom(0);
			this.note.y = 0;
			this.note.visible = true;
		}

		return container;
	}
	
	// output a copy of the burst graphic shape
	burst(color='yellow') {
		var container = new createjs.Container();
		// add burst graphic
		container.addChild(new createjs.Shape(this.burstGfx(color)));
		container.cache(-35,-35,70,70);
		return container;
	}
	
	// output a copy of the mine graphic
	mine() {
		return this.mineGfx();
	}
	
	// output a copy of the mine burst graphic
	mineBurst(color='red') {
		var container = new createjs.Container();
		// add burst graphic
		container.addChild(new createjs.Shape(this.mineBurstGfx(color)));
		container.cache(-30,-30,60,60);
		return container;
	}
}



class Receptor {
	// x value is mandatory, everything else optional
	constructor(size=30, x, y=100, noteskin=new Noteskin()) {
		this.size = size;	// not used yet but is the size of the graphics currently
		this.x = x;
		this.y = y;
		this.noteskin = noteskin;
		this.draw();
	}
	// load a noteskin
	loadNoteskin(noteskin=new Noteskin()) {
		this.noteskin = noteskin;
	}
	// draw the receptor
	draw() {
		// pull a copy of the noteskin shape and assign location
		this.graphic = this.noteskin.base()
		this.graphic.x = this.x;
		this.graphic.y = this.y;

		// keep a copy of the hold burst graphic on top of the receptor
		this.burstGraphic = this.noteskin.burst();
		this.burstGraphic.x = this.x;
		this.burstGraphic.y = this.y;
		this.burstGraphic.visible = false;
		this.burstGraphic['birth'] = 0;
		this.burstGraphic['death'] = 0;

		// keep a copy of the mine burst graphic on top of the receptor
		this.mineBurstGraphic = this.noteskin.mineBurst();
		this.mineBurstGraphic.x = this.x;
		this.mineBurstGraphic.y = this.y;
		this.mineBurstGraphic.visible = false;
		this.mineBurstGraphic['birth'] = 0;
		this.mineBurstGraphic['death'] = 0;
	}
	// animation trigger when button is pressed
	push() {
		// the ratio of the receptor size when pushed down
		var ratio = 0.90;
		
		if (this.graphic.scale > ratio) {
			this.graphic.scale -= 0.1;
			if (this.graphic.scale < ratio) {
				this.graphic.scale = ratio;
			}
		}
	}
	// animation to return to neutral state
	update() {
		if (this.graphic.scale < 1) {
			this.graphic.scale += 0.05;
			if (this.graphic.scale > 1) {
				this.graphic.scale = 1;
			}
		}
		// check burst
		if (this.burstGraphic.visible){
			var currentTime = Date.now();
			if (currentTime < this.burstGraphic.death) {
				var lifespan = this.burstGraphic.death - this.burstGraphic.birth;
				var ageRatio = (currentTime - this.burstGraphic.birth)/lifespan;
				var alphaLerp = 1-ageRatio;
				this.burstGraphic.alpha = alphaLerp;
			} else {
				this.burstGraphic.visible = false;
			}
		}
		// check mine burst
		if (this.mineBurstGraphic.visible){
			var currentTime = Date.now();
			if (currentTime < this.mineBurstGraphic.death) {
				var lifespan = this.mineBurstGraphic.death - this.mineBurstGraphic.birth;
				var ageRatio = (currentTime - this.mineBurstGraphic.birth)/lifespan;
				var alphaLerp = 1-ageRatio;
				this.mineBurstGraphic.alpha = alphaLerp;
			} else {
				this.mineBurstGraphic.visible = false;
			}
		}
	}
	// set the burst to appear
	burst() {
		this.burstGraphic.visible = true;
		var currentTime = Date.now();
		this.burstGraphic.birth = currentTime;
		this.burstGraphic.death = currentTime + 150;
	}
	// set the mine burst to appear
	mineBurst(mineSound) {
		// play the sound effect
		mineSound.position = 0;
		mineSound.play();
		// graphics
		this.mineBurstGraphic.visible = true;
		var currentTime = Date.now();
		this.mineBurstGraphic.birth = currentTime;
		this.mineBurstGraphic.death = currentTime + 300;
	}
	
}


// -----------
// Level class
// -----------
//
// TODO: make two groups of notes, one registered and one not-registered, so searching for the note we hit is much easier
//			also, handle misses, which will help speed this up even more
//
class Level {
	// stage takes the level/song and the user's settings
	constructor(song, level, width=800, height=600, settings, game) {
		this.game = game;
		this.song = song;
		
		// loading level data might be more complicated subroutine
		this.level = level;

		// loading notetrack might be more complicated subroutine
		this.notetrack = new Notetrack(
			level.notes,
			level.gap,
			level.syncBPMList,
			level.syncStopList,
			level.scrollModList,
			level.scrollStopList
		);
		
		// loading settings might be more complicated subroutine
		this.settings = settings;
		this.settings.scrollSpeedFactor = this.settings.scrollSpeed/1000;
		this.noteskin = new Noteskin(settings.noteskin);
		
		this.width = width;
		this.height = height;
		this.receptors = [];
		
		// keep track of hold notes on each receptor
		// 0 or false indicates that no hold note exists there yet
		this.heldNotes = [0,0,0,0,0,0];
		
	}
	
	// update the settings after they have been changed
	updateSettings(settings) {
		this.settings = settings;
		this.setup();
	}
	
	// initialize the canvas by adding everything to the stage
	setup() {
		this.stage.removeAllChildren();
		this.initBackground();
		this.initReceptors();
		this.initNotetrack();
		this.initStats();
		this.initTimeline();
		this.initBackButton();
	}
	
	// you must attach the canvas to this object before anything can be drawn
	attachStage(stage) {
		this.stage = stage;
	}

	// draw the background and add to canvas
	initBackground() {
		this.background = new createjs.Shape();
		this.background.graphics.beginFill("black").drawRect(0, 0, this.width, this.height);
		this.background.x = 0;
		this.background.y = 0;
		this.stage.addChild(this.background);
		//this.updateStage();
	}
	// draw the receptors and add to canvas
	initReceptors() {
		this.noteskin = new Noteskin(this.settings.noteskin);
		var keys = this.notetrack.keyCount;		// determined from level file		
		this.receptors = [];					// hold receptors for reference
		for (var k = 0; k < keys; k++) {
			// downscroll
			if (this.settings.scrollDirection === 'down') {
				var y = this.height-100;
			}
			// upscroll
			else {
				var y = 100;
			}
			var x = this.getAlignment(this.width/2, keys, 60, 10, k);
			this.receptors[k] = new Receptor(30,x,y,this.noteskin);
			this.stage.addChild(this.receptors[k].graphic);
			this.stage.addChild(this.receptors[k].burstGraphic);
			this.stage.addChild(this.receptors[k].mineBurstGraphic);
		}
	}
	// draw the notetrack and add to canvas
	initNotetrack() {
		// clear the existing notetrack
		if (this.notetrack.gfx) {
			this.notetrack.gfx.removeAllChildren();
		}
		
		// holds the notetrack of notes
		var notetrackGraphics = new createjs.Container();
		this.notetrack.gfx = notetrackGraphics;
		
		// this grabs the note and mine objects
		var notes = this.notetrack.notes;
		var mines = this.notetrack.mines;

		for (var col = 0; col < notes.length; col++) {
			// get the initial position of the note
			var x = this.getAlignment(this.width/2, this.notetrack.keyCount, 60, 10, col);

			// iterate through the notes
			for (var j = 0; j < notes[col].length; j++) {
				var note = notes[col][j];
				// scale note position depending on default scroll speed
				var notePos = note.pos*this.settings.scrollSpeedFactor;
				if (this.settings.scrollDirection === 'down') {
					var y = this.receptors[0].y - notePos;
				} else {
					var y = this.receptors[0].y + notePos;
				}
				
				var color = divisionToColor(note.div);

				if (note.type == 'hold') {
					// init the graphic
					var nonScaledHeight = note.end - note.pos;
					var height = nonScaledHeight*this.settings.scrollSpeedFactor;
					var holdGfx = this.noteskin.hold(height, color);
					holdGfx.x = x;
					holdGfx.y = y;
					if (this.settings.scrollDirection === 'down') {
						holdGfx.scaleY = -1;
					}
					
					// attach it to the note object
					note.attachGfx(holdGfx);
					
					// attach graphic to the notetrack
					// notetrackGraphics.addChild(holdGfx);

				}
				else if (note.type == 'tap') {
					// init the graphic
					var noteGfx = this.noteskin.base(color);
					noteGfx.x = x;
					noteGfx.y = y;
					
					// attach it to the note object
					note.attachGfx(noteGfx);
					
					// attach graphic to the notetrack
					// notetrackGraphics.addChild(noteGfx);
				}
			}
			
			// iterate through the mines
			for (var j = 0; j < mines[col].length; j++) {
				var mine = mines[col][j];
				// scale mine position depending on default scroll speed
				var minePos = mine.pos*this.settings.scrollSpeedFactor;
				if (this.settings.scrollDirection === 'down') {
					var y = this.receptors[0].y - minePos;
				} else {
					var y = this.receptors[0].y + minePos;
				}
				
				var mineGfx = this.noteskin.mine();
				mineGfx.x = x;
				mineGfx.y = y;
				
				// attach it to the note object
				mine.attachGfx(mineGfx);
				
				// attach graphic to the notetrack
				notetrackGraphics.addChild(mineGfx);
			}
		}
		// attach the notetrack to the stage
		this.stage.addChild(notetrackGraphics);
	}
	initStats() {
		this.fpsCounter = new createjs.Text("FPS: ", "12px Arial", "#ffffff")
		this.stage.addChild(this.fpsCounter)
	}
	// draws the timeline that you can click to allow you to seek
	initTimeline() {
		this.timelineGfx = new createjs.Container;
		this.timelineGfx.x = this.width/2;
		this.timelineGfx.y = 20;
		this.timelineGfx.level = this;
		
		var border = new createjs.Shape();
		border.graphics.beginStroke("#FFFFFF").beginFill("#000000").setStrokeStyle(1);
		border.graphics.rect(-this.width/3,-5,2*this.width/3,10);
		this.timelineGfx.addChild(border);

		var fill = new createjs.Shape();
		fill.graphics.beginFill("DeepSkyBlue");
		fill.graphics.rect(-this.width/3,-5,1,10);
		this.timelineGfx.fillGfx = fill;
		this.timelineGfx.addChild(fill);
		
		// add a click event listener
		this.timelineGfx.addEventListener("click", function(event) {
			var level = event.currentTarget.level;
			level.reset();
			// calculate how far in the timeline we choose
			var barPos = event.stageX - level.width/6;
			var totalBarLength = 2*level.width/3;
			var barRatio = barPos/totalBarLength;
			// calculate that time
			var timelineLength = level.game.timeline.end - level.game.timeline.start;
			var timeLerp = level.game.timeline.start + barRatio*timelineLength;
			// set the new time position
			level.game.timeline.setPosition(timeLerp);
		});
		
		// add all the highlight markings
		for (var k = 0; k < this.level.highlights.length; k++) {
			var highlight = this.level.highlights[k];
			// calculate where the highlight begins and ends
			var songStart = this.game.timeline.start;
			var songEnd = this.game.timeline.end;
			var songLength = songEnd-songStart;
			var startTime = 1000*this.notetrack.beatToTime(highlight[0]);
			var endTime = 1000*this.notetrack.beatToTime(highlight[1]);
			var startRatio = (startTime-songStart)/songLength;
			var endRatio = (endTime-songStart)/songLength;
			var boxBegin = -this.width/3;
			var boxEnd = this.width/3;
			var boxLength = boxEnd - boxBegin;
			var boxBeginLerp = boxBegin + startRatio*boxLength;
			var boxEndLerp = boxBegin + endRatio*boxLength;
			var highlightWidth = boxEndLerp - boxBeginLerp;
			// draw the box
			var highlightBox = new createjs.Shape();
			var highlightColor = "#ffff99";
			if (highlight[2]) {
				highlightColor = highlight[2];
			}
			highlightBox.graphics.beginFill(highlightColor);
			highlightBox.graphics.rect(boxBeginLerp,-10,highlightWidth,20);
			highlightBox.alpha = 0.5;
			this.timelineGfx.addChild(highlightBox);
			this.stage.update();
		}
		
		// add timestamp
		this.timestampText = new createjs.Text("start/end", "12px Arial", "#ffffff")
		this.timestampText.textAlign = 'right';
		this.timestampText.x = 5*this.width/6;
		this.timestampText.y = 32;
		this.stage.addChild(this.timestampText)
		
		this.stage.addChild(this.timelineGfx);
	}
	// include a back button
	initBackButton() {
		// back button
		this.backButton = new createjs.Container();
		this.backButton.game = this.game;
		var buttonX = this.width-40;
		var buttonY = 20;
		var backButton = new createjs.Shape();
		backButton.graphics.ss(1).s("#ffffff").f("#000000").rr(buttonX-35,buttonY-15,70,30,4,4,4,4);
		this.backButton.addChild(backButton);
		// settings menu button text
		var backButtonText = new createjs.Text("Back", "14px Arial", "#ffffff");
		backButtonText.x = buttonX;
		backButtonText.y = buttonY;
		backButtonText.textAlign = "center";
		backButtonText.textBaseline = "middle";
		this.backButton.addChild(backButtonText);
		// add a click event listener
		this.backButton.addEventListener("click", function(event) {
			var game = event.currentTarget.game;
			// stop the game, back to the main menu
			game.timeline.stop();
			game.level.reset();
			game.initMainMenu();
		});
		this.stage.addChild(this.backButton);
	}

	// draw everything on the stage that needs to be updated
	updateStage(currentTime) {

		// update the notetrack
		var posDiff = this.notetrack.timeToTrackPosition(currentTime/1000);
		this.notetrack.position = posDiff;
		if (this.settings.scrollDirection === 'down') {
			this.notetrack.gfx.y = posDiff*this.settings.scrollSpeedFactor;
		} else {
			this.notetrack.gfx.y = -posDiff*this.settings.scrollSpeedFactor;
		}
		
		// update the receptors
		for (var n = 0; n < this.receptors.length; n++) {
			this.receptors[n].update();
		}
		
		// update the individual notes and mines
		var notes = this.notetrack.notes;
		var mines = this.notetrack.mines;
		for (var col = 0; col < notes.length; col++) {
			
			// update the notes
			for (var k = 0; k < notes[col].length; k++) {
				var note = notes[col][k];
				
				// check if the note is on the screen
				var absY = note.pos - this.notetrack.position;
				var topY = absY;
				if (note.type === 'hold') {
					topY = note.end - this.notetrack.position;
				}
				// this check applies to all notes and holds
				// note should be on screen
				var screenBottom = -200/this.settings.scrollSpeedFactor;
				var screenTop = (this.height+200)/this.settings.scrollSpeedFactor;
				var limits = [screenBottom, screenTop, absY, topY].sort(function(a,b){return a-b;});
				var notOnScreen = (limits[0] === screenBottom && limits[1] === screenTop) || (limits[2] === screenBottom && limits[3] === screenTop);
				if (!notOnScreen) {
					// not yet on screen
					if (!note.onScreen) {
						this.notetrack.gfx.addChild(note.gfxObj);
						note.onScreen = true;
					}
				}
				// note should not be on screen
				else {
					if (note.onScreen) {
						this.notetrack.gfx.removeChild(note.gfxObj);
						note.onScreen = false;
					}
				}
				
				// update the graphics depending on the type of note
				if (note.registered) {
					if (note.type === 'tap') {
						if (!note.alive) {
							// remove note entirely if comboed
							note.gfxObj.visible = false;
						} else {
							// otherwise just make it dim
							note.gfxObj.alpha = 0.4;
						}
					} else if (note.type === 'hold') {
						if (note.alive && !note.active) {
							// missed hold, just make it dim
							note.gfxObj.alpha = 0.4;
						}
					}
				}
			}
			
			// update the mines
			for (var k = 0; k < mines[col].length; k++) {
				var mine = mines[col][k];
				
				// check if the mine is on the screen
				var absY = mine.pos - this.notetrack.position;
				// mine should be on screen
				var screenBottom = -200/this.settings.scrollSpeedFactor;
				var screenTop = (this.height+200)/this.settings.scrollSpeedFactor;
				if (absY > screenBottom && absY < screenTop) {
					// not yet on screen
					if (!mine.onScreen) {
						this.notetrack.gfx.addChild(mine.gfxObj);
						mine.onScreen = true;
					}
				}
				// mine should not be on screen
				else {
					if (mine.onScreen) {
						this.notetrack.gfx.removeChild(mine.gfxObj);
						mine.onScreen = false;
					}
				}
				
				// update the graphics
				if (!mine.alive) {
					mine.gfxObj.visible = false;
				}
			}

		}
		
		// update the held notes
		for (var col = 0; col < this.notetrack.keyCount; col++) {
			var heldNote = this.heldNotes[col];		// stores the hold note (if it exists)
			// held note found and rendered
			if (heldNote && heldNote.onScreen) {
				// update the hold graphics accordingly
				
				// check if the hold should be alive
				if (!heldNote.alive) {
					heldNote.gfxObj.visible = false;
					// set burst graphics
					this.receptors[col].burst();
				}
				
				// update the note head
				var nonScaledBottom = this.notetrack.position-heldNote.pos;
				var bottom = nonScaledBottom*this.settings.scrollSpeedFactor;
				if (heldNote.active) {
					heldNote.gfxObj.note.visible = false;
				} else {
					heldNote.gfxObj.note.y = bottom;
					heldNote.gfxObj.note.visible = true;
				}
				// update the hold tail
				var tail = heldNote.gfxObj;
				tail.setTailBottom(bottom);

				// update the alpha
				if (!heldNote.active) {
					// we don't need to set the tail alpha because the entire hold being missed will account for it
					heldNote.gfxObj.tail.alpha = 1;
				} else if (!heldNote.held) {
					var dropTime = currentTime - heldNote.lastRelease;
					var dropTimeRatio = dropTime/judgmentWindows['Hold'];
					var alphaLerp = 1-0.5*dropTimeRatio;
					heldNote.gfxObj.tail.alpha = alphaLerp;
				} else if (heldNote.held) {
					heldNote.gfxObj.tail.alpha = 1;
				}
				
				// if the hold is no longer active, remove it from the list
				// this logic SHOULD go in the Game object, not the Level object, but then the order of execution is wrong
				if (!heldNote.active) {
					this.heldNotes[col] = 0;
				}
			}
		}
		
		// update the timeline bar
		var timeline = this.game.timeline;
		var timeElapsed = currentTime - timeline.start;
		var totalTime = timeline.end - timeline.start;
		var timeRatio = timeElapsed/totalTime;
		var barWidth = timeRatio*2*this.width/3;
		try {	// why does this fail the first time it runs?
			this.timelineGfx.fillGfx.graphics._instructions[1]['w'] = barWidth;
		} catch(e) {
			if (!e instanceof TypeError) {
				throw e;
			}
		}
		var timeElapsedSec = +(timeElapsed/1000).toFixed(2);
		var timeElapsedMin = Math.floor(timeElapsedSec/60);
		timeElapsedSec = (timeElapsedSec%60).toFixed(2);
		timeElapsedSec = ''+timeElapsedSec;
		timeElapsedSec = timeElapsedSec.substring(0,5);
		if (timeElapsedSec < 10) {
			timeElapsedSec = '0'+timeElapsedSec;
		}
		var totalTimeSec = (totalTime/1000).toFixed(2);
		var totalTimeMin = Math.floor(totalTimeSec/60);
		totalTimeSec = (totalTimeSec%60).toFixed(2);
		totalTimeSec = ''+totalTimeSec;
		totalTimeSec = totalTimeSec.substring(0,5);
		if (totalTimeSec < 10) {
			totalTimeSec = '0'+totalTimeSec;
		}
		this.timestampText.text = ''+timeElapsedMin+':'+timeElapsedSec +' / '+totalTimeMin+':'+totalTimeSec;
		
		this.stage.update();
	}

	// utility function to calculate position value
	// suppose you have the following graphics:
	//			o  o  o  o  o  o
	// 		center: position of center (in between the 3rd and 4th objects)
	//		num: number of objects (6)
	//		width: width of the above objects
	//		gap: distance between the above objects
	//		index: if you wanted the position value of the 1st object, give 0
	getAlignment(center, num, width, gap, index) {
		return center + width*(index+1-(num+1)/2) + gap*(index-(num-1)/2)
	}

	// reset all the notes on the notetrack
	reset() {
		var notes = this.notetrack.notes;
		for (var k = 0; k < notes.length; k++) {
			for (var n = 0; n < notes[k].length; n++) {
				var note = notes[k][n];
				
				// reset graphics
				note.gfxObj.resetGfx();
				// reset note data
				note.resetState();
			}
		}
		var mines = this.notetrack.mines;
		for (var k = 0; k < mines.length; k++) {
			for (var n = 0; n < mines[k].length; n++) {
				var mine = mines[k][n];
				
				// reset graphics
				mine.gfxObj.visible = true;
				// reset note data
				mine.resetState();
			}
		}
	}
	
}