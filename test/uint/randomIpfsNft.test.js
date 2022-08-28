const { assert, expect } = require("chai")
const { deployments, ethers } = require("hardhat")

describe("RandomIpfsNft Contracts", async function () {
    let randomIpfsNft, vrfCoordinatorV2Mock
    beforeEach(async function () {
        await deployments.fixture(["all"])
        randomIpfsNft = await ethers.getContract("RandomIpfsNft")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    })
    describe("Constructor Corretely", async function () {
        it("sets starting values correctly!", async function () {
            const dogUris = await randomIpfsNft.getDogTokenUris(0)
            assert(dogUris.includes("ipfs://"))
        })
    })
    describe("requestNft function", async function () {
        it("fails if payment isn't sent with the request", async function () {
            await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                "RandomIpfsNft__NeedMoreEthSent"
            )
        })
        it("emits an event and kicks off a random word request", async function () {
            const fee = await randomIpfsNft.getMintFee()
            await expect(randomIpfsNft.requestNft({ value: fee })).to.be.emit(
                randomIpfsNft,
                "NftRequested"
            )
        })
    })
    describe("fulfillRandomWords", () => {
        it("mints NFT after random number is returned", async function () {
            await new Promise(async (resolve, reject) => {
                randomIpfsNft.once("NftDogBreed", async () => {
                    const tokenUri = await randomIpfsNft.tokenURI("0")
                    const tokenCounter = await randomIpfsNft.getTokenCounter()

                    assert.equal(tokenUri.toString().includes("ipfs://"), true)
                    // assert.equal(tokenCounter, 1)
                    resolve()
                })

                const fee = await randomIpfsNft.getMintFee()
                const requestNftResponse = await randomIpfsNft.requestNft({
                    value: fee,
                })
                const requestNftReceipt = await requestNftResponse.wait(1)
                const requestId =
                    requestNftReceipt.events[1].args.requestId.toString()
                await vrfCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfsNft.address
                )
            })
        })
    })
})
