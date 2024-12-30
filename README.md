# Crypto Address Generator

A TypeScript utility for generating cryptocurrency addresses from a mnemonic phrase. This tool supports multiple address formats for different cryptocurrencies:

- Ethereum (ETH)
- Bitcoin (BTC)
  - Legacy (P2PKH)
  - SegWit (P2SH)
  - Native SegWit (Bech32)
  - Taproot (P2TR)
- Dogecoin (DOGE)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gen-web3-accounts
```

2. Install dependencies:
```bash
npm install
```

## Usage

You can use this tool in three different ways:

### 1. Generate Random Mnemonic

To generate a new random mnemonic and its corresponding addresses:
```bash
npm start
```

### 2. Use Existing Mnemonic from File

Create a file containing your 12 or 24 word mnemonic phrase, then pass the file path:
```bash
npm start ./mnemonic.txt
```

Example mnemonic.txt content:
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

### 3. Input Mnemonic Directly

You can also input the mnemonic phrase directly as a command line argument:
```bash
npm start "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
```

## Example Output

```
新生成的助记词: word1 word2 word3 ... word12

生成的地址：
以太坊: 0x...
比特币 Legacy: 1...
比特币 Taproot: bc1p...
比特币 P2SH: 3...
比特币 Bech32: bc1...
狗狗币: D...
```

## Security Notes

- Keep your mnemonic phrase secure and never share it with anyone
- Store your mnemonic phrase offline in a safe place
- This tool is for educational purposes only
- Be cautious when inputting mnemonics directly in the command line as they may be stored in your shell history

## License

MIT 