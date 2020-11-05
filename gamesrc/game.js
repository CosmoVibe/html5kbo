// ----------
// Game class
// ----------
//
// the goal is to make configuration very simple: pass in the song, the level file, settings, and it sets up itself
// this class is like a container that holds everything
//
// two major class instances contained:
//		Level: handles all graphics
//		Timeline: handles all time/song related stuff
//
//
// *yes, a lot of this is a mess because later on i didn't feel like structuring my code properly, I just wanted a complete product asap
//
class Game {
	
	// canvasid: the HTML canvas element ID tags
	// song: the URL src of the song
	// chartdata: chart data object (see chartdata.js/README)
	// settings: settings data object (see README)
	constructor(gameConfig) {
		console.log('Setting up embed with given configuration:')
		console.log(gameConfig);
		
		this.canvasId = gameConfig.canvasid;
		
		// tells us if we are in the main menu, settings menu, or the game
		//	values: main/settings/game
		this.menuState = 'main';
		
		// find the width and length of the canvas element
		this.width = document.getElementById(gameConfig.canvasid).width;
		this.height = document.getElementById(gameConfig.canvasid).height;

		// set up basic settings
		// probably want a class for this but im lazy
		this.settings = {
			keyBind: {
				0: Q,
				1: W,
				2: E,
				3: COMMA,
				4: PERIOD,
				5: FSLASH,
				'pause': SPACE,
				'seekLeft': LEFT,
				'seekRight': RIGHT
			},
			scrollDirection: 'down',
			scrollSpeed: 800,
			globalOffset: 0,
			noteskin: 'orb',
			volume: 100
		};
		
		// record the download URL for the file if it exists
		this.downloadURL = -1;
		if ("downloadURL" in gameConfig) {
			this.downloadURL = gameConfig.downloadURL;
		}
		
		// keep track of keys that are pressed down
		this.keysDown = {};
		this.keysMineCheck = [];
		
		// log the chart and song src
		this.chartConfig = gameConfig.chart;
		this.songSrc = gameConfig.song;

	}
	async init() {
		console.log('Initializing canvas ID: ' + this.canvasId);
		// ------------
		// Canvas setup
		// ------------
		// attach the game stage to the HTML canvas element
		this.stage = new createjs.Stage(this.canvasId);

		// --------------
		// Settings setup
		// --------------
		// load settings from cookies
		this.loadSettings();
		// copy the settings for temporary hold when in settings menu
		// if the player confirms, this overwrites normal settings
		// otherwise, it is discarded
		this.tempSettings = clone(this.settings);
		// if -1, proceed as normal
		// if any number from 0 to 5, we are choosing a key to configure in settings
		this.keyConfigureState = -1;
		
		// ------------
		// Ticker setup
		// ------------
		// ticker controls frame by frame update of the game window
		// any objects that need to be updated should have its own update function, which will be called here
		var ref = this;		// this allows the ticker to reference the game object
		createjs.Ticker.framerate = 144;
		this.measuredFPS = 0;
		this.tick = function(event) {
			// update FPS counter display
			ref.measuredFPS = createjs.Ticker.getMeasuredFPS();
			ref.level.fpsCounter.text = 'FPS: ' + Math.round(ref.measuredFPS);
			
			// update game logic regarding held keys
			ref.checkHeldKeys();
			
			// update the stage (all graphics)
			if (!event.paused) {
				ref.level.updateStage(ref.timeline.getPosition());
			}

			// update the timeline
			ref.timeline.update();
		}
		
		// -----------
		// Chart setup
		// -----------
		this.chartdata = this.loadChart(this.chartConfig);
		console.log('chart data:');
		console.log(this.chartdata);
		this.level = new Level(this.songSrc,this.chartdata,this.width,this.height,this.settings,this);	// construct the level object
		this.level.attachStage(this.stage);																// attach the level to the stage

		// --------------
		// Timeline setup
		// --------------
		this.timeline = new Timeline(this.songSrc, this.settings.globalOffset);
		this.timeline.start = -this.level.notetrack.gap*1000 - 2000;
		this.timeline.end = 1000*this.level.notetrack.beatToTime(this.level.notetrack.lastBeat) + 4000;
		
		
		// -----------
		// Stage setup
		// -----------
		// we can draw the highlights now that the timeline is set up
		this.level.setup();

		// create a main menu
		this.initMainMenu();
		// get the settings menu ready
		this.initSettingsMenu();

		// set up the mine checking values
		for (var col = 0; col < this.level.notetrack.keyCount; col++) {
			this.keysMineCheck.push({
				'tapRegistered': false,
				'lastHeld': -1000
			});
		}

		this.mineSound = createjs.Sound.createInstance("mine");

		// ----------------
		// Final load check
		// ----------------
		// make sure that the song is fully loaded before creating a sound instance to the timeline
		return await new Promise((resolve, reject) => {
			var result = createjs.Sound.registerSound(this.songSrc);

			if (result === true) {
				//console.log(`${this.songSrc} had already been loaded.`);
				resolve(this.songSrc);
			} else {
				let loadListener = createjs.Sound.on("fileload", e => {
					if (e.src == this.songSrc) {
						ref.timeline.song = createjs.Sound.createInstance(this.songSrc);
						createjs.Sound.off("fileload", loadListener);
						resolve(this.songSrc);
					}
				});

				let errorListener = createjs.Sound.on("fileerror", e => {
					if (e.src == this.songSrc) {
						createjs.Sound.off("fileerror", errorListener);
						reject(this.songSrc);
					}
				});
			}
		}).then(
			src => console.log(`${src} loaded`),
			src => console.log(`${src} couldn't be loaded`)
		);
	}

