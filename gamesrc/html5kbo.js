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

// grab the current script file folder
// not sure how reliable this part is, potentially could break
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
var thisFilePath = scripts[baseScriptIndex].src;
thisFilePath = thisFilePath.substring(0,thisFilePath.length-baseScriptName.length);

// include all the necessary files now
include(thisFilePath+'game.js');
include(thisFilePath+'notetrack.js');
include(thisFilePath+'graphics.js');
include(thisFilePath+'controls.js');
include(thisFilePath+'utility.js');
include(thisFilePath+'config.js');
include(thisFilePath+'convertsm.js');


// -------------
// Main function
// -------------
//
// Takes an array of objects, where each object is the configuration data for each game canvas
function html5kbo(gameConfigs) {
	// ---------------------------------
	// Initialize all the games in order
	// ---------------------------------

	var games = gameConfigs.map(gameConfig => new Game(gameConfig));

	return Promise.all(
		games.map(game => game.init())
	).then(() => {
		games.forEach(game => {
			addEventListener("keydown", game.rawKeyDown)
			addEventListener("keyup", game.rawKeyUp)
		})
	})
}
