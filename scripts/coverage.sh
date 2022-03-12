#!/usr/bin/env bash


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
    ./node_modules/.bin/istanbul report --include="$path"/final-coverage-json/*.json -d final-coverage lcov
    rm -r final-coverage-json

}


run_coverage