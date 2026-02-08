"use strict";exports.id=12933,exports.ids=[12933],exports.modules={12933:(a,b,c)=>{c.r(b),c.d(b,{AppKitModal:()=>ce,W3mListWallet:()=>ck,W3mModal:()=>cd,W3mModalBase:()=>cc,W3mRouterContainer:()=>cn,W3mUsageExceededView:()=>cg});var d=c(88635),e=c(76657),f=c(53343),g=c(4010),h=c(86256),i=c(98224),j=c(83559),k=c(99636),l=c(55907),m=c(17404),n=c(43081);let o={isUnsupportedChainView:()=>"UnsupportedChain"===l.I.state.view||"SwitchNetwork"===l.I.state.view&&l.I.state.history.includes("UnsupportedChain"),async safeClose(){if(this.isUnsupportedChainView()||await n.U.isSIWXCloseDisabled())return void h.W.shake();("DataCapture"===l.I.state.view||"DataCaptureOtpConfirm"===l.I.state.view)&&m.x.disconnect(),h.W.close()}};var p=c(35297),q=c(35570),r=c(55641),s=c(70986),t=c(91123),u=c(13812),v=c(55708),w=c(39161),x=c(65137),y=c(91187),z=c(79421),A=c(45229);let B={getGasPriceInEther:(a,b)=>Number(b*a)/1e18,getGasPriceInUSD(a,b,c){let d=B.getGasPriceInEther(b,c);return t.S.bigNumber(a).times(d).toNumber()},getPriceImpact({sourceTokenAmount:a,sourceTokenPriceInUSD:b,toTokenPriceInUSD:c,toTokenAmount:d}){let e=t.S.bigNumber(a).times(b),f=t.S.bigNumber(d).times(c);return e.minus(f).div(e).times(100).toNumber()},getMaxSlippage(a,b){let c=t.S.bigNumber(a).div(100);return t.S.multiply(b,c).toNumber()},getProviderFee:(a,b=.0085)=>t.S.bigNumber(a).times(b).toString(),isInsufficientNetworkTokenForGas:(a,b)=>!!t.S.bigNumber(a).eq(0)||t.S.bigNumber(t.S.bigNumber(b||"0")).gt(a),isInsufficientSourceTokenForSwap(a,b,c){let d=c?.find(a=>a.address===b)?.quantity?.numeric;return t.S.bigNumber(d||"0").lt(a)}};var C=c(8677),D=c(74582),E=c(21082),F=c(32611);let G={initializing:!1,initialized:!1,loadingPrices:!1,loadingQuote:!1,loadingApprovalTransaction:!1,loadingBuildTransaction:!1,loadingTransaction:!1,switchingTokens:!1,fetchError:!1,approvalTransaction:void 0,swapTransaction:void 0,transactionError:void 0,sourceToken:void 0,sourceTokenAmount:"",sourceTokenPriceInUSD:0,toToken:void 0,toTokenAmount:"",toTokenPriceInUSD:0,networkPrice:"0",networkBalanceInUSD:"0",networkTokenSymbol:"",inputError:void 0,slippage:y.oU.CONVERT_SLIPPAGE_TOLERANCE,tokens:void 0,popularTokens:void 0,suggestedTokens:void 0,foundTokens:void 0,myTokensWithBalance:void 0,tokensPriceMap:{},gasFee:"0",gasPriceInUSD:0,priceImpact:void 0,maxSlippage:void 0,providerFee:void 0},H=(0,r.BX)({...G}),I={state:H,subscribe:a=>(0,r.B1)(H,()=>a(H)),subscribeKey:(a,b)=>(0,s.u$)(H,a,b),getParams(){let a=i.W.state.activeChain,b=i.W.getAccountData(a)?.caipAddress??i.W.state.activeCaipAddress,c=z.w.getPlainAddress(b),d=(0,x.K1)(),e=j.a.getConnectorId(i.W.state.activeChain);if(!c)throw Error("No address found to swap the tokens from.");let f=!H.toToken?.address||!H.toToken?.decimals,g=!H.sourceToken?.address||!H.sourceToken?.decimals||!t.S.bigNumber(H.sourceTokenAmount).gt(0),h=!H.sourceTokenAmount;return{networkAddress:d,fromAddress:c,fromCaipAddress:b,sourceTokenAddress:H.sourceToken?.address,toTokenAddress:H.toToken?.address,toTokenAmount:H.toTokenAmount,toTokenDecimals:H.toToken?.decimals,sourceTokenAmount:H.sourceTokenAmount,sourceTokenDecimals:H.sourceToken?.decimals,invalidToToken:f,invalidSourceToken:g,invalidSourceTokenAmount:h,availableToSwap:b&&!f&&!g&&!h,isAuthConnector:e===u.o.CONNECTOR_ID.AUTH}},async setSourceToken(a){if(!a){H.sourceToken=a,H.sourceTokenAmount="",H.sourceTokenPriceInUSD=0;return}H.sourceToken=a,await J.setTokenPrice(a.address,"sourceToken")},setSourceTokenAmount(a){H.sourceTokenAmount=a},async setToToken(a){if(!a){H.toToken=a,H.toTokenAmount="",H.toTokenPriceInUSD=0;return}H.toToken=a,await J.setTokenPrice(a.address,"toToken")},setToTokenAmount(a){H.toTokenAmount=a?t.S.toFixed(a,6):""},async setTokenPrice(a,b){let c=H.tokensPriceMap[a]||0;c||(H.loadingPrices=!0,c=await J.getAddressPrice(a)),"sourceToken"===b?H.sourceTokenPriceInUSD=c:"toToken"===b&&(H.toTokenPriceInUSD=c),H.loadingPrices&&(H.loadingPrices=!1),J.getParams().availableToSwap&&!H.switchingTokens&&J.swapTokens()},async switchTokens(){if(!H.initializing&&H.initialized&&!H.switchingTokens){H.switchingTokens=!0;try{let a=H.toToken?{...H.toToken}:void 0,b=H.sourceToken?{...H.sourceToken}:void 0,c=a&&""===H.toTokenAmount?"1":H.toTokenAmount;J.setSourceTokenAmount(c),J.setToTokenAmount(""),await J.setSourceToken(a),await J.setToToken(b),H.switchingTokens=!1,J.swapTokens()}catch(a){throw H.switchingTokens=!1,a}}},resetState(){H.myTokensWithBalance=G.myTokensWithBalance,H.tokensPriceMap=G.tokensPriceMap,H.initialized=G.initialized,H.initializing=G.initializing,H.switchingTokens=G.switchingTokens,H.sourceToken=G.sourceToken,H.sourceTokenAmount=G.sourceTokenAmount,H.sourceTokenPriceInUSD=G.sourceTokenPriceInUSD,H.toToken=G.toToken,H.toTokenAmount=G.toTokenAmount,H.toTokenPriceInUSD=G.toTokenPriceInUSD,H.networkPrice=G.networkPrice,H.networkTokenSymbol=G.networkTokenSymbol,H.networkBalanceInUSD=G.networkBalanceInUSD,H.inputError=G.inputError},resetValues(){let{networkAddress:a}=J.getParams(),b=H.tokens?.find(b=>b.address===a);J.setSourceToken(b),J.setToToken(void 0)},getApprovalLoadingState:()=>H.loadingApprovalTransaction,clearError(){H.transactionError=void 0},async initializeState(){if(!H.initializing){if(H.initializing=!0,!H.initialized)try{await J.fetchTokens(),H.initialized=!0}catch(a){H.initialized=!1,q.P.showError("Failed to initialize swap"),l.I.goBack()}H.initializing=!1}},async fetchTokens(){let{networkAddress:a}=J.getParams();await J.getNetworkTokenPrice(),await J.getMyTokensWithBalance();let b=H.myTokensWithBalance?.find(b=>b.address===a);b&&(H.networkTokenSymbol=b.symbol,J.setSourceToken(b),J.setSourceTokenAmount("0"))},async getTokenList(){let a=i.W.state.activeCaipNetwork?.caipNetworkId;if(H.caipNetworkId!==a||!H.tokens)try{H.tokensLoading=!0;let b=await A.s.getTokenList(a);H.tokens=b,H.caipNetworkId=a,H.popularTokens=b.sort((a,b)=>a.symbol<b.symbol?-1:+(a.symbol>b.symbol));let c=(a&&y.oU.SUGGESTED_TOKENS_BY_CHAIN?.[a]||[]).map(a=>b.find(b=>b.symbol===a)).filter(a=>!!a),d=(y.oU.SWAP_SUGGESTED_TOKENS||[]).map(a=>b.find(b=>b.symbol===a)).filter(a=>!!a).filter(a=>!c.some(b=>b.address===a.address));H.suggestedTokens=[...c,...d]}catch(a){H.tokens=[],H.popularTokens=[],H.suggestedTokens=[]}finally{H.tokensLoading=!1}},async getAddressPrice(a){let b=H.tokensPriceMap[a];if(b)return b;let c=await E.T.fetchTokenPrice({addresses:[a]}),d=c?.fungibles||[],e=[...H.tokens||[],...H.myTokensWithBalance||[]],f=e?.find(b=>b.address===a)?.symbol,g=parseFloat((d.find(a=>a.symbol.toLowerCase()===f?.toLowerCase())?.price||0).toString());return H.tokensPriceMap[a]=g,g},async getNetworkTokenPrice(){let{networkAddress:a}=J.getParams(),b=await E.T.fetchTokenPrice({addresses:[a]}).catch(()=>(q.P.showError("Failed to fetch network token price"),{fungibles:[]})),c=b.fungibles?.[0],d=c?.price.toString()||"0";H.tokensPriceMap[a]=parseFloat(d),H.networkTokenSymbol=c?.symbol||"",H.networkPrice=d},async getMyTokensWithBalance(a){let b=await w.Z.getMyTokensWithBalance({forceUpdate:a,caipNetwork:i.W.state.activeCaipNetwork,address:i.W.getAccountData()?.address}),c=A.s.mapBalancesToSwapTokens(b);c&&(await J.getInitialGasPrice(),J.setBalances(c))},setBalances(a){let{networkAddress:b}=J.getParams(),c=i.W.state.activeCaipNetwork;if(!c)return;let d=a.find(a=>a.address===b);a.forEach(a=>{H.tokensPriceMap[a.address]=a.price||0}),H.myTokensWithBalance=a.filter(a=>a.address.startsWith(c.caipNetworkId)),H.networkBalanceInUSD=d?t.S.multiply(d.quantity.numeric,d.price).toString():"0"},async getInitialGasPrice(){let a=await A.s.fetchGasPrice();if(!a)return{gasPrice:null,gasPriceInUSD:null};switch(i.W.state?.activeCaipNetwork?.chainNamespace){case u.o.CHAIN.SOLANA:return H.gasFee=a.standard??"0",H.gasPriceInUSD=t.S.multiply(a.standard,H.networkPrice).div(1e9).toNumber(),{gasPrice:BigInt(H.gasFee),gasPriceInUSD:Number(H.gasPriceInUSD)};case u.o.CHAIN.EVM:default:let b=a.standard??"0",c=BigInt(b),d=BigInt(15e4),e=B.getGasPriceInUSD(H.networkPrice,d,c);return H.gasFee=b,H.gasPriceInUSD=e,{gasPrice:c,gasPriceInUSD:e}}},async swapTokens(){let a=i.W.getAccountData()?.address,b=H.sourceToken,c=H.toToken,d=t.S.bigNumber(H.sourceTokenAmount).gt(0);if(d||J.setToTokenAmount(""),!c||!b||H.loadingPrices||!d||!a)return;H.loadingQuote=!0;let e=t.S.bigNumber(H.sourceTokenAmount).times(10**b.decimals).round(0).toFixed(0);try{let d=await E.T.fetchSwapQuote({userAddress:a,from:b.address,to:c.address,gasPrice:H.gasFee,amount:e.toString()});H.loadingQuote=!1;let f=d?.quotes?.[0]?.toAmount;if(!f)return void D.h.open({displayMessage:"Incorrect amount",debugMessage:"Please enter a valid amount"},"error");let g=t.S.bigNumber(f).div(10**c.decimals).toString();J.setToTokenAmount(g),J.hasInsufficientToken(H.sourceTokenAmount,b.address)?H.inputError="Insufficient balance":(H.inputError=void 0,J.setTransactionDetails())}catch(b){let a=await A.s.handleSwapError(b);H.loadingQuote=!1,H.inputError=a||"Insufficient balance"}},async getTransaction(){let{fromCaipAddress:a,availableToSwap:b}=J.getParams(),c=H.sourceToken,d=H.toToken;if(a&&b&&c&&d&&!H.loadingQuote)try{let b;return H.loadingBuildTransaction=!0,b=await A.s.fetchSwapAllowance({userAddress:a,tokenAddress:c.address,sourceTokenAmount:H.sourceTokenAmount,sourceTokenDecimals:c.decimals})?await J.createSwapTransaction():await J.createAllowanceTransaction(),H.loadingBuildTransaction=!1,H.fetchError=!1,b}catch(a){l.I.goBack(),q.P.showError("Failed to check allowance"),H.loadingBuildTransaction=!1,H.approvalTransaction=void 0,H.swapTransaction=void 0,H.fetchError=!0;return}},async createAllowanceTransaction(){let{fromCaipAddress:a,sourceTokenAddress:b,toTokenAddress:c}=J.getParams();if(a&&c){if(!b)throw Error("createAllowanceTransaction - No source token address found.");try{let d=await E.T.generateApproveCalldata({from:b,to:c,userAddress:a}),e=z.w.getPlainAddress(d.tx.from);if(!e)throw Error("SwapController:createAllowanceTransaction - address is required");let f={data:d.tx.data,to:e,gasPrice:BigInt(d.tx.eip155.gasPrice),value:BigInt(d.tx.value),toAmount:H.toTokenAmount};return H.swapTransaction=void 0,H.approvalTransaction={data:f.data,to:f.to,gasPrice:f.gasPrice,value:f.value,toAmount:f.toAmount},{data:f.data,to:f.to,gasPrice:f.gasPrice,value:f.value,toAmount:f.toAmount}}catch(a){l.I.goBack(),q.P.showError("Failed to create approval transaction"),H.approvalTransaction=void 0,H.swapTransaction=void 0,H.fetchError=!0;return}}},async createSwapTransaction(){let{networkAddress:a,fromCaipAddress:b,sourceTokenAmount:c}=J.getParams(),d=H.sourceToken,e=H.toToken;if(!b||!c||!d||!e)return;let f=m.x.parseUnits(c,d.decimals)?.toString();try{let c=await E.T.generateSwapCalldata({userAddress:b,from:d.address,to:e.address,amount:f,disableEstimate:!0}),g=d.address===a,h=BigInt(c.tx.eip155.gas),i=BigInt(c.tx.eip155.gasPrice),j=z.w.getPlainAddress(c.tx.to);if(!j)throw Error("SwapController:createSwapTransaction - address is required");let k={data:c.tx.data,to:j,gas:h,gasPrice:i,value:g?BigInt(f??"0"):BigInt("0"),toAmount:H.toTokenAmount};return H.gasPriceInUSD=B.getGasPriceInUSD(H.networkPrice,h,i),H.approvalTransaction=void 0,H.swapTransaction=k,k}catch(a){l.I.goBack(),q.P.showError("Failed to create transaction"),H.approvalTransaction=void 0,H.swapTransaction=void 0,H.fetchError=!0;return}},onEmbeddedWalletApprovalSuccess(){q.P.showLoading("Approve limit increase in your wallet"),l.I.replace("SwapPreview")},async sendTransactionForApproval(a){let{fromAddress:b,isAuthConnector:c}=J.getParams();H.loadingApprovalTransaction=!0,c?l.I.pushTransactionStack({onSuccess:J.onEmbeddedWalletApprovalSuccess}):q.P.showLoading("Approve limit increase in your wallet");try{await m.x.sendTransaction({address:b,to:a.to,data:a.data,value:a.value,chainNamespace:u.o.CHAIN.EVM}),await J.swapTokens(),await J.getTransaction(),H.approvalTransaction=void 0,H.loadingApprovalTransaction=!1}catch(a){H.transactionError=a?.displayMessage,H.loadingApprovalTransaction=!1,q.P.showError(a?.displayMessage||"Transaction error"),F.E.sendEvent({type:"track",event:"SWAP_APPROVAL_ERROR",properties:{message:a?.displayMessage||a?.message||"Unknown",network:i.W.state.activeCaipNetwork?.caipNetworkId||"",swapFromToken:J.state.sourceToken?.symbol||"",swapToToken:J.state.toToken?.symbol||"",swapFromAmount:J.state.sourceTokenAmount||"",swapToAmount:J.state.toTokenAmount||"",isSmartAccount:(0,x.lj)(u.o.CHAIN.EVM)===v.Vl.ACCOUNT_TYPES.SMART_ACCOUNT}})}},async sendTransactionForSwap(a){if(!a)return;let{fromAddress:b,toTokenAmount:c,isAuthConnector:d}=J.getParams();H.loadingTransaction=!0;let e=`Swapping ${H.sourceToken?.symbol} to ${t.S.formatNumberToLocalString(c,3)} ${H.toToken?.symbol}`,f=`Swapped ${H.sourceToken?.symbol} to ${t.S.formatNumberToLocalString(c,3)} ${H.toToken?.symbol}`;d?l.I.pushTransactionStack({onSuccess(){l.I.replace("Account"),q.P.showLoading(e),I.resetState()}}):q.P.showLoading("Confirm transaction in your wallet");try{let c=[H.sourceToken?.address,H.toToken?.address].join(","),e=await m.x.sendTransaction({address:b,to:a.to,data:a.data,value:a.value,chainNamespace:u.o.CHAIN.EVM});return H.loadingTransaction=!1,q.P.showSuccess(f),F.E.sendEvent({type:"track",event:"SWAP_SUCCESS",properties:{network:i.W.state.activeCaipNetwork?.caipNetworkId||"",swapFromToken:J.state.sourceToken?.symbol||"",swapToToken:J.state.toToken?.symbol||"",swapFromAmount:J.state.sourceTokenAmount||"",swapToAmount:J.state.toTokenAmount||"",isSmartAccount:(0,x.lj)(u.o.CHAIN.EVM)===v.Vl.ACCOUNT_TYPES.SMART_ACCOUNT}}),I.resetState(),d||l.I.replace("Account"),I.getMyTokensWithBalance(c),e}catch(a){H.transactionError=a?.displayMessage,H.loadingTransaction=!1,q.P.showError(a?.displayMessage||"Transaction error"),F.E.sendEvent({type:"track",event:"SWAP_ERROR",properties:{message:a?.displayMessage||a?.message||"Unknown",network:i.W.state.activeCaipNetwork?.caipNetworkId||"",swapFromToken:J.state.sourceToken?.symbol||"",swapToToken:J.state.toToken?.symbol||"",swapFromAmount:J.state.sourceTokenAmount||"",swapToAmount:J.state.toTokenAmount||"",isSmartAccount:(0,x.lj)(u.o.CHAIN.EVM)===v.Vl.ACCOUNT_TYPES.SMART_ACCOUNT}});return}},hasInsufficientToken:(a,b)=>B.isInsufficientSourceTokenForSwap(a,b,H.myTokensWithBalance),setTransactionDetails(){let{toTokenAddress:a,toTokenDecimals:b}=J.getParams();a&&b&&(H.gasPriceInUSD=B.getGasPriceInUSD(H.networkPrice,BigInt(H.gasFee),BigInt(15e4)),H.priceImpact=B.getPriceImpact({sourceTokenAmount:H.sourceTokenAmount,sourceTokenPriceInUSD:H.sourceTokenPriceInUSD,toTokenPriceInUSD:H.toTokenPriceInUSD,toTokenAmount:H.toTokenAmount}),H.maxSlippage=B.getMaxSlippage(H.slippage,H.toTokenAmount),H.providerFee=B.getProviderFee(H.sourceTokenAmount))}},J=(0,C.X)(I);var K=c(31219),L=c(90872),M=c(71555),N=c(61396);let O=(0,N.AH)`
  :host {
    display: block;
    border-radius: clamp(0px, ${({borderRadius:a})=>a["8"]}, 44px);
    box-shadow: 0 0 0 1px ${({tokens:a})=>a.theme.foregroundPrimary};
    overflow: hidden;
  }
`,P=class extends d.WF{render(){return(0,d.qy)`<slot></slot>`}};P.styles=[L.W5,O],P=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g}([(0,M.E)("wui-card")],P),c(61225),c(60880),c(24101),c(92064);let Q=(0,N.AH)`
  :host {
    width: 100%;
  }

  :host > wui-flex {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({spacing:a})=>a[2]};
    padding: ${({spacing:a})=>a[3]};
    border-radius: ${({borderRadius:a})=>a[6]};
    border: 1px solid ${({tokens:a})=>a.theme.borderPrimary};
    box-sizing: border-box;
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
    color: ${({tokens:a})=>a.theme.textPrimary};
  }

  :host > wui-flex[data-type='info'] {
    .icon-box {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};

      wui-icon {
        color: ${({tokens:a})=>a.theme.iconDefault};
      }
    }
  }
  :host > wui-flex[data-type='success'] {
    .icon-box {
      background-color: ${({tokens:a})=>a.core.backgroundSuccess};

      wui-icon {
        color: ${({tokens:a})=>a.core.borderSuccess};
      }
    }
  }
  :host > wui-flex[data-type='warning'] {
    .icon-box {
      background-color: ${({tokens:a})=>a.core.backgroundWarning};

      wui-icon {
        color: ${({tokens:a})=>a.core.borderWarning};
      }
    }
  }
  :host > wui-flex[data-type='error'] {
    .icon-box {
      background-color: ${({tokens:a})=>a.core.backgroundError};

      wui-icon {
        color: ${({tokens:a})=>a.core.borderError};
      }
    }
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
    color: ${({tokens:a})=>a.theme.iconDefault};
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:a})=>a["2"]};
    background-color: var(--local-icon-bg-value);
  }
`;var R=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let S={info:"info",success:"checkmark",warning:"warningCircle",error:"warning"},T=class extends d.WF{constructor(){super(...arguments),this.message="",this.type="info"}render(){return(0,d.qy)`
      <wui-flex
        data-type=${(0,f.J)(this.type)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap="2"
      >
        <wui-flex columnGap="2" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color="inherit" size="md" name=${S[this.type]}></wui-icon>
          </wui-flex>
          <wui-text variant="md-medium" color="inherit" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="inherit"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){D.h.close()}};T.styles=[L.W5,Q],R([(0,e.MZ)()],T.prototype,"message",void 0),R([(0,e.MZ)()],T.prototype,"type",void 0),T=R([(0,M.E)("wui-alertbar")],T);let U=(0,K.AH)`
  :host {
    display: block;
    position: absolute;
    top: ${({spacing:a})=>a["3"]};
    left: ${({spacing:a})=>a["4"]};
    right: ${({spacing:a})=>a["4"]};
    opacity: 0;
    pointer-events: none;
  }
`;var V=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let W={info:{backgroundColor:"fg-350",iconColor:"fg-325",icon:"info"},success:{backgroundColor:"success-glass-reown-020",iconColor:"success-125",icon:"checkmark"},warning:{backgroundColor:"warning-glass-reown-020",iconColor:"warning-100",icon:"warningCircle"},error:{backgroundColor:"error-glass-reown-020",iconColor:"error-125",icon:"warning"}},X=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.open=D.h.state.open,this.onOpen(!0),this.unsubscribe.push(D.h.subscribeKey("open",a=>{this.open=a,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){let{message:a,variant:b}=D.h.state,c=W[b];return(0,d.qy)`
      <wui-alertbar
        message=${a}
        backgroundColor=${c?.backgroundColor}
        iconColor=${c?.iconColor}
        icon=${c?.icon}
        type=${b}
      ></wui-alertbar>
    `}onOpen(a){this.open?(this.animate([{opacity:0,transform:"scale(0.85)"},{opacity:1,transform:"scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: auto"):a||(this.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: none")}};X.styles=U,V([(0,e.wk)()],X.prototype,"open",void 0),X=V([(0,K.EM)("w3m-alertbar")],X);var Y=c(71680),Z=c(65136);let $=(0,N.AH)`
  :host {
    position: relative;
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    padding: ${({spacing:a})=>a[1]};
  }

  /* -- Colors --------------------------------------------------- */
  button[data-type='accent'] wui-icon {
    color: ${({tokens:a})=>a.core.iconAccentPrimary};
  }

  button[data-type='neutral'][data-variant='primary'] wui-icon {
    color: ${({tokens:a})=>a.theme.iconInverse};
  }

  button[data-type='neutral'][data-variant='secondary'] wui-icon {
    color: ${({tokens:a})=>a.theme.iconDefault};
  }

  button[data-type='success'] wui-icon {
    color: ${({tokens:a})=>a.core.iconSuccess};
  }

  button[data-type='error'] wui-icon {
    color: ${({tokens:a})=>a.core.iconError};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='xs'] {
    width: 16px;
    height: 16px;

    border-radius: ${({borderRadius:a})=>a[1]};
  }

  button[data-size='sm'] {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:a})=>a[1]};
  }

  button[data-size='md'] {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:a})=>a[2]};
  }

  button[data-size='lg'] {
    width: 28px;
    height: 28px;
    border-radius: ${({borderRadius:a})=>a[2]};
  }

  button[data-size='xs'] wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] wui-icon {
    width: 20px;
    height: 20px;
  }

  /* -- Hover --------------------------------------------------- */
  @media (hover: hover) {
    button[data-type='accent']:hover:enabled {
      background-color: ${({tokens:a})=>a.core.foregroundAccent010};
    }

    button[data-variant='primary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    }

    button[data-variant='secondary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    }

    button[data-type='success']:hover:enabled {
      background-color: ${({tokens:a})=>a.core.backgroundSuccess};
    }

    button[data-type='error']:hover:enabled {
      background-color: ${({tokens:a})=>a.core.backgroundError};
    }
  }

  /* -- Focus --------------------------------------------------- */
  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:a})=>a.core.foregroundAccent020};
  }

  /* -- Properties --------------------------------------------------- */
  button[data-full-width='true'] {
    width: 100%;
  }

  :host([fullWidth]) {
    width: 100%;
  }

  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var _=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let aa=class extends d.WF{constructor(){super(...arguments),this.icon="card",this.variant="primary",this.type="accent",this.size="md",this.iconSize=void 0,this.fullWidth=!1,this.disabled=!1}render(){return(0,d.qy)`<button
      data-variant=${this.variant}
      data-type=${this.type}
      data-size=${this.size}
      data-full-width=${this.fullWidth}
      ?disabled=${this.disabled}
    >
      <wui-icon color="inherit" name=${this.icon} size=${(0,f.J)(this.iconSize)}></wui-icon>
    </button>`}};aa.styles=[L.W5,L.fD,$],_([(0,e.MZ)()],aa.prototype,"icon",void 0),_([(0,e.MZ)()],aa.prototype,"variant",void 0),_([(0,e.MZ)()],aa.prototype,"type",void 0),_([(0,e.MZ)()],aa.prototype,"size",void 0),_([(0,e.MZ)()],aa.prototype,"iconSize",void 0),_([(0,e.MZ)({type:Boolean})],aa.prototype,"fullWidth",void 0),_([(0,e.MZ)({type:Boolean})],aa.prototype,"disabled",void 0),aa=_([(0,M.E)("wui-icon-button")],aa),c(470);let ab=(0,N.AH)`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: ${({spacing:a})=>a[1]};
    transition: background-color ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-2"]};
    will-change: background-color;
    border-radius: ${({borderRadius:a})=>a[32]};
  }

  wui-image {
    border-radius: 100%;
  }

  wui-text {
    padding-left: ${({spacing:a})=>a[1]};
  }

  .left-icon-container,
  .right-icon-container {
    width: 24px;
    height: 24px;
    justify-content: center;
    align-items: center;
  }

  wui-icon {
    color: ${({tokens:a})=>a.theme.iconDefault};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='lg'] {
    height: 32px;
  }

  button[data-size='md'] {
    height: 28px;
  }

  button[data-size='sm'] {
    height: 24px;
  }

  button[data-size='lg'] wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] wui-image {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] .left-icon-container {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] .left-icon-container {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] .left-icon-container {
    width: 16px;
    height: 16px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-type='filled-dropdown'] {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  button[data-type='text-dropdown'] {
    background-color: transparent;
  }

  /* -- Focus states --------------------------------------------------- */
  button:focus-visible:enabled {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    box-shadow: 0 0 0 4px ${({tokens:a})=>a.core.foregroundAccent040};
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    }
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    opacity: 0.5;
  }
`;var ac=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let ad={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},ae={lg:"lg",md:"md",sm:"sm"},af=class extends d.WF{constructor(){super(...arguments),this.imageSrc="",this.text="",this.size="lg",this.type="text-dropdown",this.disabled=!1}render(){return(0,d.qy)`<button ?disabled=${this.disabled} data-size=${this.size} data-type=${this.type}>
      ${this.imageTemplate()} ${this.textTemplate()}
      <wui-flex class="right-icon-container">
        <wui-icon name="chevronBottom"></wui-icon>
      </wui-flex>
    </button>`}textTemplate(){let a=ad[this.size];return this.text?(0,d.qy)`<wui-text color="primary" variant=${a}>${this.text}</wui-text>`:null}imageTemplate(){if(this.imageSrc)return(0,d.qy)`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`;let a=ae[this.size];return(0,d.qy)` <wui-flex class="left-icon-container">
      <wui-icon size=${a} name="networkPlaceholder"></wui-icon>
    </wui-flex>`}};af.styles=[L.W5,L.fD,ab],ac([(0,e.MZ)()],af.prototype,"imageSrc",void 0),ac([(0,e.MZ)()],af.prototype,"text",void 0),ac([(0,e.MZ)()],af.prototype,"size",void 0),ac([(0,e.MZ)()],af.prototype,"type",void 0),ac([(0,e.MZ)({type:Boolean})],af.prototype,"disabled",void 0),af=ac([(0,M.E)("wui-select")],af),c(55093),c(66594);let ag={ACCOUNT_TABS:[{label:"Tokens"},{label:"Activity"}],SECURE_SITE_ORIGIN:("undefined"!=typeof process&&void 0!==process.env?process.env.NEXT_PUBLIC_SECURE_SITE_ORIGIN:void 0)||"https://secure.walletconnect.org",VIEW_DIRECTION:{Next:"next",Prev:"prev"},ANIMATION_DURATIONS:{HeaderText:120,ModalHeight:150,ViewTransition:150},VIEWS_WITH_LEGAL_FOOTER:["Connect","ConnectWallets","OnRampTokenSelect","OnRampFiatSelect","OnRampProviders"],VIEWS_WITH_DEFAULT_FOOTER:["Networks"]};c(33354),c(74335);let ah=(0,N.AH)`
  button {
    background-color: transparent;
    padding: ${({spacing:a})=>a[1]};
  }

  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:a})=>a.core.foregroundAccent020};
  }

  button[data-variant='accent']:hover:enabled,
  button[data-variant='accent']:focus-visible {
    background-color: ${({tokens:a})=>a.core.foregroundAccent010};
  }

  button[data-variant='primary']:hover:enabled,
  button[data-variant='primary']:focus-visible,
  button[data-variant='secondary']:hover:enabled,
  button[data-variant='secondary']:focus-visible {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
  }

  button[data-size='xs'] > wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='xs'],
  button[data-size='sm'] {
    border-radius: ${({borderRadius:a})=>a[1]};
  }

  button[data-size='md'],
  button[data-size='lg'] {
    border-radius: ${({borderRadius:a})=>a[2]};
  }

  button[data-size='md'] > wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] > wui-icon {
    width: 20px;
    height: 20px;
  }

  button:disabled {
    background-color: transparent;
    cursor: not-allowed;
    opacity: 0.5;
  }

  button:hover:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
  }

  button:focus-visible:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
`;var ai=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let aj=class extends d.WF{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="default",this.variant="accent"}render(){return(0,d.qy)`
      <button data-variant=${this.variant} ?disabled=${this.disabled} data-size=${this.size}>
        <wui-icon
          color=${({accent:"accent-primary",primary:"inverse",secondary:"default"})[this.variant]||this.iconColor}
          size=${this.size}
          name=${this.icon}
        ></wui-icon>
      </button>
    `}};aj.styles=[L.W5,L.fD,ah],ai([(0,e.MZ)()],aj.prototype,"size",void 0),ai([(0,e.MZ)({type:Boolean})],aj.prototype,"disabled",void 0),ai([(0,e.MZ)()],aj.prototype,"icon",void 0),ai([(0,e.MZ)()],aj.prototype,"iconColor",void 0),ai([(0,e.MZ)()],aj.prototype,"variant",void 0),aj=ai([(0,M.E)("wui-icon-link")],aj),c(9272),c(58528);let ak=(0,d.JW)`<svg width="86" height="96" fill="none">
  <path
    d="M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z"
  />
</svg>`;var al=c(82687);let am=(0,d.JW)`
  <svg fill="none" viewBox="0 0 36 40">
    <path
      d="M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z"
    />
  </svg>
`,an=(0,N.AH)`
  :host {
    position: relative;
    border-radius: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-width);
    height: var(--local-height);
  }

  :host([data-round='true']) {
    background: ${({tokens:a})=>a.theme.foregroundPrimary};
    border-radius: 100%;
    outline: 1px solid ${({tokens:a})=>a.core.glass010};
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  svg > path {
    stroke: var(--local-stroke);
  }

  wui-image {
    width: 100%;
    height: 100%;
    -webkit-clip-path: var(--local-path);
    clip-path: var(--local-path);
    background: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  wui-icon {
    transform: translateY(-5%);
    width: var(--local-icon-size);
    height: var(--local-icon-size);
  }
`;var ao=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let ap=class extends d.WF{constructor(){super(...arguments),this.size="md",this.name="uknown",this.networkImagesBySize={sm:am,md:al.a,lg:ak},this.selected=!1,this.round=!1}render(){return this.round?(this.dataset.round="true",this.style.cssText=`
      --local-width: var(--apkt-spacing-10);
      --local-height: var(--apkt-spacing-10);
      --local-icon-size: var(--apkt-spacing-4);
    `):this.style.cssText=`

      --local-path: var(--apkt-path-network-${this.size});
      --local-width:  var(--apkt-width-network-${this.size});
      --local-height:  var(--apkt-height-network-${this.size});
      --local-icon-size:  var(--apkt-spacing-${({sm:"4",md:"6",lg:"10"})[this.size]});
    `,(0,d.qy)`${this.templateVisual()} ${this.svgTemplate()} `}svgTemplate(){return this.round?null:this.networkImagesBySize[this.size]}templateVisual(){return this.imageSrc?(0,d.qy)`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:(0,d.qy)`<wui-icon size="inherit" color="default" name="networkPlaceholder"></wui-icon>`}};ap.styles=[L.W5,an],ao([(0,e.MZ)()],ap.prototype,"size",void 0),ao([(0,e.MZ)()],ap.prototype,"name",void 0),ao([(0,e.MZ)({type:Object})],ap.prototype,"networkImagesBySize",void 0),ao([(0,e.MZ)()],ap.prototype,"imageSrc",void 0),ao([(0,e.MZ)({type:Boolean})],ap.prototype,"selected",void 0),ao([(0,e.MZ)({type:Boolean})],ap.prototype,"round",void 0),ap=ao([(0,M.E)("wui-network-image")],ap);let aq=(0,N.AH)`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: ${({tokens:a})=>a.theme.borderPrimary};
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 8px;
    transition: background-color ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-2"]};
    will-change: background-color;
  }

  :host([data-bg-color='primary']) > wui-text {
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
  }

  :host([data-bg-color='secondary']) > wui-text {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }
`;var ar=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let as=class extends d.WF{constructor(){super(...arguments),this.text="",this.bgColor="primary"}render(){return this.dataset.bgColor=this.bgColor,(0,d.qy)`${this.template()}`}template(){return this.text?(0,d.qy)`<wui-text variant="md-regular" color="secondary">${this.text}</wui-text>`:null}};as.styles=[L.W5,aq],ar([(0,e.MZ)()],as.prototype,"text",void 0),ar([(0,e.MZ)()],as.prototype,"bgColor",void 0),as=ar([(0,M.E)("wui-separator")],as),c(1799);var at=c(26006),au=c(63662);let av={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS",UNABLE_TO_GET_TOKEN_BALANCES:"UNABLE_TO_GET_TOKEN_BALANCES",UNABLE_TO_GET_QUOTE:"UNABLE_TO_GET_QUOTE",UNABLE_TO_GET_QUOTE_STATUS:"UNABLE_TO_GET_QUOTE_STATUS",INVALID_RECIPIENT_ADDRESS_FOR_ASSET:"INVALID_RECIPIENT_ADDRESS_FOR_ASSET"},aw={[av.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[av.INVALID_RECIPIENT]:"Invalid recipient address",[av.INVALID_ASSET]:"Invalid asset specified",[av.INVALID_AMOUNT]:"Invalid payment amount",[av.INVALID_RECIPIENT_ADDRESS_FOR_ASSET]:"Invalid recipient address for the asset selected",[av.UNKNOWN_ERROR]:"Unknown payment error occurred",[av.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[av.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[av.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[av.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[av.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[av.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[av.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status",[av.UNABLE_TO_GET_TOKEN_BALANCES]:"Unable to get token balances",[av.UNABLE_TO_GET_QUOTE]:"Unable to get quote. Please choose a different token",[av.UNABLE_TO_GET_QUOTE_STATUS]:"Unable to get quote status"};class ax extends Error{get message(){return aw[this.code]}constructor(a,b){super(aw[a]),this.name="AppKitPayError",this.code=a,this.details=b,Error.captureStackTrace&&Error.captureStackTrace(this,ax)}}var ay=c(2664);let az="reown_test";var aA=c(525),aB=c(60123);async function aC(a,b,c){if(b!==u.o.CHAIN.EVM)throw new ax(av.INVALID_CHAIN_NAMESPACE);if(!c.fromAddress)throw new ax(av.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");let d="string"==typeof c.amount?parseFloat(c.amount):c.amount;if(isNaN(d))throw new ax(av.INVALID_PAYMENT_CONFIG);let e=a.metadata?.decimals??18,f=m.x.parseUnits(d.toString(),e);if("bigint"!=typeof f)throw new ax(av.GENERIC_PAYMENT_ERROR);return await m.x.sendTransaction({chainNamespace:b,to:c.recipient,address:c.fromAddress,value:f,data:"0x"})??void 0}async function aD(a,b){if(!b.fromAddress)throw new ax(av.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");let c=a.asset,d=b.recipient,e=Number(a.metadata.decimals),f=m.x.parseUnits(b.amount.toString(),e);if(void 0===f)throw new ax(av.GENERIC_PAYMENT_ERROR);return await m.x.writeContract({fromAddress:b.fromAddress,tokenAddress:c,args:[d,f],method:"transfer",abi:aA.v.getERC20Abi(c),chainNamespace:u.o.CHAIN.EVM})??void 0}async function aE(a,b){if(a!==u.o.CHAIN.SOLANA)throw new ax(av.INVALID_CHAIN_NAMESPACE);if(!b.fromAddress)throw new ax(av.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");let c="string"==typeof b.amount?parseFloat(b.amount):b.amount;if(isNaN(c)||c<=0)throw new ax(av.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!aB.G.getProvider(a))throw new ax(av.GENERIC_PAYMENT_ERROR,"No Solana provider available.");let d=await m.x.sendTransaction({chainNamespace:u.o.CHAIN.SOLANA,to:b.recipient,value:c,tokenMint:b.tokenMint});if(!d)throw new ax(av.GENERIC_PAYMENT_ERROR,"Transaction failed.");return d}catch(a){if(a instanceof ax)throw a;throw new ax(av.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${a}`)}}async function aF({sourceToken:a,toToken:b,amount:c,recipient:d}){let e=m.x.parseUnits(c,a.metadata.decimals),f=m.x.parseUnits(c,b.metadata.decimals);return Promise.resolve({type:aY,origin:{amount:e?.toString()??"0",currency:a},destination:{amount:f?.toString()??"0",currency:b},fees:[{id:"service",label:"Service Fee",amount:"0",currency:b}],steps:[{requestId:aY,type:"deposit",deposit:{amount:e?.toString()??"0",currency:a.asset,receiver:d}}],timeInSeconds:6})}function aG(a){if(!a)return null;let b=a.steps[0];return b&&b.type===aZ?b:null}function aH(a,b=0){if(!a)return[];let c=a.steps.filter(a=>a.type===a$),d=c.filter((a,c)=>c+1>b);return c.length>0&&c.length<3?d:[]}let aI=new ay.Z({baseUrl:z.w.getApiUrl(),clientId:null});class aJ extends Error{}function aK(){let{projectId:a,sdkType:b,sdkVersion:c}=g.H.state;return{projectId:a,st:b||"appkit",sv:c||"html-wagmi-4.2.2"}}async function aL(a,b){let c=function(){let a=g.H.getSnapshot().projectId;return`https://rpc.walletconnect.org/v1/json-rpc?projectId=${a}`}(),{sdkType:d,sdkVersion:e,projectId:f}=g.H.getSnapshot(),h={jsonrpc:"2.0",id:1,method:a,params:{...b||{},st:d,sv:e,projectId:f}},i=await fetch(c,{method:"POST",body:JSON.stringify(h),headers:{"Content-Type":"application/json"}}),j=await i.json();if(j.error)throw new aJ(j.error.message);return j}async function aM(a){return(await aL("reown_getExchanges",a)).result}async function aN(a){return(await aL("reown_getExchangePayUrl",a)).result}async function aO(a){return(await aL("reown_getExchangeBuyStatus",a)).result}async function aP(a){let b=t.S.bigNumber(a.amount).times(10**a.toToken.metadata.decimals).toString(),{chainId:c,chainNamespace:d}=at.C.parseCaipNetworkId(a.sourceToken.network),{chainId:e,chainNamespace:f}=at.C.parseCaipNetworkId(a.toToken.network),g="native"===a.sourceToken.asset?(0,x.NH)(d):a.sourceToken.asset,h="native"===a.toToken.asset?(0,x.NH)(f):a.toToken.asset;return await aI.post({path:"/appkit/v1/transfers/quote",body:{user:a.address,originChainId:c.toString(),originCurrency:g,destinationChainId:e.toString(),destinationCurrency:h,recipient:a.recipient,amount:b},params:aK()})}async function aQ(a){let b=au.y.isLowerCaseMatch(a.sourceToken.network,a.toToken.network),c=au.y.isLowerCaseMatch(a.sourceToken.asset,a.toToken.asset);return b&&c?aF(a):aP(a)}async function aR(a){return await aI.get({path:"/appkit/v1/transfers/status",params:{requestId:a.requestId,...aK()}})}async function aS(a){return await aI.get({path:`/appkit/v1/transfers/assets/exchanges/${a}`,params:aK()})}let aT=["eip155","solana"],aU={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function aV(a,b){let{chainNamespace:c,chainId:d}=at.C.parseCaipNetworkId(a),e=aU[c];if(!e)throw Error(`Unsupported chain namespace for CAIP-19 formatting: ${c}`);let f=e.native.assetNamespace,g=e.native.assetReference;"native"!==b&&(f=e.defaultTokenNamespace,g=b);let h=`${c}:${d}`;return`${h}/${f}:${g}`}function aW(a){let b=t.S.bigNumber(a,{safe:!0});return b.lt(.001)?"<0.001":b.round(4).toString()}let aX="unknown",aY="direct-transfer",aZ="deposit",a$="transaction",a_=(0,r.BX)({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0,choice:"pay",tokenBalances:{[u.o.CHAIN.EVM]:[],[u.o.CHAIN.SOLANA]:[]},isFetchingTokenBalances:!1,selectedPaymentAsset:null,quote:void 0,quoteStatus:"waiting",quoteError:null,isFetchingQuote:!1,selectedExchange:void 0,exchangeUrlForQuote:void 0,requestId:void 0}),a0={state:a_,subscribe:a=>(0,r.B1)(a_,()=>a(a_)),subscribeKey:(a,b)=>(0,s.u$)(a_,a,b),async handleOpenPay(a){this.resetState(),this.setPaymentConfig(a),this.initializeAnalytics();let{chainNamespace:b}=at.C.parseCaipNetworkId(a0.state.paymentAsset.network);if(!z.w.isAddress(a0.state.recipient,b))throw new ax(av.INVALID_RECIPIENT_ADDRESS_FOR_ASSET,`Provide valid recipient address for namespace "${b}"`);await this.prepareTokenLogo(),a_.isConfigured=!0,F.E.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:a_.exchanges,configuration:{network:a_.paymentAsset.network,asset:a_.paymentAsset.asset,recipient:a_.recipient,amount:a_.amount}}}),await h.W.open({view:"Pay"})},resetState(){a_.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},a_.recipient="0x0",a_.amount=0,a_.isConfigured=!1,a_.error=null,a_.isPaymentInProgress=!1,a_.isLoading=!1,a_.currentPayment=void 0,a_.selectedExchange=void 0,a_.exchangeUrlForQuote=void 0,a_.requestId=void 0},resetQuoteState(){a_.quote=void 0,a_.quoteStatus="waiting",a_.quoteError=null,a_.isFetchingQuote=!1,a_.requestId=void 0},setPaymentConfig(a){if(!a.paymentAsset)throw new ax(av.INVALID_PAYMENT_CONFIG);try{a_.choice=a.choice??"pay",a_.paymentAsset=a.paymentAsset,a_.recipient=a.recipient,a_.amount=a.amount,a_.openInNewTab=a.openInNewTab??!0,a_.redirectUrl=a.redirectUrl,a_.payWithExchange=a.payWithExchange,a_.error=null}catch(a){throw new ax(av.INVALID_PAYMENT_CONFIG,a.message)}},setSelectedPaymentAsset(a){a_.selectedPaymentAsset=a},setSelectedExchange(a){a_.selectedExchange=a},setRequestId(a){a_.requestId=a},setPaymentInProgress(a){a_.isPaymentInProgress=a},getPaymentAsset:()=>a_.paymentAsset,getExchanges:()=>a_.exchanges,async fetchExchanges(){try{a_.isLoading=!0,a_.exchanges=(await aM({page:0})).exchanges.slice(0,2)}catch(a){throw q.P.showError(aw.UNABLE_TO_GET_EXCHANGES),new ax(av.UNABLE_TO_GET_EXCHANGES)}finally{a_.isLoading=!1}},async getAvailableExchanges(a){try{let b=a?.asset&&a?.network?aV(a.network,a.asset):void 0;return await aM({page:a?.page??0,asset:b,amount:a?.amount?.toString()})}catch(a){throw new ax(av.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(a,b,c=!1){try{let d=Number(b.amount),e=await aN({exchangeId:a,asset:aV(b.network,b.asset),amount:d.toString(),recipient:`${b.network}:${b.recipient}`});return F.E.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:a},configuration:{network:b.network,asset:b.asset,recipient:b.recipient,amount:d},currentPayment:{type:"exchange",exchangeId:a},headless:c}}),c&&(this.initiatePayment(),F.E.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:a_.paymentId||aX,configuration:{network:b.network,asset:b.asset,recipient:b.recipient,amount:d},currentPayment:{type:"exchange",exchangeId:a}}})),e}catch(a){if(a instanceof Error&&a.message.includes("is not supported"))throw new ax(av.ASSET_NOT_SUPPORTED);throw Error(a.message)}},async generateExchangeUrlForQuote({exchangeId:a,paymentAsset:b,amount:c,recipient:d}){let e=await aN({exchangeId:a,asset:aV(b.network,b.asset),amount:c.toString(),recipient:d});a_.exchangeSessionId=e.sessionId,a_.exchangeUrlForQuote=e.url},async openPayUrl(a,b,c=!1){try{let d=await this.getPayUrl(a.exchangeId,b,c);if(!d)throw new ax(av.UNABLE_TO_GET_PAY_URL);let e=a.openInNewTab??!0;return z.w.openHref(d.url,e?"_blank":"_self"),d}catch(a){throw a instanceof ax?a_.error=a.message:a_.error=aw.GENERIC_PAYMENT_ERROR,new ax(av.UNABLE_TO_GET_PAY_URL)}},async onTransfer({chainNamespace:a,fromAddress:b,toAddress:c,amount:d,paymentAsset:e}){if(a_.currentPayment={type:"wallet",status:"IN_PROGRESS"},!a_.isPaymentInProgress)try{this.initiatePayment();let f=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===e.network);if(!f)throw Error("Target network not found");let g=i.W.state.activeCaipNetwork;switch(!au.y.isLowerCaseMatch(g?.caipNetworkId,f.caipNetworkId)&&await i.W.switchActiveNetwork(f),a){case u.o.CHAIN.EVM:"native"===e.asset&&(a_.currentPayment.result=await aC(e,a,{recipient:c,amount:d,fromAddress:b})),e.asset.startsWith("0x")&&(a_.currentPayment.result=await aD(e,{recipient:c,amount:d,fromAddress:b})),a_.currentPayment.status="SUCCESS";break;case u.o.CHAIN.SOLANA:a_.currentPayment.result=await aE(a,{recipient:c,amount:d,fromAddress:b,tokenMint:"native"===e.asset?void 0:e.asset}),a_.currentPayment.status="SUCCESS";break;default:throw new ax(av.INVALID_CHAIN_NAMESPACE)}}catch(a){throw a instanceof ax?a_.error=a.message:a_.error=aw.GENERIC_PAYMENT_ERROR,a_.currentPayment.status="FAILED",q.P.showError(a_.error),a}finally{a_.isPaymentInProgress=!1}},async onSendTransaction(a){try{let{namespace:b,transactionStep:c}=a;a0.initiatePayment();let d=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===a_.paymentAsset?.network);if(!d)throw Error("Target network not found");let e=i.W.state.activeCaipNetwork;if(au.y.isLowerCaseMatch(e?.caipNetworkId,d.caipNetworkId)||await i.W.switchActiveNetwork(d),b===u.o.CHAIN.EVM){let{from:a,to:d,data:e,value:f}=c.transaction;await m.x.sendTransaction({address:a,to:d,data:e,value:BigInt(f),chainNamespace:b})}else if(b===u.o.CHAIN.SOLANA){let{instructions:a}=c.transaction;await m.x.writeSolanaTransaction({instructions:a})}}catch(a){throw a instanceof ax?a_.error=a.message:a_.error=aw.GENERIC_PAYMENT_ERROR,q.P.showError(a_.error),a}finally{a_.isPaymentInProgress=!1}},getExchangeById:a=>a_.exchanges.find(b=>b.id===a),validatePayConfig(a){let{paymentAsset:b,recipient:c,amount:d}=a;if(!b)throw new ax(av.INVALID_PAYMENT_CONFIG);if(!c)throw new ax(av.INVALID_RECIPIENT);if(!b.asset)throw new ax(av.INVALID_ASSET);if(null==d||d<=0)throw new ax(av.INVALID_AMOUNT)},async handlePayWithExchange(a){try{a_.currentPayment={type:"exchange",exchangeId:a};let{network:b,asset:c}=a_.paymentAsset,d={network:b,asset:c,amount:a_.amount,recipient:a_.recipient},e=await this.getPayUrl(a,d);if(!e)throw new ax(av.UNABLE_TO_INITIATE_PAYMENT);return a_.currentPayment.sessionId=e.sessionId,a_.currentPayment.status="IN_PROGRESS",a_.currentPayment.exchangeId=a,this.initiatePayment(),{url:e.url,openInNewTab:a_.openInNewTab}}catch(a){return a instanceof ax?a_.error=a.message:a_.error=aw.GENERIC_PAYMENT_ERROR,a_.isPaymentInProgress=!1,q.P.showError(a_.error),null}},async getBuyStatus(a,b){try{let c=await aO({sessionId:b,exchangeId:a});return("SUCCESS"===c.status||"FAILED"===c.status)&&F.E.sendEvent({type:"track",event:"SUCCESS"===c.status?"PAY_SUCCESS":"PAY_ERROR",properties:{message:"FAILED"===c.status?z.w.parseError(a_.error):void 0,source:"pay",paymentId:a_.paymentId||aX,configuration:{network:a_.paymentAsset.network,asset:a_.paymentAsset.asset,recipient:a_.recipient,amount:a_.amount},currentPayment:{type:"exchange",exchangeId:a_.currentPayment?.exchangeId,sessionId:a_.currentPayment?.sessionId,result:c.txHash}}}),c}catch(a){throw new ax(av.UNABLE_TO_GET_BUY_STATUS)}},async fetchTokensFromEOA({caipAddress:a,caipNetwork:b,namespace:c}){if(!a)return[];let{address:d}=at.C.parseCaipAddress(a),e=b;return c===u.o.CHAIN.EVM&&(e=void 0),await w.Z.getMyTokensWithBalance({address:d,caipNetwork:e})},async fetchTokensFromExchange(){if(!a_.selectedExchange)return[];let a=Object.values((await aS(a_.selectedExchange.id)).assets).flat();return await Promise.all(a.map(async a=>{let b={chainId:a.network,address:`${a.network}:${a.asset}`,symbol:a.metadata.symbol,name:a.metadata.name,iconUrl:a.metadata.logoURI||"",price:0,quantity:{numeric:"0",decimals:a.metadata.decimals.toString()}},{chainNamespace:c}=at.C.parseCaipNetworkId(b.chainId),d=b.address;if(z.w.isCaipAddress(d)){let{address:a}=at.C.parseCaipAddress(d);d=a}return b.iconUrl=await Y.$.getImageByToken(d??"",c).catch(()=>void 0)??"",b}))},async fetchTokens({caipAddress:a,caipNetwork:b,namespace:c}){try{a_.isFetchingTokenBalances=!0;let d=a_.selectedExchange?this.fetchTokensFromExchange():this.fetchTokensFromEOA({caipAddress:a,caipNetwork:b,namespace:c}),e=await d;a_.tokenBalances={...a_.tokenBalances,[c]:e}}catch(b){let a=b instanceof Error?b.message:"Unable to get token balances";q.P.showError(a)}finally{a_.isFetchingTokenBalances=!1}},async fetchQuote({amount:a,address:b,sourceToken:c,toToken:d,recipient:e}){try{a0.resetQuoteState(),a_.isFetchingQuote=!0;let f=await aQ({amount:a,address:a_.selectedExchange?void 0:b,sourceToken:c,toToken:d,recipient:e});if(a_.selectedExchange){let a=aG(f);if(a){let b=`${c.network}:${a.deposit.receiver}`,d=t.S.formatNumber(a.deposit.amount,{decimals:c.metadata.decimals??0,round:8});await a0.generateExchangeUrlForQuote({exchangeId:a_.selectedExchange.id,paymentAsset:c,amount:d.toString(),recipient:b})}}a_.quote=f}catch(b){let a=aw.UNABLE_TO_GET_QUOTE;if(b instanceof Error&&b.cause&&b.cause instanceof Response)try{let c=await b.cause.json();c.error&&"string"==typeof c.error&&(a=c.error)}catch{}throw a_.quoteError=a,q.P.showError(a),new ax(av.UNABLE_TO_GET_QUOTE)}finally{a_.isFetchingQuote=!1}},async fetchQuoteStatus({requestId:a}){try{if(a===aY){let a=a_.selectedExchange,b=a_.exchangeSessionId;if(a&&b){switch((await this.getBuyStatus(a.id,b)).status){case"IN_PROGRESS":case"UNKNOWN":default:a_.quoteStatus="waiting";break;case"SUCCESS":a_.quoteStatus="success",a_.isPaymentInProgress=!1;break;case"FAILED":a_.quoteStatus="failure",a_.isPaymentInProgress=!1}return}a_.quoteStatus="success";return}let{status:b}=await aR({requestId:a});a_.quoteStatus=b}catch{throw a_.quoteStatus="failure",new ax(av.UNABLE_TO_GET_QUOTE_STATUS)}},initiatePayment(){a_.isPaymentInProgress=!0,a_.paymentId=crypto.randomUUID()},initializeAnalytics(){a_.analyticsSet||(a_.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",a=>{if(a_.currentPayment?.status&&"UNKNOWN"!==a_.currentPayment.status){let a={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[a_.currentPayment.status];F.E.sendEvent({type:"track",event:a,properties:{message:"FAILED"===a_.currentPayment.status?z.w.parseError(a_.error):void 0,source:"pay",paymentId:a_.paymentId||aX,configuration:{network:a_.paymentAsset.network,asset:a_.paymentAsset.asset,recipient:a_.recipient,amount:a_.amount},currentPayment:{type:a_.currentPayment.type,exchangeId:a_.currentPayment.exchangeId,sessionId:a_.currentPayment.sessionId,result:a_.currentPayment.result}}})}}))},async prepareTokenLogo(){if(!a_.paymentAsset.metadata.logoURI)try{let{chainNamespace:a}=at.C.parseCaipNetworkId(a_.paymentAsset.network),b=await Y.$.getImageByToken(a_.paymentAsset.asset,a);a_.paymentAsset.metadata.logoURI=b}catch{}}},a1=(0,K.AH)`
  wui-separator {
    margin: var(--apkt-spacing-3) calc(var(--apkt-spacing-3) * -1) var(--apkt-spacing-2)
      calc(var(--apkt-spacing-3) * -1);
    width: calc(100% + var(--apkt-spacing-3) * 2);
  }

  .token-display {
    padding: var(--apkt-spacing-3) var(--apkt-spacing-3);
    border-radius: var(--apkt-borderRadius-5);
    background-color: var(--apkt-tokens-theme-backgroundPrimary);
    margin-top: var(--apkt-spacing-3);
    margin-bottom: var(--apkt-spacing-3);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--apkt-spacing-2);
  }

  .left-image-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:a})=>a.round};
    width: 40px;
    height: 40px;
  }

  .chain-image {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:a})=>a.round};
    border: 2px solid ${({tokens:a})=>a.theme.backgroundPrimary};
  }

  .payment-methods-container {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:a})=>a[8]};
    border-top-left-radius: ${({borderRadius:a})=>a[8]};
  }
