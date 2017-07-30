/**
 * Created by Josef on 7/19/2017.
 */
// =============
//  Injected Web3 protection
// =============


// if (typeof window.web3 !== 'undefined') {
//     injectedProvider = window.web3.currentProvider;
//     web3 = new Web3(injectedProvider);
// } else {
//     web3 = new Web3(new Web3.providers.HttpProvider('http://104.196.220.4:8555'));
// }


var mmrpc, lhrpc, rmrpc;

if (web3.currentProvider.hasOwnProperty("multiStream")) {
    web3.dest = "metamask";
    mmrpc = web3;
} else if (web3.currentProvider.host.indexOf("/localhost:") != -1) {
    web3.dest = "localhost";
    lhrpc = web3;
} else if (web3.currentProvider.host == "http://104.196.220.4:8555") {
    web3.dest = "adahoyTest";
    rmrpc = web3;
} else {
    web3.dest = "custom";
    console.log("Your RCP is too hipster for me to swallow!");
}

var agents;
// force our RPC
var forceRPC = function() {
    if (web3.dest != "adahoyTest") {
        rmrpc = new Web3(new Web3.providers.HttpProvider("http://104.196.220.4:8555"));
        web3 = rmrpc;
        console.log("The injected provider was bypassed to connect to the TestRPC");
    }

    // web3.eth.getAccounts(function (result, error) {
    //     if (result == undefined) {
    //         agents = error;
    //     } else {
    //         agents = result;
    //     }
    // });

    agents = web3.eth.accounts;
    // web3.settings.defaultAccount = agents[0];
    web3.eth.defaultAccount = agents[0];

    $('#startPrototype').text("Start");
    $('#startPrototype').prop('disabled', false);
};

$(document).ready(forceRPC());

// =============
//  Randomization functions
// =============

// DEFINE: return random number from interval
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// DEFINE: return semi-random duration in years
function semiRandomDuration(_setContractLength) {
    if (Math.random() <= 0.50) {
        return _setContractLength
    }
    else {
        return randomIntFromInterval(1, _setContractLength)
    }
}

// DEFINE: populate random scenarios
var cases = [];
var randomScenarios = function(_setPriceRange, _setPercentage, _setContractLength) {
    return new Promise(function(resolve, reject) {
        if (contracts.lenght == 0) {
            reject("Contracts were not publish yet. Run loadContracts(n) first.")
        }

        cases = [];
        console.log("Random generated scenario:");

        contracts.forEach(function (item, index) {
            item._caseObj = new Object();

            item._caseObj.contractI = index;
            item._caseObj.lastHolder = [agent[index + 1]];

            item._caseObj.yearly = randomIntFromInterval(_setPriceRange[0], _setPriceRange[1]);
            item._caseObj.commission = _setPercentage;
            item._caseObj.shouldLast = _setContractLength;
            item._caseObj.lasts = semiRandomDuration(5);

            item._caseObj.premium = Math.round(item._caseObj.yearly * (item._caseObj.commission / 100));
            item._caseObj.yearOver = 0;

            cases[index] = item._caseObj;
            console.log(item._caseObj);
        });

        resolve("Random scenarios populated");
    });
};

// DEFINE: select random agent index for transfer
function getRandomAgent(agentFrom) {
    if (Math.random() <= 0.660) {
        return agentFrom
    }
    else {
        agentTo = randomIntFromInterval(1, 5);
        return agentTo
    }
}


// =============
//  Contract deployment
// =============

var loadContract = function(contractsCount) {
    return new Promise(function(resolve, reject) {
        contracts = [];
        for (i = 0; i < contractsCount; i++) {
            contracts[i] = i;
        }

        var promises = [];

        contracts.forEach(function (item, index) {
            symbol = "comm" + (index + 1);
            name = "Commission token num." + (index + 1);
            totalSupply = Math.floor(Math.random() * 10) + 1;
            agent = agents[(index + 1)];
            duration = 5;

            promises.push(
                commissionToken.deploy(
                    [
                        symbol,
                        name,
                        totalSupply,
                        agent,
                        duration
                    ],
                    {   from: agents[0],
                        gas: 3000000
                    })
                    .then(
                        function (response) {
                            // mintContract = response;
                            contracts[index] = response;
                            console.log("Turn " + index);
                            console.log(contracts[index]);
                        }
                    )
                // todo: add .catch
            )
        });

        Promise.all(promises).then(function() {
            resolve("All contracts published");
        });

    });
};

// =============
//  Contract awakening
// =============

// DEFINE: run contract signature by every agent
var runZero = function() {
    return new Promise(function(resolve, reject) {
        if (contracts.lenght == 0) {
            reject("Contracts were not publish yet. Run loadContracts(n) first.")
        }
        var promises = [];

        cases.forEach(function (item, index) {
            promises.push(
                contracts[item.contractI].agentSignature({from: agents[index + 1]})
                    .then(function (response) {
                        console.log("Agent " + (index + 1) + " signed! TxHash: " + response.transactionHash);
                        $('#contractsHolder tr').eq(index + 1).children().eq(1).children().eq(0).text('-');
                        $('#premiumPaid tr').eq(index + 1).children().eq(1).children().eq(0).text('-');
                        $('#tokenValue tr').eq(index + 1).children().eq(1).children().eq(0).text(((item.shouldLast-item.yearOver)*item.premium) + " €");
                    })
            )
        });

        Promise.all(promises).then(function() {
            resolve("All contracts signed!");
        });
    });
};

