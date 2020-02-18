const fs = require('fs');
const JSZip = require("jszip");
const recursive = require("recursive-readdir");

const moggHeaderPath = __dirname + '/datafiles/moggheader';
const moggHeaderSize = fs.statSync(moggHeaderPath).size;

var audicaFiles = {
  'song.mid': fs.readFileSync(__dirname + '/datafiles/midifile')
}

// oggfile or bail
var isDirectory = false
if (typeof process.argv[2] === 'undefined') {
  console.log('This tool requires an ogg file to run');
  process.exit(0);
} else if (!(process.argv[2].toLowerCase().endsWith('.ogg')) && fs.statSync(process.argv[2]).isFile()) {
  console.log('Argument must be an oggfile that exists');
  process.exit(0);
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

createAudica(fs);

function createAudica(o) {
  var id = process.argv[2].replace(/^.*\//,'').replace(/\.ogg$/,'');

  songDesc.songID = id;
  songDesc.title  = 'faketitle';
  songDesc.artist = 'fakeartist';
  songDesc.tempo = 120;
  songDesc.offset = 0; 
  songDesc._previewStartSeconds = 12;

  audicaFiles['song.desc'] = JSON.stringify(songDesc,0,2);

  audicaFiles['song.mid'].writeUIntBE(Math.round(60000000/songDesc.tempo),41,3);
  audicaFiles['song.mogg'] = Buffer.concat([fs.readFileSync(moggHeaderPath),fs.readFileSync(process.argv[2])]);

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
