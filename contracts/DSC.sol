// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DSC (DeFi Stablecoin)
 * @notice The stablecoin token used for cross-chain borrowing in the CreditLend protocol
 * @dev ERC20 token with minting/burning capabilities, only mintable by authorized Minter contracts
 */
contract DSC is ERC20, ERC20Burnable, Ownable {
    // Custom errors
    error DSC__MustBeMoreThanZero();
    error DSC__BurnAmountExceedsBalance();
    error DSC__NotZeroAddress();
    error DSC__NotMinter();

    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount, address indexed burner);

    // State variables
    mapping(address => bool) public authorizedMinters;
    address[] public mintersList;
    
    // Constants
    uint8 private constant DECIMALS = 18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**DECIMALS; // 1 billion DSC max supply

    modifier onlyMinter() {
        if (!authorizedMinters[msg.sender]) {
            revert DSC__NotMinter();
        }
        _;
    }

    modifier moreThanZero(uint256 _amount) {
        if (_amount == 0) {
            revert DSC__MustBeMoreThanZero();
        }
        _;
    }

    modifier notZeroAddress(address _address) {
        if (_address == address(0)) {
            revert DSC__NotZeroAddress();
        }
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _initialMinter
    ) ERC20(_name, _symbol) Ownable() {
        if (_initialMinter != address(0)) {
            _addMinter(_initialMinter);
        }
    }

    /**
     * @notice Mint DSC tokens to a specified address
     * @param _to The address to mint tokens to
     * @param _amount The amount of tokens to mint
     * @dev Only authorized minters can call this function
     */
    function mint(
        address _to,
        uint256 _amount
    ) external onlyMinter notZeroAddress(_to) moreThanZero(_amount) {
        // Check max supply constraint
        require(totalSupply() + _amount <= MAX_SUPPLY, "DSC: Exceeds max supply");
        
        _mint(_to, _amount);
        
        emit TokensMinted(_to, _amount, msg.sender);
    }

    /**
     * @notice Burn DSC tokens from a specified address
     * @param _from The address to burn tokens from
     * @param _amount The amount of tokens to burn
     * @dev Only authorized minters can call this function
     */
    function burnFrom(
        address _from,
        uint256 _amount
    ) public override onlyMinter notZeroAddress(_from) moreThanZero(_amount) {
        uint256 currentBalance = balanceOf(_from);
        if (_amount > currentBalance) {
            revert DSC__BurnAmountExceedsBalance();
        }
        
        // Use the parent contract's burnFrom functionality
        super.burnFrom(_from, _amount);
        
        emit TokensBurned(_from, _amount, msg.sender);
    }

    /**
     * @notice Burn DSC tokens from caller's balance
     * @param _amount The amount of tokens to burn
     */
    function burn(uint256 _amount) public override moreThanZero(_amount) {
        uint256 currentBalance = balanceOf(msg.sender);
        if (_amount > currentBalance) {
            revert DSC__BurnAmountExceedsBalance();
        }
        
        super.burn(_amount);
        
        emit TokensBurned(msg.sender, _amount, msg.sender);
    }

    /**
     * @notice Add a new authorized minter
     * @param _minter The address to authorize as a minter
     */
    function addMinter(address _minter) external onlyOwner notZeroAddress(_minter) {
        _addMinter(_minter);
    }

    /**
     * @notice Remove an authorized minter
     * @param _minter The address to remove from authorized minters
     */
    function removeMinter(address _minter) external onlyOwner notZeroAddress(_minter) {
        require(authorizedMinters[_minter], "DSC: Address is not a minter");
        
        authorizedMinters[_minter] = false;
        
        // Remove from minters list
        for (uint256 i = 0; i < mintersList.length; i++) {
            if (mintersList[i] == _minter) {
                mintersList[i] = mintersList[mintersList.length - 1];
                mintersList.pop();
                break;
            }
        }
        
        emit MinterRemoved(_minter);
    }

    function _addMinter(address _minter) internal {
        require(!authorizedMinters[_minter], "DSC: Address is already a minter");
        
        authorizedMinters[_minter] = true;
        mintersList.push(_minter);
        
        emit MinterAdded(_minter);
    }

    // View functions
    function isMinter(address _address) external view returns (bool) {
        return authorizedMinters[_address];
    }

    function getMinters() external view returns (address[] memory) {
        return mintersList;
    }

    function getMintersCount() external view returns (uint256) {
        return mintersList.length;
    }

    /**
     * @notice Get token decimals
     * @return Number of decimals for the token
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Get remaining mintable supply
     * @return Amount of tokens that can still be minted
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @notice Check if minting amount would exceed max supply
     * @param _amount Amount to check
     * @return Whether the amount would exceed max supply
     */
    function wouldExceedMaxSupply(uint256 _amount) external view returns (bool) {
        return totalSupply() + _amount > MAX_SUPPLY;
    }

    // Override transfer functions to add additional checks if needed
    function transfer(address to, uint256 amount) public override notZeroAddress(to) returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override notZeroAddress(to) returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}