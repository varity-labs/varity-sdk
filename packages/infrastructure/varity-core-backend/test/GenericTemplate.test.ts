import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { GenericTemplate } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GenericTemplate", function () {
  let genericTemplate: GenericTemplate;
  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let entityOwner: SignerWithAddress;
  let user: SignerWithAddress;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANAGER_ROLE"));
  const SYSTEM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SYSTEM_ROLE"));
  const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));

  beforeEach(async function () {
    [admin, manager, entityOwner, user] = await ethers.getSigners();

    const GenericTemplateFactory = await ethers.getContractFactory("GenericTemplate");
    genericTemplate = (await upgrades.deployProxy(
      GenericTemplateFactory,
      [admin.address],
      { initializer: "initialize" }
    )) as unknown as GenericTemplate;

    await genericTemplate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await genericTemplate.getAddress()).to.be.properAddress;
    });

    it("Should grant admin roles to deployer", async function () {
      expect(await genericTemplate.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await genericTemplate.hasRole(UPGRADER_ROLE, admin.address)).to.be.true;
    });

    it("Should not be paused after deployment", async function () {
      expect(await genericTemplate.paused()).to.be.false;
    });
  });

  describe("Company Configuration", function () {
    it("Should set company configuration", async function () {
      const companyId = ethers.keccak256(ethers.toUtf8Bytes("test-company"));
      const companyName = "Test Company";
      const industry = "iso";
      const entityType = "merchant";
      const managerType = "rep";
      const transactionType = "payment";
      const templateVersion = "1.0.0";

      await expect(
        genericTemplate.connect(admin).setCompanyConfig(
          companyId,
          companyName,
          industry,
          entityType,
          managerType,
          transactionType,
          templateVersion
        )
      ).to.emit(genericTemplate, "CompanyConfigured");

      const config = await genericTemplate.companyConfig();
      expect(config.companyId).to.equal(companyId);
      expect(config.companyName).to.equal(companyName);
      expect(config.industry).to.equal(industry);
      expect(config.entityType).to.equal(entityType);
      expect(config.managerType).to.equal(managerType);
      expect(config.transactionType).to.equal(transactionType);
      expect(config.isActive).to.be.true;
    });

    it("Should revert if non-admin tries to set config", async function () {
      const companyId = ethers.keccak256(ethers.toUtf8Bytes("test-company"));

      await expect(
        genericTemplate.connect(user).setCompanyConfig(
          companyId,
          "Test",
          "iso",
          "merchant",
          "rep",
          "payment",
          "1.0.0"
        )
      ).to.be.reverted;
    });
  });

  describe("Entity Registry", function () {
    let managerId: string;

    beforeEach(async function () {
      // First register a manager
      managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));
      await genericTemplate.connect(admin).grantRole(MANAGER_ROLE, manager.address);

      await genericTemplate.connect(admin).registerManager(
        managerId,
        manager.address,
        "Test Manager",
        "contact@test.com",
        1000 // 10% compensation rate
      );
    });

    it("Should register an entity", async function () {
      const entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));
      const entityName = "Test Entity";
      const metadata = JSON.stringify({ type: "test" });

      await expect(
        genericTemplate.connect(admin).registerEntity(
          entityId,
          entityOwner.address,
          entityName,
          managerId,
          metadata
        )
      ).to.emit(genericTemplate, "EntityRegistered")
        .withArgs(entityId, entityOwner.address, managerId);

      const entity = await genericTemplate.getEntity(entityId);
      expect(entity.entityId).to.equal(entityId);
      expect(entity.ownerAddress).to.equal(entityOwner.address);
      expect(entity.name).to.equal(entityName);
      expect(entity.assignedManagerId).to.equal(managerId);
      expect(entity.status).to.equal(0); // ACTIVE
    });

    it("Should update entity status", async function () {
      const entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));

      await genericTemplate.connect(admin).registerEntity(
        entityId,
        entityOwner.address,
        "Test Entity",
        managerId,
        "{}"
      );

      await expect(
        genericTemplate.connect(admin).updateEntityStatus(entityId, 2) // SUSPENDED
      ).to.emit(genericTemplate, "EntityStatusChanged")
        .withArgs(entityId, 2);

      const entity = await genericTemplate.getEntity(entityId);
      expect(entity.status).to.equal(2);
    });

    it("Should flag an entity", async function () {
      const entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));

      await genericTemplate.connect(admin).registerEntity(
        entityId,
        entityOwner.address,
        "Test Entity",
        managerId,
        "{}"
      );

      const flagReason = "Suspicious activity";
      await expect(
        genericTemplate.connect(admin).flagEntity(entityId, flagReason)
      ).to.emit(genericTemplate, "EntityFlagged")
        .withArgs(entityId, flagReason);

      const entity = await genericTemplate.getEntity(entityId);
      expect(entity.isFlagged).to.be.true;
      expect(entity.flagReason).to.equal(flagReason);
    });

    it("Should get entity count", async function () {
      expect(await genericTemplate.getEntityCount()).to.equal(0);

      const entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));
      await genericTemplate.connect(admin).registerEntity(
        entityId,
        entityOwner.address,
        "Test Entity",
        managerId,
        "{}"
      );

      expect(await genericTemplate.getEntityCount()).to.equal(1);
    });
  });

  describe("Manager Performance", function () {
    it("Should register a manager", async function () {
      const managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));
      const managerName = "Test Manager";
      const contactInfo = "contact@test.com";
      const compensationRate = 1000; // 10%

      await genericTemplate.connect(admin).grantRole(MANAGER_ROLE, manager.address);

      await expect(
        genericTemplate.connect(admin).registerManager(
          managerId,
          manager.address,
          managerName,
          contactInfo,
          compensationRate
        )
      ).to.emit(genericTemplate, "ManagerRegistered")
        .withArgs(managerId, manager.address, managerName);

      const managerData = await genericTemplate.getManager(managerId);
      expect(managerData.managerId).to.equal(managerId);
      expect(managerData.walletAddress).to.equal(manager.address);
      expect(managerData.name).to.equal(managerName);
      expect(managerData.status).to.equal(0); // ACTIVE
    });

    it("Should update manager status", async function () {
      const managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));

      await genericTemplate.connect(admin).grantRole(MANAGER_ROLE, manager.address);
      await genericTemplate.connect(admin).registerManager(
        managerId,
        manager.address,
        "Test Manager",
        "contact@test.com",
        1000
      );

      await expect(
        genericTemplate.connect(admin).updateManagerStatus(managerId, 3) // SUSPENDED
      ).to.emit(genericTemplate, "ManagerStatusChanged")
        .withArgs(managerId, 3);

      const managerData = await genericTemplate.getManager(managerId);
      expect(managerData.status).to.equal(3);
    });

    it("Should update compensation rate", async function () {
      const managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));

      await genericTemplate.connect(admin).grantRole(MANAGER_ROLE, manager.address);
      await genericTemplate.connect(admin).registerManager(
        managerId,
        manager.address,
        "Test Manager",
        "contact@test.com",
        1000
      );

      const newRate = 1500; // 15%
      await genericTemplate.connect(admin).updateCompensationRate(managerId, newRate);

      const managerData = await genericTemplate.getManager(managerId);
      expect(managerData.compensationRateBps).to.equal(newRate);
    });
  });

  describe("Transaction Vault", function () {
    let entityId: string;
    let managerId: string;

    beforeEach(async function () {
      // Setup manager
      managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));
      await genericTemplate.connect(admin).grantRole(MANAGER_ROLE, manager.address);
      await genericTemplate.connect(admin).registerManager(
        managerId,
        manager.address,
        "Test Manager",
        "contact@test.com",
        1000
      );

      // Setup entity
      entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));
      await genericTemplate.connect(admin).registerEntity(
        entityId,
        entityOwner.address,
        "Test Entity",
        managerId,
        "{}"
      );

      // Grant system role
      await genericTemplate.connect(admin).grantRole(SYSTEM_ROLE, admin.address);
    });

    it("Should record a transaction", async function () {
      const txId = ethers.keccak256(ethers.toUtf8Bytes("tx-1"));
      const amount = ethers.parseEther("100");
      const calculatedValue = ethers.parseEther("10");
      const txDate = Math.floor(Date.now() / 1000);

      await expect(
        genericTemplate.connect(admin).recordTransaction(
          txId,
          entityId,
          managerId,
          amount,
          calculatedValue,
          txDate,
          "{}"
        )
      ).to.emit(genericTemplate, "TransactionRecorded")
        .withArgs(txId, entityId, managerId, amount);

      expect(await genericTemplate.getTransactionCount()).to.equal(1);
    });

    it("Should record batch transactions", async function () {
      const tx1 = {
        transactionId: ethers.keccak256(ethers.toUtf8Bytes("tx-1")),
        entityId: entityId,
        managerId: managerId,
        amount: ethers.parseEther("100"),
        calculatedValue: ethers.parseEther("10"),
        transactionDate: Math.floor(Date.now() / 1000),
        metadata: "{}",
        batchId: ethers.ZeroHash
      };

      const tx2 = {
        transactionId: ethers.keccak256(ethers.toUtf8Bytes("tx-2")),
        entityId: entityId,
        managerId: managerId,
        amount: ethers.parseEther("200"),
        calculatedValue: ethers.parseEther("20"),
        transactionDate: Math.floor(Date.now() / 1000),
        metadata: "{}",
        batchId: ethers.ZeroHash
      };

      await expect(
        genericTemplate.connect(admin).recordBatchTransactions([tx1, tx2])
      ).to.emit(genericTemplate, "BatchTransactionsRecorded");

      expect(await genericTemplate.getTransactionCount()).to.equal(2);
    });
  });

  describe("Calculation Engine", function () {
    it("Should calculate value correctly", async function () {
      const amount = ethers.parseEther("100");
      const rateBps = 1000; // 10%
      const expectedValue = ethers.parseEther("10");

      const calculatedValue = await genericTemplate.calculateValue(amount, rateBps);
      expect(calculatedValue).to.equal(expectedValue);
    });

    it("Should calculate tiered value correctly", async function () {
      const amount = ethers.parseEther("100");

      const result = await genericTemplate.calculateTieredValue(
        amount,
        500,  // tier1Rate: 5%
        750,  // tier2Rate: 7.5%
        1000, // tier3Rate: 10%
        ethers.parseEther("50"),  // tier1Max
        ethers.parseEther("50")   // tier2Max
      );

      // First $50 at 5% = $2.50
      // Second $50 at 7.5% = $3.75
      // Total = $6.25
      const expected = ethers.parseEther("6.25");
      expect(result).to.equal(expected);
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause and unpause", async function () {
      await genericTemplate.connect(admin).pause();
      expect(await genericTemplate.paused()).to.be.true;

      await genericTemplate.connect(admin).unpause();
      expect(await genericTemplate.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await genericTemplate.connect(admin).pause();

      const entityId = ethers.keccak256(ethers.toUtf8Bytes("entity-1"));
      const managerId = ethers.keccak256(ethers.toUtf8Bytes("manager-1"));

      await expect(
        genericTemplate.connect(admin).registerEntity(
          entityId,
          entityOwner.address,
          "Test",
          managerId,
          "{}"
        )
      ).to.be.reverted;
    });

    it("Should only allow admin to pause", async function () {
      await expect(
        genericTemplate.connect(user).pause()
      ).to.be.reverted;
    });
  });

  describe("Dashboard Summary", function () {
    it("Should return dashboard summary", async function () {
      const summary = await genericTemplate.getDashboardSummary();

      expect(summary.totalEntities).to.equal(0);
      expect(summary.totalManagers).to.equal(0);
      expect(summary.totalTransactions).to.equal(0);
      expect(summary.totalVolume).to.equal(0);
      expect(summary.totalValue).to.equal(0);
    });
  });
});
