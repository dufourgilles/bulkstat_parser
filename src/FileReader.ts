import { open, FileHandle } from 'fs/promises';

const MAX_LINE = 8192;


export class FileReader {
    protected _buffer: Buffer = Buffer.alloc(MAX_LINE);
    protected _len = 0;
    constructor(protected _filename: string) {}

    async openFileAsync(): Promise<FileHandle> {
        return open(this._filename, 'r');
    }

    async closeFileAsync(fd: FileHandle) {
        return fd.close();
    }

    protected _findLine(): string | null {
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

    async readLineAsync(fd: FileHandle): Promise<string> {
        // Check current buffer content
        if (this._len > 0) {
            const line = this._findLine();
            if (line !== null) {
                return line; 
            }
        }
        // Read more data
        const res = await fd.read(this._buffer, this._len, MAX_LINE - this._len);
        this._len += res.bytesRead;
        if (this._len > 0) {
            const line = this._findLine();
            if (line !== null) { return line; }
            return this._buffer.toString();
        }
    }
}