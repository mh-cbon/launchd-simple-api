var should            = require('should');
var fs                = require('fs');
var split             = require('split');
var through2          = require('through2');
var path              = require('path');
var LaunchdSimpleApi  = require('../index.js');

describe('launchd simple api', function() {
  var lsa = new LaunchdSimpleApi()
  it('should list services', function(done) {
    lsa.list(function (err, items) {
      err && console.error(err);
      // yosemite box exposes service 'com.apple.usernoted'
      if (process.env['BOXTYPE']==='yosemite') {
        items['com.apple.usernoted'].id.should.eql("com.apple.usernoted")
        items['com.apple.usernoted'].pid.should.match(/[0-9]+/)
        items['com.apple.usernoted'].status.should.eql("0")
        Object.keys(items).indexOf('com.apple.usernoted').should.not.eql(-1);
      } else {
        // maverick box exposes com.apple.launchctl.Background
        items['com.apple.launchctl.Background'].id.should.eql("com.apple.launchctl.Background")
        items['com.apple.launchctl.Background'].pid.should.eql("-")
        items['com.apple.launchctl.Background'].status.should.eql("0")
        Object.keys(items).indexOf('com.apple.launchctl.Background').should.not.eql(-1);
      }
      // yeah. That s not cool.
      done(err);
    })
  });

  it('should find a service file', function(done) {
    lsa.findUnitFile('com.apple.cfprefsd.xpc.agent', function (err, results) {
      err && console.error(err);
      results.length.should.eql(1)
      results[0].should.eql('/System/Library/LaunchAgents/com.apple.cfprefsd.xpc.agent.plist');
      done(err);
    })
  });

  it('should describe a service file', function(done) {
    lsa.describeFile('/System/Library/LaunchAgents/com.apple.cfprefsd.xpc.agent.plist', function (err, results) {
      err && console.error(err);
      results.Label.should.eql('com.apple.cfprefsd.xpc.agent');
      results.ProgramArguments.should.eql(['/usr/sbin/cfprefsd', 'agent']);
      done(err);
    })
  });

  it('should properly fail to describe a service file', function(done) {
    lsa.describeFile('wxcwxcwxc', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

  it('should describe a service', function(done) {
    lsa.describe('com.apple.cfprefsd.xpc.agent', function (err, results) {
      err && console.error(err);
      results.Label.should.eql('com.apple.cfprefsd.xpc.agent');
      results.ProgramArguments.should.eql(['/usr/sbin/cfprefsd', 'agent']);
      done();
    })
  });

  it('should properly fail to describe a service', function(done) {
    lsa.describe('wxcwxcwxc', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

  it('should test a service file', function(done) {
    lsa.testUnitFile('/System/Library/LaunchAgents/com.apple.cfprefsd.xpc.agent.plist', function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done();
    })
  });

  it('should properly fail to test a service file', function(done) {
    lsa.testUnitFile(__dirname + '/index.js', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

  it('should convert a service file to json', function(done) {
    lsa.convertUnitFile('/System/Library/LaunchAgents/com.apple.cfprefsd.xpc.agent.plist', 'json', function (err, results) {
      err && console.error(err);
      results = JSON.parse(results);
      results.Label.should.eql('com.apple.cfprefsd.xpc.agent')
      results.ProgramArguments.should.eql([ '/usr/sbin/cfprefsd', 'agent' ])
      done(err);
    })
  });

  it('should properly fail to convert a service file to json', function(done) {
    lsa.convertUnitFile(__dirname + '/index.js', 'json', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

  it('should convert a json object to xml plist', function(done) {
    lsa.convertJsonToPlist({what: 'ever'}, function (err, results) {
      err && console.error(err);
      results.should.match(/<key>what<\/key>/)
      results.should.match(/<string>ever<\/string>/)
      console.log(err);
      (!err).should.eql(true);
      done();
    })
  });

  it('should install a service', function(done) {
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
      if (err) return done(err);
      var serviceFile = '/Users/vagrant/Library/LaunchAgents/fake.plist';
      fs.readFile(serviceFile, function (err2, content){
        err2 && console.error(err2);
        content.toString().should.match(/<string>fake<\/string>/);
        done(err2);
      })
    })
  });

  it('should properly fail to install a service', function(done) {
    var service = {
      domain: 'global',
      jobType: 'daemon',
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
      (!err).should.eql(false);
      done();
    })
  });

  it('should load a service', function(done) {
    lsa.load('fake', {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should unload a service', function(done) {
    lsa.unload('fake', {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should load a service file', function(done) {
    var serviceFile = '/Users/vagrant/Library/LaunchAgents/fake.plist';
    lsa.loadServiceFile(serviceFile, {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should properly fail to load a service', function(done) {
    lsa.load('wxcxwc', {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done()
    })
  });

  it('should properly fail to load a service file', function(done) {
    var serviceFile = '/Users/vagrant/Library/LaunchAgents/wxcwc.plist';
    lsa.loadServiceFile(serviceFile, {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

  it('should properly fail to unload a service', function(done) {
    lsa.unload('wxcxwc', {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    });
  });

  it('should properly fail to unload a service file', function(done) {
    var serviceFile = '/Users/vagrant/Library/LaunchAgents/wxcwc.plist';
    lsa.unloadServiceFile(serviceFile, {}, function (err, results) {
      err && console.error(err);
      console.log('%j', err);
      (!err).should.eql(false);
      done()
    });
  });

  it('should start a service', function(done) {
    lsa.start('fake', function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should properly fail to start a service', function(done) {
    lsa.start('xcwcxwc', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done()
    })
  });

  it('should stop a service', function(done) {
    lsa.stop('fake', function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should properly fail to stop a service', function(done) {
    lsa.stop('xcwcxwc', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done()
    })
  });

  it('should restart a service', function(done) {
    lsa.restart('fake', function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should properly fail to restart a service', function(done) {
    lsa.restart('xcwcxwc', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done()
    })
  });

  it('should unload a service file', function(done) {
    var serviceFile = '/Users/vagrant/Library/LaunchAgents/fake.plist';
    lsa.unloadServiceFile(serviceFile, {}, function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      done()
    })
  });

  it('should uninstall a service', function(done) {
    lsa.uninstall('fake', function (err, results) {
      err && console.error(err);
      (!err).should.eql(true);
      var serviceFile = '/Users/vagrant/Library/LaunchAgents/fake.plist';
      fs.readFile(serviceFile, function (err2, content){
        err2 && console.error(err2);
        (!err2).should.eql(false);
        done()
      })
    })
  });

  it('should properly fail to uninstall a service', function(done) {
    lsa.uninstall('fake', function (err, results) {
      err && console.error(err);
      (!err).should.eql(false);
      done();
    })
  });

});
