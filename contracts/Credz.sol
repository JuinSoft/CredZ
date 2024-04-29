// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Credz {
    using SafeMath for uint256;
    struct LoanRequest {
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 paybackAmount;
        uint256 loanDueDate;
        uint256 duration;
        uint256 loanId;
        bool isPayback;
    }
    struct LendRequest {
        address lender;
        uint256 lendId;
        uint256 lendAmountEther;
        uint256 lendAmountToken;
        uint256 paybackAmountEther;
        uint256 paybackAmountToken;
        uint256 timeLend;
        uint256 timeCanGetInterest;
        bool retrieved;
        bool isLendEther;
    }

    uint256 private constant TOKEN_DECIMALS = 18;
    uint256 private constant MIN_LOAN_AMOUNT = 0.0001 ether;
    uint256 private constant MIN_LEND_AMOUNT = 0.0001 ether;
    uint256 private constant INTEREST_RATE_7_DAYS = 106;
    uint256 private constant INTEREST_RATE_14_DAYS = 107;
    uint256 private constant INTEREST_RATE_30_DAYS = 108;
    uint256 private constant INTEREST_RATE_LEND = 105;
    uint256 private constant LOAN_DURATION_7_DAYS = 7 days;
    uint256 private constant LOAN_DURATION_14_DAYS = 14 days;
    uint256 private constant LOAN_DURATION_30_DAYS = 30 days;
    uint256 private constant MIN_LEND_DURATION = 30 days;
    uint256 private constant COLLATERAL_RATIO = 115;
    uint256 private constant MAX_LOAN_COUNT = 1000;
    uint256 private constant MAX_LEND_COUNT = 1000;
    address private constant TOKEN_ADDRESS =
        0xf54276f48fE888D9c158F332eeB88d09751bdA1a;
    uint256 private constant ETH_PER_TOKEN = 0.0001 ether;

    address public owner;
    uint256 public loanCount;
    uint256 public lendCount;
    uint256 public totalLiquidity;

    LoanRequest[] public loans;
    LendRequest[] public lends;

    event NewLoan(
        address indexed borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 paybackAmount,
        uint256 loanDueDate,
        uint256 duration
    );

    event NewLend(
        address indexed lender,
        uint256 lendAmountEther,
        uint256 lendAmountToken,
        uint256 paybackAmountEther,
        uint256 paybackAmountToken,
        uint256 timeLend,
        uint256 timeCanGetInterest,
        bool retrieved,
        bool isLendEther
    );

    event LoanPayback(
        address indexed borrower,
        uint256 paybackAmount,
        uint256 collateralAmount,
        uint256 paybackTime
    );

    event LendWithdraw(
        address indexed lender,
        uint256 withdrawAmount,
        bool isEarnInterest,
        bool isWithdrawEther
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier loanExists(uint256 _loanId) {
        require(_loanId < loans.length, "Loan does not exist");
        _;
    }

    modifier lendExists(uint256 _lendId) {
        require(_lendId < lends.length, "Lend does not exist");
        _;
    }

    modifier onlyBorrower(uint256 _loanId) {
        require(
            msg.sender == loans[_loanId].borrower,
            "Only borrower can call this function"
        );
        _;
    }

    modifier onlyLender(uint256 _lendId) {
        require(
            msg.sender == lends[_lendId].lender,
            "Only lender can call this function"
        );
        _;
    }

    modifier loanNotPaid(uint256 _loanId) {
        require(!loans[_loanId].isPayback, "Loan already paid back");
        _;
    }

    modifier lendNotRetrieved(uint256 _lendId) {
        require(!lends[_lendId].retrieved, "Lend already retrieved");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function initializeLiquidity() external payable onlyOwner {
        require(msg.value > 0, "Liquidity must be greater than 0");
        totalLiquidity = totalLiquidity.add(msg.value);
    }

    function createLoan(
        uint256 _loanAmount,
        uint256 _duration
    ) external payable {
        require(loanCount < MAX_LOAN_COUNT, "Maximum loan count reached");
        require(_loanAmount >= MIN_LOAN_AMOUNT, "Loan amount too small");
        require(
            _duration == LOAN_DURATION_7_DAYS ||
                _duration == LOAN_DURATION_14_DAYS ||
                _duration == LOAN_DURATION_30_DAYS,
            "Invalid loan duration"
        );

        uint256 collateralAmount = calculateCollateralAmount(_loanAmount);
        require(msg.value >= collateralAmount, "Insufficient collateral");

        uint256 paybackAmount = calculatePaybackAmount(_loanAmount, _duration);
        uint256 loanDueDate = block.timestamp.add(_duration);

        loans.push(
            LoanRequest(
                msg.sender,
                _loanAmount,
                collateralAmount,
                paybackAmount,
                loanDueDate,
                _duration,
                loanCount,
                false
            )
        );

        loanCount = loanCount.add(1);
        totalLiquidity = totalLiquidity.sub(_loanAmount);

        require(hasEnoughLiquidity(), "Not enough liquidity");

        payable(msg.sender).transfer(_loanAmount);

        emit NewLoan(
            msg.sender,
            _loanAmount,
            collateralAmount,
            paybackAmount,
            loanDueDate,
            _duration
        );
    }

    function createLend() external payable {
        require(lendCount < MAX_LEND_COUNT, "Maximum lend count reached");
        require(msg.value >= MIN_LEND_AMOUNT, "Lend amount too small");

        uint256 lendAmountToken = msg.value.mul(10 ** TOKEN_DECIMALS).div(
            ETH_PER_TOKEN
        );
        uint256 paybackAmountEther = msg.value.mul(INTEREST_RATE_LEND).div(100);
        uint256 paybackAmountToken = lendAmountToken
            .mul(INTEREST_RATE_LEND)
            .div(100);
        uint256 timeCanGetInterest = block.timestamp.add(MIN_LEND_DURATION);

        lends.push(
            LendRequest(
                msg.sender,
                lendCount,
                msg.value,
                lendAmountToken,
                paybackAmountEther,
                paybackAmountToken,
                block.timestamp,
                timeCanGetInterest,
                false,
                true
            )
        );

        lendCount = lendCount.add(1);
        totalLiquidity = totalLiquidity.add(msg.value);

        emit NewLend(
            msg.sender,
            msg.value,
            lendAmountToken,
            paybackAmountEther,
            paybackAmountToken,
            block.timestamp,
            timeCanGetInterest,
            false,
            true
        );
    }

    function paybackLoan(
        uint256 _loanId
    )
        external
        payable
        loanExists(_loanId)
        onlyBorrower(_loanId)
        loanNotPaid(_loanId)
    {
        LoanRequest storage loan = loans[_loanId];
        require(msg.value >= loan.paybackAmount, "Insufficient payback amount");

        loan.isPayback = true;
        totalLiquidity = totalLiquidity.add(loan.paybackAmount);

        if (block.timestamp <= loan.loanDueDate) {
            payable(loan.borrower).transfer(loan.collateralAmount);
        } else {
            payable(owner).transfer(loan.collateralAmount);
        }

        emit LoanPayback(
            loan.borrower,
            loan.paybackAmount,
            loan.collateralAmount,
            block.timestamp
        );
    }

    function withdrawLend(
        uint256 _lendId
    )
        external
        lendExists(_lendId)
        onlyLender(_lendId)
        lendNotRetrieved(_lendId)
    {
        LendRequest storage lend = lends[_lendId];
        lend.retrieved = true;

        bool isEarnInterest = block.timestamp >= lend.timeCanGetInterest;
        uint256 withdrawAmount = isEarnInterest
            ? lend.paybackAmountEther
            : lend.lendAmountEther;

        if (isEarnInterest) {
            totalLiquidity = totalLiquidity.sub(lend.paybackAmountEther);
        } else {
            totalLiquidity = totalLiquidity.sub(lend.lendAmountEther);
        }

        require(hasEnoughLiquidity(), "Not enough liquidity");

        payable(lend.lender).transfer(withdrawAmount);

        emit LendWithdraw(lend.lender, withdrawAmount, isEarnInterest, true);
    }

    function getUserLoans(
        address _user
    ) external view returns (LoanRequest[] memory) {
        uint256 userLoanCount = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _user) {
                userLoanCount++;
            }
        }

        LoanRequest[] memory userLoans = new LoanRequest[](userLoanCount);
        uint256 index = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _user) {
                userLoans[index] = loans[i];
                index++;
            }
        }

        return userLoans;
    }

    function getUserActiveLoans(
        address _user
    ) external view returns (LoanRequest[] memory) {
        uint256 userActiveLoanCount = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _user && !loans[i].isPayback) {
                userActiveLoanCount++;
            }
        }

        LoanRequest[] memory userActiveLoans = new LoanRequest[](
            userActiveLoanCount
        );
        uint256 index = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (loans[i].borrower == _user && !loans[i].isPayback) {
                userActiveLoans[index] = loans[i];
                index++;
            }
        }

        return userActiveLoans;
    }

    function getUserDefaultedLoans(
        address _user
    ) external view returns (LoanRequest[] memory) {
        uint256 userDefaultedLoanCount = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (
                loans[i].borrower == _user &&
                !loans[i].isPayback &&
                block.timestamp > loans[i].loanDueDate
            ) {
                userDefaultedLoanCount++;
            }
        }

        LoanRequest[] memory userDefaultedLoans = new LoanRequest[](
            userDefaultedLoanCount
        );
        uint256 index = 0;

        for (uint256 i = 0; i < loans.length; i++) {
            if (
                loans[i].borrower == _user &&
                !loans[i].isPayback &&
                block.timestamp > loans[i].loanDueDate
            ) {
                userDefaultedLoans[index] = loans[i];
                index++;
            }
        }

        return userDefaultedLoans;
    }

    function getUserLends(
        address _user
    ) external view returns (LendRequest[] memory) {
        uint256 userLendCount = 0;

        for (uint256 i = 0; i < lends.length; i++) {
            if (lends[i].lender == _user) {
                userLendCount++;
            }
        }

        LendRequest[] memory userLends = new LendRequest[](userLendCount);
        uint256 index = 0;

        for (uint256 i = 0; i < lends.length; i++) {
            if (lends[i].lender == _user) {
                userLends[index] = lends[i];
                index++;
            }
        }

        return userLends;
    }

    function getUserActiveLends(
        address _user
    ) external view returns (LendRequest[] memory) {
        uint256 userActiveLendCount = 0;

        for (uint256 i = 0; i < lends.length; i++) {
            if (lends[i].lender == _user && !lends[i].retrieved) {
                userActiveLendCount++;
            }
        }

        LendRequest[] memory userActiveLends = new LendRequest[](
            userActiveLendCount
        );
        uint256 index = 0;

        for (uint256 i = 0; i < lends.length; i++) {
            if (lends[i].lender == _user && !lends[i].retrieved) {
                userActiveLends[index] = lends[i];
                index++;
            }
        }

        return userActiveLends;
    }

    function calculateCollateralAmount(
        uint256 _loanAmount
    ) private pure returns (uint256) {
        return _loanAmount.mul(COLLATERAL_RATIO).div(100);
    }

    function calculatePaybackAmount(
        uint256 _loanAmount,
        uint256 _duration
    ) private pure returns (uint256) {
        if (_duration == LOAN_DURATION_7_DAYS) {
            return _loanAmount.mul(INTEREST_RATE_7_DAYS).div(100);
        } else if (_duration == LOAN_DURATION_14_DAYS) {
            return _loanAmount.mul(INTEREST_RATE_14_DAYS).div(100);
        } else if (_duration == LOAN_DURATION_30_DAYS) {
            return _loanAmount.mul(INTEREST_RATE_30_DAYS).div(100);
        } else {
            revert("Invalid loan duration");
        }
    }

    function hasEnoughLiquidity() private view returns (bool) {
        return totalLiquidity >= MIN_LOAN_AMOUNT;
    }
}
