const axios = require("axios");
const dotenv = require('dotenv');

dotenv.config();

//GET transaction info by hash/id - Ortelius API
exports.getTransactionByIdFromXChain = async (txId) => {
    let response;

    try {
        response = await axios.get(`${process.env.ORTELIUS_API_ENDPOINT + `transactions/${txId}`}`);
    } catch (error) {
        return 1;
    }
    
    return response.data;
};

//GET address info by hash
exports.getAddressInfoByHashFromXChain = async (address) => {
    let balanceResult;

    const responseForBalance = await axios.post(process.env.X_CHAIN_BC_CLIENT_BLOCK_ENDPOINT, {
        jsonrpc: '2.0',
        id: 1,
        method: 'avm.getAllBalances',
        params: {
                address: `${address}`
        }
    }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
    }).then(response => {
        balanceResult = [0, response.data.result];
    }).catch(error => {
        if(!error.response) {
            console.log("connection refused to avalanche client");
            balanceResult = [1, JSON.parse('{"result":"connection refused to avalanche client"}')];
        } else {
            console.log(error.response.data);
            balanceResult = [1, error.response.data];
        }
    });

    if (balanceResult[0] == 1 || typeof balanceResult[1] == 'undefined') {
        balanceResult[0] = 1
        return balanceResult;
    }

    let responseForAssets;

    for(let i = 0; i < responseForBalance.data.result.balances.length; i++) {
        responseForAssets = await axios.post(process.env.X_CHAIN_BC_CLIENT_BLOCK_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'avm.getAssetDescription',
            params: {
                'assetID' :`${responseForBalance.data.result.balances[i].asset}`
            }
        }, {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
        });
    }
    
    return [responseForBalance.data.result.balances, responseForAssets.data.result];
};

//GET X transaction from address after N-th transaction
exports.getXTransactionsAfterNthFromAddressFromXChain = async (address, n, x) => {
    let transactionsResult;

    const response = await axios.post(process.env.X_CHAIN_BC_CLIENT_BLOCK_ENDPOINT, {
        jsonrpc: '2.0',
        id: 1,
        method: 'avm.getAddressTxs',
        params: {
                address: `${address}`,
                assetID: 'AVAX'
        }
    }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
    }).then(response => {
        transactionsResult = [0, (response.data.result.txIDs).slice(n - x, n)];
    }).catch(error => {
        if(!error.response) {
            console.log("connection refused to avalanche client");
            transactionsResult = [1, JSON.parse('{"result":"connection refused to avalanche client"}')];
        } else {
            console.log(error.response.data);
            transactionsResult = [1, error.response.data];
        }
    });

    return transactionsResult;
}