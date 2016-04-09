# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|

    config.vm.define :yosemite do |yosemite|
      yosemite.vm.box = "AndrewDryga/vagrant-box-osx"
      yosemite.vm.synced_folder ".", "/Users/vagrant/wd", type: "rsync"
      yosemite.vm.network :private_network, ip: "10.1.1.10"
    end

    config.vm.define :maverick do |maverick|
      maverick.vm.box = "http://files.dryga.com/boxes/osx-mavericks-0.1.0.box"
      maverick.vm.synced_folder ".", "/Users/vagrant/wd", type: "rsync"
      maverick.vm.network :private_network, ip: "10.1.1.10"
    end

end