`;var a2=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let a3=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.amount=a0.state.amount,this.namespace=void 0,this.paymentAsset=a0.state.paymentAsset,this.activeConnectorIds=j.a.state.activeConnectorIds,this.caipAddress=void 0,this.exchanges=a0.state.exchanges,this.isLoading=a0.state.isLoading,this.initializeNamespace(),this.unsubscribe.push(a0.subscribeKey("amount",a=>this.amount=a)),this.unsubscribe.push(j.a.subscribeKey("activeConnectorIds",a=>this.activeConnectorIds=a)),this.unsubscribe.push(a0.subscribeKey("exchanges",a=>this.exchanges=a)),this.unsubscribe.push(a0.subscribeKey("isLoading",a=>this.isLoading=a)),a0.fetchExchanges(),a0.setSelectedExchange(void 0)}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){return(0,d.qy)`
      <wui-flex flexDirection="column">
        ${this.paymentDetailsTemplate()} ${this.paymentMethodsTemplate()}
      </wui-flex>
    `}paymentMethodsTemplate(){return(0,d.qy)`
      <wui-flex flexDirection="column" padding="3" gap="2" class="payment-methods-container">
        ${this.payWithWalletTemplate()} ${this.templateSeparator()}
        ${this.templateExchangeOptions()}
      </wui-flex>
    `}initializeNamespace(){let a=i.W.state.activeChain;this.namespace=a,this.caipAddress=i.W.getAccountData(a)?.caipAddress,this.unsubscribe.push(i.W.subscribeChainProp("accountState",a=>{this.caipAddress=a?.caipAddress},a))}paymentDetailsTemplate(){let a=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===this.paymentAsset.network);return(0,d.qy)`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        .padding=${["6","8","6","8"]}
        gap="2"
      >
        <wui-flex alignItems="center" gap="1">
          <wui-text variant="h1-regular" color="primary">
            ${aW(this.amount||"0")}
          </wui-text>

          <wui-flex flexDirection="column">
            <wui-text variant="h6-regular" color="secondary">
              ${this.paymentAsset.metadata.symbol||"Unknown"}
            </wui-text>
            <wui-text variant="md-medium" color="secondary"
              >on ${a?.name||"Unknown"}</wui-text
            >
          </wui-flex>
        </wui-flex>

        <wui-flex class="left-image-container">
          <wui-image
            src=${(0,f.J)(this.paymentAsset.metadata.logoURI)}
            class="token-image"
          ></wui-image>
          <wui-image
            src=${(0,f.J)(Y.$.getNetworkImage(a))}
            class="chain-image"
          ></wui-image>
        </wui-flex>
      </wui-flex>
    `}payWithWalletTemplate(){return!function(a){let{chainNamespace:b}=at.C.parseCaipNetworkId(a);return aT.includes(b)}(this.paymentAsset.network)?(0,d.qy)``:this.caipAddress?this.connectedWalletTemplate():this.disconnectedWalletTemplate()}connectedWalletTemplate(){let{name:a,image:b}=this.getWalletProperties({namespace:this.namespace});return(0,d.qy)`
      <wui-flex flexDirection="column" gap="3">
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${this.onWalletPayment}
          .boxed=${!1}
          ?chevron=${!0}
          ?fullSize=${!1}
          ?rounded=${!0}
          data-testid="wallet-payment-option"
          imageSrc=${(0,f.J)(b)}
          imageSize="3xl"
        >
          <wui-text variant="lg-regular" color="primary">Pay with ${a}</wui-text>
        </wui-list-item>

        <wui-list-item
          type="secondary"
          icon="power"
          iconColor="error"
          @click=${this.onDisconnect}
          data-testid="disconnect-button"
          ?chevron=${!1}
          boxColor="foregroundSecondary"
        >
          <wui-text variant="lg-regular" color="secondary">Disconnect</wui-text>
        </wui-list-item>
      </wui-flex>
    `}disconnectedWalletTemplate(){return(0,d.qy)`<wui-list-item
      type="secondary"
      boxColor="foregroundSecondary"
      variant="icon"
      iconColor="default"
      iconVariant="overlay"
      icon="wallet"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="lg-regular" color="primary">Pay with wallet</wui-text>
    </wui-list-item>`}templateExchangeOptions(){if(this.isLoading)return(0,d.qy)`<wui-flex justifyContent="center" alignItems="center">
        <wui-loading-spinner size="md"></wui-loading-spinner>
      </wui-flex>`;let a=this.exchanges.filter(a=>!function(a){let b=i.W.getAllRequestedCaipNetworks().find(b=>b.caipNetworkId===a.network);return!!b&&!!b.testnet}(this.paymentAsset)?a.id!==az:a.id===az);return 0===a.length?(0,d.qy)`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="md-medium" color="primary">No exchanges available</wui-text>
      </wui-flex>`:a.map(a=>(0,d.qy)`
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${()=>this.onExchangePayment(a)}
          data-testid="exchange-option-${a.id}"
          ?chevron=${!0}
          imageSrc=${(0,f.J)(a.imageUrl)}
        >
          <wui-text flexGrow="1" variant="lg-regular" color="primary">
            Pay with ${a.name}
          </wui-text>
        </wui-list-item>
      `)}templateSeparator(){return(0,d.qy)`<wui-separator text="or" bgColor="secondary"></wui-separator>`}async onWalletPayment(){if(!this.namespace)throw Error("Namespace not found");this.caipAddress?l.I.push("PayQuote"):(await j.a.connect(),await h.W.open({view:"PayQuote"}))}onExchangePayment(a){a0.setSelectedExchange(a),l.I.push("PayQuote")}async onDisconnect(){try{await m.x.disconnect(),await h.W.open({view:"Pay"})}catch{console.error("Failed to disconnect"),q.P.showError("Failed to disconnect")}}getWalletProperties({namespace:a}){if(!a)return{name:void 0,image:void 0};let b=this.activeConnectorIds[a];if(!b)return{name:void 0,image:void 0};let c=j.a.getConnector({id:b,namespace:a});if(!c)return{name:void 0,image:void 0};let d=Y.$.getConnectorImage(c);return{name:c.name,image:d}}};a3.styles=a1,a2([(0,e.wk)()],a3.prototype,"amount",void 0),a2([(0,e.wk)()],a3.prototype,"namespace",void 0),a2([(0,e.wk)()],a3.prototype,"paymentAsset",void 0),a2([(0,e.wk)()],a3.prototype,"activeConnectorIds",void 0),a2([(0,e.wk)()],a3.prototype,"caipAddress",void 0),a2([(0,e.wk)()],a3.prototype,"exchanges",void 0),a2([(0,e.wk)()],a3.prototype,"isLoading",void 0),a3=a2([(0,K.EM)("w3m-pay-view")],a3);var a4=c(97314);let a5=(0,N.AH)`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-container {
    position: relative;
    width: var(--pulse-size);
    height: var(--pulse-size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-rings {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .pulse-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid var(--pulse-color);
    opacity: 0;
    animation: pulse var(--pulse-duration, 2s) ease-out infinite;
  }

  .pulse-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.5);
      opacity: var(--pulse-opacity, 0.3);
    }
    50% {
      opacity: calc(var(--pulse-opacity, 0.3) * 0.5);
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
`;var a6=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let a7={"accent-primary":N.f.tokens.core.backgroundAccentPrimary},a8=class extends d.WF{constructor(){super(...arguments),this.rings=3,this.duration=2,this.opacity=.3,this.size="200px",this.variant="accent-primary"}render(){let a=a7[this.variant];this.style.cssText=`
      --pulse-size: ${this.size};
      --pulse-duration: ${this.duration}s;
      --pulse-color: ${a};
      --pulse-opacity: ${this.opacity};
    `;let b=Array.from({length:this.rings},(a,b)=>this.renderRing(b,this.rings));return(0,d.qy)`
      <div class="pulse-container">
        <div class="pulse-rings">${b}</div>
        <div class="pulse-content">
          <slot></slot>
        </div>
      </div>
    `}renderRing(a,b){let c=a/b*this.duration,e=`animation-delay: ${c}s;`;return(0,d.qy)`<div class="pulse-ring" style=${e}></div>`}};a8.styles=[L.W5,a5],a6([(0,e.MZ)({type:Number})],a8.prototype,"rings",void 0),a6([(0,e.MZ)({type:Number})],a8.prototype,"duration",void 0),a6([(0,e.MZ)({type:Number})],a8.prototype,"opacity",void 0),a6([(0,e.MZ)()],a8.prototype,"size",void 0),a6([(0,e.MZ)()],a8.prototype,"variant",void 0),a8=a6([(0,M.E)("wui-pulse")],a8);let a9=[{id:"received",title:"Receiving funds",icon:"dollar"},{id:"processing",title:"Swapping asset",icon:"recycleHorizontal"},{id:"sending",title:"Sending asset to the recipient address",icon:"send"}],ba=["success","submitted","failure","timeout","refund"],bb=(0,K.AH)`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-image {
    border-radius: ${({borderRadius:a})=>a.round};
  }

  .token-badge-container {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: ${({borderRadius:a})=>a[4]};
    z-index: 3;
    min-width: 105px;
  }

  .token-badge-container.loading {
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    border: 3px solid ${({tokens:a})=>a.theme.backgroundPrimary};
  }

  .token-badge-container.success {
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    border: 3px solid ${({tokens:a})=>a.theme.backgroundPrimary};
  }

  .token-image-container {
    position: relative;
  }

  .token-image {
    border-radius: ${({borderRadius:a})=>a.round};
    width: 64px;
    height: 64px;
  }

  .token-image.success {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  .token-image.error {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  .token-image.loading {
    background: ${({colors:a})=>a.accent010};
  }

  .token-image wui-icon {
    width: 32px;
    height: 32px;
  }

  .token-badge {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    border: 1px solid ${({tokens:a})=>a.theme.foregroundSecondary};
    border-radius: ${({borderRadius:a})=>a[4]};
  }

  .token-badge wui-text {
    white-space: nowrap;
  }

  .payment-lifecycle-container {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:a})=>a[6]};
    border-top-left-radius: ${({borderRadius:a})=>a[6]};
  }

  .payment-step-badge {
    padding: ${({spacing:a})=>a[1]} ${({spacing:a})=>a[2]};
    border-radius: ${({borderRadius:a})=>a[1]};
  }

  .payment-step-badge.loading {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
  }

  .payment-step-badge.error {
    background-color: ${({tokens:a})=>a.core.backgroundError};
  }

  .payment-step-badge.success {
    background-color: ${({tokens:a})=>a.core.backgroundSuccess};
  }

  .step-icon-container {
    position: relative;
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:a})=>a.round};
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
  }

  .step-icon-box {
    position: absolute;
    right: -4px;
    bottom: -1px;
    padding: 2px;
    border-radius: ${({borderRadius:a})=>a.round};
    border: 2px solid ${({tokens:a})=>a.theme.backgroundPrimary};
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  .step-icon-box.success {
    background-color: ${({tokens:a})=>a.core.backgroundSuccess};
  }
`;var bc=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bd={received:["pending","success","submitted"],processing:["success","submitted"],sending:["success","submitted"]},be=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.pollingInterval=null,this.paymentAsset=a0.state.paymentAsset,this.quoteStatus=a0.state.quoteStatus,this.quote=a0.state.quote,this.amount=a0.state.amount,this.namespace=void 0,this.caipAddress=void 0,this.profileName=null,this.activeConnectorIds=j.a.state.activeConnectorIds,this.selectedExchange=a0.state.selectedExchange,this.initializeNamespace(),this.unsubscribe.push(a0.subscribeKey("quoteStatus",a=>this.quoteStatus=a),a0.subscribeKey("quote",a=>this.quote=a),j.a.subscribeKey("activeConnectorIds",a=>this.activeConnectorIds=a),a0.subscribeKey("selectedExchange",a=>this.selectedExchange=a))}connectedCallback(){super.connectedCallback(),this.startPolling()}disconnectedCallback(){super.disconnectedCallback(),this.stopPolling(),this.unsubscribe.forEach(a=>a())}render(){return(0,d.qy)`
      <wui-flex flexDirection="column" .padding=${["3","0","0","0"]} gap="2">
        ${this.tokenTemplate()} ${this.paymentTemplate()} ${this.paymentLifecycleTemplate()}
      </wui-flex>
    `}tokenTemplate(){let a=aW(this.amount||"0"),b=this.paymentAsset.metadata.symbol??"Unknown",c=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===this.paymentAsset.network),e="failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus;return"success"===this.quoteStatus||"submitted"===this.quoteStatus?(0,d.qy)`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image success">
          <wui-icon name="checkmark" color="success" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:e?(0,d.qy)`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image error">
          <wui-icon name="close" color="error" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:(0,d.qy)`
      <wui-flex alignItems="center" justifyContent="center">
        <wui-flex class="token-image-container">
          <wui-pulse size="125px" rings="3" duration="4" opacity="0.5" variant="accent-primary">
            <wui-flex justifyContent="center" alignItems="center" class="token-image loading">
              <wui-icon name="paperPlaneTitle" color="accent-primary" size="inherit"></wui-icon>
            </wui-flex>
          </wui-pulse>

          <wui-flex
            justifyContent="center"
            alignItems="center"
            class="token-badge-container loading"
          >
            <wui-flex
              alignItems="center"
              justifyContent="center"
              gap="01"
              padding="1"
              class="token-badge"
            >
              <wui-image
                src=${(0,f.J)(Y.$.getNetworkImage(c))}
                class="chain-image"
                size="mdl"
              ></wui-image>

              <wui-text variant="lg-regular" color="primary">${a} ${b}</wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}paymentTemplate(){return(0,d.qy)`
      <wui-flex flexDirection="column" gap="2" .padding=${["0","6","0","6"]}>
        ${this.renderPayment()}
        <wui-separator></wui-separator>
        ${this.renderWallet()}
      </wui-flex>
    `}paymentLifecycleTemplate(){let a=this.getStepsWithStatus();return(0,d.qy)`
      <wui-flex flexDirection="column" padding="4" gap="2" class="payment-lifecycle-container">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">PAYMENT CYCLE</wui-text>

          ${this.renderPaymentCycleBadge()}
        </wui-flex>

        <wui-flex flexDirection="column" gap="5" .padding=${["2","0","2","0"]}>
          ${a.map(a=>this.renderStep(a))}
        </wui-flex>
      </wui-flex>
    `}renderPaymentCycleBadge(){let a="failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus,b="success"===this.quoteStatus||"submitted"===this.quoteStatus;if(a)return(0,d.qy)`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge error"
          gap="1"
        >
          <wui-icon name="close" color="error" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="error">Failed</wui-text>
        </wui-flex>
      `;if(b)return(0,d.qy)`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge success"
          gap="1"
        >
          <wui-icon name="checkmark" color="success" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="success">Completed</wui-text>
        </wui-flex>
      `;let c=this.quote?.timeInSeconds??0;return(0,d.qy)`
      <wui-flex alignItems="center" justifyContent="space-between" gap="3">
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge loading"
          gap="1"
        >
          <wui-icon name="clock" color="default" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="primary">Est. ${c} sec</wui-text>
        </wui-flex>

        <wui-icon name="chevronBottom" color="default" size="xxs"></wui-icon>
      </wui-flex>
    `}renderPayment(){let a=i.W.getAllRequestedCaipNetworks().find(a=>{let b=this.quote?.origin.currency.network;if(!b)return!1;let{chainId:c}=at.C.parseCaipNetworkId(b);return au.y.isLowerCaseMatch(a.id.toString(),c.toString())}),b=aW(t.S.formatNumber(this.quote?.origin.amount||"0",{decimals:this.quote?.origin.currency.metadata.decimals??0}).toString()),c=this.quote?.origin.currency.metadata.symbol??"Unknown";return(0,d.qy)`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary">Payment Method</wui-text>

        <wui-flex flexDirection="column" alignItems="flex-end" gap="1">
          <wui-flex alignItems="center" gap="01">
            <wui-text variant="lg-regular" color="primary">${b}</wui-text>
            <wui-text variant="lg-regular" color="secondary">${c}</wui-text>
          </wui-flex>

          <wui-flex alignItems="center" gap="1">
            <wui-text variant="md-regular" color="secondary">on</wui-text>
            <wui-image
              src=${(0,f.J)(Y.$.getNetworkImage(a))}
              size="xs"
            ></wui-image>
            <wui-text variant="md-regular" color="secondary">${a?.name}</wui-text>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderWallet(){return(0,d.qy)`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary">Wallet</wui-text>

        ${this.renderWalletText()}
      </wui-flex>
    `}renderWalletText(){let{image:a}=this.getWalletProperties({namespace:this.namespace}),{address:b}=this.caipAddress?at.C.parseCaipAddress(this.caipAddress):{},c=this.selectedExchange?.name;return this.selectedExchange?(0,d.qy)`
        <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
          <wui-text variant="lg-regular" color="primary">${c}</wui-text>
          <wui-image src=${(0,f.J)(this.selectedExchange.imageUrl)} size="mdl"></wui-image>
        </wui-flex>
      `:(0,d.qy)`
      <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
        <wui-text variant="lg-regular" color="primary">
          ${K.Zv.getTruncateString({string:this.profileName||b||c||"",charsStart:this.profileName?16:4,charsEnd:6*!this.profileName,truncate:this.profileName?"end":"middle"})}
        </wui-text>

        <wui-image src=${(0,f.J)(a)} size="mdl"></wui-image>
      </wui-flex>
    `}getStepsWithStatus(){return"failure"===this.quoteStatus||"timeout"===this.quoteStatus||"refund"===this.quoteStatus?a9.map(a=>({...a,status:"failed"})):a9.map(a=>{let b=(bd[a.id]??[]).includes(this.quoteStatus)?"completed":"pending";return{...a,status:b}})}renderStep({title:a,icon:b,status:c}){return(0,d.qy)`
      <wui-flex alignItems="center" gap="3">
        <wui-flex justifyContent="center" alignItems="center" class="step-icon-container">
          <wui-icon name=${b} color="default" size="mdl"></wui-icon>

          <wui-flex alignItems="center" justifyContent="center" class=${(0,a4.H)({"step-icon-box":!0,success:"completed"===c})}>
            ${this.renderStatusIndicator(c)}
          </wui-flex>
        </wui-flex>

        <wui-text variant="md-regular" color="primary">${a}</wui-text>
      </wui-flex>
    `}renderStatusIndicator(a){return"completed"===a?(0,d.qy)`<wui-icon size="sm" color="success" name="checkmark"></wui-icon>`:"failed"===a?(0,d.qy)`<wui-icon size="sm" color="error" name="close"></wui-icon>`:"pending"===a?(0,d.qy)`<wui-loading-spinner color="accent-primary" size="sm"></wui-loading-spinner>`:null}startPolling(){this.pollingInterval||(this.fetchQuoteStatus(),this.pollingInterval=setInterval(()=>{this.fetchQuoteStatus()},3e3))}stopPolling(){this.pollingInterval&&(clearInterval(this.pollingInterval),this.pollingInterval=null)}async fetchQuoteStatus(){let a=a0.state.requestId;if(!a||ba.includes(this.quoteStatus))this.stopPolling();else try{await a0.fetchQuoteStatus({requestId:a}),ba.includes(this.quoteStatus)&&this.stopPolling()}catch{this.stopPolling()}}initializeNamespace(){let a=i.W.state.activeChain;this.namespace=a,this.caipAddress=i.W.getAccountData(a)?.caipAddress,this.profileName=i.W.getAccountData(a)?.profileName??null,this.unsubscribe.push(i.W.subscribeChainProp("accountState",a=>{this.caipAddress=a?.caipAddress,this.profileName=a?.profileName??null},a))}getWalletProperties({namespace:a}){if(!a)return{name:void 0,image:void 0};let b=this.activeConnectorIds[a];if(!b)return{name:void 0,image:void 0};let c=j.a.getConnector({id:b,namespace:a});if(!c)return{name:void 0,image:void 0};let d=Y.$.getConnectorImage(c);return{name:c.name,image:d}}};be.styles=bb,bc([(0,e.wk)()],be.prototype,"paymentAsset",void 0),bc([(0,e.wk)()],be.prototype,"quoteStatus",void 0),bc([(0,e.wk)()],be.prototype,"quote",void 0),bc([(0,e.wk)()],be.prototype,"amount",void 0),bc([(0,e.wk)()],be.prototype,"namespace",void 0),bc([(0,e.wk)()],be.prototype,"caipAddress",void 0),bc([(0,e.wk)()],be.prototype,"profileName",void 0),bc([(0,e.wk)()],be.prototype,"activeConnectorIds",void 0),bc([(0,e.wk)()],be.prototype,"selectedExchange",void 0),be=bc([(0,K.EM)("w3m-pay-loading-view")],be);var bf=c(77847);let bg=(0,N.AH)`
  button {
    display: flex;
    align-items: center;
    height: 40px;
    padding: ${({spacing:a})=>a[2]};
    border-radius: ${({borderRadius:a})=>a[4]};
    column-gap: ${({spacing:a})=>a[1]};
    background-color: transparent;
    transition: background-color ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-2"]};
    will-change: background-color;
  }

  wui-image,
  .icon-box {
    width: ${({spacing:a})=>a[6]};
    height: ${({spacing:a})=>a[6]};
    border-radius: ${({borderRadius:a})=>a[4]};
  }

  wui-text {
    flex: 1;
  }

  .icon-box {
    position: relative;
  }

  .icon-box[data-active='true'] {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
  }

  .circle {
    position: absolute;
    left: 16px;
    top: 15px;
    width: 8px;
    height: 8px;
    background-color: ${({tokens:a})=>a.core.textSuccess};
    box-shadow: 0 0 0 2px ${({tokens:a})=>a.theme.foregroundPrimary};
    border-radius: 50%;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    }
  }
`;var bh=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bi=class extends d.WF{constructor(){super(...arguments),this.address="",this.profileName="",this.alt="",this.imageSrc="",this.icon=void 0,this.iconSize="md",this.enableGreenCircle=!0,this.loading=!1,this.charsStart=4,this.charsEnd=6}render(){return(0,d.qy)`
      <button>
        ${this.leftImageTemplate()} ${this.textTemplate()} ${this.rightImageTemplate()}
      </button>
    `}leftImageTemplate(){let a=this.icon?(0,d.qy)`<wui-icon
          size=${(0,f.J)(this.iconSize)}
          color="default"
          name=${this.icon}
          class="icon"
        ></wui-icon>`:(0,d.qy)`<wui-image src=${this.imageSrc} alt=${this.alt}></wui-image>`;return(0,d.qy)`
      <wui-flex
        alignItems="center"
        justifyContent="center"
        class="icon-box"
        data-active=${!!this.icon}
      >
        ${a}
        ${this.enableGreenCircle?(0,d.qy)`<wui-flex class="circle"></wui-flex>`:null}
      </wui-flex>
    `}textTemplate(){return(0,d.qy)`
      <wui-text variant="lg-regular" color="primary">
        ${bf.Z.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?16:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"})}
      </wui-text>
    `}rightImageTemplate(){return(0,d.qy)`<wui-icon name="chevronBottom" size="sm" color="default"></wui-icon>`}};bi.styles=[L.W5,L.fD,bg],bh([(0,e.MZ)()],bi.prototype,"address",void 0),bh([(0,e.MZ)()],bi.prototype,"profileName",void 0),bh([(0,e.MZ)()],bi.prototype,"alt",void 0),bh([(0,e.MZ)()],bi.prototype,"imageSrc",void 0),bh([(0,e.MZ)()],bi.prototype,"icon",void 0),bh([(0,e.MZ)()],bi.prototype,"iconSize",void 0),bh([(0,e.MZ)({type:Boolean})],bi.prototype,"enableGreenCircle",void 0),bh([(0,e.MZ)({type:Boolean})],bi.prototype,"loading",void 0),bh([(0,e.MZ)({type:Number})],bi.prototype,"charsStart",void 0),bh([(0,e.MZ)({type:Number})],bi.prototype,"charsEnd",void 0),bi=bh([(0,M.E)("wui-wallet-switch")],bi),c(30787);let bj=(0,d.AH)`
  :host {
    display: block;
  }
`,bk=class extends d.WF{render(){return(0,d.qy)`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-shimmer width="60px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Network Fee</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-shimmer
              width="75px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>

            <wui-flex alignItems="center" gap="01">
              <wui-shimmer width="14px" height="14px" rounded variant="light"></wui-shimmer>
              <wui-shimmer
                width="49px"
                height="14px"
                borderRadius="4xs"
                variant="light"
              ></wui-shimmer>
            </wui-flex>
          </wui-flex>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Service Fee</wui-text>
          <wui-shimmer width="75px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>
      </wui-flex>
    `}};bk.styles=[bj],bk=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g}([(0,K.EM)("w3m-pay-fees-skeleton")],bk);let bl=(0,K.AH)`
  :host {
    display: block;
  }

  wui-image {
    border-radius: ${({borderRadius:a})=>a.round};
  }
`;var bm=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bn=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.quote=a0.state.quote,this.unsubscribe.push(a0.subscribeKey("quote",a=>this.quote=a))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){let a=t.S.formatNumber(this.quote?.origin.amount||"0",{decimals:this.quote?.origin.currency.metadata.decimals??0,round:6}).toString();return(0,d.qy)`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-text variant="md-regular" color="primary">
            ${a} ${this.quote?.origin.currency.metadata.symbol||"Unknown"}
          </wui-text>
        </wui-flex>

        ${this.quote&&this.quote.fees.length>0?this.quote.fees.map(a=>this.renderFee(a)):null}
      </wui-flex>
    `}renderFee(a){let b="network"===a.id,c=t.S.formatNumber(a.amount||"0",{decimals:a.currency.metadata.decimals??0,round:6}).toString();if(b){let b=i.W.getAllRequestedCaipNetworks().find(b=>au.y.isLowerCaseMatch(b.caipNetworkId,a.currency.network));return(0,d.qy)`
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">${a.label}</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-text variant="md-regular" color="primary">
              ${c} ${a.currency.metadata.symbol||"Unknown"}
            </wui-text>

            <wui-flex alignItems="center" gap="01">
              <wui-image
                src=${(0,f.J)(Y.$.getNetworkImage(b))}
                size="xs"
              ></wui-image>
              <wui-text variant="sm-regular" color="secondary">
                ${b?.name||"Unknown"}
              </wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      `}return(0,d.qy)`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-text variant="md-regular" color="secondary">${a.label}</wui-text>
        <wui-text variant="md-regular" color="primary">
          ${c} ${a.currency.metadata.symbol||"Unknown"}
        </wui-text>
      </wui-flex>
    `}};bn.styles=[bl],bm([(0,e.wk)()],bn.prototype,"quote",void 0),bn=bm([(0,K.EM)("w3m-pay-fees")],bn);let bo=(0,K.AH)`
  :host {
    display: block;
    width: 100%;
  }

  .disabled-container {
    padding: ${({spacing:a})=>a[2]};
    min-height: 168px;
  }

  wui-icon {
    width: ${({spacing:a})=>a[8]};
    height: ${({spacing:a})=>a[8]};
  }

  wui-flex > wui-text {
    max-width: 273px;
  }
`;var bp=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bq=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.selectedExchange=a0.state.selectedExchange,this.unsubscribe.push(a0.subscribeKey("selectedExchange",a=>this.selectedExchange=a))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){let a=!!this.selectedExchange;return(0,d.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
        class="disabled-container"
      >
        <wui-icon name="coins" color="default" size="inherit"></wui-icon>

        <wui-text variant="md-regular" color="primary" align="center">
          You don't have enough funds to complete this transaction
        </wui-text>

        ${a?null:(0,d.qy)`<wui-button
              size="md"
              variant="neutral-secondary"
              @click=${this.dispatchConnectOtherWalletEvent.bind(this)}
              >Connect other wallet</wui-button
            >`}
      </wui-flex>
    `}dispatchConnectOtherWalletEvent(){this.dispatchEvent(new CustomEvent("connectOtherWallet",{detail:!0,bubbles:!0,composed:!0}))}};bq.styles=[bo],bp([(0,e.MZ)({type:Array})],bq.prototype,"selectedExchange",void 0),bq=bp([(0,K.EM)("w3m-pay-options-empty")],bq);let br=(0,K.AH)`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    border-radius: ${({borderRadius:a})=>a[4]};
    padding: ${({spacing:a})=>a[3]};
    min-height: 60px;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .chain-image {
    position: absolute;
    bottom: -3px;
    right: -5px;
    border: 2px solid ${({tokens:a})=>a.theme.foregroundSecondary};
  }
`,bs=class extends d.WF{render(){return(0,d.qy)`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.renderOptionEntry()} ${this.renderOptionEntry()} ${this.renderOptionEntry()}
      </wui-flex>
    `}renderOptionEntry(){return(0,d.qy)`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-shimmer
              width="32px"
              height="32px"
              rounded
              variant="light"
              class="token-image"
            ></wui-shimmer>
            <wui-shimmer
              width="16px"
              height="16px"
              rounded
              variant="light"
              class="chain-image"
            ></wui-shimmer>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-shimmer
              width="74px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
            <wui-shimmer
              width="46px"
              height="14px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}};bs.styles=[br],bs=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g}([(0,K.EM)("w3m-pay-options-skeleton")],bs);let bt=(0,K.AH)`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    mask-image: var(--options-mask-image);
    -webkit-mask-image: var(--options-mask-image);
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    cursor: pointer;
    border-radius: ${({borderRadius:a})=>a[4]};
    padding: ${({spacing:a})=>a[3]};
    transition: background-color ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-1"]};
    will-change: background-color;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:a})=>a.round};
    width: 32px;
    height: 32px;
  }

  .chain-image {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:a})=>a.round};
    border: 2px solid ${({tokens:a})=>a.theme.backgroundPrimary};
  }

  @media (hover: hover) and (pointer: fine) {
    .pay-option-container:hover {
      background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    }
  }
