var spawn     = require('child_process').spawn;
var fs        = require('fs-extra')
var path      = require('path')
var split     = require('split')
var async     = require('async')
var through2  = require('through2')
var yasudo    = require('@mh-cbon/c-yasudo')
var sudoFs    = require('@mh-cbon/sudo-fs')
var pkg       = require('./package.json')
var debug     = require('debug')(pkg.name);

var LaunchdSimpleApi = function (version) {

  var elevationEnabled = false;
  var pwd = false;
  this.enableElevation = function (p) {
    if (p===false){
      elevationEnabled = false;
      pwd = false;
      return;
    }
    elevationEnabled = true;
    pwd = p;
  }

  var getFs = function () {
    return elevationEnabled ? sudoFs : fs;
  }

  var spawnAChild = function (bin, args, opts) {
    if (elevationEnabled) {
      debug('sudo %s %s', bin, args.join(' '))
      opts = opts || {};
      if (pwd) opts.password = pwd;
      return yasudo(bin, args, opts);
    }
    debug('%s %s', bin, args.join(' '))
    return spawn(bin, args, opts);
  }

  this.list = function (then) {
    var results = {}
    var c = spawnAChild('launchctl', ['list'], {stdio: 'pipe'})
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
      if(!results.length) return then('not found')
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

    var c = spawnAChild('launchctl', args, {stdio: 'pipe'})

    var stdout = ''
    var stderr = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })

    c.on('close', function (code){
      // on yosemite, a file not found will not return an exit code>0
      // so, we shall apply some patch.
      if (code===0 && (stdout+stderr).match(/(No such file or directory)/)) code = 1;
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

    var c = spawnAChild('launchctl', args, {stdio: 'pipe'})

    var stdout = ''
    var stderr = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })

    c.on('close', function (code){
      // on yosemite, a file not found will not return an exit code>0
      // so, we shall apply some patch.
      if (code===0 && (stdout+stderr).match(/(No such file or directory)/)) code = 1;
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
        if(i===paths.length-1) {
          debug('findUnitFile %s', results)
          then(null, results);
        }
      })
    })
  }

  var forgePath = function (domain, jobType) {
    var dir = null;
    if (domain==='user') {
      dir = process.env['HOME'] + '/Library/LaunchAgents'

    } else if(domain==='global') {
      if(jobType==='agent') dir = '/Library/LaunchAgents'
      else if(!jobType || jobType==='daemon') dir = '/Library/LaunchDaemons'

    } else if(domain==='system') {
        if(jobType==='agent') dir = '/System/Library/LaunchAgents'
        else if(!jobType || jobType==='daemon') dir = '/System/Library/LaunchDaemons'
    }
    debug('forgePath %s %s %s', domain, jobType, dir)
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
    var c = spawnAChild('plutil', [file], {stdio: 'pipe'})
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
    var c = spawnAChild('plutil', ['-convert', fmt, '-o', '-', file], {stdio: 'pipe'})
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
      then(code>0 ? stderr+stdout || 'error' : null, stdout)
    })

    c.on('error', then);

    c.stdin.end(JSON.stringify(obj))

    return c;
  }

  this.start = function (serviceId, then) {
    var c = spawnAChild('launchctl', ['start', serviceId], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout || 'error' : null)
    })

    c.on('error', then);

    return c;
  }

  this.stop = function (serviceId, then) {
    var c = spawnAChild('launchctl', ['stop', serviceId], {stdio: 'pipe'})
    var stdout = ''
    c.stdout.on('data', function (d){
      stdout += d.toString();
    })
    var stderr = ''
    c.stderr.on('data', function (d){
      stderr += d.toString();
    })
    c.on('close', function (code){
      then(code>0 ? stderr+stdout || 'error' : null)
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
      async.series([
        function (next) {
          if (opts.plist.StandardOutPath) {
            return (getFs().mkdirs || getFs().mkdir)(path.dirname(opts.plist.StandardOutPath), next);
          }
        },
        function (next) {
          if (opts.plist.StandardErrorPath) {
            return (getFs().mkdirs || getFs().mkdir)(path.dirname(opts.plist.StandardErrorPath), next);
          }
        },
        function (next) {
          (getFs().mkdirs || getFs().mkdir)(dir, next);
        },
        function (next) {
          getFs().writeFile(path.join(dir, opts.plist.Label + '.plist'), plist, next)
        }
      ], then)
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
      if(!results.length) then('not found')
    })
  }

  this.uninstallUnitFile = function (file, then) {
    getFs().unlink(file, then)
  }
}

module.exports = LaunchdSimpleApi
