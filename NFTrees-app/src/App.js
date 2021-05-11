// base imports
import React ,{useEffect, useState} from 'react';
import './App.css';
import NFTreeABI from './contracts/NFTree.json';

// import packages
import Web3 from 'web3';
import {useTransition, animated} from 'react-spring';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

// import components
import Landing from './components/Pages/Landing';
import Navbar from './components/Navigation/Navbar';
import Home from './components/Pages/Home';
import Plant from './components/Pages/Plant';
import Wallet from './components/Pages/Wallet';
import About from './components/Pages/About';
import Footer from './components/Pages/Footer';

function App() {
  const[Currentaccount, setCurrentaccount] = useState("connect eth account.");
  const[Currentnetwork, setCurrentnetwork] = useState(0);
  const[NFTreeContract, setNFTreeContract] = useState();
  const[nextTokenId, setNextTokenId] = useState();
  const[isLoading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadWeb3();
      await loadBlockchainData();
    };

    // initialize web3 and load blockchain data
    load();

    setLoading(false);
  }, []);

  /* ethereum initialization functions */

  // detect ethereum browser 
  const loadWeb3 = async () => {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'no ethereum wallet detected.'
      );
    }
  };

  const connectWallet = async () => {
    console.log('ran')
    if(window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      const web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'no ethereum wallet detected.'
      );
    }

    // fetch user eth account
    const accounts = await window.web3.eth.getAccounts();
    const account = accounts[0];
    // set current account to account[0] if unlocked
    if (account){
      setCurrentaccount(account);
    }
  }

  // load ethereum accounts, network, and smart contracts 
  const loadBlockchainData = async () => {
    // initialize web3
    const web3 = window.web3;
    
    // fetch user eth account
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    // set current account to account[0] if unlocked
    if (account){
      setCurrentaccount(account);
    }

    // get networkId, display error if networkId != 1 (ethereum mainnet)
    // 1337 local host
    const networkId = await web3.eth.net.getId();
    if(networkId != 5777){
      setCurrentaccount('wrong network');
      setCurrentnetwork(networkId);
    }

    // get smart contracts
    const networkData = NFTreeABI.networks[networkId];
    if(networkData){
      
      setNFTreeContract(await new web3.eth.Contract(NFTreeABI.abi, networkData.address));

      /* do not know why i need to do this */
      let contract = await new web3.eth.Contract(NFTreeABI.abi, networkData.address);
      setNextTokenId(await contract.methods.getNextTokenId().call());
    }else{
      window.alert('Contract Not Deployed')
    }
    console.log('loadbcdata');
  }

  /* smart contract interaction functions */

  const mintToken = async () => {
    // get next metadata hash

    // call buyNFTree function
    await NFTreeContract.methods.buyNFTree('QmfUShAbxfXecoxySb9JiMH1Lb8URUw2Cse9Usj5vZmeej').send({from: Currentaccount, value: 10**18});
    //await NFTreeContract.methods.sendTo(Currentaccount).send({from: Currentaccount});
    console.log('contract balance', await NFTreeContract.methods.getContractBalance().call());

    // if transaction went through mark metadata hash as used

    // update next token id
    setNextTokenId(await NFTreeContract.methods.getNextTokenId().call());
  }

  const searchAddress = async () => {
    // search only if eth address
    if(Currentaccount == 40){
      let tokens = [];
      let balance = 0;
      balance = await NFTreeContract.methods.balanceOf(Currentaccount).call();
      if(balance >= 1){
        tokens = await NFTreeContract.methods.tokensOfOwner(Currentaccount).call();
      } else {
        //alert('This address does not own any NFTrees.');
      }
      return(tokens);
    } else {
      return []
    }
  }

  const getToken = async (tokenId) => {
    //fetch(await NFTreeContract.methods.tokenURI(1).call())
      //.then(response => response.json())
      //.then(data => console.log(data));
    console.log('getToken');
    return(await NFTreeContract.methods.tokenURI(1).call());
    
  }

  return (
    <div className = 'App'>
      <Router>
        {/* display navbar */}
        {/*<Navbar account = {Currentaccount} connectWallet = {connectWallet}/>*/}

        {/* depending on url display home, gallery, or about page */}
        <Switch>
          <Route exact path= "/">
          <Landing/>
            <div id = 'homePage' className= 'home'>
              <Navbar account = {Currentaccount} connectWallet = {connectWallet}/>
              <Home mintToken = {mintToken} nextTokenId = {nextTokenId}/>
              <Plant/>
              <Footer />
            </div>
          </Route>
          <Route path="/wallet">
            <Navbar account = {Currentaccount} connectWallet = {connectWallet}/>
            <Wallet getToken = {getToken} searchAddress = {searchAddress}/>
            <Footer />
          </Route>
          <Route path="/about">
            <Navbar account = {Currentaccount} connectWallet = {connectWallet}/>
            <About />
            <Footer />
          </Route>
        </Switch>
      </Router>
    </div>

  );
}

export default App;