	// load a chart from the chart configuration input
	loadChart(chartdata) {
		// process the .sm file
		var fullSMObject = processSM(chartdata.src);
		this.fullChartObject = fullSMObject;
		
		// find the chart in question
		var levels = fullSMObject.levels[chartdata.type];
		for (var k = 0; k < levels.length; k++) {
			if (levels[k].level == chartdata.diff) {
				var SMchart = levels[k];
			}
		}
		// build the object
		var chart = {};
		chart.notes = SMchart.notes;
		chart.gap = fullSMObject.OFFSET;
		chart.syncBPMList = fullSMObject.BPMS;
		chart.syncStopList = fullSMObject.STOPS;
		chart.scrollModList = [[0,1]];
		chart.scrollStopList = [];
		if (fullSMObject.XMODBPMS) {
			chart.scrollModList = fullSMObject.XMODBPMS;
		}
		if (fullSMObject.XMODSTOPS) {
			chart.scrollStopList = fullSMObject.XMODSTOPS;
		}
		chart.highlights = chartdata.highlights;
		return chart;
	}
	
	// load settings from cookie
	loadSettings() {
		// skip if we cannot find a cookie
		if (!document.cookie) {
			this.saveSettings();
			return;
		}
		var cookieRaw = document.cookie.split(';');
		var cookie = {};
		for (var k = 0; k < cookieRaw.length; k++) {
			cookieRaw[k] = cookieRaw[k].split('=');
			cookie[cookieRaw[k][0].trim()] = cookieRaw[k][1];
		}
		
		this.settings.scrollDirection = cookie['scrollDirection'];
		this.settings.scrollSpeed = +cookie['scrollSpeed'];
		this.settings.scrollSpeedFactor = this.settings.scrollSpeed/1000;
		this.settings.globalOffset = +cookie['globalOffset'];
		this.settings.noteskin = cookie['noteskin'];
		this.settings.volume = cookie['volume'] ?? 100;

		this.settings.keyBind[0] = +cookie['keyBind0'];
		this.settings.keyBind[1] = +cookie['keyBind1'];
		this.settings.keyBind[2] = +cookie['keyBind2'];
		this.settings.keyBind[3] = +cookie['keyBind3'];
		this.settings.keyBind[4] = +cookie['keyBind4'];
		this.settings.keyBind[5] = +cookie['keyBind5'];
		this.settings.keyBind['pause'] = +cookie['keyBindPause'];
		this.settings.keyBind['seekLeft'] = +cookie['keyBindSeekLeft'];
		this.settings.keyBind['seekRight'] = +cookie['keyBindSeekRight'];

	}
	// save settings to cookie
	saveSettings() {
		
		this.setCookie('scrollDirection',this.settings.scrollDirection);
		this.setCookie('scrollSpeed',this.settings.scrollSpeed);
		this.setCookie('globalOffset',this.settings.globalOffset);
		this.setCookie('noteskin',this.settings.noteskin);
		this.setCookie('volume',this.settings.volume);
		
		this.setCookie('keyBind0',this.settings.keyBind[0]);
		this.setCookie('keyBind1',this.settings.keyBind[1]);
		this.setCookie('keyBind2',this.settings.keyBind[2]);
		this.setCookie('keyBind3',this.settings.keyBind[3]);
		this.setCookie('keyBind4',this.settings.keyBind[4]);
		this.setCookie('keyBind5',this.settings.keyBind[5]);
		this.setCookie('keyBindPause',this.settings.keyBind['pause']);
		this.setCookie('keyBindSeekLeft',this.settings.keyBind['seekLeft']);
		this.setCookie('keyBindSeekRight',this.settings.keyBind['seekRight']);
		
		// update the level
		this.level.updateSettings(this.settings);
		// update the timeline
		this.timeline.offset = this.settings.globalOffset;
		createjs.Sound.volume = this.settings.volume/100;

	}
	// set cookie
	setCookie(prop, value) {
		var myDate = new Date();
		myDate.setMonth(myDate.getMonth() + 12);
		
		var cookie = prop + '=' + value;
		cookie += ";expires=" + myDate;
		cookie += ";domain=."+window.location.hostname+";path=/";
		document.cookie = cookie;
	}
	
