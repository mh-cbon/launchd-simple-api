# launchd-simple-api

Simple API to manage services via macosx launchd

# Install

```sh
npm i @mh-cbon/launchd-simple-api --save
```

# Usage

```js
var LaunchSimpleApi = require('@mh-cbon/launchd-simple-api')

var lsa = new LaunchSimpleApi()

// launchctl list
lsa.list(function (err, items) {
  console.log(items)
})

// find the service file definition,
// then convert it to a json object with plutil
lsa.describe("serviceId", function (err, info) {
  console.log(info)
})

// convert given service file to a json object with plutil
lsa.describeFile("/SystemLibrary/Myservice.plist", function (err, info) {
  console.log(info)
})

// find the service file definition,
// then, launchctl load /the/service/file.plist
lsa.load('fake', {disabled: false, force: false, domain: null, session:null}, function (err) {
  err && console.error(err);
})

// launchctl load /the/service/file.plist
var opts = {disabled: false, force: false, domain: null, session:null}
lsa.loadServiceFile('/SystemLibrary/Myservice.plist', opts, function (err) {
  err && console.error(err);
})

// find the service file definition,
// then, launchctl unload /the/service/file.plist
lsa.unload('fake', {disabled: false, domain: null, session:null}, function (err) {
  err && console.error(err);
})

// launchctl unload /the/service/file.plist
var opts = {disabled: false, domain: null, session:null}
lsa.unloadServiceFile('/SystemLibrary/Myservice.plist', opts, function (err) {
  err && console.error(err);
})

// Look up through each defaults macosx service definition directories
// and try to find for a file named such [service name].plist
lsa.findUnitFile('fake', function (err, list) {
  console.log(list)
})

// Test validity of the given plist service definition file
// plutil /SystemLibrary/Myservice.plist
lsa.testUnitFile('/SystemLibrary/Myservice.plist', function (err) {
  err && console.error(err);
})

// Convert given plist service file into a JSON object
// plutil -convert json -o - /SystemLibrary/Myservice.plist
lsa.convertUnitFile('/SystemLibrary/Myservice.plist', 'json', function (err, info) {
  err && console.error(err);
  console.log(info)
})

// Convert given JSON object into a valid plist content
// plutil -convert json -o - - (< JSON object into stdin)
lsa.convertJsonToPlist({some: 'object'}, function (err, info) {
  err && console.error(err);
  console.log(info)
})

// launhctl start serviceId
lsa.start('serviceId', function (err) {
  err && console.error(err);
})

// launhctl stop serviceId
lsa.stop('serviceId', function (err) {
  err && console.error(err);
})

// launhctl start serviceId
// launhctl stop serviceId
lsa.restart('serviceId', function (err) {
  err && console.error(err);
})

// Find all service file definition for given options
/*
domain === user         => ~/Library/LaunchAgents
domain === global
   jobType === agent    => /Library/LaunchAgents
   jobType === daemon   => /Library/LaunchDaemons
domain === system
   jobType === agent    => /System/Library/LaunchAgents
   jobType === daemon   => /System/Library/LaunchDaemons
*/
lsa.listUnitFiles({domain: 'global', jobType: 'agents'}, function (err, list) {
  console.log(list)
})
```

# Install a service

```js
var service = {
  domain: 'user',
  plist: {
    Label: 'fake',
    ProgramArguments: [
      '/Users/vagrant/node/node-v5.9.1-darwin-x64/bin/node',
      '/Users/vagrant/wd/utils/fake-service.js'
    ]
  }
}
lsa.install(service, function (err, results) {
  err && console.error(err);
  var serviceFile = '/Users/vagrant/Library/LaunchAgents/fake.plist';
  fs.readFile(serviceFile, function (err2, content){
    err2 && console.error(err2);
    console.log(content.toString())
  })
})

// find the corresponding service file, then deletes it
lsa.uninstall('fake', function (err, results) {
  err && console.error(err);
})

// deletes given service file definition
lsa.uninstallUnitFile('/Users/vagrant/Library/LaunchAgents/fake.plist', function (err, results) {
  err && console.error(err);
})
```

# Read more

- http://launchd.info/
- https://developer.apple.com/library/mac/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html
- https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man1/launchctl.1.html
- http://alvinalexander.com/mac-os-x/launchd-examples-launchd-plist-file-examples-mac
