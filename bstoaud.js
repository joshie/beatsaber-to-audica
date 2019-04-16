const fs = require('fs');
const StreamZip = require('node-stream-zip');
const JSZip = require("jszip");

const moggHeaderPath = __dirname + '/datafiles/moggheader';
const moggHeaderSize = fs.statSync(moggHeaderPath).size;

var audicaFiles = {
  'song.mid': fs.readFileSync(__dirname + '/datafiles/midifile')
}

const zip = new StreamZip({
    file: process.argv[2],
    storeEntries: true
});

var songDesc = {
    "moggSong": "song.moggsong",
    "midiFile": "song.mid",
    "fusionSpatialized": "fusion/guns/default/drums_default_spatial.fusion",
    "fusionUnspatialized": "fusion/guns/default/drums_default_sub.fusion",
    "sustainSongRight": "song_sustain_r.moggsong",
    "sustainSongLeft": "song_sustain_l.moggsong",
    "fxSong": "song_extras.moggsong",
    "songEndEvent": "event:/song_end/song_end_A",
    "prerollSeconds": 3.0,
    "useMidiForCues": false,
    "hidden": false
};

var difficultyMap = {
  'beginner.cues': ['Easy','Normal'],
  'moderate.cues': ['Normal','Hard'],
  'advanced.cues': ['Hard','Expert'],
  'expert.cues':   ['Expert','ExpertPlus']
}
var difficultyIndex = 0;

var filePath = {};
var cues = {};

zip.on('ready', () => {
    Object.keys(zip.entries()).forEach(function(entry) {
      filePath[entry.replace(/.*\//,'').toLowerCase()] = entry;
    });

    var songInfo = JSON.parse(zip.entryDataSync(filePath['info.json']));
    var infoPath = filePath['info.json'].replace(/[^/]*$/,'');    
    
    var oggPath = songInfo.difficultyLevels[0].audioPath;
    var offset  = songInfo.difficultyLevels[0].offset || 0;

    songDesc.songID = songInfo.songName.toLowerCase() + songInfo.songSubName.toLowerCase() + songInfo.authorName.toLowerCase();
    songDesc.songID = songDesc.songID.replace(/[^a-z0-9]/gi,'');
    songDesc.title  = songInfo.songName;
    songDesc.artist = songInfo.songSubName + '';
    if (songDesc.artist == '')
      songDesc.artist = songInfo.authorName;
    songDesc.tempo = songInfo.beatsPerMinute;
    songDesc.offset = offset; 

    audicaFiles['song.desc'] = JSON.stringify(songDesc,0,2);

    audicaFiles['song.mid'].writeUIntBE(Math.round(60000000/songDesc.tempo),41,3);
    audicaFiles['song.mogg'] = Buffer.concat([fs.readFileSync(moggHeaderPath),zip.entryDataSync(infoPath + oggPath)]);

    songInfo.difficultyLevels.forEach(function(l) {
      if (l.difficulty === 'ExpertPlus')
        difficultyIndex = 1;
      cues[l.difficulty] = {cues: []};

      var dedupe = {};
      
      JSON.parse(zip.entryDataSync(infoPath + l.jsonPath))._notes.forEach(function(n) {
        if (n._type <= 1) {
          var tick     = Math.round(n._time * 480);
          var handType = Math.abs(n._type-1) + 1;
          if(!dedupe[tick + '_' + handType]) {
            cues[l.difficulty].cues.push({
              tick: tick,
              tickLength: 120,
              pitch: 28 + 12 * n._lineLayer + n._lineIndex,
              velocity: 60,
              gridOffset: {
                x: 0.0,
                y: 0.0
              },
              handType: handType,
              behavior: 0
            });
            dedupe[tick + '_' + handType] = true;
          }
        }
      });
    });

    Object.keys(difficultyMap).forEach(function(cueFile) {
      if(typeof cues[difficultyMap[cueFile][difficultyIndex]] === 'object')
        audicaFiles[cueFile] = JSON.stringify(cues[difficultyMap[cueFile][difficultyIndex]],0,2);
    });

    fs.readdirSync(__dirname + '/audicatemplate').forEach(function(f) {
      audicaFiles[f] = fs.readFileSync(__dirname + '/audicatemplate/' + f);
    });

    zipName = songDesc.songID  + '.audica'

    var ozip = new JSZip();
    Object.keys(audicaFiles).forEach(function(fileName) {
      ozip.file(fileName,audicaFiles[fileName]);
    });

    ozip
    .generateNodeStream({type:'nodebuffer',streamFiles:false})
    .pipe(fs.createWriteStream(zipName))
    .on('finish', function () {
      // JSZip generates a readable stream with a "end" event,
      // but is piped here in a writable stream which emits a "finish" event.
      console.log(zipName + " written.");
    });
 
    zip.close()
});
