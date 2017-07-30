pragma solidity ^0.4.9;

import "./ERC223.sol";

/**
 * @title Adahoy - commission token
 *
 * @dev Based on ERC20/ERC223 https://github.com/Dexaran/ERC23-tokens/blob/Recommended/ERC223_Token.sol
 */

contract commissionToken is ERC223 {

    address public issuer;
    address private agent;
    uint blockNumber;
    uint public expiration;
    uint[] fulfillment;
    bool contractSigned = false;

    /**
     * TODO: Optimizie data types
     * @dev Constructor
     * @param _symbol string token symbol, 3 letter id of the symbol, unwritten standard
     * @param _name string token name, internal contract/token identification - see whitepaper
     * @param _totalSupply uint amount, total amount of tokens issued
     * @param _agent address counter party identification, needed to hand over the tokens
     * @param _duration uint8 years, length of the agreement in years - can serve as expiration
     */
    function commissionToken(
        string _symbol,
        string _name,
        uint _totalSupply,
        address _agent,
        uint8 _duration
    ) {
        symbol = _symbol;
        name = _name;
        totalSupply = _totalSupply;
        issuer = msg.sender;
        agent = _agent;
        blockNumber = block.number;
        expiration = _duration;
        fulfillment.length = _duration;
    }

    // @dev Functions with this modifier can only be executed by the issuer
    modifier onlyOwner() {
        if (msg.sender != issuer) {
            throw;
        }
        _;
    }

    // @dev Function with this modifier can only be executed from addresses that hold tokens
    modifier tokenHolder() {
        if (balanceOf(msg.sender) < 1) {
            throw;
        }
        _;
    }

    // @dev Function with this modifier can only be executed after the expiration period had run out of buffer
    modifier expired() {
        if (0 < expiration + 1) {
            throw;
        }
        _;
    }

    /**
     * @dev Counterparty signature - initially, tokens will be released only if an agent signs the contract
     * @dev no params needed as the agent was set in constructor
     */
    function agentSignature() returns (bool) {
        if (contractSigned && msg.sender != agent) {
            throw;
        }
        // initial token emission - all tokens assigned to the agent
        contractSigned = true;
        balances[msg.sender] = totalSupply;

        // TODO: update blockNumber to the number of when it got signed
        contractSignedEvent(issuer, msg.sender, blockNumber, totalSupply);
        return contractSigned;
    }

    /**
     * @dev Loading of the reward/commission based on agreement - assign the msg.value to some selected rewardPeriod
     * @param rewardPeriod uint period id, all the ether sent with the tx will be associate with a year/period
     */
    function loadRewardAccount(uint rewardPeriod) payable returns (bool) {
        fulfillment[rewardPeriod] = msg.value;
        rewardLoaded(msg.sender,rewardPeriod,msg.value);

        // TODO: here should  be some sort of a bank account check
        // small bot/trigger on the bank-acc side -> if the payment per policyID hasn't occur.. do something
        // TODO: more sophisticated call back
        return true;
    }

    /**
     * @dev Claim reward for an period - every reward period a tokenHolder can claim her reward as a pull
     * @param rewardPeriod uint period id, all the ether associate with a year/period will be sent to tokenHolder
     */
    function claimReward(uint rewardPeriod) tokenHolder returns (bool) {
        uint value = fulfillment[rewardPeriod];
        fulfillment[rewardPeriod] = 0;
        msg.sender.transfer(value);
        rewardClaimed(msg.sender, rewardPeriod, value);
        return true;
    }

    // TODO: to be implemented
    // every reward period a delegate can claim the reward for an owner
    // function claimRewardFor(address who) returns (bool);

    // << constant functions >>
    // function getLastRewardPeriod() private constant returns (uint);
    // function getRewardPaid() private constant returns (uint);


    // TODO: implement transfer agreement function this way:
    //  struct transferAgreement {
    //    address buyer;
    //    uint period;
    //    bool agreed;
    //  }
    // function transferOffer(address buyer) {
    //        transferAgreement.buyer = buyer;
    //        transferAgreement.period = getLastRewardPeriod();
    // }
    // function transferStatusAgreement(address buyer) {
    //        if (transferAgreement.buyer = msg.sender && transferAgreement.period = getLastRewardPeriod()) {
    //              transferAgreement.agreed = true; }
    //        else {
    //              throw;
    //        };
    // }

    // << cleanup functions >>
    // can be called after time = expiration + 1 to return all funds and erase the contract

    /**
     * TODO: rename to expiration handling
     * @dev Function to terminate the contract after expiration or testing
     */
    function fulfillDestiny() onlyOwner returns (bool) {
        // TODO: add only if contractSigned == False or modifier expired;
        return true;
        //return selfdestruct(msg.sender);
        // TODO: payout to the tokenHolder or issuer based on conditions
    }

    event rewardLoaded(address indexed from, uint indexed period, uint value);
    event rewardClaimed(address indexed from, uint indexed period, uint value);
    event contractSignedEvent(address indexed issuer, address indexed agent, uint blockNumber, uint tokens);
}


