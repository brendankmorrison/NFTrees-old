// base imports
import React ,{useEffect, useState} from 'react';
import './App.css';
import NFTreeABI from './contracts/NFTree.json';
import MycoinABI from './contracts/Mycoin.json'; //test

// import packages
import Web3 from 'web3';
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
import MyImpact from './components/Pages/MyImpact';
import Emissions from './components/Pages/Emissions';
import About from './components/Pages/About';
import Footer from './components/Pages/Footer';
import ScrollToTop from './components/Pages/PageItems/ScrollToTop';

function App() {
  const[Currentaccount, setCurrentaccount] = useState("connect eth account.");
  const[Currentnetwork, setCurrentnetwork] = useState();
  const[NFTreeContract, setNFTreeContract] = useState();
  const[MycoinContract, setMycoinContract] = useState();
  const[isConnected, setIsConnected] = useState(false);
  const[isLoading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadWeb3();
    };

    // initialize web3 and load blockchain data
    load();

    if(window.ethereum){
      // reload on metamask accountsChanged event
      window.ethereum.on('accountsChanged', function (accounts) {
        load();
      });

      // reload on metamask networkChanged event
      window.ethereum.on('networkChanged', function (accounts) {
        load();
        //window.location.reload();
      });
    }

    setLoading(false);
  },[]);

  /* ethereum initialization functions */

  // detect ethereum browser 
  const loadWeb3 = async () => {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      loadBlockchainData();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      loadBlockchainData();
    } else {
      window.alert(
        'no ethereum wallet detected.'
      );
    }
  }

  const checkConnection = async () => {
    // fetch user eth account
    const accounts = await window.web3.eth.getAccounts();
    const account = accounts[0];
    // set current account to account[0] if unlocked
    if (account){
      setIsConnected(true);
      setCurrentaccount(account);
    }

    // get networkId, display error if networkId != 1 (ethereum mainnet)
    // 1337 local host
    const networkId = await window.web3.eth.net.getId()
    if(networkId !== 5777){
      setIsConnected(false);
      setCurrentaccount('wrong network');
      setCurrentnetwork(networkId);
    } else {
      setCurrentnetwork(networkId);
    }
  }

  const connectWallet = async () => {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'no ethereum wallet detected.'
      );
    }
    await checkConnection();
  }

  // load ethereum accounts, network, and smart contracts 
  const loadBlockchainData = async () => {
    // initialize web3
    const web3 = window.web3;
    
    // check
    await checkConnection();

    // get smart contracts
    const networkData = NFTreeABI.networks[await window.web3.eth.net.getId()];
    const networkData2 = MycoinABI.networks[await window.web3.eth.net.getId()];

    if(networkData){
      setNFTreeContract(await new web3.eth.Contract(NFTreeABI.abi, networkData.address));
      setMycoinContract(await new web3.eth.Contract(MycoinABI.abi, networkData2.address));
    }
  }

  /* smart contract interaction functions */

  const approveTokens = async (total) => {
    const contractAddress = NFTreeABI.networks[Currentnetwork].address;
    await MycoinContract.methods.approve(contractAddress, total).send({from: Currentaccount});
  }

  const mintToken = async () => {
    // call buyNFTree function
    await NFTreeContract.methods.buyNFTree('QmfUShAbxfXecoxySb9JiMH1Lb8URUw2Cse9Usj5vZmeej').send({from: Currentaccount, value: 10**18});
    //await NFTreeContract.methods.sendTo(Currentaccount).send({from: Currentaccount});
    console.log('contract balance', await NFTreeContract.methods.getContractBalance().call());
  }

  const searchAddress = async () => {
    // search only if eth address
    if(Currentaccount === 40){
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
    console.log('getToken');
    return(await NFTreeContract.methods.tokenURI(1).call());
    
  }

  const mint = async () => {
    await MycoinContract.methods.mint(Currentaccount).send({from: Currentaccount, value: 0});
    console.log(await MycoinContract.methods.totalSupply().call())
    console.log(await MycoinContract.methods.balanceOf(Currentaccount).call())

  }

  const balance = async () => {
    console.log(await MycoinContract.methods.balanceOf(Currentaccount).call())

  }

  const transfer = async () => {
    await MycoinContract.methods.transfer('0x2e5228Ab51087B6FFD54F63af375Ebb2d2094e3F', 10000).send({from: Currentaccount, value: 0});
    console.log(await MycoinContract.methods.balanceOf('0x2e5228Ab51087B6FFD54F63af375Ebb2d2094e3F').call())

  }

  return (
    <div className = 'App'>
      <Router>
        <Switch>
          
          <Route exact path= "/">
            <Landing/>
            <div className= 'home'>
              <Navbar account = {Currentaccount} connectWallet = {connectWallet}/>
              <Home/>
              <button onClick = {mint}> mint eth </button>
              <button onClick = {balance}> balance </button>
              <button onClick = {transfer}> transfer </button>
              <div className = 'space'></div>
              <Plant mintToken = {mintToken} isConnected = {isConnected} approveTokens = {approveTokens}/>
              <Footer />
            </div>
          </Route>

          <Route path="/myimpact">
            <div id = 'myImpactTop'></div>
            <ScrollToTop/>
            <div className= 'myimpact'>
              <Navbar account = {Currentaccount} connectWallet = {connectWallet}/>
              <MyImpact getToken = {getToken} searchAddress = {searchAddress} address = {Currentaccount}/>
              <div className = 'space'></div>
              <Emissions/>
              <Footer />
            </div>
          </Route>

          <Route path="/about">
            <ScrollToTop/>
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
