#!/bin/bash
VERSION=$(cat ../package.json | grep version | cut -d'"' -f4)
TEXT="$VERSION "$'Changelog:\n'"$(cat ../release_data/$VERSION)"$'\n\n'"$(cat ../release_data/STATIC)"
#TEXT="$(echo "$TEXT" | tr "\n" '^' | sed 's|\^|\\n|g')"
TITLE="Beat Saber to Audica Converter $VERSION"
TOKEN=$(git config --global github.token)
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
zip -r beatsaber_to_audica_$VERSION.zip beatsaber_to_audica
rm -rf beatsaber_to_audica

github-release upload --prerelease --owner joshie --repo beatsaber-to-audica --tag $VERSION --name "$TITLE" --body "$TEXT" --token $TOKEN beatsaber_to_audica_$VERSION.zip
