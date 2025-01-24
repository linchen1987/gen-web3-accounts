import HDKey from 'hdkey';
import { publicToAddress, toChecksumAddress } from '@ethereumjs/util';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as ecc from 'tiny-secp256k1';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
// Initialize the ECC library
bitcoin.initEccLib(ecc);

interface CryptoAddresses {
  ethereum?: string;
  ethereumPrivateKey?: string;
  bitcoinLegacy?: string;
  bitcoinP2sh?: string;
  bitcoinBech32?: string;
  bitcoinTaproot?: string;
  dogecoin?: string;
  solana?: string;
}

async function generateAddresses(mnemonicInput?: string): Promise<{ mnemonic: string; addresses: CryptoAddresses }> {
  let mnemonic: string;

  if (mnemonicInput) {
    // 检查输入是否是文件路径
    if (fs.existsSync(mnemonicInput)) {
      mnemonic = fs.readFileSync(mnemonicInput, 'utf-8').trim();
    } else {
      // 直接使用输入作为助记词
      mnemonic = mnemonicInput.trim();
    }
  } else {
    // 生成新的助记词
    const entropy = crypto.randomBytes(16); // 128 bits = 12 words
    mnemonic = bip39.entropyToMnemonic(entropy);
  }

  // 验证助记词
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }

  // 生成种子
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed);

  // 生成以太坊地址
  // 派生路径: m/44'/60'/0'/0/0
  const ethPath = "m/44'/60'/0'/0/0";
  const ethChild = hdkey.derive(ethPath);
  if (!ethChild.publicKey) {
    throw new Error('Failed to derive Ethereum public key');
  }
  const ethAddress = publicToAddress(ethChild.publicKey, true);
  const ethAddressHexWithout0x = Buffer.from(ethAddress).toString('hex');
  const ethereumAddress = toChecksumAddress('0x' + ethAddressHexWithout0x);
  const ethereumAddressPrivateKey = ethChild.privateKey?.toString('hex');

  // 生成比特币地址
  const bitcoinPathLegacy = "m/44'/0'/0'/0/0";
  const bitcoinChildLegacy = hdkey.derive(bitcoinPathLegacy);
  if (!bitcoinChildLegacy.publicKey) {
    throw new Error('Failed to derive Bitcoin Legacy public key');
  }
  const bitcoinAddressLegacy = bitcoin.payments.p2pkh({
    pubkey: bitcoinChildLegacy.publicKey,
    network: bitcoin.networks.bitcoin,
  }).address;

  // 生成比特币 Taproot 地址
  const bitcoinPathTaproot = "m/86'/0'/0'/0/0";
  const bitcoinChildTaproot = hdkey.derive(bitcoinPathTaproot);
  if (!bitcoinChildTaproot.publicKey) {
    throw new Error('Failed to derive Taproot public key');
  }
  const pubkey = Buffer.from(bitcoinChildTaproot.publicKey.slice(1, 33)); // Convert 33-byte public key to 32-byte x-only pubkey
  const bitcoinAddressTaproot = bitcoin.payments.p2tr({
    internalPubkey: pubkey,
    network: bitcoin.networks.bitcoin,
  }).address;

  // 生成比特币 P2SH 地址
  const bitcoinPathP2sh = "m/49'/0'/0'/0/0";
  const bitcoinChildP2sh = hdkey.derive(bitcoinPathP2sh);
  if (!bitcoinChildP2sh.publicKey) {
    throw new Error('Failed to derive P2SH public key');
  }
  const bitcoinAddressP2sh = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({
      pubkey: bitcoinChildP2sh.publicKey,
      network: bitcoin.networks.bitcoin,
    }),
    network: bitcoin.networks.bitcoin,
  }).address;

  // 生成比特币 Bech32 地址
  const bitcoinPathBech32 = "m/84'/0'/0'/0/0";
  const bitcoinChildBech32 = hdkey.derive(bitcoinPathBech32);
  if (!bitcoinChildBech32.publicKey) {
    throw new Error('Failed to derive Bech32 public key');
  }
  const bitcoinAddressBech32 = bitcoin.payments.p2wpkh({
    pubkey: bitcoinChildBech32.publicKey,
    network: bitcoin.networks.bitcoin,
  }).address;

  // 生成狗狗币地址
  // 派生路径: m/44'/3'/0'/0/0
  const dogePath = "m/44'/3'/0'/0/0";
  const dogeChild = hdkey.derive(dogePath);
  if (!dogeChild.publicKey) {
    throw new Error('Failed to derive Dogecoin public key');
  }
  const { address: dogecoinAddress } = bitcoin.payments.p2pkh({
    pubkey: dogeChild.publicKey,
    network: {
      messagePrefix: '\x19Dogecoin Signed Message:\n',
      bech32: 'dc',
      bip32: {
        public: 0x02facafd,
        private: 0x02fac398,
      },
      pubKeyHash: 0x1e,
      scriptHash: 0x16,
      wif: 0x9e,
    },
  });

  // 生成Solana地址
  const solanaPath = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(solanaPath, seed.toString('hex')).key;
  const keypair = Keypair.fromSeed(derivedSeed);
  const solanaAddress = keypair.publicKey.toBase58();

  return {
    mnemonic,
    addresses: {
      ethereum: ethereumAddress,
      ethereumPrivateKey: ethereumAddressPrivateKey,
      bitcoinLegacy: bitcoinAddressLegacy,
      bitcoinTaproot: bitcoinAddressTaproot,
      bitcoinP2sh: bitcoinAddressP2sh,
      bitcoinBech32: bitcoinAddressBech32,
      dogecoin: dogecoinAddress!,
      solana: solanaAddress,
    },
  };
}

// 命令行入口
async function main() {
  let mnemonicInput: string | undefined;

  if (process.argv.length >= 3) {
    mnemonicInput = process.argv[2];
  }

  try {
    const result = await generateAddresses(mnemonicInput);
    if (!mnemonicInput) {
      console.log('新生成的助记词:', result.mnemonic);
    } else if (fs.existsSync(mnemonicInput)) {
      console.log('从文件读取的助记词:', result.mnemonic);
    } else {
      console.log('使用的助记词:', result.mnemonic);
    }
    console.log('\n生成的地址：');
    console.log('以太坊:', result.addresses.ethereum);
    console.log('以太坊私钥:', result.addresses.ethereumPrivateKey);
    console.log('比特币 Legacy:', result.addresses.bitcoinLegacy);
    console.log('比特币 Taproot:', result.addresses.bitcoinTaproot);
    console.log('比特币 P2SH:', result.addresses.bitcoinP2sh);
    console.log('比特币 Bech32:', result.addresses.bitcoinBech32);
    console.log('狗狗币:', result.addresses.dogecoin);
    console.log('Solana:', result.addresses.solana);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateAddresses };
