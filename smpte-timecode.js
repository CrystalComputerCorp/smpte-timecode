// This should work both in node and in the browsers, so that's what this wrapper is about
;(function(root, undefined) {

    
    /**
     * Timecode object constructor
     * @param {number|String|Date} timeCode Frame count as number, "HH:MM:SS(:|;|.)FF", or Date()
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
            this.frameRate!=50 && this.frameRate!=60
        ) throw new Error('Unsupported framerate');
        
        // If we are passed dropFrame, we need to use it
        if (typeof dropFrame === 'boolean') this.dropFrame = dropFrame;
        else this.dropFrame = (this.frameRate==29.97); // by default, assume DF for 29.97, NDF otherwise

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
                 (this.dropFrame && this.frames<2 && this.seconds==0 && this.minutes%10 )
            ) throw new Error("Invalid timecode")
        }
        else if (typeof timeCode == 'object' && timeCode instanceof Date) {
            var midnight = new Date( timeCode.getFullYear(), timeCode.getMonth(), timeCode.getDate(),0,0,0 );
    		this.frameCount = Math.floor(((timeCode-midnight)/1000)*this.frameRate);
        }
        else if (typeof timeCode == 'undefined') {
            this.frameCount = 0;
        } 
        else {
            throw new Error('Timecode() constructor expects a number, timecode string, or Date()');
        }

        // Make sure dropFrame is only for 29.97
        if (this.dropFrame && this.frameRate!=29.97) throw new Error('Drop frame is only supported for 29.97fps');

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
        // adjust for dropFrame
        if (this.dropFrame) {
            var df = this.frameRate==29.97 ? 2 : 4; // 59.94 is 4 frames
            var d = Math.floor(this.frameCount / 17982);
            var m = this.frameCount % 17982;
            if (m<2) m=m+2;
            this.frameCount = this.frameCount + 9*df*d + df*(Math.floor((m-2)/1798));
        }
        var fps = Math.round(this.frameRate);
        this.frames = this.frameCount % fps;
        this.seconds = Math.floor(this.frameCount/fps) % 60;
        this.minutes = Math.floor(this.frameCount/(fps*60)) % 60;
        this.hours = Math.floor(this.frameCount/(fps*3600)) % 24;
    };

    /**
     * Calculate frame count based on time Timecode
     * @private
     */
    Timecode.prototype._timeCodeToFrameCount = function() {
        this.frameCount = (this.hours*3600 + this.minutes*60 + this.seconds) * Math.round(this.frameRate) + this.frames;
        if (this.dropFrame) {
            var totalMinutes = this.hours*60 + this.minutes;
            this.frameCount = this.frameCount - 2 * (totalMinutes - Math.floor(totalMinutes/10));
        }
    };

    /**
     * Convert Timecode to String
     * @returns {string}
     */
    Timecode.prototype.toString = function TimeCodeToString() {
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
            this.frames<10 ? '0' : '',
            this.frames.toString()
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
     * @returns Timecode
     */
    Timecode.prototype.add = function(t) {
        if (typeof t == 'number') {
            if (this.frameCount+Math.floor(t)<0) throw new Error("Negative timecodes not supported");
            this.frameCount += Math.floor(t);
        } 
        else {
            if (!(t instanceof Timecode)) t = new Timecode(t);
            this.frameCount += t.frameCount;
            this.frameCount = this.frameCount % (Math.floor(this.frameRate*86400)); // wraparound 24h
        }
        this._frameCountToTimeCode();
        return this;
    };

    /**
     * Converts timecode to a Date() object
     */
    Timecode.prototype.toDate = function() {
        var ms = this.frameCount/this.frameRate*1000
        return new Date( 0, 0, 0, 1,2,3,4 );

        // TODO
    };

    // Export it for Node or attach to root for in-browser
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        module.exports = Timecode;
    } else if (root) {
        root.Timecode = Timecode;
    }


}(this));