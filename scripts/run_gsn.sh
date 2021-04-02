#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

cleanup() {
    # Kill the ganache instance that we started (if we started one and if it's still running).
    if [ -n "$gsn_pid" ] && ps -p $gsn_pid > /dev/null; then
        kill -9 $gsn_pid
    fi
}

gsn_running() {
    node_modules/.bin/gsn status | grep "status: true"
}

start_gsn() {
    node_modules/.bin/gsn start > /dev/null &
    gsn_pid=$!
    
    echo "Waiting for gsn to launch ..."
    
    while ! gsn_running; do
        sleep 0.9 # wait for 1/10 of the second before check again
    done
    
    echo "GSN started!"
}

if gsn_running; then
    echo "Using existing gsn instance"
else
    echo "Starting our own gsn instance"
    start_gsn
    sleep 1
fi
