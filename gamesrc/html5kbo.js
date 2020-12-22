// --------------------------
// Import all necessary files
// --------------------------

// function for importing a script within javascript

function include(file) {

	var script = document.createElement('script');
	script.src = file;
	script.type = 'text/javascript';
	script.defer = true;

	document.getElementsByTagName('head').item(0).appendChild(script);
}

async function initCreateJS() {
	// load the sound effects
	return await new Promise((resolve, reject) => {
		var result = createjs.Sound.registerSound({id:'mine', src:thisFilePath+'mine.ogg'});
		if (result === true) {
			console.log("Mine SFX had already been loaded.");
			resolve("mine.ogg");
		} else {
			let loadListener = createjs.Sound.on("fileload", e => {
				if (e.id == "mine") {
					createjs.Sound.off("fileload", loadListener);
					resolve("mine.ogg");
				}
			});

			let errorListener = createjs.Sound.on("fileerror", e => {
				if (e.id == "mine") {
					createjs.Sound.off("fileerror", errorListener);
					reject("mine.ogg");
				}
			});
		}
	}).then(
		src => console.log(`${src} loaded`),
		src => console.log(`${src} couldn't be loaded`)
	);
}

// -------------
// Main function
// -------------
//
// Takes an array of objects, where each object is the configuration data for each game canvas
async function html5kbo(gameConfigs) {
	// ---------------------------------
	// Initialize all the games in order
	// ---------------------------------
	
	// container for the game's init function allows it to reference itself
	var games = gameConfigs.map(config => new Game(config));

	for (var k = 0; k < games.length; k++) {
		await games[k].init();
		function getGameKeyDown(k) {
			return function(e){games[k].rawKeyDown(e)};
		}
		function getGameKeyUp(k) {
			return function(e){games[k].rawKeyUp(e)};
		}
		addEventListener("keydown", getGameKeyDown(k));
		addEventListener("keyup", getGameKeyUp(k));
	}
}

var scripts = document.getElementsByTagName("script");
var baseScriptName = 'html5kbo.js'
var baseScriptIndex = -1;
for (var k = 0; k < scripts.length; k++) {
	var scriptsrc = scripts[k].src;
	var testStr = scriptsrc.substring(scriptsrc.length-baseScriptName.length,scriptsrc.length);
	if (testStr === baseScriptName) {
		baseScriptIndex = k;
	}
}
if (baseScriptIndex === -1) {
	throw new Error('Somehow could not locate the base "'+baseScriptName+'" script.');
}
var thisFilePath = scripts[baseScriptIndex].src.replace('www.','');
thisFilePath = thisFilePath.substring(0,thisFilePath.length-baseScriptName.length);

// grab the current script file folder
// not sure how reliable this part is, potentially could break

// include all the necessary files now
include(thisFilePath+'game.js');
include(thisFilePath+'notetrack.js');
include(thisFilePath+'graphics.js');
include(thisFilePath+'controls.js');
include(thisFilePath+'utility.js');
include(thisFilePath+'config.js');
include(thisFilePath+'convertsm.js');

initCreateJS();