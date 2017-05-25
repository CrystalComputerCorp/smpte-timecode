// This should work both in node and in the browsers, so that's what this wrapper is about
;(function(root, undefined) {

    
    /**
     * Timecode object constructor
     * @param {number|String|Date|Object} timeCode Frame count as number, "HH:MM:SS(:|;|.)FF", Date(), or object.
     * @param {number} [frameRate=29.97] Frame rate
     * @param {boolean} [dropFrame=true] Whether the timecode is drop-frame or not
     * @constructor
     * @returns {Timecode}
     */
    var Timecode = function ( timeCode, frameRate, dropFrame ) {

        // Make this class safe for use without "new"
        if (!(this instanceof Timecode)) return new Timecode( timeCode, frameRate, dropFrame);

        // Get frame rate
        if (typeof frameRate == 'undefined') this.frameRate = 29.97;
        else if (typeof frameRate == 'number' && frameRate>0) this.frameRate = frameRate;
        else throw new Error('Number expected as framerate');
        if (this.frameRate!=24 && this.frameRate!=25 && this.frameRate!=29.97 && this.frameRate!=30 &&
            this.frameRate!=50 && this.frameRate!=59.94 && this.frameRate!=60
        ) throw new Error('Unsupported framerate');
        
        // If we are passed dropFrame, we need to use it
        if (typeof dropFrame === 'boolean') this.dropFrame = dropFrame;
        else this.dropFrame = (this.frameRate==29.97 || this.frameRate==59.94); // by default, assume DF for 29.97 and 59.94, NDF otherwise

        // Now either get the frame count, string or datetime        
        if (typeof timeCode == 'number') {
            this.frameCount = Math.floor(timeCode);
        }
        else if (typeof timeCode == 'string') {
            
            // pick it apart
            var parts = timeCode.match('^([012]\\d):(\\d\\d):(\\d\\d)(:|;|\\.)(\\d\\d)$');
            if (!parts) throw new Error("Timecode string expected as HH:MM:SS:FF or HH:MM:SS;FF");
            this.hours = parseInt(parts[1]);
            this.minutes = parseInt(parts[2]);
            this.seconds = parseInt(parts[3]);
            this.dropFrame = parts[4]!=':';
            this.frames = parseInt(parts[5]);

            // make sure the numbers make sense
            if ( this.hours>23 || this.minutes>59 || this.seconds>59 || 
                 this.frames>=this.frameRate ||
                 (this.dropFrame && this.seconds==0 && this.minutes%10 && this.frames<2*(this.frameRate/29.97) )
            ) throw new Error("Invalid timecode")
        }
        else if (typeof timeCode == 'object' && timeCode instanceof Date) {
            var midnight = new Date( timeCode.getFullYear(), timeCode.getMonth(), timeCode.getDate(),0,0,0 );
    		   this.frameCount = Math.floor(((timeCode-midnight)/1000)*this.frameRate);
        }
        else if (typeof timeCode === 'object' && timeCode.hours >= 0) {
            this.hours = timeCode.hours;
            this.minutes = timeCode.minutes;
            this.seconds = timeCode.seconds;
            this.frames = timeCode.frames;

            // make sure the numbers make sense
            if ( this.hours>23 || this.minutes>59 || this.seconds>59 || 
                 this.frames>=this.frameRate ||
                 (this.dropFrame && this.seconds==0 && this.minutes%10 && this.frames<2*(this.frameRate/29.97) )
            ) throw new Error("Invalid timecode: " + JSON.stringify(timeCode))

        }
        else if (typeof timeCode == 'undefined') {
            this.frameCount = 0;
        } 
        else {
            throw new Error('Timecode() constructor expects a number, timecode string, or Date()');
        }

        // Make sure dropFrame is only for 29.97 & 59.94
        if (this.dropFrame && this.frameRate!=29.97 && this.frameRate!=59.94) {
            throw new Error('Drop frame is only supported for 29.97 and 59.94 fps');
        }

        // Now, if we have frameCount we need to calculate hours minutes seconds frames, vice versa
        if (typeof(this.frameCount)!=='number') {
            this._timeCodeToFrameCount();
        }
        else this._frameCountToTimeCode();

        return this;
    };

    /**
     * Calculate timecode based on frame count
     * @private
     */
    Timecode.prototype._frameCountToTimeCode = function() {
        var fc = this.frameCount;
        // adjust for dropFrame
        if (this.dropFrame) {
            var df = this.frameRate==29.97 ? 2 : 4; // 59.94 skips 4 frames
            var d = Math.floor(this.frameCount / (17982*df/2));
            var m = this.frameCount % (17982*df/2);
            if (m<df) m=m+df;
            fc = this.frameCount + 9*df*d + df*(Math.floor((m-df)/(1798*df/2)));
        }
        var fps = Math.round(this.frameRate);
        this.frames = fc % fps;
        this.seconds = Math.floor(fc/fps) % 60;
        this.minutes = Math.floor(fc/(fps*60)) % 60;
        this.hours = Math.floor(fc/(fps*3600)) % 24;
    };

    /**
     * Calculate frame count based on time Timecode
     * @private
     */
    Timecode.prototype._timeCodeToFrameCount = function() {
        this.frameCount = (this.hours*3600 + this.minutes*60 + this.seconds) * Math.round(this.frameRate) + this.frames;
        if (this.dropFrame) {
            var totalMinutes = this.hours*60 + this.minutes;
            var df = this.frameRate == 29.97 ? 2 : 4;
            this.frameCount = this.frameCount - df * (totalMinutes - Math.floor(totalMinutes/10));
        }
    };

    /**
     * Convert Timecode to String
     * @returns {string}
     */
    Timecode.prototype.toString = function TimeCodeToString(format) {
        var frames = this.frames;
        var field = '';
        if (typeof format == 'string') {
            if (format == 'field') {
                if (this.frameRate<=30) field = '.0';
                else {
                    frames = Math.floor(frames/2);
                    field = '.'.concat((this.frameCount%2).toString());
                };
            }
            else throw new Error('Unsupported string format');
        };
        return "".concat(
            this.hours<10 ? '0' : '',
            this.hours.toString(),
            ':',
            this.minutes<10 ? '0' : '',
            this.minutes.toString(),
            ':',
            this.seconds<10 ? '0' : '',
            this.seconds.toString(),
            this.dropFrame ? ';' : ':',
            frames<10 ? '0' : '',
            frames.toString(),
            field
        );
    };

    /**
     * Return the frame count when Timecode() object is used as a number
     */
    Timecode.prototype.valueOf = function() {
        return this.frameCount;
    };

    /**
     * Adds t to timecode, in-place (i.e. the object itself changes)
     * @param {number|string|Date|Timecode} t How much to add
     * @param {boolean} [negative=false] Whether we are adding or subtracting
     * @returns Timecode
     */
    Timecode.prototype.add = function(t,negative) {
        if (typeof t == 'number') {
            var newFrameCount = this.frameCount + Math.floor(t) * (negative?-1:1);
            if (newFrameCount<0) throw new Error("Negative timecodes not supported");
            this.frameCount = newFrameCount;
        } 
        else {
            if (!(t instanceof Timecode)) t = new Timecode(t);
            return this.add(t.frameCount,negative);
        }
        this.frameCount = this.frameCount % (Math.floor(this.frameRate*86400)); // wraparound 24h
        this._frameCountToTimeCode();
        return this;
    };


    Timecode.prototype.subtract = function(t) {
        return this.add(t,true);
    }

    /**
     * Converts timecode to a Date() object
     * @returns {Date}
     */
    Timecode.prototype.toDate = function() {
        var ms = this.frameCount/this.frameRate*1000
        var midnight = new Date();
        midnight.setHours(0);
        midnight.setMinutes(0);
        midnight.setSeconds(0);
        midnight.setMilliseconds(0);
        return new Date( midnight.valueOf() + ms );
    };

    // Export it for Node or attach to root for in-browser
    /* istanbul ignore else */
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        module.exports = Timecode;
    } else if (root) {
        root.Timecode = Timecode;
    }


}(this));
