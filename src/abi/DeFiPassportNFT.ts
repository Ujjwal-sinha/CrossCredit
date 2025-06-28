export const DeFiPassportNFT_ABI = [
  // Minimal ERC721 ABI + mint(address) function
  "function mint(address to) public returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