`;var bu=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bv=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.options=[],this.selectedPaymentAsset=null}disconnectedCallback(){this.unsubscribe.forEach(a=>a()),this.resizeObserver?.disconnect();let a=this.shadowRoot?.querySelector(".pay-options-container");a?.removeEventListener("scroll",this.handleOptionsListScroll.bind(this))}firstUpdated(){let a=this.shadowRoot?.querySelector(".pay-options-container");a&&(requestAnimationFrame(this.handleOptionsListScroll.bind(this)),a?.addEventListener("scroll",this.handleOptionsListScroll.bind(this)),this.resizeObserver=new ResizeObserver(()=>{this.handleOptionsListScroll()}),this.resizeObserver?.observe(a),this.handleOptionsListScroll())}render(){return(0,d.qy)`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.options.map(a=>this.payOptionTemplate(a))}
      </wui-flex>
    `}payOptionTemplate(a){let{network:b,metadata:c,asset:e,amount:g="0"}=a,h=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===b),j=`${b}:${e}`,k=`${this.selectedPaymentAsset?.network}:${this.selectedPaymentAsset?.asset}`,l=t.S.bigNumber(g,{safe:!0}),m=l.gt(0);return(0,d.qy)`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        @click=${()=>this.onSelect?.(a)}
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-image
              src=${(0,f.J)(c.logoURI)}
              class="token-image"
              size="3xl"
            ></wui-image>
            <wui-image
              src=${(0,f.J)(Y.$.getNetworkImage(h))}
              class="chain-image"
              size="md"
            ></wui-image>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-text variant="lg-regular" color="primary">${c.symbol}</wui-text>
            ${m?(0,d.qy)`<wui-text variant="sm-regular" color="secondary">
                  ${l.round(6).toString()} ${c.symbol}
                </wui-text>`:null}
          </wui-flex>
        </wui-flex>

        ${j===k?(0,d.qy)`<wui-icon name="checkmark" size="md" color="success"></wui-icon>`:null}
      </wui-flex>
    `}handleOptionsListScroll(){let a=this.shadowRoot?.querySelector(".pay-options-container");a&&(a.scrollHeight>300?(a.style.setProperty("--options-mask-image",`linear-gradient(
          to bottom,
          rgba(0, 0, 0, calc(1 - var(--options-scroll--top-opacity))) 0px,
          rgba(200, 200, 200, calc(1 - var(--options-scroll--top-opacity))) 1px,
          black 50px,
          black calc(100% - 50px),
          rgba(155, 155, 155, calc(1 - var(--options-scroll--bottom-opacity))) calc(100% - 1px),
          rgba(0, 0, 0, calc(1 - var(--options-scroll--bottom-opacity))) 100%
        )`),a.style.setProperty("--options-scroll--top-opacity",K.z8.interpolate([0,50],[0,1],a.scrollTop).toString()),a.style.setProperty("--options-scroll--bottom-opacity",K.z8.interpolate([0,50],[0,1],a.scrollHeight-a.scrollTop-a.offsetHeight).toString())):(a.style.setProperty("--options-mask-image","none"),a.style.setProperty("--options-scroll--top-opacity","0"),a.style.setProperty("--options-scroll--bottom-opacity","0")))}};bv.styles=[bt],bu([(0,e.MZ)({type:Array})],bv.prototype,"options",void 0),bu([(0,e.MZ)()],bv.prototype,"selectedPaymentAsset",void 0),bu([(0,e.MZ)()],bv.prototype,"onSelect",void 0),bv=bu([(0,K.EM)("w3m-pay-options")],bv);let bw=(0,K.AH)`
  .payment-methods-container {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:a})=>a[5]};
    border-top-left-radius: ${({borderRadius:a})=>a[5]};
  }

  .pay-options-container {
    background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    border-radius: ${({borderRadius:a})=>a[5]};
    padding: ${({spacing:a})=>a[1]};
  }

  w3m-tooltip-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: fit-content;
  }

  wui-image {
    border-radius: ${({borderRadius:a})=>a.round};
  }

  w3m-pay-options.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;var bx=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let by={eip155:"ethereum",solana:"solana",bip122:"bitcoin",ton:"ton"},bz={eip155:{icon:by.eip155,label:"EVM"},solana:{icon:by.solana,label:"Solana"},bip122:{icon:by.bip122,label:"Bitcoin"},ton:{icon:by.ton,label:"Ton"}},bA=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.profileName=null,this.paymentAsset=a0.state.paymentAsset,this.namespace=void 0,this.caipAddress=void 0,this.amount=a0.state.amount,this.recipient=a0.state.recipient,this.activeConnectorIds=j.a.state.activeConnectorIds,this.selectedPaymentAsset=a0.state.selectedPaymentAsset,this.selectedExchange=a0.state.selectedExchange,this.isFetchingQuote=a0.state.isFetchingQuote,this.quoteError=a0.state.quoteError,this.quote=a0.state.quote,this.isFetchingTokenBalances=a0.state.isFetchingTokenBalances,this.tokenBalances=a0.state.tokenBalances,this.isPaymentInProgress=a0.state.isPaymentInProgress,this.exchangeUrlForQuote=a0.state.exchangeUrlForQuote,this.completedTransactionsCount=0,this.unsubscribe.push(a0.subscribeKey("paymentAsset",a=>this.paymentAsset=a)),this.unsubscribe.push(a0.subscribeKey("tokenBalances",a=>this.onTokenBalancesChanged(a))),this.unsubscribe.push(a0.subscribeKey("isFetchingTokenBalances",a=>this.isFetchingTokenBalances=a)),this.unsubscribe.push(j.a.subscribeKey("activeConnectorIds",a=>this.activeConnectorIds=a)),this.unsubscribe.push(a0.subscribeKey("selectedPaymentAsset",a=>this.selectedPaymentAsset=a)),this.unsubscribe.push(a0.subscribeKey("isFetchingQuote",a=>this.isFetchingQuote=a)),this.unsubscribe.push(a0.subscribeKey("quoteError",a=>this.quoteError=a)),this.unsubscribe.push(a0.subscribeKey("quote",a=>this.quote=a)),this.unsubscribe.push(a0.subscribeKey("amount",a=>this.amount=a)),this.unsubscribe.push(a0.subscribeKey("recipient",a=>this.recipient=a)),this.unsubscribe.push(a0.subscribeKey("isPaymentInProgress",a=>this.isPaymentInProgress=a)),this.unsubscribe.push(a0.subscribeKey("selectedExchange",a=>this.selectedExchange=a)),this.unsubscribe.push(a0.subscribeKey("exchangeUrlForQuote",a=>this.exchangeUrlForQuote=a)),this.resetQuoteState(),this.initializeNamespace(),this.fetchTokens()}disconnectedCallback(){super.disconnectedCallback(),this.resetAssetsState(),this.unsubscribe.forEach(a=>a())}updated(a){super.updated(a),a.has("selectedPaymentAsset")&&this.fetchQuote()}render(){return(0,d.qy)`
      <wui-flex flexDirection="column">
        ${this.profileTemplate()}

        <wui-flex
          flexDirection="column"
          gap="4"
          class="payment-methods-container"
          .padding=${["4","4","5","4"]}
        >
          ${this.paymentOptionsViewTemplate()} ${this.amountWithFeeTemplate()}

          <wui-flex
            alignItems="center"
            justifyContent="space-between"
            .padding=${["1","0","1","0"]}
          >
            <wui-separator></wui-separator>
          </wui-flex>

          ${this.paymentActionsTemplate()}
        </wui-flex>
      </wui-flex>
    `}profileTemplate(){if(this.selectedExchange){let a=t.S.formatNumber(this.quote?.origin.amount,{decimals:this.quote?.origin.currency.metadata.decimals??0}).toString();return(0,d.qy)`
        <wui-flex
          .padding=${["4","3","4","3"]}
          alignItems="center"
          justifyContent="space-between"
          gap="2"
        >
          <wui-text variant="lg-regular" color="secondary">Paying with</wui-text>

          ${this.quote?(0,d.qy)`<wui-text variant="lg-regular" color="primary">
                ${t.S.bigNumber(a,{safe:!0}).round(6).toString()}
                ${this.quote.origin.currency.metadata.symbol}
              </wui-text>`:(0,d.qy)`<wui-shimmer width="80px" height="18px" variant="light"></wui-shimmer>`}
        </wui-flex>
      `}let a=z.w.getPlainAddress(this.caipAddress)??"",{name:b,image:c}=this.getWalletProperties({namespace:this.namespace}),{icon:e,label:g}=bz[this.namespace]??{};return(0,d.qy)`
      <wui-flex
        .padding=${["4","3","4","3"]}
        alignItems="center"
        justifyContent="space-between"
        gap="2"
      >
        <wui-wallet-switch
          profileName=${(0,f.J)(this.profileName)}
          address=${(0,f.J)(a)}
          imageSrc=${(0,f.J)(c)}
          alt=${(0,f.J)(b)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>

        <wui-wallet-switch
          profileName=${(0,f.J)(g)}
          address=${(0,f.J)(a)}
          icon=${(0,f.J)(e)}
          iconSize="xs"
          .enableGreenCircle=${!1}
          alt=${(0,f.J)(g)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>
      </wui-flex>
    `}initializeNamespace(){let a=i.W.state.activeChain;this.namespace=a,this.caipAddress=i.W.getAccountData(a)?.caipAddress,this.profileName=i.W.getAccountData(a)?.profileName??null,this.unsubscribe.push(i.W.subscribeChainProp("accountState",a=>this.onAccountStateChanged(a),a))}async fetchTokens(){if(this.namespace){let a;if(this.caipAddress){let{chainId:b,chainNamespace:c}=at.C.parseCaipAddress(this.caipAddress),d=`${c}:${b}`;a=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===d)}await a0.fetchTokens({caipAddress:this.caipAddress,caipNetwork:a,namespace:this.namespace})}}fetchQuote(){if(this.amount&&this.recipient&&this.selectedPaymentAsset&&this.paymentAsset){let{address:a}=this.caipAddress?at.C.parseCaipAddress(this.caipAddress):{};a0.fetchQuote({amount:this.amount.toString(),address:a,sourceToken:this.selectedPaymentAsset,toToken:this.paymentAsset,recipient:this.recipient})}}getWalletProperties({namespace:a}){if(!a)return{name:void 0,image:void 0};let b=this.activeConnectorIds[a];if(!b)return{name:void 0,image:void 0};let c=j.a.getConnector({id:b,namespace:a});if(!c)return{name:void 0,image:void 0};let d=Y.$.getConnectorImage(c);return{name:c.name,image:d}}paymentOptionsViewTemplate(){return(0,d.qy)`
      <wui-flex flexDirection="column" gap="2">
        <wui-text variant="sm-regular" color="secondary">CHOOSE PAYMENT OPTION</wui-text>
        <wui-flex class="pay-options-container">${this.paymentOptionsTemplate()}</wui-flex>
      </wui-flex>
    `}paymentOptionsTemplate(){let a=this.getPaymentAssetFromTokenBalances();if(this.isFetchingTokenBalances)return(0,d.qy)`<w3m-pay-options-skeleton></w3m-pay-options-skeleton>`;if(0===a.length)return(0,d.qy)`<w3m-pay-options-empty
        @connectOtherWallet=${this.onConnectOtherWallet.bind(this)}
      ></w3m-pay-options-empty>`;let b={disabled:this.isFetchingQuote};return(0,d.qy)`<w3m-pay-options
      class=${(0,a4.H)(b)}
      .options=${a}
      .selectedPaymentAsset=${(0,f.J)(this.selectedPaymentAsset)}
      .onSelect=${this.onSelectedPaymentAssetChanged.bind(this)}
    ></w3m-pay-options>`}amountWithFeeTemplate(){return this.isFetchingQuote||!this.selectedPaymentAsset||this.quoteError?(0,d.qy)`<w3m-pay-fees-skeleton></w3m-pay-fees-skeleton>`:(0,d.qy)`<w3m-pay-fees></w3m-pay-fees>`}paymentActionsTemplate(){let a=this.isFetchingQuote||this.isFetchingTokenBalances,b=this.isFetchingQuote||this.isFetchingTokenBalances||!this.selectedPaymentAsset||!!this.quoteError,c=t.S.formatNumber(this.quote?.origin.amount??0,{decimals:this.quote?.origin.currency.metadata.decimals??0}).toString();return this.selectedExchange?a||b?(0,d.qy)`
          <wui-shimmer width="100%" height="48px" variant="light" ?rounded=${!0}></wui-shimmer>
        `:(0,d.qy)`<wui-button
        size="lg"
        fullWidth
        variant="accent-secondary"
        @click=${this.onPayWithExchange.bind(this)}
      >
        ${`Continue in ${this.selectedExchange.name}`}

        <wui-icon name="arrowRight" color="inherit" size="sm" slot="iconRight"></wui-icon>
      </wui-button>`:(0,d.qy)`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-flex flexDirection="column" gap="1">
          <wui-text variant="md-regular" color="secondary">Order Total</wui-text>

          ${a||b?(0,d.qy)`<wui-shimmer width="58px" height="32px" variant="light"></wui-shimmer>`:(0,d.qy)`<wui-flex alignItems="center" gap="01">
                <wui-text variant="h4-regular" color="primary">${aW(c)}</wui-text>

                <wui-text variant="lg-regular" color="secondary">
                  ${this.quote?.origin.currency.metadata.symbol||"Unknown"}
                </wui-text>
              </wui-flex>`}
        </wui-flex>

        ${this.actionButtonTemplate({isLoading:a,isDisabled:b})}
      </wui-flex>
    `}actionButtonTemplate(a){let b=aH(this.quote),{isLoading:c,isDisabled:e}=a,f="Pay";return b.length>1&&0===this.completedTransactionsCount&&(f="Approve"),(0,d.qy)`
      <wui-button
        size="lg"
        variant="accent-primary"
        ?loading=${c||this.isPaymentInProgress}
        ?disabled=${e||this.isPaymentInProgress}
        @click=${()=>{b.length>0?this.onSendTransactions():this.onTransfer()}}
      >
        ${f}
        ${c?null:(0,d.qy)`<wui-icon
              name="arrowRight"
              color="inherit"
              size="sm"
              slot="iconRight"
            ></wui-icon>`}
      </wui-button>
    `}getPaymentAssetFromTokenBalances(){return this.namespace?(this.tokenBalances[this.namespace]??[]).map(a=>{try{let b=i.W.getAllRequestedCaipNetworks().find(b=>b.caipNetworkId===a.chainId),c=a.address;if(!b)throw Error(`Target network not found for balance chainId "${a.chainId}"`);if(au.y.isLowerCaseMatch(a.symbol,b.nativeCurrency.symbol))c="native";else if(z.w.isCaipAddress(c)){let{address:a}=at.C.parseCaipAddress(c);c=a}else if(!c)throw Error(`Balance address not found for balance symbol "${a.symbol}"`);return{network:b.caipNetworkId,asset:c,metadata:{name:a.name,symbol:a.symbol,decimals:Number(a.quantity.decimals),logoURI:a.iconUrl},amount:a.quantity.numeric}}catch(a){return null}}).filter(a=>!!a).filter(a=>{let{chainId:b}=at.C.parseCaipNetworkId(a.network),{chainId:c}=at.C.parseCaipNetworkId(this.paymentAsset.network);return!!au.y.isLowerCaseMatch(a.asset,this.paymentAsset.asset)||!this.selectedExchange||!au.y.isLowerCaseMatch(b.toString(),c.toString())}):[]}onTokenBalancesChanged(a){this.tokenBalances=a;let[b]=this.getPaymentAssetFromTokenBalances();b&&a0.setSelectedPaymentAsset(b)}async onConnectOtherWallet(){await j.a.connect(),await h.W.open({view:"PayQuote"})}onAccountStateChanged(a){let{address:b}=this.caipAddress?at.C.parseCaipAddress(this.caipAddress):{};if(this.caipAddress=a?.caipAddress,this.profileName=a?.profileName??null,b){let{address:a}=this.caipAddress?at.C.parseCaipAddress(this.caipAddress):{};a?au.y.isLowerCaseMatch(a,b)||(this.resetAssetsState(),this.resetQuoteState(),this.fetchTokens()):h.W.close()}}onSelectedPaymentAssetChanged(a){this.isFetchingQuote||a0.setSelectedPaymentAsset(a)}async onTransfer(){let a=aG(this.quote);if(a){if(!au.y.isLowerCaseMatch(this.selectedPaymentAsset?.asset,a.deposit.currency))throw Error("Quote asset is not the same as the selected payment asset");let b=this.selectedPaymentAsset?.amount??"0",c=t.S.formatNumber(a.deposit.amount,{decimals:this.selectedPaymentAsset?.metadata.decimals??0}).toString();if(!t.S.bigNumber(b).gte(c))return void q.P.showError("Insufficient funds");if(this.quote&&this.selectedPaymentAsset&&this.caipAddress&&this.namespace){let{address:b}=at.C.parseCaipAddress(this.caipAddress);await a0.onTransfer({chainNamespace:this.namespace,fromAddress:b,toAddress:a.deposit.receiver,amount:c,paymentAsset:this.selectedPaymentAsset}),a0.setRequestId(a.requestId),l.I.push("PayLoading")}}}async onSendTransactions(){let a=this.selectedPaymentAsset?.amount??"0",b=t.S.formatNumber(this.quote?.origin.amount??0,{decimals:this.selectedPaymentAsset?.metadata.decimals??0}).toString();if(!t.S.bigNumber(a).gte(b))return void q.P.showError("Insufficient funds");let c=aH(this.quote),[d]=aH(this.quote,this.completedTransactionsCount);d&&this.namespace&&(await a0.onSendTransaction({namespace:this.namespace,transactionStep:d}),this.completedTransactionsCount+=1,this.completedTransactionsCount===c.length&&(a0.setRequestId(d.requestId),l.I.push("PayLoading")))}onPayWithExchange(){if(this.exchangeUrlForQuote){let a=z.w.returnOpenHref("","popupWindow","scrollbar=yes,width=480,height=720");if(!a)throw Error("Could not create popup window");a.location.href=this.exchangeUrlForQuote;let b=aG(this.quote);b&&a0.setRequestId(b.requestId),a0.initiatePayment(),l.I.push("PayLoading")}}resetAssetsState(){a0.setSelectedPaymentAsset(null)}resetQuoteState(){a0.resetQuoteState()}};bA.styles=bw,bx([(0,e.wk)()],bA.prototype,"profileName",void 0),bx([(0,e.wk)()],bA.prototype,"paymentAsset",void 0),bx([(0,e.wk)()],bA.prototype,"namespace",void 0),bx([(0,e.wk)()],bA.prototype,"caipAddress",void 0),bx([(0,e.wk)()],bA.prototype,"amount",void 0),bx([(0,e.wk)()],bA.prototype,"recipient",void 0),bx([(0,e.wk)()],bA.prototype,"activeConnectorIds",void 0),bx([(0,e.wk)()],bA.prototype,"selectedPaymentAsset",void 0),bx([(0,e.wk)()],bA.prototype,"selectedExchange",void 0),bx([(0,e.wk)()],bA.prototype,"isFetchingQuote",void 0),bx([(0,e.wk)()],bA.prototype,"quoteError",void 0),bx([(0,e.wk)()],bA.prototype,"quote",void 0),bx([(0,e.wk)()],bA.prototype,"isFetchingTokenBalances",void 0),bx([(0,e.wk)()],bA.prototype,"tokenBalances",void 0),bx([(0,e.wk)()],bA.prototype,"isPaymentInProgress",void 0),bx([(0,e.wk)()],bA.prototype,"exchangeUrlForQuote",void 0),bx([(0,e.wk)()],bA.prototype,"completedTransactionsCount",void 0),bA=bx([(0,K.EM)("w3m-pay-quote-view")],bA);let bB=(0,K.AH)`
  wui-image {
    border-radius: ${({borderRadius:a})=>a.round};
  }

  .transfers-badge {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    border: 1px solid ${({tokens:a})=>a.theme.foregroundSecondary};
    border-radius: ${({borderRadius:a})=>a[4]};
  }
`;var bC=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bD=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.paymentAsset=a0.state.paymentAsset,this.amount=a0.state.amount,this.unsubscribe.push(a0.subscribeKey("paymentAsset",a=>{this.paymentAsset=a}),a0.subscribeKey("amount",a=>{this.amount=a}))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){let a=i.W.getAllRequestedCaipNetworks().find(a=>a.caipNetworkId===this.paymentAsset.network);return(0,d.qy)`<wui-flex
      alignItems="center"
      gap="1"
      .padding=${["1","2","1","1"]}
      class="transfers-badge"
    >
      <wui-image src=${(0,f.J)(this.paymentAsset.metadata.logoURI)} size="xl"></wui-image>
      <wui-text variant="lg-regular" color="primary">
        ${this.amount} ${this.paymentAsset.metadata.symbol}
      </wui-text>
      <wui-text variant="sm-regular" color="secondary">
        on ${a?.name??"Unknown"}
      </wui-text>
    </wui-flex>`}};bD.styles=[bB],bC([(0,e.MZ)()],bD.prototype,"paymentAsset",void 0),bC([(0,e.MZ)()],bD.prototype,"amount",void 0),bD=bC([(0,K.EM)("w3m-pay-header")],bD);let bE=(0,K.AH)`
  :host {
    height: 60px;
  }

  :host > wui-flex {
    box-sizing: border-box;
    background-color: var(--local-header-background-color);
  }

  wui-text {
    background-color: var(--local-header-background-color);
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards ${({easings:a})=>a["ease-out-power-2"]},
      slide-down-in 120ms forwards ${({easings:a})=>a["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards ${({easings:a})=>a["ease-out-power-2"]},
      slide-up-in 120ms forwards ${({easings:a})=>a["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-icon-button[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;var bF=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bG=["SmartSessionList"],bH={PayWithExchange:K.f.tokens.theme.foregroundPrimary};function bI(){let a=l.I.state.data?.connector?.name,b=l.I.state.data?.wallet?.name,c=l.I.state.data?.network?.name,d=b??a,e=j.a.getConnectors(),f=1===e.length&&e[0]?.id==="w3m-email",g=i.W.getAccountData()?.socialProvider;return{Connect:`Connect ${f?"Email":""} Wallet`,Create:"Create Wallet",ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:"All Wallets",ApproveTransaction:"Approve Transaction",BuyInProgress:"Buy",UsageExceeded:"Usage Exceeded",ConnectingExternal:d??"Connect Wallet",ConnectingWalletConnect:d??"WalletConnect",ConnectingWalletConnectBasic:"WalletConnect",ConnectingSiwe:"Sign In",Convert:"Convert",ConvertSelectToken:"Select token",ConvertPreview:"Preview Convert",Downloads:d?`Get ${d}`:"Downloads",EmailLogin:"Email Login",EmailVerifyOtp:"Confirm Email",EmailVerifyDevice:"Register Device",GetWallet:"Get a Wallet",Networks:"Choose Network",OnRampProviders:"Choose Provider",OnRampActivity:"Activity",OnRampTokenSelect:"Select Token",OnRampFiatSelect:"Select Currency",Pay:"How you pay",ProfileWallets:"Wallets",SwitchNetwork:c??"Switch Network",Transactions:"Activity",UnsupportedChain:"Switch Network",UpgradeEmailWallet:"Upgrade Your Wallet",UpdateEmailWallet:"Edit Email",UpdateEmailPrimaryOtp:"Confirm Current Email",UpdateEmailSecondaryOtp:"Confirm New Email",WhatIsABuy:"What is Buy?",RegisterAccountName:"Choose Name",RegisterAccountNameSuccess:"",WalletReceive:"Receive",WalletCompatibleNetworks:"Compatible Networks",Swap:"Swap",SwapSelectToken:"Select Token",SwapPreview:"Preview Swap",WalletSend:"Send",WalletSendPreview:"Review Send",WalletSendSelectToken:"Select Token",WalletSendConfirmed:"Confirmed",WhatIsANetwork:"What is a network?",WhatIsAWallet:"What is a Wallet?",ConnectWallets:"Connect Wallet",ConnectSocials:"All Socials",ConnectingSocial:g?g.charAt(0).toUpperCase()+g.slice(1):"Connect Social",ConnectingMultiChain:"Select Chain",ConnectingFarcaster:"Farcaster",SwitchActiveChain:"Switch Chain",SmartSessionCreated:void 0,SmartSessionList:"Smart Sessions",SIWXSignMessage:"Sign In",PayLoading:"Processing payment...",PayQuote:"Payment Quote",DataCapture:"Profile",DataCaptureOtpConfirm:"Confirm Email",FundWallet:"Fund Wallet",PayWithExchange:"Deposit from Exchange",PayWithExchangeSelectAsset:"Select Asset",SmartAccountSettings:"Smart Account Settings"}}let bJ=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.heading=bI()[l.I.state.view],this.network=i.W.state.activeCaipNetwork,this.networkImage=Y.$.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=l.I.state.view,this.viewDirection="",this.unsubscribe.push(Z.j.subscribeNetworkImages(()=>{this.networkImage=Y.$.getNetworkImage(this.network)}),l.I.subscribeKey("view",a=>{setTimeout(()=>{this.view=a,this.heading=bI()[a]},ag.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),i.W.subscribeKey("activeCaipNetwork",a=>{this.network=a,this.networkImage=Y.$.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(a=>a())}render(){let a=bH[l.I.state.view]??K.f.tokens.theme.backgroundPrimary;return this.style.setProperty("--local-header-background-color",a),(0,d.qy)`
      <wui-flex
        .padding=${["0","4","0","4"]}
        justifyContent="space-between"
        alignItems="center"
      >
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){F.E.sendEvent({type:"track",event:"CLICK_WALLET_HELP"}),l.I.push("WhatIsAWallet")}async onClose(){await o.safeClose()}rightHeaderTemplate(){let a=g.H?.state?.features?.smartSessions;return"Account"===l.I.state.view&&a?(0,d.qy)`<wui-flex>
      <wui-icon-button
        icon="clock"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${()=>l.I.push("SmartSessionList")}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-button>
      ${this.closeButtonTemplate()}
    </wui-flex> `:this.closeButtonTemplate()}closeButtonTemplate(){return(0,d.qy)`
      <wui-icon-button
        icon="close"
        size="lg"
        type="neutral"
        variant="primary"
        iconSize="lg"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-button>
    `}titleTemplate(){if("PayQuote"===this.view)return(0,d.qy)`<w3m-pay-header></w3m-pay-header>`;let a=bG.includes(this.view);return(0,d.qy)`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="2"
      >
        <wui-text
          display="inline"
          variant="lg-regular"
          color="primary"
          data-testid="w3m-header-text"
        >
          ${this.heading}
        </wui-text>
        ${a?(0,d.qy)`<wui-tag variant="accent" size="md">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){let{view:a}=l.I.state,b="Connect"===a,c=g.H.state.enableEmbedded,e=g.H.state.enableNetworkSwitch;return"Account"===a&&e?(0,d.qy)`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${(0,f.J)(this.network?.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${(0,f.J)(this.networkImage)}
      ></wui-select>`:this.showBack&&!("ApproveTransaction"===a||"ConnectingSiwe"===a||b&&c)?(0,d.qy)`<wui-icon-button
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-button>`:(0,d.qy)`<wui-icon-button
      data-hidden=${!b}
      id="dynamic"
      icon="helpCircle"
      size="lg"
      iconSize="lg"
      type="neutral"
      variant="primary"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-button>`}onNetworks(){this.isAllowedNetworkSwitch()&&(F.E.sendEvent({type:"track",event:"CLICK_NETWORKS"}),l.I.push("Networks"))}isAllowedNetworkSwitch(){let a=i.W.getAllRequestedCaipNetworks(),b=!!a&&a.length>1,c=a?.find(({id:a})=>a===this.network?.id);return b||!c}onViewChange(){let{history:a}=l.I.state,b=ag.VIEW_DIRECTION.Next;a.length<this.prevHistoryLength&&(b=ag.VIEW_DIRECTION.Prev),this.prevHistoryLength=a.length,this.viewDirection=b}async onHistoryChange(){let{history:a}=l.I.state,b=this.shadowRoot?.querySelector("#dynamic");a.length>1&&!this.showBack&&b?(await b.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!0,b.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"})):a.length<=1&&this.showBack&&b&&(await b.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!1,b.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}onGoBack(){l.I.goBack()}};bJ.styles=bE,bF([(0,e.wk)()],bJ.prototype,"heading",void 0),bF([(0,e.wk)()],bJ.prototype,"network",void 0),bF([(0,e.wk)()],bJ.prototype,"networkImage",void 0),bF([(0,e.wk)()],bJ.prototype,"showBack",void 0),bF([(0,e.wk)()],bJ.prototype,"prevHistoryLength",void 0),bF([(0,e.wk)()],bJ.prototype,"view",void 0),bF([(0,e.wk)()],bJ.prototype,"viewDirection",void 0),bJ=bF([(0,K.EM)("w3m-header")],bJ),c(41005),c(47032);let bK=(0,N.AH)`
  :host {
    display: flex;
    align-items: center;
    gap: ${({spacing:a})=>a[1]};
    padding: ${({spacing:a})=>a[2]} ${({spacing:a})=>a[3]}
      ${({spacing:a})=>a[2]} ${({spacing:a})=>a[2]};
    border-radius: ${({borderRadius:a})=>a[20]};
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
    box-shadow:
      0px 0px 8px 0px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px ${({tokens:a})=>a.theme.borderPrimary};
    max-width: 320px;
  }

  wui-icon-box {
    border-radius: ${({borderRadius:a})=>a.round} !important;
    overflow: hidden;
  }

  wui-loading-spinner {
    padding: ${({spacing:a})=>a[1]};
    background-color: ${({tokens:a})=>a.core.foregroundAccent010};
    border-radius: ${({borderRadius:a})=>a.round} !important;
  }
`;var bL=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bM=class extends d.WF{constructor(){super(...arguments),this.message="",this.variant="success"}render(){return(0,d.qy)`
      ${this.templateIcon()}
      <wui-text variant="lg-regular" color="primary" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){return"loading"===this.variant?(0,d.qy)`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:(0,d.qy)`<wui-icon-box
      size="md"
      color=${({success:"success",error:"error",warning:"warning",info:"default"})[this.variant]}
      icon=${({success:"checkmark",error:"warning",warning:"warningCircle",info:"info"})[this.variant]}
    ></wui-icon-box>`}};bM.styles=[L.W5,bK],bL([(0,e.MZ)()],bM.prototype,"message",void 0),bL([(0,e.MZ)()],bM.prototype,"variant",void 0),bM=bL([(0,M.E)("wui-snackbar")],bM);let bN=(0,d.AH)`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`;var bO=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bP=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=q.P.state.open,this.unsubscribe.push(q.P.subscribeKey("open",a=>{this.open=a,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(a=>a())}render(){let{message:a,variant:b}=q.P.state;return(0,d.qy)` <wui-snackbar message=${a} variant=${b}></wui-snackbar> `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:"translateX(-50%) scale(0.85)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.timeout&&clearTimeout(this.timeout),q.P.state.autoClose&&(this.timeout=setTimeout(()=>q.P.hide(),2500))):this.animate([{opacity:1,transform:"translateX(-50%) scale(1)"},{opacity:0,transform:"translateX(-50%) scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"})}};bP.styles=bN,bO([(0,e.wk)()],bP.prototype,"open",void 0),bP=bO([(0,K.EM)("w3m-snackbar")],bP);let bQ=(0,r.BX)({message:"",open:!1,triggerRect:{width:0,height:0,top:0,left:0},variant:"shade"}),bR=(0,C.X)({state:bQ,subscribe:a=>(0,r.B1)(bQ,()=>a(bQ)),subscribeKey:(a,b)=>(0,s.u$)(bQ,a,b),showTooltip({message:a,triggerRect:b,variant:c}){bQ.open=!0,bQ.message=a,bQ.triggerRect=b,bQ.variant=c},hide(){bQ.open=!1,bQ.message="",bQ.triggerRect={width:0,height:0,top:0,left:0}}}),bS=(0,d.AH)`
  :host {
    width: 100%;
    display: block;
  }
`;var bT=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bU=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.text="",this.open=bR.state.open,this.unsubscribe.push(l.I.subscribeKey("view",()=>{bR.hide()}),h.W.subscribeKey("open",a=>{a||bR.hide()}),bR.subscribeKey("open",a=>{this.open=a}))}disconnectedCallback(){this.unsubscribe.forEach(a=>a()),bR.hide()}render(){return(0,d.qy)`
      <div
        @pointermove=${this.onMouseEnter.bind(this)}
        @pointerleave=${this.onMouseLeave.bind(this)}
      >
        ${this.renderChildren()}
      </div>
    `}renderChildren(){return(0,d.qy)`<slot></slot> `}onMouseEnter(){let a=this.getBoundingClientRect();if(!this.open){let b=document.querySelector("w3m-modal"),c={width:a.width,height:a.height,left:a.left,top:a.top};if(b){let d=b.getBoundingClientRect();c.left=a.left-(window.innerWidth-d.width)/2,c.top=a.top-(window.innerHeight-d.height)/2}bR.showTooltip({message:this.text,triggerRect:c,variant:"shade"})}}onMouseLeave(a){this.contains(a.relatedTarget)||bR.hide()}};bU.styles=[bS],bT([(0,e.MZ)()],bU.prototype,"text",void 0),bT([(0,e.wk)()],bU.prototype,"open",void 0),bU=bT([(0,K.EM)("w3m-tooltip-trigger")],bU);let bV=(0,K.AH)`
  :host {
    pointer-events: none;
  }

  :host > wui-flex {
    display: var(--w3m-tooltip-display);
    opacity: var(--w3m-tooltip-opacity);
    padding: 9px ${({spacing:a})=>a["3"]} 10px ${({spacing:a})=>a["3"]};
    border-radius: ${({borderRadius:a})=>a["3"]};
    color: ${({tokens:a})=>a.theme.backgroundPrimary};
    position: absolute;
    top: var(--w3m-tooltip-top);
    left: var(--w3m-tooltip-left);
    transform: translate(calc(-50% + var(--w3m-tooltip-parent-width)), calc(-100% - 8px));
    max-width: calc(var(--apkt-modal-width) - ${({spacing:a})=>a["5"]});
    transition: opacity ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-2"]};
    will-change: opacity;
    opacity: 0;
    animation-duration: ${({durations:a})=>a.xl};
    animation-timing-function: ${({easings:a})=>a["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  :host([data-variant='shade']) > wui-flex {
    background-color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  :host([data-variant='shade']) > wui-flex > wui-text {
    color: ${({tokens:a})=>a.theme.textSecondary};
  }

  :host([data-variant='fill']) > wui-flex {
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    border: 1px solid ${({tokens:a})=>a.theme.borderPrimary};
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
    color: ${({tokens:a})=>a.theme.foregroundPrimary};
  }

  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var bW=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let bX=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.open=bR.state.open,this.message=bR.state.message,this.triggerRect=bR.state.triggerRect,this.variant=bR.state.variant,this.unsubscribe.push(bR.subscribe(a=>{this.open=a.open,this.message=a.message,this.triggerRect=a.triggerRect,this.variant=a.variant}))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){this.dataset.variant=this.variant;let a=this.triggerRect.top,b=this.triggerRect.left;return this.style.cssText=`
    --w3m-tooltip-top: ${a}px;
    --w3m-tooltip-left: ${b}px;
    --w3m-tooltip-parent-width: ${this.triggerRect.width/2}px;
    --w3m-tooltip-display: ${this.open?"flex":"none"};
    --w3m-tooltip-opacity: ${+!!this.open};
    `,(0,d.qy)`<wui-flex>
      <wui-icon data-placement="top" size="inherit" name="cursor"></wui-icon>
      <wui-text color="primary" variant="sm-regular">${this.message}</wui-text>
    </wui-flex>`}};bX.styles=[bV],bW([(0,e.wk)()],bX.prototype,"open",void 0),bW([(0,e.wk)()],bX.prototype,"message",void 0),bW([(0,e.wk)()],bX.prototype,"triggerRect",void 0),bW([(0,e.wk)()],bX.prototype,"variant",void 0),bX=bW([(0,K.EM)("w3m-tooltip")],bX);let bY={getTabsByNamespace:a=>a&&a===u.o.CHAIN.EVM?g.H.state.remoteFeatures?.activity===!1?ag.ACCOUNT_TABS.filter(a=>"Activity"!==a.label):ag.ACCOUNT_TABS:[],isValidReownName:a=>/^[a-zA-Z0-9]+$/gu.test(a),isValidEmail:a=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/gu.test(a),validateReownName:a=>a.replace(/\^/gu,"").toLowerCase().replace(/[^a-zA-Z0-9]/gu,""),hasFooter(){let a=l.I.state.view;if(ag.VIEWS_WITH_LEGAL_FOOTER.includes(a)){let{termsConditionsUrl:a,privacyPolicyUrl:b}=g.H.state,c=g.H.state.features?.legalCheckbox;return(!!a||!!b)&&!c}return ag.VIEWS_WITH_DEFAULT_FOOTER.includes(a)}};c(80954);let bZ=(0,K.AH)`
  :host wui-ux-by-reown {
    padding-top: 0;
  }

  :host wui-ux-by-reown.branding-only {
    padding-top: ${({spacing:a})=>a["3"]};
  }

  a {
    text-decoration: none;
    color: ${({tokens:a})=>a.core.textAccentPrimary};
    font-weight: 500;
  }
`;var b$=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let b_=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.remoteFeatures=g.H.state.remoteFeatures,this.unsubscribe.push(g.H.subscribeKey("remoteFeatures",a=>this.remoteFeatures=a))}disconnectedCallback(){this.unsubscribe.forEach(a=>a())}render(){let{termsConditionsUrl:a,privacyPolicyUrl:b}=g.H.state,c=g.H.state.features?.legalCheckbox;return(a||b)&&!c?(0,d.qy)`
      <wui-flex flexDirection="column">
        <wui-flex .padding=${["4","3","3","3"]} justifyContent="center">
          <wui-text color="secondary" variant="md-regular" align="center">
            By connecting your wallet, you agree to our <br />
            ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
          </wui-text>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `:(0,d.qy)`
        <wui-flex flexDirection="column"> ${this.reownBrandingTemplate(!0)} </wui-flex>
      `}andTemplate(){let{termsConditionsUrl:a,privacyPolicyUrl:b}=g.H.state;return a&&b?"and":""}termsTemplate(){let{termsConditionsUrl:a}=g.H.state;return a?(0,d.qy)`<a href=${a} target="_blank" rel="noopener noreferrer"
      >Terms of Service</a
    >`:null}privacyTemplate(){let{privacyPolicyUrl:a}=g.H.state;return a?(0,d.qy)`<a href=${a} target="_blank" rel="noopener noreferrer"
      >Privacy Policy</a
    >`:null}reownBrandingTemplate(a=!1){return this.remoteFeatures?.reownBranding?a?(0,d.qy)`<wui-ux-by-reown class="branding-only"></wui-ux-by-reown>`:(0,d.qy)`<wui-ux-by-reown></wui-ux-by-reown>`:null}};b_.styles=[bZ],b$([(0,e.wk)()],b_.prototype,"remoteFeatures",void 0),b_=b$([(0,K.EM)("w3m-legal-footer")],b_),c(11140);let b0=(0,d.AH)``,b1=class extends d.WF{render(){let{termsConditionsUrl:a,privacyPolicyUrl:b}=g.H.state;return a||b?(0,d.qy)`
      <wui-flex
        .padding=${["4","3","3","3"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
      >
        <wui-text color="secondary" variant="md-regular" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `:null}howDoesItWorkTemplate(){return(0,d.qy)` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){F.E.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:(0,x.lj)(i.W.state.activeChain)===v.Vl.ACCOUNT_TYPES.SMART_ACCOUNT}}),l.I.push("WhatIsABuy")}};b1.styles=[b0],b1=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g}([(0,K.EM)("w3m-onramp-providers-footer")],b1);let b2=(0,K.AH)`
  :host {
    display: block;
  }

  div.container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    height: auto;
    display: block;
  }

  div.container[status='hide'] {
    animation: fade-out;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:a})=>a["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: 0s;
  }

  div.container[status='show'] {
    animation: fade-in;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:a})=>a["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      filter: blur(6px);
    }
    to {
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
      filter: blur(0px);
    }
    to {
      opacity: 0;
      filter: blur(6px);
    }
  }
