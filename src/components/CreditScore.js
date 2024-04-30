import React, { useState, useEffect, useContext } from 'react';
import { fetchActivityData } from '../utils/ActivityData';
import { WalletContext } from '../App';
import { AddressActivityListView } from '@covalenthq/goldrush-kit';
import { CredZContext } from '../context/CredZProvider';

const ethers = require('ethers');

/* global BigInt */
// function CreditScoreCard({ totalTransactions, latestTxDate, chainName, totalSuccessfulTxs, totalGasSpentEth, totalFeesPaidEth, totalValueEth }) {
//     return (
//         <div className="bg-gray-800 text-white shadow-lg rounded-lg p-6 w-full max-w-md mx-auto">
//             <h1 className="text-2xl font-bold mb-4">On-chain Activity</h1>
//             {totalTransactions ? (
//                 <>
//                     <p><strong>Total Transactions:</strong> {totalTransactions}</p>
//                     <p><strong>Latest Transaction Date:</strong> {new Date(latestTxDate).toLocaleString()}</p>
//                     <p><strong>Chain Name:</strong> {chainName}</p>
//                     <p><strong>Total Successful Transactions:</strong> {totalSuccessfulTxs}</p>
//                     <p><strong>Total Fees Paid (ETH):</strong> {totalFeesPaidEth ? totalFeesPaidEth.toFixed(4) : 'No data available'}</p>
//                     <p><strong>Total Value Transacted (ETH):</strong> {totalValueEth ? totalValueEth.toFixed(4) : 'No data available'}</p>
//                 </>
//             ) : (
//                 <p>No data available</p>
//             )}
//             <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">Calculate Credit Score</button>
//         </div>
//     );
// }

function CreditScore() {
    const [transactions, setTransactions] = useState([]);
    const [creditScore, setCreditScore] = useState(0);
    const [creditData, setCreditData] = useState({});
    const { walletAddress } = useContext(WalletContext);
    const {getCreditScore, setInitialCreditScore} = useContext(CredZContext);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchActivityData(walletAddress);
            setTransactions(data);
            calculateCreditScore(data);
        };
        loadData();
    }, [walletAddress]);

    const calculateCreditScore = async (data) => {
        const totalTransactions = data.items.length;
        const latestTxDate = data.items[data.items.length - 1].block_signed_at;
        const chainName = data.chain_name;

        const currentAddress = walletAddress.toLowerCase();
        const filteredItems = data.items.filter(tx => tx.from_address.toLowerCase() === currentAddress && tx.successful);

        const totalSuccessfulTxs = filteredItems.length;

        const totalGasSpent = filteredItems.reduce((acc, tx) => acc + parseInt(tx.gas_spent, 10), 0);
        const totalFeesPaid = filteredItems.reduce((acc, tx) => acc + BigInt(tx.fees_paid), BigInt(0));
        const totalValue = filteredItems.reduce((acc, tx) => acc + BigInt(tx.value), BigInt(0));

        const decimals = data.items[0]?.gas_metadata.contract_decimals || 18;
        const totalGasSpentEth = totalGasSpent / Math.pow(10, decimals);
        const totalFeesPaidEth = Number(totalFeesPaid) / Math.pow(10, decimals);
        const totalValueEth = Number(totalValue) / Math.pow(10, decimals);

        setCreditData({
            totalTransactions,
            latestTxDate,
            chainName,
            totalSuccessfulTxs,
            totalGasSpentEth,
            totalFeesPaidEth,
            totalValueEth
        });

        const creditScore_ = await getCreditScore();
        setCreditScore(parseInt(creditScore_));
        // await setInitialCreditScore(walletAddress);    // only for testing purposes
        
    }

    return (
        <>
            <div className="flex flex-col items-center mt-10 w-full">
                <h2 className="text-2xl font-bold text-white-800 mb-4">On Chain Activities</h2>
                <div className="bg-gray-800 p-5 rounded-lg shadow-lg w-3/4 max-w-4xl h-96 overflow-y-auto">
                    <AddressActivityListView address={walletAddress} />
                </div>
                <p className="text-lg text-white mb-4">Your credit score is: {creditScore ? creditScore : 'No data available'} </p>
                {creditScore == 0 && (
                    <button onClick={() => setInitialCreditScore(walletAddress)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">Refresh Credit Score</button>
                )}
                <div className="absolute bottom-4 right-4 text-green-500">
                    <p>Latest Transaction on Scroll Testnet: {new Date(creditData.latestTxDate).toLocaleString()}</p>
                </div>
            </div>
        </>
    );
}

export default CreditScore;