// Handle keyboard controls

// Keycode values //
var ESC = 27,
	LEFT = 37,
	UP = 38,
	RIGHT = 39,
	DOWN = 40,
	SPACE = 32,
	A = 65,
	B = 66,
	C = 67,
	D = 68,
	E = 69,
	F = 70,
	G = 71,
	H = 72,
	I = 73,
	J = 74,
	K = 75,
	L = 76,
	M = 77,
	N = 78,
	O = 79,
	P = 80,
	Q = 81,
	R = 82;
	S = 83,
	T = 84,
	U = 85,
	V = 86,
	W = 87,
	X = 88,
	Y = 89,
	Z = 90,
	NUM0 = 96,
	NUM1 = 97,
	NUM2 = 98,
	NUM3 = 99,
	NUM4 = 100,
	NUM5 = 101,
	NUM6 = 102,
	NUM7 = 103,
	NUM8 = 104,
	NUM9 = 105,
	SEMICOLON = 186,
	EQUAL = 187,
	COMMA = 188,
	HYPHEN = 189,
	PERIOD = 190,
	FSLASH = 191,
	GRAVE = 192,
	OPENBRACKET = 219,
	BSLASH = 220,
	CLOSEBRACKET = 221,
	APOSTROPHE = 222,
	PAGEUP = 33,
	PAGEDOWN = 34,
	END = 35,
	HOME = 36,
	SHIFT = 16,
	ENTER = 13,
	BACKSPACE = 8,
	CTRL = 17,
	ALT = 18,
	WINDOWS = 91;

function getCharFromKeyCode(n) {
	switch (n) {
		case 8:
			return 'Bspace';
		case 9:		// why
			return 'Tab';
		case 16:
			return 'Shift';
		case 17:
			return 'Ctrl';
		case 18:
			return 'Alt';
		case 20:
			return 'CapsL';
		case 32:
			return 'Space';
		case 33:
			return 'PgUp';
		case 34:
			return 'PgDn';
		case 35:
			return 'End';
		case 36:
			return 'Home';
		case 37:
			return 'Left';
		case 38:
			return 'Up';
		case 39:
			return 'Right';
		case 40:
			return 'Down';
		case 45:
			return 'Ins';
		case 46:
			return 'Del';
		case 91:	// why
			return 'LWin';
		case 92:	// why
			return 'RWin';
		case 93:
			return 'Select';
		case 96:
			return 'Num0';
		case 97:
			return 'Num1';
		case 98:
			return 'Num2';
		case 99:
			return 'Num3';
		case 100:
			return 'Num4';
		case 101:
			return 'Num5';
		case 102:
			return 'Num6';
		case 103:
			return 'Num7';
		case 104:
			return 'Num8';
		case 105:
			return 'Num9';
		case 106:
			return 'Num*';
		case 107:
			return 'Num+';
		case 109:
			return 'Num-';
		case 110:
			return 'Num.';
		case 111:
			return 'Num/';
		case 186:
			return ';';
		case 187:
			return '=';
		case 188:
			return ',';
		case 189:
			return '-';
		case 190:
			return '.';
		case 191:
			return '/';
		case 192:
			return '`';
		case 219:
			return '[';
		case 220:
			return '\\';
		case 221:
			return ']';
		case 222:
			return "'";
	}
	return String.fromCharCode(n);
}