vagrant up yosemite
vagrant ssh yosemite -c "sh /Users/vagrant/wd/run-tests-mac.sh"
vagrant halt yosemite

vagrant up maverick
vagrant ssh maverick -c "sh /Users/vagrant/wd/run-tests-mac.sh"
vagrant halt maverick
