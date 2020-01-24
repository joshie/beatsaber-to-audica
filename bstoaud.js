const fs = require('fs');
const StreamZip = require('node-stream-zip');
const JSZip = require("jszip");
const recursive = require("recursive-readdir");

const moggHeaderPath = __dirname + '/datafiles/moggheader';
const moggHeaderSize = fs.statSync(moggHeaderPath).size;

var audicaFiles = {
  'song.mid': fs.readFileSync(__dirname + '/datafiles/midifile')
}

// Directory, Zip, or Bail
var isDirectory = false
if (typeof process.argv[2] === 'undefined') {
  console.log('This tool requires a Beat Saber song zip or directory to run');
  process.exit(0);
} else if (!(process.argv[2].toLowerCase().endsWith('.zip'))) {
  if (fs.statSync(process.argv[2]).isDirectory()) {
    isDirectory = true
  } else {
    console.log('Argument must be a zipfile or directory');
    process.exit(0);
  }
}

var songDesc = {
  "moggSong":            "song.moggsong",
  "midiFile":            "song.mid",
  "fusionSpatialized":   "fusion/guns/default/drums_default_spatial.fusion",
  "fusionUnspatialized": "fusion/guns/default/drums_default_sub.fusion",
  "sustainSongRight":    "song_sustain_r.moggsong",
  "sustainSongLeft":     "song_sustain_l.moggsong",
  "fxSong":              "song_extras.moggsong",
  "songEndEvent":        "event:/song_end/song_end_A",
  "prerollSeconds":      3.0,
  "useMidiForCues":      false,
  "hidden":              false
};

const difficultyMap = {
  'beginner.cues': ['easy','normal'],
  'moderate.cues': ['normal','hard'],
  'advanced.cues': ['hard','expert'],
  'expert.cues':   ['expert','expertplus']
}

if (isDirectory) {
  recursive(process.argv[2], function (err, files) {
    fs.reader = fs.readFileSync;
    createAudica(fs,files);
  }); 
} else {
  const zip = new StreamZip({
    file: process.argv[2],
    storeEntries: true
  });

  zip.on('ready', () => {
    zip.reader = zip.entryDataSync;
    createAudica(zip,Object.keys(zip.entries()));
  });
}

function createAudica(o,files) {
  var filePath = {};
  files.forEach(function(entry) {
    filePath[entry.replace(/.*(\/|\\)/,'').toLowerCase()] = entry;
  });

  var infoPath = filePath['info.dat'].replace(/[^/]*$/,'');
  var re = new RegExp("^"+infoPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

  files.forEach(function(entry) {
    filePath[entry.replace(re,'').toLowerCase()] = entry;
  });

  var songInfo = JSON.parse(o.reader(filePath['info.dat']));
  //var songInfo = infoFile._difficultyBeatmapSets[0];
  var oggPath = songInfo._songFilename.toLowerCase();
  var offset  = songInfo._songTimeOffset || 0;

  songDesc.songID = songInfo._songName.toLowerCase() + songInfo._songSubName.toLowerCase() + songInfo._songAuthorName.toLowerCase();
  songDesc.songID = songDesc.songID.replace(/[^a-z0-9]/gi,'');
  songDesc.title  = songInfo._songName;
  songDesc.artist = songInfo._songSubName + '';
  if (songDesc.artist == '')
    songDesc.artist = songInfo._levelAuthorName;
  songDesc.tempo = songInfo._beatsPerMinute;
  songDesc.offset = offset; 

  if (typeof songInfo._previewStartTime === 'number') {
    songDesc.previewStartSeconds = songInfo._previewStartTime;
  } else {
    songDesc._previewStartSeconds = 12;
  }

  audicaFiles['song.desc'] = JSON.stringify(songDesc,0,2);

  audicaFiles['song.mid'].writeUIntBE(Math.round(60000000/songDesc.tempo),41,3);
  audicaFiles['song.mogg'] = Buffer.concat([fs.readFileSync(moggHeaderPath),o.reader(filePath[oggPath])]);

  var cues = {};
  var difficultyIndex = 0;

  songInfo._difficultyBeatmapSets[0]._difficultyBeatmaps.forEach(function(l) {
    if (l._difficulty.toLowerCase() === 'expertplus')
      difficultyIndex = 1;
    cues[l._difficulty.toLowerCase()] = {cues: []};

    var dedupe = {};
     
    if(l._beatmapFilename.toLowerCase() in filePath) {
      JSON.parse(o.reader(filePath[l._beatmapFilename.toLowerCase()]))._notes.forEach(function(n) {
        if (n._type <= 1) {
          var tick     = Math.round(n._time * 480);
          var handType = Math.abs(n._type-1) + 1;
          if(!dedupe[tick + '_' + handType]) {
            cues[l._difficulty.toLowerCase()].cues.push({
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
    } else {
      console.log(l._difficulty + " difficulty is defined but json for difficulty is missing, skipping");
    }
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
    console.log(zipName + " written.");
  });
}
