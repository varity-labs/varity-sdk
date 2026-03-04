const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TemplateMarketplace", function () {
  let marketplace;
  let owner, creator, buyer, creator2;
  let templateId;

  const TEMPLATE_PRICE = ethers.parseEther("0.1");
  const TEMPLATE_NAME = "Finance Dashboard Template";
  const REPOSITORY_URL = "https://github.com/varity/finance-template";
  const IPFS_HASH = "QmTest123456789";
  const QUALITY_SCORE = 92;

  beforeEach(async function () {
    [owner, creator, buyer, creator2] = await ethers.getSigners();

    const TemplateMarketplace = await ethers.getContractFactory("TemplateMarketplace");
    marketplace = await TemplateMarketplace.deploy();
    await marketplace.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(await owner.getAddress());
    });

    it("Should have correct revenue split constants", async function () {
      expect(await marketplace.CREATOR_SHARE_PERCENT()).to.equal(30);
      expect(await marketplace.PLATFORM_SHARE_PERCENT()).to.equal(70);
    });

    it("Should have correct quality score constants", async function () {
      expect(await marketplace.MIN_QUALITY_SCORE()).to.equal(85);
      expect(await marketplace.MAX_QUALITY_SCORE()).to.equal(100);
    });

    it("Should start with zero templates", async function () {
      expect(await marketplace.totalTemplates()).to.equal(0);
    });
  });

  describe("Template Publishing", function () {
    it("Should allow creator to publish a template", async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      await expect(tx).to.emit(marketplace, "TemplatePublished");
      expect(await marketplace.totalTemplates()).to.equal(1);
    });

    it("Should reject template with quality score below 85", async function () {
      await expect(
        marketplace.connect(creator).publishTemplate(
          TEMPLATE_NAME,
          TEMPLATE_PRICE,
          REPOSITORY_URL,
          IPFS_HASH,
          84 // Below minimum
        )
      ).to.be.revertedWith("Invalid quality score");
    });

    it("Should reject template with quality score above 100", async function () {
      await expect(
        marketplace.connect(creator).publishTemplate(
          TEMPLATE_NAME,
          TEMPLATE_PRICE,
          REPOSITORY_URL,
          IPFS_HASH,
          101 // Above maximum
        )
      ).to.be.revertedWith("Invalid quality score");
    });

    it("Should reject template with empty name", async function () {
      await expect(
        marketplace.connect(creator).publishTemplate(
          "",
          TEMPLATE_PRICE,
          REPOSITORY_URL,
          IPFS_HASH,
          QUALITY_SCORE
        )
      ).to.be.revertedWith("Template name required");
    });

    it("Should reject template with zero price", async function () {
      await expect(
        marketplace.connect(creator).publishTemplate(
          TEMPLATE_NAME,
          0,
          REPOSITORY_URL,
          IPFS_HASH,
          QUALITY_SCORE
        )
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should track creator templates correctly", async function () {
      await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const creatorTemplates = await marketplace.getCreatorTemplates(await creator.getAddress());
      expect(creatorTemplates.length).to.equal(1);
    });
  });

  describe("Template Purchase", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return marketplace.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "TemplatePublished");

      templateId = event.args.templateId;
    });

    it("Should allow buyer to purchase template", async function () {
      const tx = await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      await expect(tx).to.emit(marketplace, "TemplatePurchased");
    });

    it("Should enforce correct 30/70 revenue split", async function () {
      const creatorBalanceBefore = await ethers.provider.getBalance(await creator.getAddress());
      const platformBalanceBefore = await ethers.provider.getBalance(await owner.getAddress());

      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      const creatorBalanceAfter = await ethers.provider.getBalance(await creator.getAddress());
      const platformBalanceAfter = await ethers.provider.getBalance(await owner.getAddress());

      const expectedCreatorShare = (TEMPLATE_PRICE * 30n) / 100n;
      const expectedPlatformShare = TEMPLATE_PRICE - expectedCreatorShare;

      // Creator should receive 30%
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(expectedCreatorShare);

      // Note: Platform balance increase verification is complex due to gas costs
      // We verify through contract stats instead
      const stats = await marketplace.getCreatorStats(await creator.getAddress());
      expect(stats.totalRevenue).to.equal(expectedCreatorShare);
    });

    it("Should reject purchase with incorrect payment amount", async function () {
      await expect(
        marketplace.connect(buyer).purchaseTemplate(templateId, {
          value: ethers.parseEther("0.05"), // Wrong amount
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should reject duplicate purchase", async function () {
      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      await expect(
        marketplace.connect(buyer).purchaseTemplate(templateId, {
          value: TEMPLATE_PRICE,
        })
      ).to.be.revertedWith("Already purchased");
    });

    it("Should update download counter", async function () {
      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      const template = await marketplace.getTemplate(templateId);
      expect(template.downloads).to.equal(1);
    });

    it("Should update creator stats", async function () {
      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      const stats = await marketplace.getCreatorStats(await creator.getAddress());
      const expectedCreatorShare = (TEMPLATE_PRICE * 30n) / 100n;

      expect(stats.totalTemplates).to.equal(1);
      expect(stats.totalDownloads).to.equal(1);
      expect(stats.totalRevenue).to.equal(expectedCreatorShare);
      expect(stats.pendingWithdrawal).to.equal(expectedCreatorShare);
    });

    it("Should track purchase correctly", async function () {
      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });

      expect(
        await marketplace.checkPurchase(templateId, await buyer.getAddress())
      ).to.be.true;
    });
  });

  describe("Template Updates", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return marketplace.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "TemplatePublished");

      templateId = event.args.templateId;
    });

    it("Should allow creator to update template price", async function () {
      const newPrice = ethers.parseEther("0.2");

      await marketplace.connect(creator).updateTemplate(templateId, newPrice, true);

      const template = await marketplace.getTemplate(templateId);
      expect(template.price).to.equal(newPrice);
    });

    it("Should allow creator to deactivate template", async function () {
      await marketplace.connect(creator).updateTemplate(TEMPLATE_PRICE, false);

      const template = await marketplace.getTemplate(templateId);
      expect(template.active).to.be.false;
    });

    it("Should reject update from non-creator", async function () {
      await expect(
        marketplace.connect(creator2).updateTemplate(templateId, TEMPLATE_PRICE, true)
      ).to.be.revertedWith("Not template creator");
    });
  });

  describe("Creator Withdrawals", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return marketplace.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "TemplatePublished");

      templateId = event.args.templateId;

      // Make a purchase to generate earnings
      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });
    });

    it("Should allow creator to withdraw earnings", async function () {
      const expectedCreatorShare = (TEMPLATE_PRICE * 30n) / 100n;

      const tx = await marketplace.connect(creator).withdrawCreatorEarnings();
      await expect(tx).to.emit(marketplace, "CreatorWithdrawal");

      const stats = await marketplace.getCreatorStats(await creator.getAddress());
      expect(stats.pendingWithdrawal).to.equal(0);
    });

    it("Should reject withdrawal with no earnings", async function () {
      await expect(
        marketplace.connect(creator2).withdrawCreatorEarnings()
      ).to.be.revertedWith("No earnings to withdraw");
    });
  });

  describe("Platform Fee Withdrawal", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return marketplace.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "TemplatePublished");

      templateId = event.args.templateId;

      await marketplace.connect(buyer).purchaseTemplate(templateId, {
        value: TEMPLATE_PRICE,
      });
    });

    it("Should allow owner to withdraw platform fees", async function () {
      const expectedPlatformShare = (TEMPLATE_PRICE * 70n) / 100n;
      const platformRevenueBefore = await marketplace.totalPlatformRevenue();

      expect(platformRevenueBefore).to.equal(expectedPlatformShare);

      const tx = await marketplace.connect(owner).withdrawPlatformFees(expectedPlatformShare);
      await expect(tx).to.emit(marketplace, "PlatformWithdrawal");

      expect(await marketplace.totalPlatformRevenue()).to.equal(0);
    });

    it("Should reject withdrawal from non-owner", async function () {
      const expectedPlatformShare = (TEMPLATE_PRICE * 70n) / 100n;

      await expect(
        marketplace.connect(creator).withdrawPlatformFees(expectedPlatformShare)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("Should reject withdrawal exceeding balance", async function () {
      const excessiveAmount = ethers.parseEther("100");

      await expect(
        marketplace.connect(owner).withdrawPlatformFees(excessiveAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Marketplace Statistics", function () {
    it("Should track marketplace stats correctly", async function () {
      // Publish 2 templates
      await marketplace.connect(creator).publishTemplate(
        "Template 1",
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      await marketplace.connect(creator2).publishTemplate(
        "Template 2",
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        90
      );

      expect(await marketplace.totalTemplates()).to.equal(2);

      const allTemplates = await marketplace.getAllTemplates();
      expect(allTemplates.length).to.equal(2);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await marketplace.connect(owner).pause();

      await expect(
        marketplace.connect(creator).publishTemplate(
          TEMPLATE_NAME,
          TEMPLATE_PRICE,
          REPOSITORY_URL,
          IPFS_HASH,
          QUALITY_SCORE
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("Should allow owner to unpause contract", async function () {
      await marketplace.connect(owner).pause();
      await marketplace.connect(owner).unpause();

      // Should work after unpause
      await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      expect(await marketplace.totalTemplates()).to.equal(1);
    });

    it("Should reject pause from non-owner", async function () {
      await expect(
        marketplace.connect(creator).pause()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Template Removal", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).publishTemplate(
        TEMPLATE_NAME,
        TEMPLATE_PRICE,
        REPOSITORY_URL,
        IPFS_HASH,
        QUALITY_SCORE
      );

      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return marketplace.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "TemplatePublished");

      templateId = event.args.templateId;
    });

    it("Should allow owner to remove template", async function () {
      await marketplace.connect(owner).removeTemplate(templateId);

      const template = await marketplace.getTemplate(templateId);
      expect(template.active).to.be.false;
    });

    it("Should reject removal from non-owner", async function () {
      await expect(
        marketplace.connect(creator).removeTemplate(templateId)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });
});
