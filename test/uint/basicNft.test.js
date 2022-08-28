const { assert } = require("chai")
const { deployments, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft contracts", async function () {
          let basicNft
          beforeEach(async function () {
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft")
          })
          describe("Constructor Corretly!", async function () {
              it("Initilizes the NFT Correctly.", async function () {
                  const nftName = await basicNft.name()
                  const nftSymbol = await basicNft.symbol()
                  const nftCounter = await basicNft.getTokenCounter()
                  assert.equal(nftName, "Doggie")
                  assert.equal(nftSymbol, "DOG")
                  assert.equal(nftCounter, 0)
              })
          })
          describe("Mint Nft Function", async function () {
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tx = await basicNft.mintNft()
                  await tx.wait(1)
                  const tokenURI = await basicNft.tokenURI(0)
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
          })
      })
