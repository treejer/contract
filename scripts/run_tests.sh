#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi

  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$gsn_pid" ] && ps -p $gsn_pid > /dev/null; then
    kill -9 $gsn_pid
  fi
}

ganache_port=8545

ganache_running() {
  nc -z localhost "$ganache_port"
}

gsn_running() {
  node_modules/.bin/gsn status | grep "status: true"
}

start_ganache() {
  ganache-cli ganache-cli --networkId 1337 --chainId 1337 --port "$ganache_port" --accounts 20 > /dev/null &
  ganache_pid=$!

  echo "Waiting for ganache to launch on port "$ganache_port"..."

  while ! ganache_running; do
    sleep 0.1 # wait for 1/10 of the second before check again
  done

  echo "Ganache launched!"
}

start_gsn() {
  node_modules/.bin/gsn start > /dev/null &
  gsn_pid=$!

  echo "Waiting for gsn to launch ..."
  sleep 5
  while ! gsn_running; do
    sleep 5 # wait for 1/10 of the second before check again
  done

  echo "GSN started!"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
  sleep 5
fi


if gsn_running; then
  echo "Using existing gsn instance"
else
  echo "Starting our own gsn instance"
  start_gsn
fi

npx truffle version
npx truffle test "$@"
# npx truffle test test/seedfactory.js
