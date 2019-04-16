Dirty README (will update)

How To Use:

Easiest Way for Windows: 
Head over to Releases and download latest! Drag your beat saber song zip onto the !BS2AUD_DRAG_N_DROP.BAT and enjoy your .audica file. Release has nodejs bundled. No need to install nodejs.

Easy way for all OSes

install node.js from https://nodejs.org

clone this repository, or download it (clone or download > download zip)

from the downloaded/cloned directory on the command line:

```
npm install
node bstoaud.js path/to/your/beatsabersong.zip
```

enjoy your .audica file

NOTES

this utility sets prerollSeconds in song.desc to 3.0. This is to avoid notes in the first 8 measures, as this will bork those notes. Not all Beat Saber songs will need this as they may have longer intros before notes, and you can potentially set it to 0.5, if you dare...

If ExpertPlus is present, Audica Beginner maps to Beat Saber Normal, Moderate to Hard, Advanced to Expert, and Expert to ExpertPlus

If ExpertPlus is not present, Audica Beginner maps to Beat Saber Easy, Moderate to Normal, Advanced to Hard, and Expert to Expert

