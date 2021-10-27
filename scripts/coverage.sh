#!/usr/bin/env bash

# npm install -g istanbul-combine

run_coverage() {
    path=$(pwd)
    
    #final-coverage-json config
    mkdir final-coverage-json -p $path

    #backup-migrations config
    mkdir backup-migrations -p $path
    mv "$path"/migrations/* "$path"/backup-migrations

    for entry in "$path"/test/*;

    do

    testFileNameWithJS=${entry#*"test/"}
    testFileName=${testFileNameWithJS%"."*}

    if [[ $testFileName != "common" && $testFileName != "config" && $testFileName != "enumes" && $testFileName != "math" ]]; then
        
        printf "\n\n /************** "$testFileName" **********************/ \n\n"  
        
        npx truffle run coverage --file ./test/$testFileNameWithJS

        mv "$path"/coverage.json final-coverage-json/"$testFileName".json
        
        rm -r coverage
    fi

    done

    #backup-migrations config
    mv "$path"/backup-migrations/* "$path"/migrations
    rm -r backup-migrations

    #istanbul-combine config
    istanbul-combine -d final-coverage -p both -r lcov -r html -r json "$path"/final-coverage-json/*.json
    rm -r final-coverage-json

}


run_coverage