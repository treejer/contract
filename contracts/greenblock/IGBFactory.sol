// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IGBFactory {

    event NewGBAdded(uint256 id, string title);
    event GBActivated(uint256 id);
    event PlanterJoinedGB(uint256 id, address planter);

    function greenBlocks(uint256 _index)
        external
        view
        returns (
            string memory,
            string memory,
            bool
        );

    function isGBFactory() external view returns (bool);

    function planterGB(address _address) external view returns (uint256);

    function gbToAmbassador(uint256 _gbId) external view returns (address);

    function gbToPlanters(uint256 _gbId, uint256 _index)
        external
        view
        returns (address);

    function ambassadorGBCount(address _address)
        external
        view
        returns (uint256);

    function ambassadorGBs(address _address, uint256 _index)
        external
        view
        returns (uint256);

    function getAmbassadorGBs(address _ambassador)
        external
        view
        returns (uint256[] memory);

    function getGBPlantersCount(uint256 _gbId) external view returns (uint256);

    function totalGB() external view returns (uint256);
}
