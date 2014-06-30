# -*- coding: utf-8 -*-
"""
fabfile.py
~~~~~~
It provides a basic suite of operations for executing local 
or remote shell commands, as well as auxiliary functionality 
such as prompting the running user for input, or aborting 
execution.

:copyright: (c) 2014 by Opentaste
"""
import os
import simplejson as json 
from fabric.api import settings, run, env, cd, lcd, local

env.user       = "owlstudios"
env.password   = ""
env.hosts      = ["web383.webfaction.com"]

HOME_DIR       = "/home/owlstudios"
TEMP_DIR       = HOME_DIR + "/tmp_mobile"
PRODUCTION_DIR = "/home/owlstudios/webapps/opentaste_mobile"
DEV_DIR        = "/home/owlstudios/webapps/opentaste_dev_mobile"
LOG_OT		   = "/home/owlstudios/log_ot"
GIT_CLONE_CMD  = "git clone https://owlstudios:followthetaste1629@github.com/Opentaste/mobile.git"

# Application tools ===============================================================
def start_node():
	""" """
	with cd(PRODUCTION_DIR):
		try:
			run('rm {}/opentaste.log'.format(LOG_OT))
		except:
			pass
		run('npm install')
		run('forever start -l {0}/opentaste.log {1}/app.js'.format(LOG_OT, PRODUCTION_DIR))
	print 'Done'
        
def stop_node():
    list_ps = run("ps aux | grep '/home/owlstudios/webapps/opentaste_mobile/app.js' | awk '{print $2}'")
    list_ps = list_ps.split('\r\n')
    for x in list_ps:
        try:
            run("kill -9 %s" % x)
        except:
            print "Error while killing this process : %s" % x

# Publish tools ===================================================================
def production():
    print '\n####### Publish #######'
    with settings(warn_only=True):
        run("rm -fr %s" % TEMP_DIR)
        run("mkdir -p %s" % (TEMP_DIR))
        with cd(TEMP_DIR):
            run(GIT_CLONE_CMD)
            run("rsync -avz --delete {}/mobile/* {}".format(TEMP_DIR, PRODUCTION_DIR))
        run("rm -fr %s" % TEMP_DIR)
        stop_node()
        start_node()

