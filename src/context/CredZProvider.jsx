import React, { createContext, useEffect, useState } from "react";
import { loanAbi, loanContractAddress } from "../utils/constants";

export const CredZContext = createContext();
const ethers = require("ethers");

export const CredZProvider = ({ children }) => {
  const [account, setAccount] = useState();
  const [provider, setProvider] = useState();
  const [isSupportMetaMask, setIsSupportMetaMask] = useState(false);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
      setIsSupportMetaMask(true);
    } else {
      setIsSupportMetaMask(false);
    }
  };

  const fetchAccount = async () => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
  };

  const createLoanContract = () => {
    return new ethers.Contract(loanContractAddress, loanAbi, provider.getSigner());
  };

  const getCreditScore = async () => {
    const contract = createLoanContract();
    return await contract.getCreditScore();
  };

  const requestEtherLoan = async (amount, loanDurationDays) => {
    const contract = createLoanContract();
    await contract.requestEtherLoan(amount, loanDurationDays);
  };

  const fundLoan = async (loanId, amount) => {
    const contract = createLoanContract();
    await contract.fundLoan(loanId, { value: ethers.parseEther(amount.toString()) });
  };

  const repayEtherLoan = async (loanId, amount) => {
    const contract = createLoanContract();
    await contract.repayEtherLoan(loanId, { value: ethers.parseEther(amount.toString()) });
  };

  const listAvailableLoans = async () => {
    const contract = createLoanContract();
    return await contract.listAvailableLoans();
  };

  const listUserLoans = async () => {
    const contract = createLoanContract();
    return await contract.listUserLoans();
  };

  const listFundedButNotRepaidLoans = async () => {
    const contract = createLoanContract();
    return await contract.listFundedButNotRepaidLoans();
  };

  const listUserInvolvedLoans = async (userAddress) => {
    const contract = createLoanContract();
    return await contract.listUserInvolvedLoans(userAddress);
  };

  useEffect(() => {
    const fetchData = async () => {
      await initializeWeb3();
      if (provider) {
        await fetchAccount();
      }
    };
    fetchData();
  }, [provider]);

  return (
    <CredZContext.Provider
      value={{
        account,
        provider,
        isSupportMetaMask,
        fetchAccount,
        getCreditScore,
        requestEtherLoan,
        fundLoan,
        repayEtherLoan,
        listAvailableLoans,
        listUserLoans,
        listFundedButNotRepaidLoans,
        listUserInvolvedLoans
      }}
    >
      {children}
    </CredZContext.Provider>
  );
};