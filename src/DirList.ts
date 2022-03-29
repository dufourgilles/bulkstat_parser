
import { readdir } from "fs/promises";

export class DirList {
    static async getFiles(dirLocation: string, startTime: number, endTime: number, pace?: number) {
        console.log(`S: ${startTime} E: ${endTime} P: ${pace}`)
        const files = await readdir(dirLocation);
        const matchedFiles: string[] = [];
        let lastTime = -1;
        files.forEach(file => {
            const m = file.match(/20\d+[_]?([0-9]{6})[._]/);
            if (m) {
                const numTime = Number(m[1]);
                //console.log(`${file} Time: ${numTime}   Last: ${lastTime} Pace: ${pace}`);
                if ((numTime >= startTime) && (endTime == null || numTime <= endTime) &&
                    ((pace == null || (lastTime === -1) || (numTime >= lastTime + pace)))) {
                    lastTime = numTime;
                    matchedFiles.push(`${dirLocation}${file}`);
                }
            }
        });
        return matchedFiles;
    }
}