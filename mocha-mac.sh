
vagrant up yosemite
vagrant ssh yosemite -c "BOXTYPE=yosemite sh /Users/vagrant/wd/run-tests-mac.sh"
vagrant halt yosemite

vagrant up maverick
vagrant ssh maverick -c "BOXTYPE=maverick sh /Users/vagrant/wd/run-tests-mac.sh"
vagrant halt maverick
