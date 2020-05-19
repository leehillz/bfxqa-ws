# bfxqa-ws
---
### Websocket automation tests
#### Mocha, Chai & JavaScript
---
#### Installation
1. Clone the repo & open a console pointing to the directory
2. Run Node Package Manager install: npm i
3. Install mocha: npm install mocha -g
4. Run tests: mocha <testfile.js> Example: mocha Auth/ExchangeOrder.js
---
#### Test Account Configuration
Running the tests requires a full-permission API secret.

Once the repository has been cloned, open the file config-template.json

Add all the requested credentials to this file, and rename the template to config.json

In order for some of the Auth tests to work, you will need BTC and USD funds available in your Exchange, Margin and Funding wallets, and USDt0 available in your Derivatives wallet.
