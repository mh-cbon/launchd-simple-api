var should = require('should');
var fs = require('fs');
var LaunchdSimpleApi = require('../index.js');

describe('launchd-simple-api userland', function() {

  this.timeout(5000);

  var lsa = new LaunchdSimpleApi();
  
  it('should install the fake service', function(done) {
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
    lsa.install(service, done)
  });

  it('should not list the fake service', function(done) {
    lsa.list(function (err, list) {
      ('fake' in list).should.eql(false);
      done();
    })
  });

  it('should load the service', function(done) {
    lsa.load('fake', {}, done)
  });

  it('should list the fake service', function(done) {
    lsa.list(function (err, list) {
      ('fake' in list).should.eql(true);
      done();
    })
  });

  it('should start the fake service', function(done) {
    lsa.start('fake', function (err) {
      setTimeout(function(){
        done(err);
      }, 1500); // this is needed for the system to load and start the program.
    })
  });

  it('should list the fake service', function(done) {
    lsa.list(function (err, list) {
      ('fake' in list).should.eql(true);
      list['fake'].id.should.eql('fake');
      done();
    })
  });

  it('should be able to consume the service', function(done) {
    var net = require('net');
    var client = net.connect({port: 8080});
    var d;
    client.on('data', (data) => {
      d = data.toString()
    });
    client.on('end', () => {
      d.should.match(/goodbye/)
      done();
    });
    client.on('error', done);
  });

  it('should stop the fake service', function(done) {
    lsa.stop('fake', done)
  });

  it('should unload the fake service', function(done) {
    lsa.unload('fake', {}, done)
  });

  it('should remove the fake service', function(done) {
    lsa.uninstall('fake', done)
  });
});
