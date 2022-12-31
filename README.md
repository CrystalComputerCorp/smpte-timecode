# smpte-timecode
[![npm](https://img.shields.io/npm/v/smpte-timecode.svg)](http://www.npmjs.com/package/smpte-timecode) [![npm](https://img.shields.io/npm/dt/smpte-timecode.svg)](https://www.npmjs.com/package/smpte-timecode) [![npm](https://img.shields.io/npm/l/smpte-timecode.svg)]()

`smpte-timecode` is a JavaScript library for operations with [SMPTE timecodes](https://en.wikipedia.org/wiki/SMPTE_timecode).

## Features

- usable in browser and Node environments;
- supports drop-frame and non-drop-frame codes;
- instantiate timecodes from frame count, string time code or JavaScript Date() objects;
- timecode arithmetics: adding frame counts and other timecodes;
- support of implicit conversiont to `string` (`toString()`) and `number` (`valueOf()`);

## Usage

```javascript
const Timecode = require('smpte-timecode')
var t = Timecode('00:15:10;03');
t.add('00:02:30;00');
console.log(t.frameCount);
t.subtract(100); //frames
console.log(t.toString());
```

## Creating Timecode() Objects
```javascript
Timecode = function (timecode, frameRate, dropFrame) {...};
```

- `timecode`: number, string or Date  
  - Numbers are interpreted as frame count.  
  - Strings are expected as `"HH:MM:SS:FF"` (non-drop-frame) or
`"HH:MM:SS;FF"` (drop-frame). The constructor will throw if the string contains invalid timecode, for example frame count above framerate or 0 frames in a drop-frame second.  
  - If `Date()` is passed, it is converted to the timecode a master 
clock would have with a given framerate. Month, date and
year discarded.

- `frameRate`: number or Array, optional  
if a non-integer number is passed that is near 24, 30 or 60, (i.e. 23.97 or 29.97 for example) the 
fractional 24000/1001, 30000/1001 or 60000/1001 rates will be assumed. If an array is passed, the
framerate is assumed to be a natural fraction, with first element the numerator and second the denominator (for example, [60000,10001]).
The framerate of 30000/1001 (29.97) is assumed if the parameter is omitted.

- `dropFrame`: boolean, optional  
whether the timecode is using drop-frame or non-drop-frame mode.
If omitted, and `timecode` is a string, the drop-frame mode is determined based on
the ":" or ";" characters separating the frames in the `timecode` parameter.
If `timecode` parameter is not a string, drop-frame assumed for 29.97 and 59.94 framerates, non-drop-frame for all others.

Examples:
```javascript
var minute = new Timecode('00:01:00:00');
var eightHundredFrames = new Timecode(800,29.97,true);
var nineHundredFrames = new Timecode(900,[60000,1001],true);
var wallClock = new Timecode(new Date());
```

Note: a direct call to `Timecode()` returns a `Timecode` object too, so both direct
calls and instantiating with `new` return the same result:
```javascript
console.log((new Timecode('00:15:00;00')).toString()); 
// is the same as
console.log(Timecode('00:15:00;00').toString());
```

## Using Timecode() Objects

Once a `Timecode` object is created, the following member variables are available:

- `frameCount`: number, total number of frames
- `frameRate`: number, framerate in FPS
- `hours`: number
- `minutes`: number
- `seconds`: number
- `frames`: number
- `dropFrame`: boolean, whether timecode is drop-frame or not

The `Timecode` object also provides the following member functions:

- `add(x)`: Timecode, adds `x` to timecode, `x` can be a number, `Date` or `Timecode`
- `subtract(x)`: Timecode, subtracts `x` from timecode, `x` can be a number, `Date` 
    or `Timecode`
- `toString()`: string, returns the timecode in "HH:MM:SS:FF" or "HH:MM:SS;FF" format
- `toString('field')`: string, returns the timecode in VITC format, where timecodes above 30fps are represented as frame.field, i.e. HH:MM:SS:FF.f
- `toDate()`: date, returns a `Date` object using today's date and timecode as wall clock
- `valueOf()`: number, returns `this.frameCount`

For more usage examples, see the unit tests.

## Running Tests
To run tests, make sure you install `expect.js`, `mocha`, and `nyc` NPMs **locally**.

    npm install expect.js mocha nyc

The tests can be run in Node using:

    npm test
    npm run coverage

To run the tests in a browser environment, open the `test/smpte-timecode-test.html` file
in a browser.

## Update History
- 1.3.1
  - Coverage tests changed to nyc
  - Support for fractional framerates and framerates above 60fps
- 1.2.3
  - Fix for adding a string-based timecode to already initialized timecode with original framerate (@tommilburn)
  - A couple of other date conversion issues (@nkurdybakha & @74ls04)
- 1.2.1
  - Added support for 23.976 fps framerate (@funkelodeon)
- 1.2.0
  - Added support for 59.94 fps drop-frame expressed without fields - i.e. 00:00:00;59 is 1 frame short of a second;
  - Added `.ToString('field')` output in HH:MM:SS;FF.f format;
- 1.1.0  
  - Fixed the problem with Timecode.add(0) subtracting the frameCount for drop frame timecodes

## Credits
- [https://www.npmjs.com/package/timecode](https://www.npmjs.com/package/timecode) 
NPM module, which in the end I decided to rewrite. The things I needed would have 
been breaking changes for anyone who used it.
- [http://andrewduncan.net/timecodes/](http://andrewduncan.net/timecodes/) by Andrew Duncan

## Legal
License: MIT

Copyright &copy; 2023 LTN Global Communications, Inc. [http://www.ltnglobal.com](http://www.ltnglobal.com)<br/>
Copyright &copy; 2017 Crystal Computer Corp. [http://www.crystalcc.com](http://www.crystalcc.com)
