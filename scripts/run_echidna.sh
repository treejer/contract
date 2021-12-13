



# # echidna-test link => https://github.com/crytic/echidna/releases/tag/v2.0.0-b2

printf "\n\n ---------------------- planterFund echidna ------------------------------ \n\n"

./echidna-test . --contract PlanterFundEchidnaTest --config contracts/external/echidnaTest/planterFund/planterFund.config.yml --test-mode assertion

printf "\n\n ---------------------- planter echidna ------------------------------ \n\n"

./echidna-test . --contract PlanterEchidnaTest --config contracts/external/echidnaTest/planter/planter.config.yml --test-mode assertion

printf "\n\n ---------------------- incrementalSale echidna ------------------------------ \n\n"

./echidna-test . --contract IncrementalSaleEchidnaTest --config contracts/external/echidnaTest/incrementalSale/incrementalSale.config.yml --test-mode assertion

printf "\n\n ---------------------- regularSale echidna ------------------------------ \n\n"

./echidna-test . --contract RegularSaleEchidnaTest --config contracts/external/echidnaTest/regularSale/regularSale.config.yml --test-mode assertion


printf "\n\n /************** FINISH **********************/ \n\n"