`;var b3=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let b4=class extends d.WF{constructor(){super(...arguments),this.resizeObserver=void 0,this.unsubscribe=[],this.status="hide",this.view=l.I.state.view}firstUpdated(){this.status=bY.hasFooter()?"show":"hide",this.unsubscribe.push(l.I.subscribeKey("view",a=>{this.view=a,this.status=bY.hasFooter()?"show":"hide","hide"===this.status&&document.documentElement.style.setProperty("--apkt-footer-height","0px")})),this.resizeObserver=new ResizeObserver(a=>{for(let b of a)if(b.target===this.getWrapper()){let a=`${b.contentRect.height}px`;document.documentElement.style.setProperty("--apkt-footer-height",a)}}),this.resizeObserver.observe(this.getWrapper())}render(){return(0,d.qy)`
      <div class="container" status=${this.status}>${this.templatePageContainer()}</div>
    `}templatePageContainer(){return bY.hasFooter()?(0,d.qy)` ${this.templateFooter()}`:null}templateFooter(){switch(this.view){case"Networks":return this.templateNetworksFooter();case"Connect":case"ConnectWallets":case"OnRampFiatSelect":case"OnRampTokenSelect":return(0,d.qy)`<w3m-legal-footer></w3m-legal-footer>`;case"OnRampProviders":return(0,d.qy)`<w3m-onramp-providers-footer></w3m-onramp-providers-footer>`;default:return null}}templateNetworksFooter(){return(0,d.qy)` <wui-flex
      class="footer-in"
      padding="3"
      flexDirection="column"
      gap="3"
      alignItems="center"
    >
      <wui-text variant="md-regular" color="secondary" align="center">
        Your connected wallet may not support some of the networks available for this dApp
      </wui-text>
      <wui-link @click=${this.onNetworkHelp.bind(this)}>
        <wui-icon size="sm" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
        What is a network
      </wui-link>
    </wui-flex>`}onNetworkHelp(){F.E.sendEvent({type:"track",event:"CLICK_NETWORK_HELP"}),l.I.push("WhatIsANetwork")}getWrapper(){return this.shadowRoot?.querySelector("div.container")}};b4.styles=[b2],b3([(0,e.wk)()],b4.prototype,"status",void 0),b3([(0,e.wk)()],b4.prototype,"view",void 0),b4=b3([(0,K.EM)("w3m-footer")],b4);let b5=(0,K.AH)`
  :host {
    display: block;
    width: inherit;
  }
