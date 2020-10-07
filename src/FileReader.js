const fs = require('fs');
const BulkstatSchema = require("./BulkstatSchema");

const MAX_LINE = 8192;


module.exports = class FileReader {
    constructor(filename) {
        this._filename = filename;
        this._buffer = Buffer.alloc(MAX_LINE);
        this._len = 0;
    }

    async _openFileAsync() {
        const error = new Error(`Failed to Open ${this._filename}.`)
        return new Promise((resolve, reject) => {
            fs.open(this._filename, 'r', (err, fd) => {
                if (err != null) { reject(error); }
                else { resolve(fd); }
            });
        });
    }

    async _closeFileAsync(fd) {
        const error = new Error(`Failed to Close ${this._filename}.`)
        return new Promise((resolve, reject) => {
            fs.close(fd, (err) => {
                if (err != null) { reject(error); }
                else { resolve(); }
            });
        });
    }

    _findLine() {
        let pos = 0;
        // Look for end of line character
        while(pos < this._len && this._buffer[pos] != 0x0A) {
            pos++;
        }
        if (pos < this._len) {
            // We have the end of line char. 
            pos++;
            const line = this._buffer.subarray(0, pos).toString();
            // Trash the content and only keep the remaining data                    
            const newBuffer = Buffer.alloc(MAX_LINE);
            if (pos < this._len) {                        
                this._buffer.copy(newBuffer, 0, pos);
                this._len = this._len - pos;
            }
            else {
                this._buffer = Buffer.alloc(MAX_LINE);
                this._len = 0;
            }
            this._buffer = newBuffer;
            return line;
        }
        return null;
    }

    async _readLineAsync(fd) {
        const error = new Error(`Failed to Read ${this._filename}.`);
        return new Promise((resolve, reject) => {
            // Check current buffer content
            if (this._len > 0) {
                const line = this._findLine();
                if (line !== null) {
                    return resolve(line); 
                }
            }
            // Read more data
            fs.read(fd, this._buffer, this._len, MAX_LINE - this._len, null,(err, len, buffer) => {
                if (err != null) { return reject(err)};
                this._len += len;
                if (this._len > 0) {
                    const line = this._findLine();
                    if (line !== null) { return resolve(line); }
                    resolve(this._buffer.toString());
                }
                resolve();
            });
        });
    }
}