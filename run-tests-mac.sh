if [ ! -f /Users/vagrant/node/node-v6.1.0-darwin-x64.tar.xz ]; then
  mkdir -p /Users/vagrant/node
  cd /Users/vagrant/node/
  curl "https://nodejs.org/dist/v6.1.0/node-v6.1.0-darwin-x64.tar.gz" -o "/Users/vagrant/node/node-v6.1.0-darwin-x64.tar.xz"
  tar -xvf node-v6.1.0-darwin-x64.tar.xz
  /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/npm i mocha -g
fi
cd /Users/vagrant/wd
rm -fr node_modules/
/Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/npm i
/Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/mocha test/index.js
/Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/mocha test/funct-user.js
sudo /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/mocha test/funct-system.js
yasudo="" /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/node /Users/vagrant/node/node-v6.1.0-darwin-x64/bin/mocha test/funct-system.js
