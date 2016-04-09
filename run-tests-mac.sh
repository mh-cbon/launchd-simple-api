if [ ! -f /Users/vagrant/node/node-v5.9.1-darwin-x64.tar.xz ]; then
  mkdir -p /Users/vagrant/node
  cd /Users/vagrant/node/
  curl "https://nodejs.org/dist/v5.9.1/node-v5.9.1-darwin-x64.tar.gz" -o "/Users/vagrant/node/node-v5.9.1-darwin-x64.tar.xz"
  tar -xvf node-v5.9.1-darwin-x64.tar.xz
  /Users/vagrant/node/node-v5.9.1-darwin-x64/bin/npm i mocha -g
fi
cd /Users/vagrant/wd
/Users/vagrant/node/node-v5.9.1-darwin-x64/bin/npm i
/Users/vagrant/node/node-v5.9.1-darwin-x64/bin/node /Users/vagrant/node/node-v5.9.1-darwin-x64/bin/mocha test/index.js
