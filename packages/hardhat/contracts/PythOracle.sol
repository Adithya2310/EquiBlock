// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract PriceFeed {
    IPyth pyth;
    bytes32 priceId;

    constructor(address _pyth, bytes32 _priceId) {
        pyth = IPyth(_pyth);
        priceId = _priceId;
    }

    // Get the current price
    function getPrice() public view returns (uint256) {
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 300);
        return uint256(int256(price.price));
    }

    // Update the price feed
    function updatePrice(bytes[] memory pythPriceUpdate) public payable {
        uint256 updateFee = pyth.getUpdateFee(pythPriceUpdate);
        pyth.updatePriceFeeds{value: updateFee}(pythPriceUpdate);
    }

    // Update the price feed and get the updated price
    function UpdateAndGetPrice(bytes[] memory pythPriceUpdate) public payable returns (uint256) {
        updatePrice(pythPriceUpdate);
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 300);

        // First convert to int256 to handle the negative case
        int256 fullPrice = int256(price.price);

        // Then convert to uint256 (after ensuring it's positive)
        require(fullPrice > 0, "Negative price");
        return uint256(fullPrice);
    }
}
