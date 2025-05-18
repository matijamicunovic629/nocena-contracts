// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MoodNftMarketplace
 * @notice NFT marketplace where users mint mood‑themed NFTs with a custom price and trade them.
 *         Each sale sends 20% of the payment to the admin (contract owner) and 80% to the seller.
 *         All purchases are made with Nocena Token (ERC20).
 */
contract MoodNftMarketplace is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    uint256 public constant ADMIN_FEE_PERCENT = 20; // 20% fee on every sale

    IERC20 public nocenaToken;

    struct MoodNFT {
        uint256 tokenId;
        string postId;
        string userName;
        string accountAddress; // pseudo‑account distinct from wallet address
        string moodType;
        string imageUri;       // direct link to the image (e.g., IPFS or HTTPS)
        uint256 price;         // listing price in Nocena tokens
        address owner;         // current owner wallet
        bool isListed;         // whether the NFT is listed for sale
    }

    // tokenId => MoodNFT metadata
    mapping(uint256 => MoodNFT) public moodNFTs;

    // pseudo accountAddress => array of tokenIds
    mapping(string => uint256[]) private accountAddressToTokenIds;

    // owner wallet => tokenIds sold
    mapping(address => uint256[]) private salesHistory;

    /* ========== EVENTS ========== */
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 price);
    event NFTPurchased(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price,
        uint256 adminFee
    );
    event NFTUnlisted(uint256 indexed tokenId);

    /* ========== CONSTRUCTOR ========== */
    constructor(address _nocenaToken) ERC721("Mood NFT", "MOOD") Ownable(msg.sender) {
        nocenaToken = IERC20(_nocenaToken);
    }

    /* ========== USER FUNCTIONS ========== */

    function mintMoodNFT(
        string memory postId,
        string memory userName,
        string memory accountAddress,
        string memory moodType,
        string memory imageUri,
        uint256 price
    ) external {
        require(price > 0, "Price must be greater than zero");

        uint256 newTokenId = _nextTokenId++;

        _mint(msg.sender, newTokenId);

        moodNFTs[newTokenId] = MoodNFT({
            tokenId: newTokenId,
            postId: postId,
            userName: userName,
            accountAddress: accountAddress,
            moodType: moodType,
            imageUri: imageUri,
            price: price,
            owner: msg.sender,
            isListed: true
        });

        accountAddressToTokenIds[accountAddress].push(newTokenId);

        emit NFTMinted(newTokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external {
        MoodNFT storage nft = moodNFTs[tokenId];
        require(nft.owner != address(0), "NFT does not exist");
        require(nft.isListed, "NFT is not listed for sale");
        require(msg.sender != nft.owner, "You already own this NFT");

        address previousOwner = nft.owner;
        uint256 price = nft.price;

        require(nocenaToken.transferFrom(msg.sender, address(this), price), "Token transfer failed");

        uint256 adminFee = (price * ADMIN_FEE_PERCENT) / 100;
        uint256 sellerProceeds = price - adminFee;

        nft.owner = msg.sender;
        nft.isListed = false;
        _transfer(previousOwner, msg.sender, tokenId);

        require(nocenaToken.transfer(owner(), adminFee), "Admin fee transfer failed");
        require(nocenaToken.transfer(previousOwner, sellerProceeds), "Proceeds transfer failed");

        salesHistory[previousOwner].push(tokenId);

        emit NFTPurchased(tokenId, previousOwner, msg.sender, price, adminFee);
    }

    /* ========== VIEW FUNCTIONS ========== */

    function getAllNFTs() external view returns (MoodNFT[] memory) {
        uint256 total = _nextTokenId - 1;
        MoodNFT[] memory items = new MoodNFT[](total);

        for (uint256 i = 0; i < total; i++) {
            items[i] = moodNFTs[i + 1];
        }
        return items;
    }

    function getNFTsByAccountAddress(string memory accountAddress) external view returns (MoodNFT[] memory) {
        uint256[] memory tokenIds = accountAddressToTokenIds[accountAddress];
        MoodNFT[] memory items = new MoodNFT[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            items[i] = moodNFTs[tokenIds[i]];
        }
        return items;
    }

    function getNFT(uint256 tokenId) external view returns (MoodNFT memory) {
        require(moodNFTs[tokenId].owner != address(0), "NFT does not exist");
        return moodNFTs[tokenId];
    }

    function getSaleHistory(address user) external view returns (uint256[] memory) {
        return salesHistory[user];
    }

    /* ========== OWNER/SELLER FUNCTIONS ========== */

    function updateNFTPrice(uint256 tokenId, uint256 newPrice) external {
        MoodNFT storage nft = moodNFTs[tokenId];
        require(msg.sender == nft.owner, "Only owner can update price");
        require(newPrice > 0, "Price must be greater than zero");
        nft.price = newPrice;
        nft.isListed = true;
    }

    function unlistNFT(uint256 tokenId) external {
        MoodNFT storage nft = moodNFTs[tokenId];
        require(msg.sender == nft.owner, "Only owner can unlist NFT");
        require(nft.isListed, "NFT is already unlisted");
        nft.isListed = false;
        emit NFTUnlisted(tokenId);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = nocenaToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(nocenaToken.transfer(owner(), balance), "Token withdraw failed");
    }
}
