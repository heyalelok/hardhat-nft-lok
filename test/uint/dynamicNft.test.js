const { assert, expect } = require("chai")
const { deployments, ethers } = require("hardhat")

describe("DynamicNft Contract", async function () {
    let dynamicSvgNft, mockV3Aggreator
    beforeEach(async function () {
        await deployments.fixture(["all"])
        dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
        mockV3Aggreator = await ethers.getContract("MockV3Aggregator")
    })
    describe("Constructor correctly", async function () {
        it("sets starting values correctly", async function () {
            const lowSVG = await dynamicSvgNft.getLowSVG()
            const highSVG = await dynamicSvgNft.getHighSVG()
            const priceFeed = await dynamicSvgNft.getPriceFeed()
            assert(lowSVG.includes("data:image/svg+html;base64,"))
            assert(highSVG.includes("data:image/svg+html;base64,"))
            assert.equal(priceFeed, mockV3Aggreator.address)
        })
    })
    describe("mintNFT function correctyly", async function () {
        it("emits an event and creates the NFT", async function () {
            const highValue = ethers.utils.parseEther("0.1")
            await expect(dynamicSvgNft.mintNFT(highValue)).to.emit(
                dynamicSvgNft,
                "CreatedNFT"
            )

            const tokenCounter = await dynamicSvgNft.getTokenCounter()
            assert.equal(tokenCounter.toString(), "1")
        })
        it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
            const lowValue = ethers.utils.parseEther("100000000")
            const txResponse = await dynamicSvgNft.mintNFT(lowValue)
            await txResponse.wait(1)
            const tokenURI = await dynamicSvgNft.tokenURI(0)
        })
    })
})