// =============
//  Data simulation
// =============

// DEFINE: simulate a year with data for each scenario
var runYear = function(_year) {
    return new Promise(function(resolve, reject) {
        if (cases.length == 0) {
            reject("Scenarios were not populated yet. Run randomScenarios() first.")
        }

        year = _year+1; // added because of laziness
        var promises = [];

        cases.forEach(function (item, index) {
            item.yearOver++;
            if ((item.lasts >= item.yearOver) && (item.shouldLast >= item.yearOver)) {
                promises.push(
                    contracts[item.contractI].loadRewardAccount([_year-1], {from: agents[0], value: 0})
                        .then(function (response) {
                            console.log("Reward payed for contract " + (index + 1) + " over tx: " + response.transactionHash);

                            // todo: Do transfer to new agent

                            $('#contractsHolder tr').eq(index + 1).children().eq(year).children().eq(0).text(item.yearly + " €");
                            $('#premiumPaid tr').eq(index + 1).children().eq(year).children().eq(0).text(item.premium + " €");
                            $('#tokenValue tr').eq(index + 1).children().eq(year).children().eq(0).text(((item.shouldLast-item.yearOver)*item.premium) + " €");
                        })
                )

            } else if ((item.lasts >= item.yearOver) && (item.shouldLast < item.yearOver)) {
                console.log("No longer obligated to pay commission at contract: " + (index + 1));

                $('#contractsHolder tr').eq(index + 1).children().eq(year).children().eq(0).text(item.yearly + " €");
                $('#premiumPaid tr').eq(index + 1).children().eq(year).children().eq(0).text(0 + " €");
                $('#tokenValue tr').eq(index + 1).children().eq(year).children().eq(0).text('-');

            } else {
                console.log("Skiping contract " + (index + 1) + " because customer stopped payments!");

                $('#contractsHolder tr').eq(index + 1).children().eq(year).children().eq(0).text(0 + " €");
                $('#premiumPaid tr').eq(index + 1).children().eq(year).children().eq(0).text('-');
                $('#tokenValue tr').eq(index + 1).children().eq(year).children().eq(0).text('-');
            }

        });
        console.log(promises);
        Promise.all(promises).then(function() {
            resolve("Year " + _year + " resolved!");
        });
    });
};

// DEFINE: chain the whole simulation
var runSimulation = function() {
    return new Promise(function(resolve, reject) {
        var promises = [];
        $('.loadedCell').text('');

        loadContract(3).then(function(result){
            console.log(result);
            return randomScenarios(setPriceRange, setPercentage, setContractLength);
        }).then(function(result){
            console.log(result);
            return runZero();
        }).then(function(result){
            console.log(result);
            return runYear(1);
        }).then(function(result){
            console.log(result);
            return runYear(2);
        }).then(function(result){
            console.log(result);
            return runYear(3);
        }).then(function(result){
            console.log(result);
            return runYear(4);
        }).then(function(result){
            console.log(result);
            return runYear(5);
        }).then(function(result){
            console.log(result);
            $('#continue').fadeIn('slow');
            resolve("All DONE!");
        });

        // Promise.all(promises).then(function() {
        //     resolve("All contracts signed!");
        // });
    });
};

// =============
//  User Interface
// =============

$('#startPrototype').off().click(function(){
    $('#startPrototype').prop('disabled', true);
    $('#restart').prop('disabled', true);
    $('#continue').hide();

    runSimulation()
    .then(function(result) {
        console.log(result);
        $('#startPrototype').prop('disabled', false);
        $('#restart').prop('disabled', false);
    }).catch(function(result) {
        console.log(result);
        $('#startPrototype').prop('disabled', false);
        $('#restart').prop('disabled', false);
    });

    $('html, body').animate({
        scrollTop: $($('#startPrototype').attr('href')).offset().top
    }, 500);
});

$("#priceRange").slider({});
$("#percentage").slider({});
$("#contractLength").slider({});

$(".settings div:nth-child(2)").show();

var setPriceRange = [200,800];
$("#priceRange").on("change", function(event) {
    setPriceRange = event.value.newValue;
    $("#yearlyPayments").text(event.value.newValue[0] + " - " + event.value.newValue[1]);
});

var setPercentage = 5;
$("#percentage").on("change", function(event) {
    setPercentage = event.value.newValue;
    $("#yearlyCommission").text(event.value.newValue);
});

var setContractLength = 3;
$("#contractLength").on("change", function(event) {
    setContractLength = event.value.newValue;
    if (event.value.newValue == 1) {
        $("#years").text(" year");
    }
    else {
        $("#years").text(" years");
    }

    $("#yearsToPay").text(event.value.newValue);
});


