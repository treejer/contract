


if [ -d ./backup-migrations ]; then

   if [ ! -d ./migrations ]; then
      mkdir migrations 
   fi

   mv ./backup-migrations/* ./migrations

fi

rm -rf backup-migrations
rm -rf final-coverage-json
rm -rf .coverage_artifacts
rm -rf .coverage_contracts