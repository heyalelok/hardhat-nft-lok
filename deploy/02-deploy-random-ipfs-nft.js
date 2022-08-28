const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")
require("dotenv").config()

const imagesLocation = "./images/randomNft"

const metedataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_types: "cute",
            value: 100,
        },
    ],
}
const FUND_AMOUNT = "1000000000000000000000"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    // get the IPFS hashes of our images
    // 1. with our own ipfs node. https://docs.ipfs.io/
    // 2. Pinata https://www.pinata.cloud/
    // 3. nft storage https://nfts.storage/

    let tokenUris = [
        "ipfs://QmPm3gjRJpLNMrazkGXZCgcpb3CPyNqiSURpLU3ADCAEC6",
        "ipfs://QmT3NW9Ptb2vRR9hT9Hm2D4pih2aHuDacqpo13mYb3jrFZ",
        "ipfs://Qmf3c1qeGVQGnYm4oY8GULTP9LuaGdg4NnQdUZ4iCpm21f",
    ]
    let vrfCoordinatorV2MockAddress, subscriptionId

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReponse = await tx.wait(1)
        subscriptionId = txReponse.events[0].args.subId

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2MockAddress = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    log("-----------------")
    const args = [
        vrfCoordinatorV2MockAddress,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
    })
    log("-------------------------------")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    // store the image in ipfs
    const { responses: imageUploadResponses, files } = await storeImages(
        imagesLocation
    )
    for (imageUploadResponsesIndex in imageUploadResponses) {
        // create metadata
        // upload the metadata
        let tokenUriMetadata = { ...metedataTemplate }
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(
            ".png",
            ""
        )
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`uploading ${tokenUriMetadata.name}...`)
        // store the JSON to pinata / ipfs
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        )
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    // store the metadata in ipfs
    console.log("Token URIs Uploaded!")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "ipfs", "main"]
