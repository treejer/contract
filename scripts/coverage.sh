#!/usr/bin/env bash

# npm install -g istanbul-combine

run_coverage() {
    path=$(pwd)
    
    mkdir final-coverage-json -p $path

    for entry in "$path"/test/*;

    do

    testFileName=${entry#*"test/"}
    testFileName=${testFileName%"."*}

    if [[ $testFileName != "common" && $testFileName != "config" && $testFileName != "enumes" && $testFileName != "math" ]]; then
        
        printf "\n\n /************** "$testFileName" **********************/ \n\n"  
        
        npx truffle run coverage --file $entry

        mv "$path"/coverage.json final-coverage-json/"$testFileName".json
        
        rm -r coverage
    fi

    done

    istanbul-combine -d final-coverage -p both -r lcov -r html -r json "$path"/final-coverage-json/*.json

    rm -r final-coverage-json

}


run_coverage