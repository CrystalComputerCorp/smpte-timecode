
// If we are running under Node, we need to add expect and load our module
if (typeof module !== 'undefined' && module.exports) {
    global.expect = require('expect.js');
    global.isEqual = require('lodash.isequal');
    global.Timecode = require('../smpte-timecode.js');
    global.sinon = require('sinon');
    var runInBrowser = false;
}
else {
    var runInBrowser = true;
}

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
        expect(function(){Timecode(1,66.1)}).to.throwException();
        expect(function(){Timecode('dewdew');}).to.throwException();
        expect(function(){Timecode('dewdew');}).to.throwException();
        expect(function(){Timecode({w:3});}).to.throwException();
    });

    it ('string initializers work', function(){
        var t = new Timecode('12:33:44;12');
        expect(t.hours).to.be(12);
        expect(t.minutes).to.be(33);
        expect(t.seconds).to.be(44);
        expect(t.frames).to.be(12);
        expect(t.dropFrame).to.be(true);
        expect(t.frameRateNum).to.be(30000);
        expect(t.frameRateDen).to.be(1001);
        expect(t.frameRate).to.be(29.97);
        t = new Timecode('12:33:44:12');
        expect(t.hours).to.be(12);
        expect(t.minutes).to.be(33);
        expect(t.seconds).to.be(44);
        expect(t.frames).to.be(12);
        expect(t.dropFrame).to.be(false);
        expect(t.frameRateNum).to.be(30000);
        expect(t.frameRateDen).to.be(1001);
        expect(t.frameRate).to.be(29.97);

        expect(function(){Timecode('40:02:00;02')}).to.throwError();
        expect(function(){Timecode('00:99:00;02')}).to.throwError();
        expect(function(){Timecode('00:02:99;02')}).to.throwError();
        expect(function(){Timecode('00:02:00;35')}).to.throwError();

    });

    it ('initializing from an object',function(){
        var t = new Timecode( {hours:12, minutes:34, seconds:56, frames:2 } );
        expect(t.toString()).to.be('12:34:56;02');
        expect(function(){Timecode(0,{})}).to.throwException();
    });

    it ('initialization defaults', function() {
        var t = Timecode();
        expect(t.frameCount).to.be(0);
        expect(t.frameRate).to.be(29.97);
        expect(t.dropFrame).to.be(true);
        expect(Timecode(1).dropFrame).to.be(true);
        expect(Timecode(1).frameRate).to.be(29.97);
        expect(Timecode(1,29.97).dropFrame).to.be(true);
        expect(Timecode(1,59.94).dropFrame).to.be(true);
        expect(Timecode(1,25).dropFrame).to.be(false);
    });

    it ('natural fraction timecodes', function() {
        var t = Timecode('00:02:10;34',[60000,1001]);
        expect(t.frameRate).to.be(59.94);
        var t2 = Timecode('00:02:10;14',[25000,1001]);
        expect(t2.frameRate).to.be(24.98);
    });

    it ('drop-frame only for 29.97 and 59.94', function() {
        expect(function(){Timecode(0,30,true)}).to.throwException();
        expect(function(){Timecode(0,59.94,true)}).to.not.throwException();
    });

    it ('drop-frame counts', function() {
        expect(Timecode('00:10:00;00').frameCount).to.be(17982);
        expect(Timecode('00:10:00;00',59.94).frameCount).to.be(17982*2);
        expect(Timecode('10:00:00;00').frameCount).to.be(1078920);
        expect(Timecode('10:00:00;00',59.94).frameCount).to.be(1078920*2);
        expect(function(){Timecode('00:02:00;00')}).to.throwError();
        expect(function(){Timecode('00:02:00;02')}).to.not.throwError();
        expect(function(){Timecode('00:02:00;00',59.94)}).to.throwError();
        expect(function(){Timecode('00:02:00;02',59.94)}).to.throwError();
        expect(function(){Timecode('00:02:00;04',59.94)}).to.not.throwError();
        expect(Timecode('00:01:59;29').frameCount).to.be(3597);
        expect(Timecode('00:01:59;59',59.94).frameCount).to.be(3597*2+1);
        expect(Timecode(17982,29.97,true).toString()).to.be('00:10:00;00'); 
        expect(Timecode(1078920,29.97,true).toString()).to.be('10:00:00;00'); 
        expect(Timecode(3597,29.97,true).toString()).to.be('00:01:59;29'); 
        expect(Timecode(17982*2,59.94,true).toString()).to.be('00:10:00;00'); 
        expect(Timecode(1078920*2,59.94,true).toString()).to.be('10:00:00;00'); 
        expect(Timecode(3597*2+1,59.94,true).toString()).to.be('00:01:59;59'); 
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

    it("preserves drop frame and frame rate from 'other' timecode", function() {
       const tc = new Timecode('05:27:00;57', 59.94, true);
       let constructed;
       expect(() => { constructed = Timecode(tc); }).not.to.throwException();
       expect(isEqual(constructed, tc)).to.be(true);
    });

   it("allows override of drop frame and frame rate from 'other' timecode", function() {
      {
         const tc = new Timecode('05:27:00;57', 59.94, true);
         expect(() => { Timecode(tc, 29.97); }).to.throwException();
      }
      {
         const tc = new Timecode('05:27:00;27', 59.94, true);
         let constructed;
         expect(() => { constructed = Timecode(tc, 29.97); }).not.to.throwException();
         expect(isEqual(constructed, new Timecode('05:27:00;27', 29.97, true))).to.be(true);
      }
   });
});

