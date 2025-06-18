// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DeFiPassportNFT
 * @notice NFT that represents a user's DeFi credit profile and reputation
 * @dev Dynamic NFT with updatable metadata based on user's credit score and activity
 */
contract DeFiPassportNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Custom errors
    error PassportAlreadyExists();
    error PassportDoesNotExist();
    error NotPassportOwner();
    error InvalidCreditScore();
    error NotAuthorizedUpdater();
    error ZeroAddress();

    // Events
    event PassportMinted(address indexed user, uint256 indexed tokenId, uint256 creditScore);
    event PassportUpdated(address indexed user, uint256 indexed tokenId, uint256 newCreditScore);
    event CreditScoreUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);

    // State variables
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from user address to token ID
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => bool) public tokenExists;
    
    // Passport data
    mapping(uint256 => PassportData) public passportData;
    
    // Authorized updaters (MainRouter, credit scoring contracts)
    mapping(address => bool) public authorizedUpdaters;
    
    // Credit level thresholds
    uint256 public constant BRONZE_THRESHOLD = 300;
    uint256 public constant SILVER_THRESHOLD = 500;
    uint256 public constant GOLD_THRESHOLD = 700;
    uint256 public constant PLATINUM_THRESHOLD = 850;

    struct PassportData {
        uint256 creditScore;
        uint256 totalTransactions;
        uint256 totalVolumeUSD;
        uint256 protocolsUsed;
        uint256 liquidationCount;
        uint256 governanceParticipation;
        uint256 mintTimestamp;
        uint256 lastUpdateTimestamp;
        CreditLevel level;
        bool isActive;
    }

    enum CreditLevel {
        BRONZE,    // 0-499
        SILVER,    // 500-699
        GOLD,      // 700-849
        PLATINUM   // 850-1000
    }

    modifier onlyPassportOwner(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotPassportOwner();
        }
        _;
    }

    modifier onlyAuthorizedUpdater() {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedUpdater();
        }
        _;
    }

    modifier validCreditScore(uint256 score) {
        if (score > 1000) {
            revert InvalidCreditScore();
        }
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _mainRouter
    ) ERC721(name, symbol) Ownable() {
        if (_mainRouter != address(0)) {
            authorizedUpdaters[_mainRouter] = true;
            emit UpdaterAuthorized(_mainRouter);
        }
    }

    /**
     * @notice Mint a new DeFi Passport NFT for a user
     * @param user The user to mint the passport for
     * @param creditScore Initial credit score
     * @param totalTransactions Total number of DeFi transactions
     * @param totalVolumeUSD Total volume in USD
     * @param protocolsUsed Number of different protocols used
     */
    function mintPassport(
        address user,
        uint256 creditScore,
        uint256 totalTransactions,
        uint256 totalVolumeUSD,
        uint256 protocolsUsed
    ) external onlyAuthorizedUpdater validCreditScore(creditScore) {
        if (user == address(0)) revert ZeroAddress();
        if (userToTokenId[user] != 0) revert PassportAlreadyExists();

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Mint NFT to user
        _safeMint(user, tokenId);

        // Set up passport data
        passportData[tokenId] = PassportData({
            creditScore: creditScore,
            totalTransactions: totalTransactions,
            totalVolumeUSD: totalVolumeUSD,
            protocolsUsed: protocolsUsed,
            liquidationCount: 0,
            governanceParticipation: 0,
            mintTimestamp: block.timestamp,
            lastUpdateTimestamp: block.timestamp,
            level: _calculateCreditLevel(creditScore),
            isActive: true
        });

        // Map user to token ID
        userToTokenId[user] = tokenId;
        tokenExists[tokenId] = true;

        // Set initial token URI
        _setTokenURI(tokenId, _generateTokenURI(tokenId));

        emit PassportMinted(user, tokenId, creditScore);
    }

    /**
     * @notice Update passport data for a user
     * @param user The user whose passport to update
     * @param newCreditScore New credit score
     * @param totalTransactions Updated total transactions
     * @param totalVolumeUSD Updated total volume
     * @param protocolsUsed Updated protocols used count
     * @param liquidationCount Number of liquidations
     * @param governanceParticipation Governance participation score
     */
    function updatePassport(
        address user,
        uint256 newCreditScore,
        uint256 totalTransactions,
        uint256 totalVolumeUSD,
        uint256 protocolsUsed,
        uint256 liquidationCount,
        uint256 governanceParticipation
    ) external onlyAuthorizedUpdater validCreditScore(newCreditScore) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert PassportDoesNotExist();

        PassportData storage passport = passportData[tokenId];
        uint256 oldScore = passport.creditScore;

        // Update passport data
        passport.creditScore = newCreditScore;
        passport.totalTransactions = totalTransactions;
        passport.totalVolumeUSD = totalVolumeUSD;
        passport.protocolsUsed = protocolsUsed;
        passport.liquidationCount = liquidationCount;
        passport.governanceParticipation = governanceParticipation;
        passport.lastUpdateTimestamp = block.timestamp;
        passport.level = _calculateCreditLevel(newCreditScore);

        // Update token URI with new data
        _setTokenURI(tokenId, _generateTokenURI(tokenId));

        emit PassportUpdated(user, tokenId, newCreditScore);
        emit CreditScoreUpdated(tokenId, oldScore, newCreditScore);
    }

    /**
     * @notice Update only the credit score for a user
     * @param user The user whose credit score to update
     * @param newCreditScore New credit score
     */
    function updateCreditScore(
        address user,
        uint256 newCreditScore
    ) external onlyAuthorizedUpdater validCreditScore(newCreditScore) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert PassportDoesNotExist();

        PassportData storage passport = passportData[tokenId];
        uint256 oldScore = passport.creditScore;

        passport.creditScore = newCreditScore;
        passport.lastUpdateTimestamp = block.timestamp;
        passport.level = _calculateCreditLevel(newCreditScore);

        // Update token URI
        _setTokenURI(tokenId, _generateTokenURI(tokenId));

        emit CreditScoreUpdated(tokenId, oldScore, newCreditScore);
    }

    /**
     * @notice Authorize an address to update passport data
     * @param updater Address to authorize
     */
    function authorizeUpdater(address updater) external onlyOwner {
        if (updater == address(0)) revert ZeroAddress();
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater);
    }

    /**
     * @notice Revoke update authorization from an address
     * @param updater Address to revoke authorization from
     */
    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRevoked(updater);
    }

    /**
     * @notice Generate dynamic token URI based on passport data
     * @param tokenId Token ID to generate URI for
     * @return Base64 encoded JSON metadata
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        PassportData memory passport = passportData[tokenId];
        
        string memory levelName = _getLevelName(passport.level);
        string memory levelColor = _getLevelColor(passport.level);
        
        // Create JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "DeFi Passport #', tokenId.toString(),
            '", "description": "Your DeFi credit profile and reputation on-chain",',
            '"image": "', _generateSVG(tokenId), '",',
            '"attributes": [',
                '{"trait_type": "Credit Score", "value": ', passport.creditScore.toString(), '},',
                '{"trait_type": "Credit Level", "value": "', levelName, '"},',
                '{"trait_type": "Total Transactions", "value": ', passport.totalTransactions.toString(), '},',
                '{"trait_type": "Total Volume USD", "value": ', passport.totalVolumeUSD.toString(), '},',
                '{"trait_type": "Protocols Used", "value": ', passport.protocolsUsed.toString(), '},',
                '{"trait_type": "Liquidation Count", "value": ', passport.liquidationCount.toString(), '},',
                '{"trait_type": "Governance Participation", "value": ', passport.governanceParticipation.toString(), '},',
                '{"trait_type": "Mint Timestamp", "value": ', passport.mintTimestamp.toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice Generate SVG image for the passport
     * @param tokenId Token ID to generate SVG for
     * @return Base64 encoded SVG
     */
    function _generateSVG(uint256 tokenId) internal view returns (string memory) {
        PassportData memory passport = passportData[tokenId];
        string memory levelColor = _getLevelColor(passport.level);
        string memory levelName = _getLevelName(passport.level);

        string memory svg = string(abi.encodePacked(
            '<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />',
                '</linearGradient>',
                '<linearGradient id="level" x1="0%" y1="0%" x2="100%" y2="0%">',
                    '<stop offset="0%" style="stop-color:', levelColor, ';stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:', levelColor, ';stop-opacity:0.6" />',
                '</linearGradient>',
            '</defs>',
            '<rect width="400" height="600" fill="url(#bg)" rx="20"/>',
            '<rect x="20" y="20" width="360" height="80" fill="url(#level)" rx="10"/>',
            '<text x="200" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">DeFi Passport</text>',
            '<text x="200" y="70" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">#', tokenId.toString(), '</text>',
            '<text x="40" y="140" fill="white" font-family="Arial" font-size="18" font-weight="bold">Credit Score</text>',
            '<text x="360" y="140" text-anchor="end" fill="', levelColor, '" font-family="Arial" font-size="24" font-weight="bold">', passport.creditScore.toString(), '</text>',
            '<text x="40" y="180" fill="white" font-family="Arial" font-size="18" font-weight="bold">Level</text>',
            '<text x="360" y="180" text-anchor="end" fill="', levelColor, '" font-family="Arial" font-size="18" font-weight="bold">', levelName, '</text>',
            '<line x1="40" y1="200" x2="360" y2="200" stroke="#374151" stroke-width="1"/>',
            '<text x="40" y="240" fill="#9CA3AF" font-family="Arial" font-size="14">Transactions: ', passport.totalTransactions.toString(), '</text>',
            '<text x="40" y="270" fill="#9CA3AF" font-family="Arial" font-size="14">Volume: $', _formatNumber(passport.totalVolumeUSD), '</text>',
            '<text x="40" y="300" fill="#9CA3AF" font-family="Arial" font-size="14">Protocols: ', passport.protocolsUsed.toString(), '</text>',
            '<text x="40" y="330" fill="#9CA3AF" font-family="Arial" font-size="14">Liquidations: ', passport.liquidationCount.toString(), '</text>',
            '</svg>'
        ));

        return string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        ));
    }

    function _calculateCreditLevel(uint256 creditScore) internal pure returns (CreditLevel) {
        if (creditScore >= PLATINUM_THRESHOLD) return CreditLevel.PLATINUM;
        if (creditScore >= GOLD_THRESHOLD) return CreditLevel.GOLD;
        if (creditScore >= SILVER_THRESHOLD) return CreditLevel.SILVER;
        return CreditLevel.BRONZE;
    }

    function _getLevelName(CreditLevel level) internal pure returns (string memory) {
        if (level == CreditLevel.PLATINUM) return "Platinum";
        if (level == CreditLevel.GOLD) return "Gold";
        if (level == CreditLevel.SILVER) return "Silver";
        return "Bronze";
    }

    function _getLevelColor(CreditLevel level) internal pure returns (string memory) {
        if (level == CreditLevel.PLATINUM) return "#E5E7EB";
        if (level == CreditLevel.GOLD) return "#FCD34D";
        if (level == CreditLevel.SILVER) return "#9CA3AF";
        return "#CD7F32";
    }

    function _formatNumber(uint256 number) internal pure returns (string memory) {
        if (number >= 1e9) return string(abi.encodePacked((number / 1e9).toString(), "B"));
        if (number >= 1e6) return string(abi.encodePacked((number / 1e6).toString(), "M"));
        if (number >= 1e3) return string(abi.encodePacked((number / 1e3).toString(), "K"));
        return number.toString();
    }

    // View functions
    function getUserPassport(address user) external view returns (PassportData memory) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert PassportDoesNotExist();
        return passportData[tokenId];
    }

    function hasPassport(address user) external view returns (bool) {
        return userToTokenId[user] != 0;
    }

    function getUserTokenId(address user) external view returns (uint256) {
        return userToTokenId[user];
    }

    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Prevent transfers to maintain passport integrity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting and burning, but prevent transfers
        require(from == address(0) || to == address(0), "DeFi Passports are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}