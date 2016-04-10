var spawn     = require('child_process').spawn;
var fs        = require('fs')
var path      = require('path')
var split     = require('split')
var through2  = require('through2')

var LaunchdSimpleApi = function (version) {

  this.list = function (then) {
    var results = {}
    var c = spawn('launchctl', ['list'], {stdio: 'pipe'})
    c.stdout
    .pipe(split())
    .pipe(through2(function (chunk, enc, cb) {
      var d = chunk.toString();
      if (d.match(/PID\s+status\s+label/)) {
        // skip headers
      } else if (d.match(/^(-|[0-9]+)\s+(-|[0-9]+)\s+.+/)) {
        //1419	-	0x7f97d040ea20.anonymous.launchctl
        d = d.match(/^(-|[0-9]+)\s+(-|[0-9]+)\s+(.+)/);
        var id = d && d[3];
        results[id] = {
          pid: d && d[1],
          status: d && d[2],
          id: d && d[3],
        }
      }
      cb();
    }, function (cb) {
      then && then(null, results)
      cb();
    }))

    c.on('error', then);

    return c;
  }

  this.describe = function (serviceId, then) {
    var that = this;
    that.findUnitFile(serviceId, function (err, results) {
      that.describeFile(results[0], then)
    })
  }

  this.describeFile = function (file, then) {
    return this.convertUnitFile(file, 'json', function (err, content){
      if (err) return then(err);
      try{
        return then(null, JSON.parse(content))
      }catch(ex){
        return then(ex)
      }
    });
  }

  this.load = function (serviceId, opts, then) {
    var that = this;
    that.findUnitFile(serviceId, function (err, results){
      if(!results.length) return then('not found')
      that.loadServiceFile(results[0], opts, then)
    })
  }
  this.loadServiceFile = function (fileOrDir, opts, then) {

    var args = ['load']
    if (opts.disabled || opts.d) args.push('-w')
    if (opts.force || opts.f) args.push('-F')
    if (opts.session || opts.s) args = args.concat(['-S', opts.session || opts.s])
    if (opts.domain || opts.d) args = args.concat(['-D', opts.domain || opts.d])
    args.push(fileOrDir)

    var c = spawn('launchctl', args, {stdio: 'pipe'})

    var stdout = ''
    var stderr = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })

    c.on('close', function (code){
      then(code>0 ? stdout+stderr : null)
    })

    c.on('error', then);

    return c;
  }

  this.unload = function (serviceId, opts, then) {
    var that = this;
    that.findUnitFile(serviceId, function (err, results){
      if(!results.length) return then('not found')
      that.unloadServiceFile(results[0], opts, then)
    })
  }
  this.unloadServiceFile = function (fileOrDir, opts, then) {

    var args = ['unload']
    if (opts.disabled || opts.d) args.push('-w')
    if (opts.session || opts.s) args = args.concat(['-S', opts.session || opts.s])
    if (opts.domain || opts.d) args = args.concat(['-D', opts.domain || opts.d])
    args.push(fileOrDir)

    var c = spawn('launchctl', args, {stdio: 'pipe'})

    var stdout = ''
    var stderr = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })

    c.on('close', function (code){
      then(code>0 ? stdout+stderr : null)
    })

    c.on('error', then);

    return c;
  }

  this.findUnitFile = function (serviceId, then) {
    var results = []
    paths = [
      '/System/Library/LaunchDaemons',
      '/System/Library/LaunchAgents',
      '/Library/LaunchDaemons',
      '/Library/LaunchAgents',
      process.env['HOME'] + '/Library/LaunchAgents'
    ]
    paths.forEach(function (dir, i) {
      var k = path.join(dir, serviceId + '.plist');
      fs.access(k, fs.FS_OK, function (err){
        if(!err) results.push(k);
        if(i===paths.length-1) then(null, results);
      })
    })
  }

  var forgePath = function (domain, jobType) {
    var dir = null;
    if (domain==='user') {
      dir = process.env['HOME'] + '/Library/LaunchAgents'

    } else if(domain==='global') {
      if(jobType==='agent') dir = '/Library/LaunchAgents'
      else if(jobType==='daemon') dir = '/Library/LaunchDaemons'

    } else if(domain==='system') {
        if(jobType==='agent') dir = '/System/Library/LaunchAgents'
        else if(jobType==='daemon') dir = '/System/Library/LaunchDaemons'
    }
    return dir;
  }

  this.listUnitFiles = function (opts, then) {
    var dir = forgePath(opts.domain, opts.jobType);
    fs.readdir(dir, function (err, files) {
      if (err) return then(err);
      then(null, files.map(function (name){
        return path.join(dir, name)
      }))
    });
  }

  this.testUnitFile = function (file, then) {
    var c = spawn('plutil', [file], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout : null)
    })

    c.on('error', then);

    return c;
  }

  this.convertUnitFile = function (file, fmt, then) {
    var c = spawn('plutil', ['-convert', fmt, '-o', '-', file], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout : null, stdout)
    })

    c.on('error', then);

    return c;
  }

  this.convertJsonToPlist = function (obj, then) {
    var c = spawn('plutil', ['-convert', 'xml1', '-o', '-', '-'], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout : null, stdout)
    })

    c.on('error', then);

    c.stdin.end(JSON.stringify(obj))

    return c;
  }

  this.start = function (serviceId, then) {
    var c = spawn('launchctl', ['start', serviceId], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout : null)
    })

    c.on('error', then);

    return c;
  }

  this.stop = function (serviceId, then) {
    var c = spawn('launchctl', ['stop', serviceId], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout : null)
    })

    c.on('error', then);

    return c;
  }

  this.restart = function (serviceId, then) {
    var that = this;
    that.stop(serviceId, function (err) {
      if (err) return then(err);
      that.stop(serviceId, then)
    })
  }

  this.install = function (opts, then) {
    this.convertJsonToPlist(opts.plist, function(err, plist) {
      if(err) return then(err);
      var dir = forgePath(opts.domain, opts.jobType);
      fs.writeFile(path.join(dir, opts.plist.Label + '.plist'), plist, then)
    })
  }

  this.uninstall = function (serviceId, then) {
    var that = this;
    that.findUnitFile(serviceId, function (err, results) {
      results.forEach(function (p, i) {
        that.uninstallUnitFile(p, function (err) {
          if (i===results.length-1) then(err);
        })
      })
      if(!results.length) then()
    })
  }

  this.uninstallUnitFile = function (file, then) {
    fs.unlink(file, then)
  }

}

module.exports = LaunchdSimpleApi
