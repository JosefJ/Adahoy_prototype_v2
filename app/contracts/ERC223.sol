pragma solidity ^0.4.9;

import "./ERC223Interface.sol";

/**
* !! DISCLAIMER: This is not a regular implementation, some of the critical parts were commented out
* or changed due to a Warning = Error on unused variables in Emabrak, most of it will be fixed in 2.6
*/

/**
* ERC23 token by Dexaran
* https://github.com/Dexaran/ERC23-tokens
*/

// TODO: fix after Embark updae 2.6
//contract contractReceiver {
//    function tokenFallback(address _from, uint _value, bytes _data){
//        balances[issuer] += _value;
//        Received(_from, issuer, _value);
//    }

//    event Received(address indexed from, address indexed to, uint value)
//}

contract ERC223 is ERC223Interface {

    mapping(address => uint) balances;
    mapping (address => mapping (address => uint)) allowed;

    //function that is called when a user or another contract wants to transfer funds
    function transfer(address _to, uint _value, bytes _data) returns (bool success) {

        //filtering if the target is a contract with bytecode inside it
        if(isContract(_to)) {
            transferToContract(_to, _value, _data);
        }
        else {
            transferToAddress(_to, _value, _data);
        }
        return true;
    }

    function transfer(address _to, uint _value) returns (bool success) {

        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons
        bytes memory emptyData;
        if(isContract(_to)) {
            transferToContract(_to, _value, emptyData);
        }
        else {
            transferToAddress(_to, _value, emptyData);
        }
        return true;
    }

    //function that is called when transaction target is an address
    function transferToAddress(address _to, uint _value, bytes _data) returns (bool success) {
        if (_data.length == 0) {}
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
        return true;
    }

    //function that is called when transaction target is a contract
    function transferToContract(address _to, uint _value, bytes _data) returns (bool success) {
        if (_data.length == 0) {}
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        //        TODO: fix after Embark update 2.6
        //        contractReceiver reciever = contractReceiver(_to);
        //        reciever.tokenFallback(msg.sender, _value, _data);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    function isContract(address _addr) private returns (bool is_contract) {
        uint length;
        assembly {
        //retrieve the size of the code on target address, this needs assembly
        length := extcodesize(_addr)
        }
        // TODO: fix after Embark update 2.6
        // _addr check added due to Solidity compiler bug (variable usage not checked in assembly) => throws warning
        // plus Embark compiler => doesn't compile with warnings

        if((length>0) && (_addr == _addr)) {
            return true;
        }
        else {
            return false;
        }
    }

    function transferFrom(address _from, address _to, uint _value) returns (bool success) {
        var _allowance = allowed[_from][msg.sender];

        if(_value > _allowance) {
            throw;
        }

        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint remaining) {
        return allowed[_owner][_spender];
    }
}
