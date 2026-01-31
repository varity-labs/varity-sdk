// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IResidualCalculator
 * @notice Interface for the ResidualCalculator contract
 */
interface IResidualCalculator {
    // Enums
    enum CalculationMethod {
        Fixed,
        Tiered,
        Dynamic,
        Custom
    }

    enum FeeType {
        Transaction,
        Monthly,
        Annual,
        OneTime
    }

    // Structs
    struct ResidualConfig {
        uint256 baseRate;
        uint256 volumeTier1;
        uint256 volumeTier2;
        uint256 tier1Rate;
        uint256 tier2Rate;
        uint256 tier3Rate;
        CalculationMethod method;
        bool isActive;
    }

    struct ResidualResult {
        uint256 grossResidual;
        uint256 netResidual;
        uint256 appliedRate;
        uint256 tier;
        uint256 repCommission;
        uint256 systemFee;
    }

    struct MerchantFeeStructure {
        bytes32 merchantId;
        uint256 baseRate;
        uint256 customRate;
        FeeType feeType;
        uint256 minFee;
        uint256 maxFee;
        bool hasCustomRate;
        uint256 effectiveDate;
    }

    struct CalculationAudit {
        bytes32 transactionId;
        bytes32 merchantId;
        uint256 transactionAmount;
        uint256 calculatedResidual;
        uint256 appliedRate;
        address calculator;
        uint256 timestamp;
    }

    // Functions
    function calculateResidual(
        uint256 _transactionAmount,
        bytes32 _merchantId,
        bytes32 _repId
    ) external view returns (ResidualResult memory);

    function calculateBatchResiduals(
        uint256[] calldata _amounts,
        bytes32[] calldata _merchantIds,
        bytes32[] calldata _repIds
    ) external view returns (ResidualResult[] memory);

    function setResidualConfig(ResidualConfig calldata _config) external;

    function setMerchantFeeStructure(
        bytes32 _merchantId,
        MerchantFeeStructure calldata _feeStructure
    ) external;

    function updateBaseRate(uint256 _newRate) external;

    function updateTierRates(
        uint256 _tier1Rate,
        uint256 _tier2Rate,
        uint256 _tier3Rate
    ) external;

    function updateVolumeTiers(
        uint256 _tier1Volume,
        uint256 _tier2Volume
    ) external;

    function getResidualConfig() external view returns (ResidualConfig memory);

    function getMerchantFeeStructure(
        bytes32 _merchantId
    ) external view returns (MerchantFeeStructure memory);

    function getEffectiveRate(
        bytes32 _merchantId,
        uint256 _volume
    ) external view returns (uint256);

    function projectMonthlyResiduals(
        bytes32 _merchantId,
        uint256 _projectedVolume
    ) external view returns (uint256);

    function validateCalculation(
        uint256 _amount,
        uint256 _residual,
        bytes32 _merchantId
    ) external view returns (bool);

    function getCalculationAudit(
        bytes32 _transactionId
    ) external view returns (CalculationAudit memory);
}