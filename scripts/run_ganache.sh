#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

cleanup() {
    # Kill the ganache instance that we started (if we started one and if it's still running).
    if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
        kill -9 $ganache_pid
    fi
    
}

ganache_port=8545

ganache_running() {
    nc -z localhost "$ganache_port"
}


start_ganache() {
    ganache --networkId 1337 -l 20000000 --port 8545 --accounts 20 > /dev/null &
    ganache_pid=$!
    
    echo "Waiting for ganache to launch on port "$ganache_port"..."
    
    while ! ganache_running; do
        sleep 0.1 # wait for 1/10 of the second before check again
    done
    
    echo "Ganache launched!"
}


if ganache_running; then
    echo "Using existing ganache instance"
else
    echo "Starting our own ganache instance"
    start_ganache
    sleep 1
fi