#!/bin/bash
rm -rf beatsaber_to_audica
mkdir beatsaber_to_audica
cd beatsaber_to_audica
mkdir app
cd app
for i in $(ls ../../../ | grep -v windows_release_build | grep -v node_modules); do
  cp -r ../../../$i .
done
npm install
cd ..
wget https://nodejs.org/dist/v10.15.3/node-v10.15.3-win-x64.zip
unzip node-v10.15.3-win-x64.zip
rm node-v10.15.3-win-x64.zip
mv node-v10.15.3-win-x64 node
cd ..
cp \!BS2AUD_DRAG_N_DROP.BAT beatsaber_to_audica
zip -r beatsaber_to_audica.zip beatsaber_to_audica
rm -rf beatsaber_to_audica
