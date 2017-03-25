
// If we are running under Node, we need to add expect and load our module
if (typeof module !== 'undefined' && module.exports) {
    global.expect = require('expect.js');
    global.Timecode = require('../smpte-timecode.js');
};

describe('Constructor tests', function(){

    var t = Timecode(100);

    it ('no new still gets you Timecode()', function() {
        expect(Timecode(3)).to.be.a(Timecode);
    });

    it ('numbers converted to framecounts', function() {
        expect(Timecode(15).frameCount).to.be(15);
        expect(Timecode(323.443).frameCount).to.be(323);
    });

    it ('incorrect initializers throw', function() {
        expect(function(){Timecode(1,-1)}).to.throwException();
        expect(function(){Timecode('dewdew');}).to.throwException();
        expect(function(){Timecode('dewdew');}).to.throwException();
    });

    it ('string initializers work', function(){
        var t = new Timecode('12:33:44;12');
        expect(t.hours).to.be(12);
        expect(t.minutes).to.be(33);
        expect(t.seconds).to.be(44);
        expect(t.frames).to.be(12);
        expect(t.dropFrame).to.be(true);
        expect(t.frameRate).to.be(29.97);
        var t = new Timecode('12:33:44:12');
        expect(t.hours).to.be(12);
        expect(t.minutes).to.be(33);
        expect(t.seconds).to.be(44);
        expect(t.frames).to.be(12);
        expect(t.dropFrame).to.be(false);
        expect(t.frameRate).to.be(29.97);

        expect(function(){Timecode('40:02:00;02')}).to.throwError();
        expect(function(){Timecode('00:99:00;02')}).to.throwError();
        expect(function(){Timecode('00:02:99;02')}).to.throwError();
        expect(function(){Timecode('00:02:00;35')}).to.throwError();

    });

    it ('drop-frame and framerate defaults', function() {
        expect(Timecode(1).dropFrame).to.be(true);
        expect(Timecode(1).frameRate).to.be(29.97);
        expect(Timecode(1,29.97).dropFrame).to.be(true);
        expect(Timecode(1,25).dropFrame).to.be(false);
    });

    it ('drop-frame only for 29.97', function() {
        expect(function(){Timecode(0,30,true)}).to.throwException();
    });

    it ('drop-frame counts', function() {
        expect(Timecode('00:10:00;00').frameCount).to.be(17982);
        expect(Timecode('10:00:00;00').frameCount).to.be(1078920);
        expect(function(){Timecode('00:02:00;00')}).to.throwError();
        expect(Timecode('00:01:59;29').frameCount).to.be(3597);
        expect(Timecode(17982,29.97,true).toString()).to.be('00:10:00;00'); 
        expect(Timecode(1078920,29.97,true).toString()).to.be('10:00:00;00'); 
        expect(Timecode(3597,29.97,true).toString()).to.be('00:01:59;29'); 
    });
    it ('non-drop-frame counts', function() {
        expect(Timecode('00:10:00:00',25).frameCount).to.be(15000);
        expect(Timecode('10:00:00:00',25).frameCount).to.be(900000);
        expect(Timecode('00:02:00:00',25).frameCount).to.be(3000);
        expect(Timecode('00:01:59:24',25).frameCount).to.be(2999);
        expect(Timecode(15000,25).toString()).to.be('00:10:00:00'); 
        expect(Timecode(900000,25).toString()).to.be('10:00:00:00'); 
        expect(Timecode(2999,25).toString()).to.be('00:01:59:24'); 
    });
});

describe('String conversions', function(){
    it ('back and forth works',function(){
        expect(Timecode('12:34:56;23').toString()).to.be('12:34:56;23');
        expect(Timecode('01:02:03;04').toString()).to.be('01:02:03;04');
    });
    it ('implicit calls to toString()',function(){
        expect('+'.concat(Timecode('12:34:56;23'),'+')).to.be('+12:34:56;23+');
        expect(/12.34.56.23/.test(Timecode('12:34:56;23')));
    });
});

describe('Timecode arithmetic', function(){
    it ('Timecode() as primitive', function() {
        var t = Timecode('01:23:45;06');
        expect(t.frameCount).to.be(150606);
        expect(t+1).to.be(150607);
        expect(12*t).to.be(150606*12);
        expect(-t).to.be(-150606);
        expect(Math.round(t)).to.be(150606);
        t++;
        expect(t).to.be(150607); 
        expect(t).to.be.a('number'); // t is not a timecode anymore!
    });
    it ('Timecode().add()', function() {
        var t = Timecode('01:23:45;06');
        expect(t.add(60).toString()).to.be('01:23:47;06')
        expect(function(){Timecode('00:00:10;00').add(-301)}).to.throwError(); // below zero
        expect(Timecode('23:59:40;00').add(Timecode('00:00:21;00')).toString()).to.be('00:00:01;00'); // wraparound
    });
});

describe('Date() operations', function(){
    it ('Date() initializers work', function(){
        var t = new Timecode( new Date(0,0,0,1,2,13,200), 29.97, true );
        expect( t.frameCount ).to.be(111996);
    });
    it ('Timecode to Date()', function(){
        var t = new Timecode( new Date(0,0,0,1,2,13,200), 29.97, true );
        expect( t.frameCount ).to.be(111996);
        expect( Timecode('00:01:01;10').toDate()).to.be(Date(0,0,0,0,1,1,333));
    });
});
