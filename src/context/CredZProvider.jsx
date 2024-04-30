import React, { createContext, useEffect, useState } from "react";
import { loanAbi, loanContractAddress } from "../utils/constants";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Error fetching account. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const createLoanContract = async () => {
    const signer = await provider.getSigner();
    return new ethers.Contract(loanContractAddress, loanAbi, signer);
  };

  const getCreditScore = async () => {
    try {
      const contract = await createLoanContract();
      return await contract.getCreditScore();
    } catch (error) {
      console.error("Error getting credit score:", error);
      toast.error("Error getting credit score. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  // only for testing
  const setInitialCreditScore = async (account) => {
    try {
      const contract = await createLoanContract();
      await contract.setInitialCreditScore(account);
    } catch (error) {
      console.error("Error setting initial credit score:", error);
      toast.error("Error setting initial credit score. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const requestEtherLoan = async (amount, loanDurationDays) => {
    try {
      const contract =  await createLoanContract();
      const parsedAmount = ethers.parseEther(amount.toString());
      await contract.requestEtherLoan(parsedAmount, loanDurationDays);
    } catch (error) {
      console.error("Error requesting ether loan:", error);
      toast.error("Error requesting ether loan. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const fundLoan = async (loanId, amount) => {
    try {
      const contract = await createLoanContract();
      await contract.fundLoan(loanId.toString(), { value: amount.toString() });
    } catch (error) {
      console.error("Error funding loan:", error);
      toast.error("Error funding loan. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const repayEtherLoan = async (loanId, amount) => {
    try {
      const contract = await createLoanContract();
      await contract.repayEtherLoan(loanId.toString(), { value: ethers.parseEther(amount.toString()) });
    } catch (error) {
      console.error("Error repaying ether loan:", error);
      toast.error("Error repaying ether loan. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const listAvailableLoans = async () => {
    try {
      const contract = await createLoanContract();
      return await contract.listAvailableLoans();
    } catch (error) {
      console.error("Error listing available loans:", error);
      toast.error("Error listing available loans. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const listUserLoans = async () => {
    try {
      const contract = await createLoanContract();
      return await contract.listUserLoans();
    } catch (error) {
      console.error("Error listing user loans:", error);
      toast.error("Error listing user loans. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const listFundedButNotRepaidLoans = async () => {
    try {
      const contract = await createLoanContract();
      return await contract.listFundedButNotRepaidLoans();
    } catch (error) {
      console.error("Error listing funded but not repaid loans:", error);
      toast.error("Error listing funded but not repaid loans. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const listUserInvolvedLoans = async (userAddress) => {
    try {
      const contract = await createLoanContract();
      return await contract.listUserInvolvedLoans(userAddress);
    } catch (error) {
      console.error("Error listing user involved loans:", error);
      toast.error("Error listing user involved loans. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await initializeWeb3();
      if (provider) {
        await fetchAccount();
      }
    };
    fetchData();
  }, []);

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
        listUserInvolvedLoans,
        setInitialCreditScore,
      }}
    >
      {children}
    </CredZContext.Provider>
  );
};