	// set up the main menu
	initMainMenu() {
		// clear the stage
		this.stage.removeAllChildren();
		
		// set menu state
		this.menuState = 'main';
		
		this.mainMenuGfx = new createjs.Container();
		// add the background image
		var background = new createjs.Shape();
		background.graphics.beginFill("#000000").rect(0, 0, this.width, this.height);
		background.x = 0;
		background.y = 0;
		this.mainMenuGfx.addChild(background);
		// add title text
		var titleText = new createjs.Text(this.fullChartObject.TITLE, "36px Arial", "#ffffff");
		titleText.x = this.width/2;
		titleText.y = 150;
		titleText.textAlign = "center";
		this.mainMenuGfx.addChild(titleText);
		// add subtitle text
		var subtitleText = new createjs.Text(this.fullChartObject.SUBTITLE, "20px Arial", "#ffffff");
		subtitleText.x = this.width/2;
		subtitleText.y = 200;
		subtitleText.textAlign = "center";
		this.mainMenuGfx.addChild(subtitleText);
		// add artist text
		var artistText = new createjs.Text(this.fullChartObject.ARTIST, "24px Arial", "#ffffff");
		artistText.x = this.width/2;
		artistText.y = 300;
		artistText.textAlign = "center";
		this.mainMenuGfx.addChild(artistText);
		// add chart artist text
		if (this.chartConfig.chartArtist) {
			var chartistText = 'Chart by ' + this.chartConfig.chartArtist;
			var chartArtistText = new createjs.Text(chartistText, "20px Arial", "#ffffff");
			chartArtistText.x = this.width/2;
			chartArtistText.y = 400;
			chartArtistText.textAlign = "center";
			this.mainMenuGfx.addChild(chartArtistText);
		}
		
		// settings menu button
		this.mainMenuGfx.settingsButton = new createjs.Container();
		this.mainMenuGfx.settingsButton.game = this;
		var buttonX = 40;
		var buttonY = 20;
		var settingsButton = new createjs.Shape();
		settingsButton.graphics.ss(1).s("#ffffff").f("#000000").rr(buttonX-35,buttonY-15,70,30,4,4,4,4);
		this.mainMenuGfx.settingsButton.addChild(settingsButton);
		// settings menu button text
		var settingsButtonText = new createjs.Text("Settings", "14px Arial", "#ffffff");
		settingsButtonText.x = buttonX;
		settingsButtonText.y = buttonY;
		settingsButtonText.textAlign = "center";
		settingsButtonText.textBaseline = "middle";
		this.mainMenuGfx.settingsButton.addChild(settingsButtonText);
		// add a click event listener
		this.mainMenuGfx.settingsButton.addEventListener("click", function(event) {
			var game = event.currentTarget.game;
			game.openSettings();
		});
		this.mainMenuGfx.addChild(this.mainMenuGfx.settingsButton);
		
		// play menu button
		this.mainMenuGfx.playButton = new createjs.Container();
		this.mainMenuGfx.playButton.game = this;
		this.mainMenuGfx.playButton.x = this.width-40;
		this.mainMenuGfx.playButton.y = 20;
		var playButton = new createjs.Shape();
		playButton.graphics.ss(1).s("#ffffff").f("#000000").rr(-35,-15,70,30,4,4,4,4);
		this.mainMenuGfx.playButton.addChild(playButton);
		// settings menu button text
		var playButtonText = new createjs.Text("Play", "14px Arial", "#ffffff");
		playButtonText.textAlign = "center";
		playButtonText.textBaseline = "middle";
		this.mainMenuGfx.playButton.addChild(playButtonText);
		// add a click event listener
		this.mainMenuGfx.playButton.addEventListener("click", function(event) {
			var game = event.currentTarget.game;
			game.startGame();
			game.level.reset();
		});
		this.mainMenuGfx.addChild(this.mainMenuGfx.playButton);
		
		// download file button
		// add only if the download URL exists
		if (this.downloadURL !== -1) {
			this.mainMenuGfx.downloadButton = new createjs.Container();
			this.mainMenuGfx.downloadButton.game = this;
			this.mainMenuGfx.downloadButton.x = 55;
			this.mainMenuGfx.downloadButton.y = this.height-20;
			var downloadButton = new createjs.Shape();
			downloadButton.graphics.ss(1).s("#ffffff").f("#000000").rr(-50,-15,100,30,4,4,4,4);
			this.mainMenuGfx.downloadButton.addChild(downloadButton);
			// settings menu button text
			var downloadButtonText = new createjs.Text("Download File", "14px Arial", "#ffffff");
			downloadButtonText.textAlign = "center";
			downloadButtonText.textBaseline = "middle";
			this.mainMenuGfx.downloadButton.addChild(downloadButtonText);
			// add a click event listener
			this.mainMenuGfx.downloadButton.addEventListener("click", function(event) {
				var game = event.currentTarget.game;
				window.open(game.downloadURL, '_blank');
			});
			this.mainMenuGfx.addChild(this.mainMenuGfx.downloadButton);
		}
		
		// add everything to the stage and update
		this.stage.addChild(this.mainMenuGfx);
		this.stage.update();
	}
	
