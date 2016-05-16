var should = require('should');
var fs = require('fs');
var LaunchdSimpleApi = require('../index.js');

describe('launchd-simple-api root', function() {
  var lsa = new LaunchdSimpleApi();

  this.timeout(5000);

  if('yasudo' in process.env) lsa.enableElevation('');

  it('should install the fakesys service', function(done) {
    var service = {
      domain: 'global',
      plist: {
        Label: 'fakesys',
        ProgramArguments: [
          process.argv[0],
          '/Users/vagrant/wd/utils/fake-service.js'
        ]
      }
    }
    lsa.install(service, done)
  });

  it('should not list the fake service', function(done) {
    lsa.list(false, function (err, list) {
      ('fakesys' in list).should.eql(false);
      done();
    })
  });

  it('should load the service', function(done) {
    lsa.load('fakesys', {}, done)
  });

  it('should list the fake service', function(done) {
    lsa.list(false, function (err, list) {
      ('fakesys' in list).should.eql(true);
      done();
    })
  });

  it('should start the fake service', function(done) {
    lsa.start('fakesys', function (err) {
      setTimeout(function(){
        done(err);
      }, 500); // this is needed for the system to load and start the program.
    })
  });

  it('should list the fake service', function(done) {
    lsa.list(false, function (err, list) {
      ('fakesys' in list).should.eql(true);
      list['fakesys'].id.should.eql('fakesys');
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
    lsa.stop('fakesys', done)
  });

  it('should unload the fake service', function(done) {
    lsa.unload('fakesys', {}, done)
  });

  it('should remove the fake service', function(done) {
    lsa.uninstall('fakesys', done)
  });
});