`;var b6=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let b7=class extends d.WF{constructor(){super(),this.unsubscribe=[],this.viewState=l.I.state.view,this.history=l.I.state.history.join(","),this.unsubscribe.push(l.I.subscribeKey("view",()=>{this.history=l.I.state.history.join(","),document.documentElement.style.setProperty("--apkt-duration-dynamic","var(--apkt-durations-lg)")}))}disconnectedCallback(){this.unsubscribe.forEach(a=>a()),document.documentElement.style.setProperty("--apkt-duration-dynamic","0s")}render(){return(0,d.qy)`${this.templatePageContainer()}`}templatePageContainer(){return(0,d.qy)`<w3m-router-container
      history=${this.history}
      .setView=${()=>{this.viewState=l.I.state.view}}
    >
      ${this.viewTemplate(this.viewState)}
    </w3m-router-container>`}viewTemplate(a){switch(a){case"AccountSettings":return(0,d.qy)`<w3m-account-settings-view></w3m-account-settings-view>`;case"Account":return(0,d.qy)`<w3m-account-view></w3m-account-view>`;case"AllWallets":return(0,d.qy)`<w3m-all-wallets-view></w3m-all-wallets-view>`;case"ApproveTransaction":return(0,d.qy)`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case"BuyInProgress":return(0,d.qy)`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case"ChooseAccountName":return(0,d.qy)`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case"Connect":default:return(0,d.qy)`<w3m-connect-view></w3m-connect-view>`;case"Create":return(0,d.qy)`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case"ConnectingWalletConnect":return(0,d.qy)`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case"ConnectingWalletConnectBasic":return(0,d.qy)`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case"ConnectingExternal":return(0,d.qy)`<w3m-connecting-external-view></w3m-connecting-external-view>`;case"ConnectingSiwe":return(0,d.qy)`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case"ConnectWallets":return(0,d.qy)`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case"ConnectSocials":return(0,d.qy)`<w3m-connect-socials-view></w3m-connect-socials-view>`;case"ConnectingSocial":return(0,d.qy)`<w3m-connecting-social-view></w3m-connecting-social-view>`;case"DataCapture":return(0,d.qy)`<w3m-data-capture-view></w3m-data-capture-view>`;case"DataCaptureOtpConfirm":return(0,d.qy)`<w3m-data-capture-otp-confirm-view></w3m-data-capture-otp-confirm-view>`;case"Downloads":return(0,d.qy)`<w3m-downloads-view></w3m-downloads-view>`;case"EmailLogin":return(0,d.qy)`<w3m-email-login-view></w3m-email-login-view>`;case"EmailVerifyOtp":return(0,d.qy)`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case"EmailVerifyDevice":return(0,d.qy)`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case"GetWallet":return(0,d.qy)`<w3m-get-wallet-view></w3m-get-wallet-view>`;case"Networks":return(0,d.qy)`<w3m-networks-view></w3m-networks-view>`;case"SwitchNetwork":return(0,d.qy)`<w3m-network-switch-view></w3m-network-switch-view>`;case"ProfileWallets":return(0,d.qy)`<w3m-profile-wallets-view></w3m-profile-wallets-view>`;case"Transactions":return(0,d.qy)`<w3m-transactions-view></w3m-transactions-view>`;case"OnRampProviders":return(0,d.qy)`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case"OnRampTokenSelect":return(0,d.qy)`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case"OnRampFiatSelect":return(0,d.qy)`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case"UpgradeEmailWallet":return(0,d.qy)`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case"UpdateEmailWallet":return(0,d.qy)`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case"UpdateEmailPrimaryOtp":return(0,d.qy)`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case"UpdateEmailSecondaryOtp":return(0,d.qy)`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case"UnsupportedChain":return(0,d.qy)`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case"Swap":return(0,d.qy)`<w3m-swap-view></w3m-swap-view>`;case"SwapSelectToken":return(0,d.qy)`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case"SwapPreview":return(0,d.qy)`<w3m-swap-preview-view></w3m-swap-preview-view>`;case"WalletSend":return(0,d.qy)`<w3m-wallet-send-view></w3m-wallet-send-view>`;case"WalletSendSelectToken":return(0,d.qy)`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case"WalletSendPreview":return(0,d.qy)`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case"WalletSendConfirmed":return(0,d.qy)`<w3m-send-confirmed-view></w3m-send-confirmed-view>`;case"WhatIsABuy":return(0,d.qy)`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case"WalletReceive":return(0,d.qy)`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case"WalletCompatibleNetworks":return(0,d.qy)`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case"WhatIsAWallet":return(0,d.qy)`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case"ConnectingMultiChain":return(0,d.qy)`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case"WhatIsANetwork":return(0,d.qy)`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case"ConnectingFarcaster":return(0,d.qy)`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case"SwitchActiveChain":return(0,d.qy)`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case"RegisterAccountName":return(0,d.qy)`<w3m-register-account-name-view></w3m-register-account-name-view>`;case"RegisterAccountNameSuccess":return(0,d.qy)`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case"SmartSessionCreated":return(0,d.qy)`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case"SmartSessionList":return(0,d.qy)`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case"SIWXSignMessage":return(0,d.qy)`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case"Pay":return(0,d.qy)`<w3m-pay-view></w3m-pay-view>`;case"PayLoading":return(0,d.qy)`<w3m-pay-loading-view></w3m-pay-loading-view>`;case"PayQuote":return(0,d.qy)`<w3m-pay-quote-view></w3m-pay-quote-view>`;case"FundWallet":return(0,d.qy)`<w3m-fund-wallet-view></w3m-fund-wallet-view>`;case"PayWithExchange":return(0,d.qy)`<w3m-deposit-from-exchange-view></w3m-deposit-from-exchange-view>`;case"PayWithExchangeSelectAsset":return(0,d.qy)`<w3m-deposit-from-exchange-select-asset-view></w3m-deposit-from-exchange-select-asset-view>`;case"UsageExceeded":return(0,d.qy)`<w3m-usage-exceeded-view></w3m-usage-exceeded-view>`;case"SmartAccountSettings":return(0,d.qy)`<w3m-smart-account-settings-view></w3m-smart-account-settings-view>`}}};b7.styles=[b5],b6([(0,e.wk)()],b7.prototype,"viewState",void 0),b6([(0,e.wk)()],b7.prototype,"history",void 0),b7=b6([(0,K.EM)("w3m-router")],b7);let b8=(0,K.AH)`
  :host {
    z-index: ${({tokens:a})=>a.core.zIndex};
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: ${({tokens:a})=>a.theme.overlay};
    backdrop-filter: blur(0px);
    transition:
      opacity ${({durations:a})=>a.lg} ${({easings:a})=>a["ease-out-power-2"]},
      backdrop-filter ${({durations:a})=>a.lg}
        ${({easings:a})=>a["ease-out-power-2"]};
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
    backdrop-filter: blur(8px);
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--apkt-modal-width);
    width: 100%;
    position: relative;
    outline: none;
    transform: translateY(4px);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
    transition:
      transform ${({durations:a})=>a.lg}
        ${({easings:a})=>a["ease-out-power-2"]},
      border-radius ${({durations:a})=>a.lg}
        ${({easings:a})=>a["ease-out-power-1"]},
      background-color ${({durations:a})=>a.lg}
        ${({easings:a})=>a["ease-out-power-1"]},
      box-shadow ${({durations:a})=>a.lg}
        ${({easings:a})=>a["ease-out-power-1"]};
    will-change: border-radius, background-color, transform, box-shadow;
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    padding: var(--local-modal-padding);
    box-sizing: border-box;
  }

  :host(.open) wui-card {
    transform: translateY(0px);
  }

  wui-card::before {
    z-index: 1;
    pointer-events: none;
    content: '';
    position: absolute;
    inset: 0;
    border-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
    transition: box-shadow ${({durations:a})=>a.lg}
      ${({easings:a})=>a["ease-out-power-2"]};
    transition-delay: ${({durations:a})=>a.md};
    will-change: box-shadow;
  }

  :host([data-mobile-fullscreen='true']) wui-card::before {
    border-radius: 0px;
  }

  :host([data-border='true']) wui-card::before {
    box-shadow: inset 0px 0px 0px 4px ${({tokens:a})=>a.theme.foregroundSecondary};
  }

  :host([data-border='false']) wui-card::before {
    box-shadow: inset 0px 0px 0px 1px ${({tokens:a})=>a.theme.borderPrimaryDark};
  }

  :host([data-border='true']) wui-card {
    animation:
      fade-in ${({durations:a})=>a.lg} ${({easings:a})=>a["ease-out-power-2"]},
      card-background-border var(--apkt-duration-dynamic)
        ${({easings:a})=>a["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  :host([data-border='false']) wui-card {
    animation:
      fade-in ${({durations:a})=>a.lg} ${({easings:a})=>a["ease-out-power-2"]},
      card-background-default var(--apkt-duration-dynamic)
        ${({easings:a})=>a["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: 0s;
  }

  :host(.appkit-modal) wui-card {
    max-width: var(--apkt-modal-width);
  }

  wui-card[shake='true'] {
    animation:
      fade-in ${({durations:a})=>a.lg} ${({easings:a})=>a["ease-out-power-2"]},
      w3m-shake ${({durations:a})=>a.xl}
        ${({easings:a})=>a["ease-out-power-2"]};
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--apkt-spacing-6) 0px;
    }
  }

  @media (max-width: 430px) {
    :host([data-mobile-fullscreen='true']) {
      height: 100dvh;
    }
    :host([data-mobile-fullscreen='true']) wui-flex {
      align-items: stretch;
    }
    :host([data-mobile-fullscreen='true']) wui-card {
      max-width: 100%;
      height: 100%;
      border-radius: 0;
      border: none;
    }
    :host(:not([data-mobile-fullscreen='true'])) wui-flex {
      align-items: flex-end;
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card {
      max-width: 100%;
      border-bottom: none;
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card[data-embedded='true'] {
      border-bottom-left-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
      border-bottom-right-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card:not([data-embedded='true']) {
      border-bottom-left-radius: 0px;
      border-bottom-right-radius: 0px;
    }

    wui-card[shake='true'] {
      animation: w3m-shake 0.5s ${({easings:a})=>a["ease-out-power-2"]};
    }
  }

  @keyframes fade-in {
    0% {
      transform: scale(0.99) translateY(4px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes card-background-border {
    from {
      background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    }
    to {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    }
  }

  @keyframes card-background-default {
    from {
      background-color: ${({tokens:a})=>a.theme.foregroundSecondary};
    }
    to {
      background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    }
  }
`;var b9=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let ca="scroll-lock",cb={PayWithExchange:"0",PayWithExchangeSelectAsset:"0",Pay:"0",PayQuote:"0",PayLoading:"0"};class cc extends d.WF{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=g.H.state.enableEmbedded,this.open=h.W.state.open,this.caipAddress=i.W.state.activeCaipAddress,this.caipNetwork=i.W.state.activeCaipNetwork,this.shake=h.W.state.shake,this.filterByNamespace=j.a.state.filterByNamespace,this.padding=K.f.spacing[1],this.mobileFullScreen=g.H.state.enableMobileFullScreen,this.initializeTheming(),k.N.prefetchAnalyticsConfig(),this.unsubscribe.push(h.W.subscribeKey("open",a=>a?this.onOpen():this.onClose()),h.W.subscribeKey("shake",a=>this.shake=a),i.W.subscribeKey("activeCaipNetwork",a=>this.onNewNetwork(a)),i.W.subscribeKey("activeCaipAddress",a=>this.onNewAddress(a)),g.H.subscribeKey("enableEmbedded",a=>this.enableEmbedded=a),j.a.subscribeKey("filterByNamespace",a=>{this.filterByNamespace===a||i.W.getAccountData(a)?.caipAddress||(k.N.fetchRecommendedWallets(),this.filterByNamespace=a)}),l.I.subscribeKey("view",()=>{this.dataset.border=bY.hasFooter()?"true":"false",this.padding=cb[l.I.state.view]??K.f.spacing[1]}))}firstUpdated(){if(this.dataset.border=bY.hasFooter()?"true":"false",this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.caipAddress){if(this.enableEmbedded){h.W.close(),this.prefetch();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(a=>a()),this.onRemoveKeyboardListener()}render(){return(this.style.setProperty("--local-modal-padding",this.padding),this.enableEmbedded)?(0,d.qy)`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?(0,d.qy)`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return(0,d.qy)` <wui-card
      shake="${this.shake}"
      data-embedded="${(0,f.J)(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-footer></w3m-footer>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(a){a.target===a.currentTarget&&(this.mobileFullScreen||await this.handleClose())}async handleClose(){await o.safeClose()}initializeTheming(){let{themeVariables:a,themeMode:b}=p.W.state,c=K.Zv.getColorTheme(b);(0,K.RF)(a,c)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),q.P.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){let a=document.createElement("style");a.dataset.w3m=ca,a.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(a)}onScrollUnlock(){let a=document.head.querySelector(`style[data-w3m="${ca}"]`);a&&a.remove()}onAddKeyboardListener(){this.abortController=new AbortController;let a=this.shadowRoot?.querySelector("wui-card");a?.focus(),window.addEventListener("keydown",b=>{if("Escape"===b.key)this.handleClose();else if("Tab"===b.key){let{tagName:c}=b.target;!c||c.includes("W3M-")||c.includes("WUI-")||a?.focus()}},this.abortController)}onRemoveKeyboardListener(){this.abortController?.abort(),this.abortController=void 0}async onNewAddress(a){let b=i.W.state.isSwitchingNamespace,c="ProfileWallets"===l.I.state.view;a||b||c||h.W.close(),await n.U.initializeIfEnabled(a),this.caipAddress=a,i.W.setIsSwitchingNamespace(!1)}onNewNetwork(a){let b=this.caipNetwork,c=b?.caipNetworkId?.toString(),d=a?.caipNetworkId?.toString(),e="UnsupportedChain"===l.I.state.view,f=h.W.state.open,g=!1;this.enableEmbedded&&"SwitchNetwork"===l.I.state.view&&(g=!0),c!==d&&J.resetState(),f&&e&&(g=!0),g&&"SIWXSignMessage"!==l.I.state.view&&l.I.goBack(),this.caipNetwork=a}prefetch(){this.hasPrefetched||(k.N.prefetch(),k.N.fetchWalletsByPage({page:1}),this.hasPrefetched=!0)}}cc.styles=b8,b9([(0,e.MZ)({type:Boolean})],cc.prototype,"enableEmbedded",void 0),b9([(0,e.wk)()],cc.prototype,"open",void 0),b9([(0,e.wk)()],cc.prototype,"caipAddress",void 0),b9([(0,e.wk)()],cc.prototype,"caipNetwork",void 0),b9([(0,e.wk)()],cc.prototype,"shake",void 0),b9([(0,e.wk)()],cc.prototype,"filterByNamespace",void 0),b9([(0,e.wk)()],cc.prototype,"padding",void 0),b9([(0,e.wk)()],cc.prototype,"mobileFullScreen",void 0);let cd=class extends cc{};cd=b9([(0,K.EM)("w3m-modal")],cd);let ce=class extends cc{};ce=b9([(0,K.EM)("appkit-modal")],ce);let cf=(0,K.AH)`
  .icon-box {
    width: 64px;
    height: 64px;
    border-radius: ${({borderRadius:a})=>a[5]};
    background-color: ${({colors:a})=>a.semanticError010};
  }
`,cg=class extends d.WF{constructor(){super()}render(){return(0,d.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="4"
        .padding="${["1","3","4","3"]}"
      >
        <wui-flex justifyContent="center" alignItems="center" class="icon-box">
          <wui-icon size="xxl" color="error" name="warningCircle"></wui-icon>
        </wui-flex>

        <wui-text variant="lg-medium" color="primary" align="center">
          The app isn't responding as expected
        </wui-text>
        <wui-text variant="md-regular" color="secondary" align="center">
          Try again or reach out to the app team for help.
        </wui-text>

        <wui-button
          variant="neutral-secondary"
          size="md"
          @click=${this.onTryAgainClick.bind(this)}
          data-testid="w3m-usage-exceeded-button"
        >
          <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
          Try Again
        </wui-button>
      </wui-flex>
    `}onTryAgainClick(){l.I.goBack()}};cg.styles=cf,cg=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g}([(0,K.EM)("w3m-usage-exceeded-view")],cg);var ch=c(54928);c(29361);let ci=(0,K.AH)`
  :host {
    width: 100%;
  }
`;var cj=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let ck=class extends d.WF{constructor(){super(...arguments),this.hasImpressionSent=!1,this.walletImages=[],this.imageSrc="",this.name="",this.size="md",this.tabIdx=void 0,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100",this.rdnsId="",this.displayIndex=void 0,this.walletRank=void 0,this.namespaces=[]}connectedCallback(){super.connectedCallback()}disconnectedCallback(){super.disconnectedCallback(),this.cleanupIntersectionObserver()}updated(a){super.updated(a),(a.has("name")||a.has("imageSrc")||a.has("walletRank"))&&(this.hasImpressionSent=!1),a.has("walletRank")&&this.walletRank&&!this.intersectionObserver&&this.setupIntersectionObserver()}setupIntersectionObserver(){this.intersectionObserver=new IntersectionObserver(a=>{a.forEach(a=>{!a.isIntersecting||this.loading||this.hasImpressionSent||this.sendImpressionEvent()})},{threshold:.1}),this.intersectionObserver.observe(this)}cleanupIntersectionObserver(){this.intersectionObserver&&(this.intersectionObserver.disconnect(),this.intersectionObserver=void 0)}sendImpressionEvent(){this.name&&!this.hasImpressionSent&&this.walletRank&&(this.hasImpressionSent=!0,(this.rdnsId||this.name)&&F.E.sendWalletImpressionEvent({name:this.name,walletRank:this.walletRank,rdnsId:this.rdnsId,view:l.I.state.view,displayIndex:this.displayIndex}))}handleGetWalletNamespaces(){return Object.keys(ch.q.state.adapters).length>1?this.namespaces:[]}render(){return(0,d.qy)`
      <wui-list-wallet
        .walletImages=${this.walletImages}
        imageSrc=${(0,f.J)(this.imageSrc)}
        name=${this.name}
        size=${(0,f.J)(this.size)}
        tagLabel=${(0,f.J)(this.tagLabel)}
        .tagVariant=${this.tagVariant}
        .walletIcon=${this.walletIcon}
        .tabIdx=${this.tabIdx}
        .disabled=${this.disabled}
        .showAllWallets=${this.showAllWallets}
        .loading=${this.loading}
        loadingSpinnerColor=${this.loadingSpinnerColor}
        .namespaces=${this.handleGetWalletNamespaces()}
      ></wui-list-wallet>
    `}};ck.styles=ci,cj([(0,e.MZ)({type:Array})],ck.prototype,"walletImages",void 0),cj([(0,e.MZ)()],ck.prototype,"imageSrc",void 0),cj([(0,e.MZ)()],ck.prototype,"name",void 0),cj([(0,e.MZ)()],ck.prototype,"size",void 0),cj([(0,e.MZ)()],ck.prototype,"tagLabel",void 0),cj([(0,e.MZ)()],ck.prototype,"tagVariant",void 0),cj([(0,e.MZ)()],ck.prototype,"walletIcon",void 0),cj([(0,e.MZ)()],ck.prototype,"tabIdx",void 0),cj([(0,e.MZ)({type:Boolean})],ck.prototype,"disabled",void 0),cj([(0,e.MZ)({type:Boolean})],ck.prototype,"showAllWallets",void 0),cj([(0,e.MZ)({type:Boolean})],ck.prototype,"loading",void 0),cj([(0,e.MZ)({type:String})],ck.prototype,"loadingSpinnerColor",void 0),cj([(0,e.MZ)()],ck.prototype,"rdnsId",void 0),cj([(0,e.MZ)()],ck.prototype,"displayIndex",void 0),cj([(0,e.MZ)()],ck.prototype,"walletRank",void 0),cj([(0,e.MZ)({type:Array})],ck.prototype,"namespaces",void 0),ck=cj([(0,K.EM)("w3m-list-wallet")],ck);let cl=(0,K.AH)`
  :host {
    --local-duration-height: 0s;
    --local-duration: ${({durations:a})=>a.lg};
    --local-transition: ${({easings:a})=>a["ease-out-power-2"]};
  }

  .container {
    display: block;
    overflow: hidden;
    overflow: hidden;
    position: relative;
    height: var(--local-container-height);
    transition: height var(--local-duration-height) var(--local-transition);
    will-change: height, padding-bottom;
  }

  .container[data-mobile-fullscreen='true'] {
    overflow: scroll;
  }

  .page {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    width: inherit;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background-color: ${({tokens:a})=>a.theme.backgroundPrimary};
    border-bottom-left-radius: var(--local-border-bottom-radius);
    border-bottom-right-radius: var(--local-border-bottom-radius);
    transition: border-bottom-left-radius var(--local-duration) var(--local-transition);
  }

  .page[data-mobile-fullscreen='true'] {
    height: 100%;
  }

  .page-content {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .footer {
    height: var(--apkt-footer-height);
  }

  div.page[view-direction^='prev-'] .page-content {
    animation:
      slide-left-out var(--local-duration) forwards var(--local-transition),
      slide-left-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:a})=>a.lg});
  }

  div.page[view-direction^='next-'] .page-content {
    animation:
      slide-right-out var(--local-duration) forwards var(--local-transition),
      slide-right-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:a})=>a.lg});
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }
`;var cm=function(a,b,c,d){var e,f=arguments.length,g=f<3?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)g=Reflect.decorate(a,b,c,d);else for(var h=a.length-1;h>=0;h--)(e=a[h])&&(g=(f<3?e(g):f>3?e(b,c,g):e(b,c))||g);return f>3&&g&&Object.defineProperty(b,c,g),g};let cn=class extends d.WF{constructor(){super(...arguments),this.resizeObserver=void 0,this.transitionDuration="0.15s",this.transitionFunction="",this.history="",this.view="",this.setView=void 0,this.viewDirection="",this.historyState="",this.previousHeight="0px",this.mobileFullScreen=g.H.state.enableMobileFullScreen,this.onViewportResize=()=>{this.updateContainerHeight()}}updated(a){if(a.has("history")){let a=this.history;""!==this.historyState&&this.historyState!==a&&this.onViewChange(a)}a.has("transitionDuration")&&this.style.setProperty("--local-duration",this.transitionDuration),a.has("transitionFunction")&&this.style.setProperty("--local-transition",this.transitionFunction)}firstUpdated(){this.transitionFunction&&this.style.setProperty("--local-transition",this.transitionFunction),this.style.setProperty("--local-duration",this.transitionDuration),this.historyState=this.history,this.resizeObserver=new ResizeObserver(a=>{for(let b of a)if(b.target===this.getWrapper()){let a=b.contentRect.height,c=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--apkt-footer-height")||"0");this.mobileFullScreen?(a=(window.visualViewport?.height||window.innerHeight)-this.getHeaderHeight()-c,this.style.setProperty("--local-border-bottom-radius","0px")):(a+=c,this.style.setProperty("--local-border-bottom-radius",c?"var(--apkt-borderRadius-5)":"0px")),this.style.setProperty("--local-container-height",`${a}px`),"0px"!==this.previousHeight&&this.style.setProperty("--local-duration-height",this.transitionDuration),this.previousHeight=`${a}px`}}),this.resizeObserver.observe(this.getWrapper()),this.updateContainerHeight(),window.addEventListener("resize",this.onViewportResize),window.visualViewport?.addEventListener("resize",this.onViewportResize)}disconnectedCallback(){let a=this.getWrapper();a&&this.resizeObserver&&this.resizeObserver.unobserve(a),window.removeEventListener("resize",this.onViewportResize),window.visualViewport?.removeEventListener("resize",this.onViewportResize)}render(){return(0,d.qy)`
      <div class="container" data-mobile-fullscreen="${(0,f.J)(this.mobileFullScreen)}">
        <div
          class="page"
          data-mobile-fullscreen="${(0,f.J)(this.mobileFullScreen)}"
          view-direction="${this.viewDirection}"
        >
          <div class="page-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `}onViewChange(a){let b=a.split(",").filter(Boolean),c=this.historyState.split(",").filter(Boolean),d=c.length,e=b.length,f=b[b.length-1]||"",g=K.Zv.cssDurationToNumber(this.transitionDuration),h="";e>d?h="next":e<d?h="prev":e===d&&b[e-1]!==c[d-1]&&(h="next"),this.viewDirection=`${h}-${f}`,setTimeout(()=>{this.historyState=a,this.setView?.(f)},g),setTimeout(()=>{this.viewDirection=""},2*g)}getWrapper(){return this.shadowRoot?.querySelector("div.page")}updateContainerHeight(){let a=this.getWrapper();if(!a)return;let b=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--apkt-footer-height")||"0"),c=0;this.mobileFullScreen?(c=(window.visualViewport?.height||window.innerHeight)-this.getHeaderHeight()-b,this.style.setProperty("--local-border-bottom-radius","0px")):(c=a.getBoundingClientRect().height+b,this.style.setProperty("--local-border-bottom-radius",b?"var(--apkt-borderRadius-5)":"0px")),this.style.setProperty("--local-container-height",`${c}px`),"0px"!==this.previousHeight&&this.style.setProperty("--local-duration-height",this.transitionDuration),this.previousHeight=`${c}px`}getHeaderHeight(){return 60}};cn.styles=[cl],cm([(0,e.MZ)({type:String})],cn.prototype,"transitionDuration",void 0),cm([(0,e.MZ)({type:String})],cn.prototype,"transitionFunction",void 0),cm([(0,e.MZ)({type:String})],cn.prototype,"history",void 0),cm([(0,e.MZ)({type:String})],cn.prototype,"view",void 0),cm([(0,e.MZ)({attribute:!1})],cn.prototype,"setView",void 0),cm([(0,e.wk)()],cn.prototype,"viewDirection",void 0),cm([(0,e.wk)()],cn.prototype,"historyState",void 0),cm([(0,e.wk)()],cn.prototype,"previousHeight",void 0),cm([(0,e.wk)()],cn.prototype,"mobileFullScreen",void 0),cn=cm([(0,K.EM)("w3m-router-container")],cn)}};