	// initialize settings menu
	initSettingsMenu() {
		this.settingsMenuGfx = new createjs.Container();
		
		// add the background image
		var background = new createjs.Shape();
		background.graphics.beginFill("#000000").rect(0, 0, this.width, this.height);
		background.x = 0;
		background.y = 0;
		this.settingsMenuGfx.addChild(background);
		
		// settings title text
		var settingsTitleText = new createjs.Text("Settings", "32px Arial", "#ffffff");
		settingsTitleText.x = this.width/2;
		settingsTitleText.y = 50;
		settingsTitleText.textAlign = "center";
		this.settingsMenuGfx.addChild(settingsTitleText);
		
		// text for each setting
		var settingsTextXAlign = 50;
		// key config text
		var keyConfigText = new createjs.Text("Key Config", "24px Arial", "#ffffff");
		keyConfigText.x = settingsTextXAlign;
		keyConfigText.y = 130;
		keyConfigText.textAlign = "left";
		keyConfigText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(keyConfigText);
		// more key config text
		var keyConfigPauseText = new createjs.Text("Pause", "20px Arial", "#ffffff");
		keyConfigPauseText.x = settingsTextXAlign+30;
		keyConfigPauseText.y = 170;
		keyConfigPauseText.textAlign = "left";
		keyConfigPauseText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(keyConfigPauseText);
		var keyConfigSeekText = new createjs.Text("Skip (Left/Right)", "20px Arial", "#ffffff");
		keyConfigSeekText.x = settingsTextXAlign+30;
		keyConfigSeekText.y = 210;
		keyConfigSeekText.textAlign = "left";
		keyConfigSeekText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(keyConfigSeekText);

		// scroll direction text
		var scrollDirectionText = new createjs.Text("Scroll Direction", "24px Arial", "#ffffff");
		scrollDirectionText.x = settingsTextXAlign;
		scrollDirectionText.y = 260;
		scrollDirectionText.textAlign = "left";
		scrollDirectionText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(scrollDirectionText);
		// scroll speed text
		var scrollSpeedText = new createjs.Text("Scroll Speed", "24px Arial", "#ffffff");
		scrollSpeedText.x = settingsTextXAlign;
		scrollSpeedText.y = 300;
		scrollSpeedText.textAlign = "left";
		scrollSpeedText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(scrollSpeedText);
		// scroll speed value
		var ssTextValue = this.tempSettings.scrollSpeed + ' pixels per second';
		var scrollSpeedValueText = new createjs.Text(ssTextValue, "20px Arial", "#ffffff");
		scrollSpeedValueText.x = settingsTextXAlign + 220;
		scrollSpeedValueText.y = 300;
		scrollSpeedValueText.textAlign = "left";
		scrollSpeedValueText.textBaseline = "middle";
		this.settingsMenuGfx.scrollSpeedValue = scrollSpeedValueText;
		this.settingsMenuGfx.addChild(scrollSpeedValueText);
		// global offset text
		var globalOffsetText = new createjs.Text("Global Offset", "24px Arial", "#ffffff");
		globalOffsetText.x = settingsTextXAlign;
		globalOffsetText.y = 340;
		globalOffsetText.textAlign = "left";
		globalOffsetText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(globalOffsetText);
		// global offset value
		var goTextValue = this.tempSettings.globalOffset + ' milliseconds';
		var globalOffsetValueText = new createjs.Text(goTextValue, "20px Arial", "#ffffff");
		globalOffsetValueText.x = settingsTextXAlign + 220;
		globalOffsetValueText.y = 340;
		globalOffsetValueText.textAlign = "left";
		globalOffsetValueText.textBaseline = "middle";
		this.settingsMenuGfx.globalOffsetValue = globalOffsetValueText;
		this.settingsMenuGfx.addChild(globalOffsetValueText);
		// volume text
		var volumeText = new createjs.Text("Volume", "24px Arial", "#ffffff");
		volumeText.x = settingsTextXAlign;
		volumeText.y = 380;
		volumeText.textAlign = "left";
		volumeText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(volumeText);
		// volume value
		var volTextValue = this.tempSettings.volume;
		var volumeValueText = new createjs.Text(volTextValue + '%', "20px Arial", "#ffffff");
		volumeValueText.x = settingsTextXAlign + 220;
		volumeValueText.y = 380;
		volumeValueText.textAlign = "left";
		volumeValueText.textBaseline = "middle";
		this.settingsMenuGfx.volumeValue = volumeValueText;
		this.settingsMenuGfx.addChild(volumeValueText);
		// noteskin
		var noteskinText = new createjs.Text("Noteskin", "24px Arial", "#ffffff");
		noteskinText.x = settingsTextXAlign;
		noteskinText.y = 420;
		noteskinText.textAlign = "left";
		noteskinText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(noteskinText);

		// bonus key config instruction
		var keyConfigInstructionText = new createjs.Text("Protip: Try the buttons!", "12px Arial", "yellow");
		keyConfigInstructionText.x = 550;
		keyConfigInstructionText.y = 200;
		keyConfigInstructionText.textAlign = "left";
		keyConfigInstructionText.textBaseline = "middle";
		this.settingsMenuGfx.addChild(keyConfigInstructionText);
		
		
		// key config buttons
		this.settingsMenuGfx.keyConfigButtons = {};
		var index = 0;
		function getKeyConfigButton(ref,width=70,height=30,color='#000000') {
			// create a button
			var button = new createjs.Container();
			button.game = ref;
			button.body = new createjs.Shape();
			button.body.graphics.ss(1).s("#ffffff").f(color).rr(-width/2,-height/2,width,height,4,4,4,4);
			button.addChild(button.body);
			// text
			button.textGfx = new createjs.Text("Q", "24px Arial", "#ffffff");
			button.textGfx.textAlign = "center";
			button.textGfx.textBaseline = "middle";
			button.addChild(button.textGfx);
			// function to change fill color
			button.setFill = function(color) {
				button.body.graphics._instructions[2].style = color;
			}
			return button;
		}
		// configure columns
		for (var col = 0; col < 6; col++) {
			// first make the button
			var button = getKeyConfigButton(this);
			this.settingsMenuGfx.keyConfigButtons[index] = button;
			index++;
			
			// assign it the corresponding column and key
			button.col = col;
			button.textGfx.text = getCharFromKeyCode(this.tempSettings.keyBind[col]);
			// give it a position
			button.y = 130;
			button.x = 300+80*col;
			// add a click event listener
			button.addEventListener("click", function(event) {
				var button = event.currentTarget;
				var game = button.game;
				var col = button.col;
				// make sure we aren't already configuring a key
				if (game.keyConfigureState === -1) {
					button.setFill('DeepSkyBlue');
					button.textGfx.text = '';
					game.keyConfigureState = col;
					game.stage.update();
				}
			});
			// add it to the menu
			this.settingsMenuGfx.addChild(button);
		}
		// pause button
		var pauseButton = getKeyConfigButton(this,120);
		this.settingsMenuGfx.keyConfigButtons['pause'] = pauseButton;
		pauseButton.col = 'pause';
		pauseButton.textGfx.text = getCharFromKeyCode(this.tempSettings.keyBind[pauseButton.col]);
		pauseButton.y = 170;
		pauseButton.x = 325;
		pauseButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			var col = button.col;
			// make sure we aren't already configuring a key
			if (game.keyConfigureState === -1) {
				button.setFill('DeepSkyBlue');
				button.textGfx.text = '';
				game.keyConfigureState = col;
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(pauseButton);
		
		// seek left/right
		var seekLeftButton = getKeyConfigButton(this,120);
		this.settingsMenuGfx.keyConfigButtons['seekLeft'] = seekLeftButton;
		seekLeftButton.col = 'seekLeft';
		seekLeftButton.textGfx.text = getCharFromKeyCode(this.tempSettings.keyBind[seekLeftButton.col]);
		seekLeftButton.y = 210;
		seekLeftButton.x = 325;
		seekLeftButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			var col = button.col;
			// make sure we aren't already configuring a key
			if (game.keyConfigureState === -1) {
				button.setFill('DeepSkyBlue');
				button.textGfx.text = '';
				game.keyConfigureState = col;
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(seekLeftButton);
		var seekRightButton = getKeyConfigButton(this,120);
		this.settingsMenuGfx.keyConfigButtons['seekRight'] = seekRightButton;
		seekRightButton.col = 'seekRight';
		seekRightButton.textGfx.text = getCharFromKeyCode(this.tempSettings.keyBind[seekRightButton.col]);
		seekRightButton.y = 210;
		seekRightButton.x = 325+130;
		seekRightButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			var col = button.col;
			// make sure we aren't already configuring a key
			if (game.keyConfigureState === -1) {
				button.setFill('DeepSkyBlue');
				button.textGfx.text = '';
				game.keyConfigureState = col;
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(seekRightButton);
		
		// downscroll and upscroll buttons
		this.settingsMenuGfx.scrollButtons = {};
		// downscroll button
		if (this.settings.scrollDirection === 'down') {
			var downScrollButton = getKeyConfigButton(this,120,30,'#198a26');
		} else {
			var downScrollButton = getKeyConfigButton(this,120,30);
		}
		this.settingsMenuGfx.scrollButtons['down'] = downScrollButton;
		downScrollButton.value = 'down';
		downScrollButton.textGfx.text = 'down';
		downScrollButton.y = 260;
		downScrollButton.x = 325;
		downScrollButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			game.settingsMenuGfx.scrollButtons['up'].setFill('black');
			game.tempSettings.scrollDirection = 'down';
			button.setFill('#198a26');
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(downScrollButton);
		// upscroll button
		if (this.settings.scrollDirection === 'up') {
			var upScrollButton = getKeyConfigButton(this,120,30,'#198a26');
		} else {
			var upScrollButton = getKeyConfigButton(this,120,30);
		}
		this.settingsMenuGfx.scrollButtons['up'] = upScrollButton;
		upScrollButton.value = 'up';
		upScrollButton.textGfx.text = 'up';
		upScrollButton.y = 260;
		upScrollButton.x = 325+130;
		upScrollButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			game.settingsMenuGfx.scrollButtons['down'].setFill('black');
			game.tempSettings.scrollDirection = 'up';
			button.setFill('#198a26');
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(upScrollButton);
		
		// button to update the scroll speed
		var scrollSpeedUpdateButton = getKeyConfigButton(this,70,25);
		scrollSpeedUpdateButton.textGfx.text = 'Change';
		scrollSpeedUpdateButton.textGfx.font = "18px Arial";
		scrollSpeedUpdateButton.y = 300;
		scrollSpeedUpdateButton.x = 580;
		scrollSpeedUpdateButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			// prompt the user
			var speedValue = prompt("Please enter a scroll speed (between 100-8000):", game.tempSettings.scrollSpeed);
			speedValue = parseInt(speedValue);
			if (speedValue >= 100 && speedValue <= 8000) {
				game.tempSettings.scrollSpeed = speedValue;
				game.tempSettings.scrollSpeedFactor = speedValue/1000;
				game.settingsMenuGfx.scrollSpeedValue.text = speedValue + ' pixels per second';
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(scrollSpeedUpdateButton);
		
		// button to update the global offset
		var globalOffsetUpdateButton = getKeyConfigButton(this,70,25);
		globalOffsetUpdateButton.textGfx.text = 'Change';
		globalOffsetUpdateButton.textGfx.font = "18px Arial";
		globalOffsetUpdateButton.y = 340;
		globalOffsetUpdateButton.x = 580;
		globalOffsetUpdateButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			// prompt the user
			var offsetValue = prompt("Please enter a global offset (in milliseconds):", game.tempSettings.globalOffset);
			offsetValue = parseInt(offsetValue);
			if (offsetValue >= -100000 && offsetValue <= 100000) {
				game.tempSettings.globalOffset = offsetValue;
				game.settingsMenuGfx.globalOffsetValue.text = offsetValue + ' milliseconds';
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(globalOffsetUpdateButton);
		
		// button to update the volume
		var volumeUpdateButton = getKeyConfigButton(this,70,25);
		volumeUpdateButton.textGfx.text = 'Change';
		volumeUpdateButton.textGfx.font = "18px Arial";
		volumeUpdateButton.y = 380;
		volumeUpdateButton.x = 580;
		volumeUpdateButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			// prompt the user
			var volumeValue = prompt("Please enter a volume level (between 0 and 100):", game.tempSettings.volume);
			volumeValue = parseInt(volumeValue);
			if (volumeValue >= 0 && volumeValue <= 100) {
				game.tempSettings.volume = volumeValue;
				game.settingsMenuGfx.volumeValue.text = volumeValue + '%';
				game.stage.update();
			}
		});
		this.settingsMenuGfx.addChild(volumeUpdateButton);
		
		// OK button
		var OKButton = getKeyConfigButton(this,100,40);
		OKButton.textGfx.text = 'OK';
		OKButton.x = this.width/2 - 100;
		OKButton.y = this.height-80;
		OKButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			// exit the menu and record all temp settings
			game.settings = clone(game.tempSettings);
			game.saveSettings();
			game.initMainMenu();
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(OKButton);
		// Cancel button
		var cancelButton = getKeyConfigButton(this,100,40);
		cancelButton.textGfx.text = 'Cancel';
		cancelButton.x = this.width/2 + 100;
		cancelButton.y = this.height-80;
		cancelButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			// exit the menu
			game.initMainMenu();
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(cancelButton);
		
		
		// noteskin buttons
		this.settingsMenuGfx.noteskinButtons = {};
		// downscroll button
		if (this.settings.noteskin === 'orb') {
			var orbSkinButton = getKeyConfigButton(this,120,30,'#198a26');
		} else {
			var orbSkinButton = getKeyConfigButton(this,120,30);
		}
		this.settingsMenuGfx.noteskinButtons['orb'] = orbSkinButton;
		orbSkinButton.value = 'orb';
		orbSkinButton.textGfx.text = 'orb';
		orbSkinButton.y = 420;
		orbSkinButton.x = 325;
		orbSkinButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			game.settingsMenuGfx.noteskinButtons['bar'].setFill('black');
			game.tempSettings.noteskin = 'orb';
			button.setFill('#198a26');
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(orbSkinButton);
		// upscroll button
		if (this.settings.noteskin === 'bar') {
			var barSkinButton = getKeyConfigButton(this,120,30,'#198a26');
		} else {
			var barSkinButton = getKeyConfigButton(this,120,30);
		}
		this.settingsMenuGfx.noteskinButtons['bar'] = barSkinButton;
		barSkinButton.value = 'bar';
		barSkinButton.textGfx.text = 'bar';
		barSkinButton.y = 420;
		barSkinButton.x = 325+130;
		barSkinButton.addEventListener("click", function(event) {
			var button = event.currentTarget;
			var game = button.game;
			game.settingsMenuGfx.noteskinButtons['orb'].setFill('black');
			game.tempSettings.noteskin = 'bar';
			button.setFill('#198a26');
			game.stage.update();
		});
		this.settingsMenuGfx.addChild(barSkinButton);
		
	}
	
	// open settings menu
	openSettings() {
		this.menuState = 'settings';
		
		this.stage.addChild(this.settingsMenuGfx);
		this.stage.update();
		// make a copy of the current settings and put it into the temp settings
		this.tempSettings = clone(this.settings);
	}
	
	// handle input
	rawKeyDown(e) {
		
		// prevent repeating keys when held down
		if (e.repeat) {
			return;
		}
		
		// we are configuring a key at the moment
		if (this.keyConfigureState !== -1) {
			// do not let the user configure the escape key, this cancels the change
			if (e.keyCode === ESC) {
				// update the graphics
				var button = this.settingsMenuGfx.keyConfigButtons[this.keyConfigureState];
				button.textGfx.text = getCharFromKeyCode(this.tempSettings.keyBind[this.keyConfigureState]);
				button.setFill('black');
				this.stage.update();
				// reset state
				this.keyConfigureState = -1;
				return;
			}
			// update temp settings
			this.tempSettings.keyBind[this.keyConfigureState] = e.keyCode;
			// update the graphics
			var button = this.settingsMenuGfx.keyConfigButtons[this.keyConfigureState];
			button.textGfx.text = getCharFromKeyCode(e.keyCode);
			button.setFill('black');
			this.stage.update();
			// reset state
			this.keyConfigureState = -1;
			return;
		}
		
		// keyboard controls
		switch (e.keyCode) {
			case this.settings.keyBind['pause']:
				if (this.menuState === 'game') {
					if (this.timeline.playing) {
						this.timeline.stop();
					} else {
						this.timeline.play();
					}
				}
				break;
			case this.settings.keyBind['seekLeft']:
				if (this.menuState === 'game') {
					this.timeline.skip(-1000);
					// whenever we set a new position, we need to reset the notes
					this.level.reset();
				}
				break;
			case this.settings.keyBind['seekRight']:
				if (this.menuState === 'game') {
					this.timeline.skip(1000);
					// whenever we set a new position, we need to reset the notes
					this.level.reset();
				}
				break;
			case ESC:
				// go back to the main menu
				this.timeline.stop();
				this.level.reset();
				this.initMainMenu();
				break;
		}
		
		// check if one of the keybinded buttons is hit
		if (this.menuState === 'game') {
			var columnButton = -1;
			for (var key in this.settings.keyBind) {
				if (this.settings.keyBind[key] === e.keyCode) {
					columnButton = key;
				}
			}
			if (columnButton >= 0 && columnButton < 6) {
				this.hitButton(columnButton);
			}
		}

		this.keysDown[e.keyCode] = true;
		
		// update the key config settings buttons
		if (this.menuState === 'settings') {
			var col = -1;
			for (var key in this.tempSettings.keyBind) {
				if (this.tempSettings.keyBind[key] === e.keyCode) {
					col = key;
				}
			}
			if (col != -1) {
				var button = this.settingsMenuGfx.keyConfigButtons[col];
				button.setFill('#198a26');
				this.stage.update();
			}
		}
		
		// prevent default actions in the browser when these keys are hit
		if([SPACE, LEFT, RIGHT, UP, DOWN, PAGEUP, PAGEDOWN, HOME, END, BACKSPACE, CTRL, ALT, WINDOWS].indexOf(e.keyCode) > -1) {
			e.preventDefault();
		}
	}
	rawKeyUp(e) {
		delete this.keysDown[e.keyCode];
		
		// update the key config settings buttons
		if (this.menuState === 'settings') {
			var col = -1;
			for (var key in this.tempSettings.keyBind) {
				if (this.tempSettings.keyBind[key] === e.keyCode) {
					col = key;
				}
			}
			if (col != -1) {
				var button = this.settingsMenuGfx.keyConfigButtons[col];
				button.setFill('#000000');
				this.stage.update();
			}
		}
	}

	// start the game
	startGame() {
		// this plays prematurely, not sure why
		if (this.timeline.readyToPlay) {
			this.menuState = 'game';									// set menu state
			createjs.Sound.volume = this.settings.volume/100;			// set the proper volume level
			this.level.setup();											// initialize the level
			if (createjs.Ticker.hasEventListener('tick')) {
				createjs.Ticker.removeAllEventListeners("tick");		// remove previous ticker
			}
			createjs.Ticker.addEventListener("tick", this.tick);		// start the ticker to update every frame
			this.timeline.setPosition(this.timeline.start);				// start at the beginning of the chart
			this.timeline.play();										// play
		}
	}
	
	// function is run whenever a column button is pressed
	hitButton(col) {
		// get the number of keys in the file
		var keys = this.level.notetrack.keyCount;
		
		// get the receptor that corresponds to this column
		if (keys === 4) {
			// ignore if we hit a receptor that doesn't exist
			if (+col === 0 || +col === 5) {
				return;
			}
			var receptor = +col-1;
		} else {
			var receptor = +col;
		}
		this.registerColumn(receptor);
	}
	registerColumn(col) {
		
		// get the time at which the hit was called
		var time = this.timeline.getPosition();
		
		// set the mine check to "failed to register a note"
		this.keysMineCheck[col].tapRegistered = false;
		this.keysMineCheck[col].lastHeld = this.timeline.getPosition();
		
		// go through the notes to see if a note should be registered		
		var notes = this.level.notetrack.notes[col];
		for (var k = 0; k < notes.length; k++) {
			var note = notes[k];
			
			// get the amount of time between the note and the hit
			var timeDiff = note.time*1000 - time;

			// check what the judgment actually is
			var judge = timingToJudgment(timeDiff);
			
			// check if the note is within the timing window and not registered
			if (judge.name !== 'Miss' && !note.registered) {
				
				// register the note
				note.registered = true;
				// set the mine check to "registered a note"
				this.keysMineCheck[col].tapRegistered = true;
				
				// update depending if combo or not
				if (judge.combo) {
					if (note.type === 'tap') {
						// simply kill the note
						note.alive = false;
					} else if (note.type === 'hold') {
						// the hold is now active
						note.active = true;
						// assume it is being held
						note.held = true;
						// store the hold for further checks
						this.level.heldNotes[col] = note;
					}
				}
				
				// don't check more than one note
				break;
			}
		}
		
		// if we didn't hit a note, check if a mine has been hit
		if (!this.keysMineCheck[col].tapRegistered) {
			var mines = this.level.notetrack.mines[col];
			for (var k = 0; k < mines.length; k++) {
				var mine = mines[k];
				// get the amount of time between the note and the hit
				var timeDiff = Math.abs(mine.time*1000 - time);
				// check if it's been hit
				if (!mine.registered && timeDiff <= judgmentWindows['Mine']) {
					mine.registered = true;
					mine.alive = false;
					// this command should go into the Level object
					this.level.receptors[col].mineBurst(this.mineSound);
					break;
				}
			}
		}
	}
	// update game logic depending on the held keys
	checkHeldKeys() {
		// get the number of keys in the file
		var keys = this.level.notetrack.keyCount;

		// hold a reference to the Game object
		var ref = this;
		
		// check each column
		for (var col = 0; col < this.level.notetrack.keyCount; col++) {
			// get the receptor that corresponds to this column
			if (keys === 4) {
				var receptor = col+1;
			} else {
				var receptor = col;
			}
			
			var heldNote = this.level.heldNotes[col];				// stores the hold note (if it exists)
			var keyHeld = ref.keysDown[ref.settings.keyBind[receptor]];	// checks if the current receptor is being held down
			var time = this.timeline.getPosition();					// current time
			
			// check for mines
			for (var k = 0; k < ref.level.notetrack.mines[col].length; k++) {
				var mine = ref.level.notetrack.mines[col][k];
				
				// find a valid mine
				if (!mine.registered && keyHeld) {
					// we hit the mine if we hold down the key directly over it
					var mineFound = mine.time*1000 <= time && mine.time*1000 > ref.keysMineCheck[col].lastHeld;
					// we found the mine, handle actions
					if (mineFound) {
						mine.registered = true;
						mine.alive = false;
						// this command should go into the Level object
						ref.level.receptors[col].mineBurst(this.mineSound);
					}
				}
			}
			
			// update receptors
			if (keyHeld) {
				ref.level.receptors[col].push();
			}
			
			// held note found
			if (heldNote) {
				// check if the hold is completed
				if (heldNote.active && time > heldNote.endTime*1000) {
					heldNote.alive = false;
					heldNote.active = false;
					continue;
				}
				
				// hold is not completed
				
				// set what happens while key is held or not held
				if (keyHeld) {
					heldNote.held = true;
					// we are still holding down the key for mines
					ref.keysMineCheck[col].lastHeld = time;
				} else {
					if (heldNote.held) {
						heldNote.lastRelease = time;
					}
					heldNote.held = false;
					// hold note is dropped
					if (judgmentWindows['Hold'] + heldNote.lastRelease < time) {
						heldNote.active = false;
					}
				}
			}
		}
	}
	
}