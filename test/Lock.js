const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OceanToken", function () {
  let OceanToken, oceanToken, owner, addr1, addr2, miner;

  beforeEach(async () => {
    OceanToken = await ethers.getContractFactory("OceanToken");
    [owner, addr1, addr2, miner, _] = await ethers.getSigners();
    oceanToken = await OceanToken.deploy(ethers.utils.parseEther("1000000"), ethers.utils.parseEther("50"));
    await oceanToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await oceanToken.owner()).to.equal(owner.address);
    });

    it("Should mint initial supply to the owner", async function () {
      const ownerBalance = await oceanToken.balanceOf(owner.address);
      expect(await oceanToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await oceanToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        oceanToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await oceanToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await oceanToken.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await oceanToken.transfer(addr1.address, ethers.utils.parseEther("100"));

      // Transfer another 50 tokens from owner to addr2.
      await oceanToken.transfer(addr2.address, ethers.utils.parseEther("50"));

      // Check balances.
      const finalOwnerBalance = await oceanToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(ethers.utils.parseEther("150")));

      const addr1Balance = await oceanToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));

      const addr2Balance = await oceanToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should allow owner to set block reward", async function () {
      await oceanToken.setBlockReward(ethers.utils.parseEther("100"));
      expect(await oceanToken.blockReward()).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should not allow non-owners to set block reward", async function () {
      await expect(
        oceanToken.connect(addr1).setBlockReward(ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Only the owner can call this function");
    });

   
    it("Should allow owner to destroy contract", async function () {
      await oceanToken.destroy();
      expect(await ethers.provider.getCode(oceanToken.address)).to.equal('0x');
    });
  });
});