describe('String conversions', function(){
    it ('back and forth works',function(){
        expect(Timecode('12:34:56;23').toString()).to.be('12:34:56;23');
        expect(Timecode('01:02:03;04').toString()).to.be('01:02:03;04');
        expect(Timecode('12:34:56;57',59.94).toString()).to.be('12:34:56;57');
        expect(Timecode('01:02:03;04',59.94).toString()).to.be('01:02:03;04');
    });
    it ('implicit calls to toString()',function(){
        expect('+'.concat(Timecode('12:34:56;23'),'+')).to.be('+12:34:56;23+');
        expect(/12.34.56.23/.test(Timecode('12:34:56;23')));
    });
    it ('toString(\'field\')',function(){
        expect(Timecode('12:34:56;23').toString('field')).to.be('12:34:56;23.0');
        expect(Timecode('01:02:03;04').toString('field')).to.be('01:02:03;04.0');
        expect(Timecode('12:34:56;57',59.94).toString('field')).to.be('12:34:56;28.1');
        expect(Timecode('01:02:03;04',59.94).toString('field')).to.be('01:02:03;02.0');
    });
    it ('toString(\'unknown-format\')',function(){
        expect(function() {Timecode('12:34:56;23').toString('unknown-format')}).to.throwException();
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
    it ('Timecode().add() and .subtract()', function() {
        var t = Timecode('01:23:45;06');
        expect(t.add(60).toString()).to.be('01:23:47;06')
        expect(function(){Timecode('00:00:10;00').add(-301)}).to.throwError(); // below zero
        expect(Timecode('23:59:40;00').add(Timecode('00:00:21;00')).toString()).to.be('00:00:01;00'); // wraparound

        t = Timecode('01:23:45;06');
        expect(t.subtract(60).toString()).to.be('01:23:43;06')
        expect(function(){Timecode('00:00:10;00').subtract(301)}).to.throwError(); // below zero

        expect(Timecode('01:23:45;06').add('01:23:13;01').toString()).to.be('02:46:58;07');

        // Covering the error with _frameCountToTimeCode() altering this.frameCount
        t = Timecode('00:01:15;00');
        var t2 = Timecode('00:01:15;00');
        t2.add(0);
        expect(t.frameCount).to.be(t2.frameCount);
        t2.add(12345);
        expect(t.frameCount).to.be(t2.frameCount-12345);
    });
    it('handles rollover to new day when permitted', function() {
       expect(function() { new Timecode().subtract(new Timecode('23:00:01;00')); }).to.throwError();
       expect(new Timecode().subtract(new Timecode('23:30:00;00'), 1).toString()).to.be('00:30:00;00');
       expect(function() { new Timecode().subtract(new Timecode('22:30:00;00'), 1); }).to.throwError();
       expect(new Timecode('01:00:00;00').subtract(new Timecode('23:30:00;00'), 2).toString()).to.be('01:30:00;00');
    });
    it('Ensures source frame rate is kept when adding two Timecode objects', function() {
        expect(new Timecode('00:00:00:00', 25, false).add('00:01:00:00').frameCount).to.be(1500);
    });
});

describe('Date() operations', function(){
    it ('Date() initializers work', function(){
        var t = new Timecode( new Date(0,0,0,1,2,13,200), 29.97, true );
        expect( t.frameCount ).to.be(111884);
        expect( t.toString()).to.be('01:02:13;06');
        
        var t2 = new Timecode( new Date(0,0,0,10,40,15,520), 25, false );
        expect( t2.frameCount ).to.be(960388);
        expect( t2.toString()).to.be('10:40:15:13');
    });
    it ('Timecode to Date()', function(){
        var d = Timecode('01:23:45;10').toDate();
        expect( d.getHours()).to.be(1);
        expect( d.getMinutes()).to.be(23);
        expect( d.getSeconds()).to.be(45);
        expect( d.getMilliseconds()).to.be(353);
    });
});

describe('DST handling', function() {
    var clock;

    function clearDate(d) {
        d.setYear(0);
        d.setMonth(0);
        d.setDate(1);
    }
 
    function checkDst(d) {
        // we need to fake out 'new Date()', since this issue only happens day of.
        clock = sinon.useFakeTimers(d);
  
        var t = new Timecode(d, 29.97, true);
        var o = t.toDate();
        // console.log(d.toString(), '->', o.toString());
        clearDate(d);
        clearDate(o);
        expect(o.toString()).to.be(d.toString());
    }
 
    afterEach(function() {
        if (!runInBrowser) clock.restore();
    });
 
    it ('handles DST start 1am', function() {
        if (runInBrowser) this.skip();
        checkDst(new Date(2018,2,11,1,0,0,200));
        checkDst(new Date(2018,2,11,1,59,59,200));
    });
 
    it ('handles DST start 2am', function() {
        if (runInBrowser) this.skip();
        checkDst(new Date(2018,2,11,2,0,0,200));
        checkDst(new Date(2018,2,11,2,59,59,200));
        checkDst(new Date(2018,2,11,3,0,0,200));
    });
 
    it ('handles DST end 1am', function() {
        if (runInBrowser) this.skip();
        checkDst(new Date(2018,10,4,1,0,0,200));
        checkDst(new Date(2018,10,4,1,59,59,200));
    });
 
    it ('handles DST end 2am', function() {
        if (runInBrowser) this.skip();
        checkDst(new Date(2018,10,4,2,0,0,200));
        checkDst(new Date(2018,10,4,2,59,59,200));
        checkDst(new Date(2018,10,4,3,0,0,200));
    });

});
