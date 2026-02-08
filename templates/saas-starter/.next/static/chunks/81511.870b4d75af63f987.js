"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[81511],{81511:(e,t,i)=>{i.r(t),i.d(t,{W3mAllWalletsView:()=>tl,W3mConnectingWcBasicView:()=>eE,W3mDownloadsView:()=>tc});var o=i(82619),r=i(30374),n=i(72173),a=i(84044),s=i(7674),l=i(81279),c=i(34118);i(28755);var d=i(54513),h=i(63812),p=i(71417),u=i(55237),w=i(587),g=i(30767);i(22874);var m=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let b=class extends o.WF{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=p.a.state.connectors,this.count=s.N.state.count,this.filteredCount=s.N.state.filteredWallets.length,this.isFetchingRecommendedWallets=s.N.state.isFetchingRecommendedWallets,this.unsubscribe.push(p.a.subscribeKey("connectors",e=>this.connectors=e),s.N.subscribeKey("count",e=>this.count=e),s.N.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),s.N.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.connectors.find(e=>"walletConnect"===e.id),{allWallets:t}=a.H.state;if(!e||"HIDE"===t||"ONLY_MOBILE"===t&&!n.w.isMobile())return null;let i=s.N.state.featured.length,r=this.count+i,l=r<10?r:10*Math.floor(r/10),c=this.filteredCount>0?this.filteredCount:l,p=`${c}`;this.filteredCount>0?p=`${this.filteredCount}`:c<r&&(p=`${c}+`);let w=u.x.hasAnyConnection(h.o.CONNECTOR_ID.WALLET_CONNECT);return(0,o.qy)`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${p}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${(0,d.J)(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${w}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){w.E.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),g.I.push("AllWallets",{redirectView:g.I.state.data?.redirectView})}};m([(0,r.MZ)()],b.prototype,"tabIdx",void 0),m([(0,r.wk)()],b.prototype,"connectors",void 0),m([(0,r.wk)()],b.prototype,"count",void 0),m([(0,r.wk)()],b.prototype,"filteredCount",void 0),m([(0,r.wk)()],b.prototype,"isFetchingRecommendedWallets",void 0),b=m([(0,c.EM)("w3m-all-wallets-widget")],b);var f=i(6746),y=i(29933),v=i(43266),$=i(33846),x=i(39580);let k=(0,c.AH)`
  :host {
    margin-top: ${({spacing:e})=>e["1"]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e["3"]} calc(${({spacing:e})=>e["3"]} * -1)
      ${({spacing:e})=>e["2"]} calc(${({spacing:e})=>e["3"]} * -1);
    width: calc(100% + ${({spacing:e})=>e["3"]} * 2);
  }
`;var C=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let E=class extends o.WF{constructor(){super(),this.unsubscribe=[],this.explorerWallets=s.N.state.explorerWallets,this.connections=u.x.state.connections,this.connectorImages=f.j.state.connectorImages,this.loadingTelegram=!1,this.unsubscribe.push(u.x.subscribeKey("connections",e=>this.connections=e),f.j.subscribeKey("connectorImages",e=>this.connectorImages=e),s.N.subscribeKey("explorerFilteredWallets",e=>{this.explorerWallets=e?.length?e:s.N.state.explorerWallets}),s.N.subscribeKey("explorerWallets",e=>{this.explorerWallets?.length||(this.explorerWallets=e)})),n.w.isTelegram()&&n.w.isIos()&&(this.loadingTelegram=!u.x.state.wcUri,this.unsubscribe.push(u.x.subscribeKey("wcUri",e=>this.loadingTelegram=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return(0,o.qy)`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){return y.g.connectorList().map((e,t)=>"connector"===e.kind?this.renderConnector(e,t):this.renderWallet(e,t))}getConnectorNamespaces(e){return"walletConnect"===e.subtype?[]:"multiChain"===e.subtype?e.connector.connectors?.map(e=>e.chain)||[]:[e.connector.chain]}renderConnector(e,t){let i,r,n=e.connector,a=v.$.getConnectorImage(n)||this.connectorImages[n?.imageId??""],s=(this.connections.get(n.chain)??[]).some(e=>x.y.isLowerCaseMatch(e.connectorId,n.id));"walletConnect"===e.subtype?(i="qr code",r="accent"):"injected"===e.subtype||"announced"===e.subtype?(i=s?"connected":"installed",r=s?"info":"success"):(i=void 0,r=void 0);let l=u.x.hasAnyConnection(h.o.CONNECTOR_ID.WALLET_CONNECT),c=("walletConnect"===e.subtype||"external"===e.subtype)&&l;return(0,o.qy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.J)(a)}
        .installed=${!0}
        name=${n.name??"Unknown"}
        .tagVariant=${r}
        tagLabel=${(0,d.J)(i)}
        data-testid=${`wallet-selector-${n.id.toLowerCase()}`}
        size="sm"
        @click=${()=>this.onClickConnector(e)}
        tabIdx=${(0,d.J)(this.tabIdx)}
        ?disabled=${c}
        rdnsId=${(0,d.J)(n.explorerWallet?.rdns||void 0)}
        walletRank=${(0,d.J)(n.explorerWallet?.order)}
        .namespaces=${this.getConnectorNamespaces(e)}
      >
      </w3m-list-wallet>
    `}onClickConnector(e){let t=g.I.state.data?.redirectView;if("walletConnect"===e.subtype){p.a.setActiveConnector(e.connector),n.w.isMobile()?g.I.push("AllWallets"):g.I.push("ConnectingWalletConnect",{redirectView:t});return}if("multiChain"===e.subtype){p.a.setActiveConnector(e.connector),g.I.push("ConnectingMultiChain",{redirectView:t});return}if("injected"===e.subtype){p.a.setActiveConnector(e.connector),g.I.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}if("announced"===e.subtype)return"walletConnect"===e.connector.id?void(n.w.isMobile()?g.I.push("AllWallets"):g.I.push("ConnectingWalletConnect",{redirectView:t})):(g.I.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet}),void 0);g.I.push("ConnectingExternal",{connector:e.connector,redirectView:t})}renderWallet(e,t){let i=e.wallet,r=v.$.getWalletImage(i),n=u.x.hasAnyConnection(h.o.CONNECTOR_ID.WALLET_CONNECT),a=this.loadingTelegram,s="recent"===e.subtype?"recent":void 0,l="recent"===e.subtype?"info":void 0;return(0,o.qy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.J)(r)}
        name=${i.name??"Unknown"}
        @click=${()=>this.onClickWallet(e)}
        size="sm"
        data-testid=${`wallet-selector-${i.id}`}
        tabIdx=${(0,d.J)(this.tabIdx)}
        ?loading=${a}
        ?disabled=${n}
        rdnsId=${(0,d.J)(i.rdns||void 0)}
        walletRank=${(0,d.J)(i.order)}
        tagLabel=${(0,d.J)(s)}
        .tagVariant=${l}
      >
      </w3m-list-wallet>
    `}onClickWallet(e){let t=g.I.state.data?.redirectView,i=$.W.state.activeChain;if("featured"===e.subtype)return void p.a.selectWalletConnector(e.wallet);if("recent"===e.subtype){if(this.loadingTelegram)return;p.a.selectWalletConnector(e.wallet);return}if("custom"===e.subtype){if(this.loadingTelegram)return;g.I.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t});return}if(this.loadingTelegram)return;let o=i?p.a.getConnector({id:e.wallet.id,namespace:i}):void 0;o?g.I.push("ConnectingExternal",{connector:o,redirectView:t}):g.I.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t})}};E.styles=k,C([(0,r.MZ)({type:Number})],E.prototype,"tabIdx",void 0),C([(0,r.wk)()],E.prototype,"explorerWallets",void 0),C([(0,r.wk)()],E.prototype,"connections",void 0),C([(0,r.wk)()],E.prototype,"connectorImages",void 0),C([(0,r.wk)()],E.prototype,"loadingTelegram",void 0),E=C([(0,c.EM)("w3m-connector-list")],E);var R=i(28027),W=i(6968),I=i(44671),S=i(75857),T=i(58341),O=i(96216),P=i(60115);i(3671),i(63284);var j=i(34508);let A=(0,j.AH)`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    column-gap: ${({spacing:e})=>e[1]};
    color: ${({tokens:e})=>e.theme.textSecondary};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: transparent;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:e})=>e.theme.textPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:e})=>e.theme.textPrimary};
    }
  }
`;var M=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let q={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},L={lg:"md",md:"sm",sm:"sm"},_=class extends o.WF{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return(0,o.qy)`
      <button data-active=${this.active}>
        ${this.icon?(0,o.qy)`<wui-icon size=${L[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${q[this.size]}> ${this.label} </wui-text>
      </button>
    `}};_.styles=[O.W5,O.fD,A],M([(0,r.MZ)()],_.prototype,"icon",void 0),M([(0,r.MZ)()],_.prototype,"size",void 0),M([(0,r.MZ)()],_.prototype,"label",void 0),M([(0,r.MZ)({type:Boolean})],_.prototype,"active",void 0),_=M([(0,P.E)("wui-tab-item")],_);let z=(0,j.AH)`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[32]};
    padding: ${({spacing:e})=>e["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var N=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let D=class extends o.WF{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((e,t)=>{let i=t===this.activeTab;return(0,o.qy)`
        <wui-tab-item
          @click=${()=>this.onTabClick(t)}
          icon=${e.icon}
          size=${this.size}
          label=${e.label}
          ?active=${i}
          data-active=${i}
          data-testid="tab-${e.label?.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(e){this.activeTab=e,this.onTabChange(e)}};D.styles=[O.W5,O.fD,z],N([(0,r.MZ)({type:Array})],D.prototype,"tabs",void 0),N([(0,r.MZ)()],D.prototype,"onTabChange",void 0),N([(0,r.MZ)()],D.prototype,"size",void 0),N([(0,r.wk)()],D.prototype,"activeTab",void 0),D=N([(0,P.E)("wui-tabs")],D);var Z=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let B=class extends o.WF{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.generateTabs();return(0,o.qy)`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){let e=this.platforms.map(e=>{if("browser"===e)return{label:"Browser",icon:"extension",platform:"browser"};if("mobile"===e)return{label:"Mobile",icon:"mobile",platform:"mobile"};if("qrcode"===e)return{label:"Mobile",icon:"mobile",platform:"qrcode"};if("web"===e)return{label:"Webapp",icon:"browser",platform:"web"};if("desktop"===e)return{label:"Desktop",icon:"desktop",platform:"desktop"};return{label:"Browser",icon:"extension",platform:"unsupported"}});return this.platformTabs=e.map(({platform:e})=>e),e}onTabChange(e){let t=this.platformTabs[e];t&&this.onSelectPlatfrom?.(t)}};Z([(0,r.MZ)({type:Array})],B.prototype,"platforms",void 0),Z([(0,r.MZ)()],B.prototype,"onSelectPlatfrom",void 0),B=Z([(0,c.EM)("w3m-connecting-header")],B);var F=i(80671);i(24856),i(19457),i(22634),i(48249);let H=(0,j.AH)`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var U=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let J=class extends o.WF{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){let e=this.radius>50?50:this.radius,t=36-e;return(0,o.qy)`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${116+t} ${245+t}"
          stroke-dashoffset=${360+1.75*t}
        />
      </svg>
    `}};J.styles=[O.W5,H],U([(0,r.MZ)({type:Number})],J.prototype,"radius",void 0),J=U([(0,P.E)("wui-loading-thumbnail")],J),i(26703),i(61953),i(41822),i(55673);let V=(0,j.AH)`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding-left: ${({spacing:e})=>e[3]};
    padding-right: ${({spacing:e})=>e[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[6]};
  }

  wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var G=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let K=class extends o.WF{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return(0,o.qy)`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};K.styles=[O.W5,O.fD,V],G([(0,r.MZ)({type:Boolean})],K.prototype,"disabled",void 0),G([(0,r.MZ)()],K.prototype,"label",void 0),G([(0,r.MZ)()],K.prototype,"buttonLabel",void 0),K=G([(0,P.E)("wui-cta-button")],K);let Q=(0,c.AH)`
  :host {
    display: block;
    padding: 0 ${({spacing:e})=>e["5"]} ${({spacing:e})=>e["5"]};
  }
`;var X=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let Y=class extends o.WF{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;let{name:e,app_store:t,play_store:i,chrome_store:r,homepage:a}=this.wallet,s=n.w.isMobile(),l=n.w.isIos(),d=n.w.isAndroid(),h=[t,i,a,r].filter(Boolean).length>1,p=c.Zv.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return h&&!s?(0,o.qy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${()=>g.I.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!h&&a?(0,o.qy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:t&&l?(0,o.qy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:i&&d?(0,o.qy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&n.w.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&n.w.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&n.w.openHref(this.wallet.homepage,"_blank")}};Y.styles=[Q],X([(0,r.MZ)({type:Object})],Y.prototype,"wallet",void 0),Y=X([(0,c.EM)("w3m-mobile-download-links")],Y);let ee=(0,c.AH)`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e["1"]} * -1);
    bottom: calc(${({spacing:e})=>e["1"]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:e})=>e.lg};
    transition-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e["4"]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var et=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};class ei extends o.WF{constructor(){super(),this.wallet=g.I.state.data?.wallet,this.connector=g.I.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=v.$.getConnectorImage(this.connector)??v.$.getWalletImage(this.wallet),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=u.x.state.wcUri,this.error=u.x.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(u.x.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),u.x.subscribeKey("wcError",e=>this.error=e)),(n.w.isTelegram()||n.w.isSafari())&&n.w.isIos()&&u.x.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),u.x.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();let e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel,t="";return this.label?t=this.label:(t=`Continue in ${this.name}`,this.error&&(t="Connection declined")),(0,o.qy)`
      <wui-flex
        data-error=${(0,d.J)(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${(0,d.J)(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${t}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?(0,o.qy)`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?(0,o.qy)`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){if(this.error&&!this.showRetry){this.showRetry=!0;let e=this.shadowRoot?.querySelector("wui-button");e?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){u.x.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){let e=F.W.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return(0,o.qy)`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(n.w.copyToClopboard(this.uri),W.P.showSuccess("Link copied"))}catch{W.P.showError("Failed to copy")}}}ei.styles=ee,et([(0,r.wk)()],ei.prototype,"isRetrying",void 0),et([(0,r.wk)()],ei.prototype,"uri",void 0),et([(0,r.wk)()],ei.prototype,"error",void 0),et([(0,r.wk)()],ei.prototype,"ready",void 0),et([(0,r.wk)()],ei.prototype,"showRetry",void 0),et([(0,r.wk)()],ei.prototype,"label",void 0),et([(0,r.wk)()],ei.prototype,"secondaryBtnLabel",void 0),et([(0,r.wk)()],ei.prototype,"secondaryLabel",void 0),et([(0,r.wk)()],ei.prototype,"isLoading",void 0),et([(0,r.MZ)({type:Boolean})],ei.prototype,"isMobile",void 0),et([(0,r.MZ)()],ei.prototype,"onRetry",void 0);let eo=class extends ei{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:g.I.state.view}})}async onConnectProxy(){try{this.error=!1;let{connectors:e}=p.a.state,t=e.find(e=>"ANNOUNCED"===e.type&&e.info?.rdns===this.wallet?.rdns||"INJECTED"===e.type||e.name===this.wallet?.name);if(t)await u.x.connectExternal(t,t.chain);else throw Error("w3m-connecting-wc-browser: No connector found");I.W.close()}catch(e){e instanceof S.A&&e.originalName===R.RQ.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?w.E.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):w.E.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};eo=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-browser")],eo);let er=class extends ei{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:g.I.state.view}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;let{desktop_link:e,name:t}=this.wallet,{redirect:i,href:o}=n.w.formatNativeUrl(e,this.uri);u.x.setWcLinking({name:t,href:o}),u.x.setRecentWallet(this.wallet),n.w.openHref(i,"_blank")}catch{this.error=!0}}};er=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-desktop")],er);var en=i(42050),ea=i(67909),es=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let el=class extends ei{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=a.H.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{en.b.onConnectMobile(this.wallet)},!this.wallet)throw Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=ea.oU.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(u.x.subscribeKey("wcUri",()=>{this.onHandleURI()})),w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:g.I.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){u.x.setWcError(!1),this.onConnect?.()}};es([(0,r.wk)()],el.prototype,"redirectDeeplink",void 0),es([(0,r.wk)()],el.prototype,"redirectUniversalLink",void 0),es([(0,r.wk)()],el.prototype,"target",void 0),es([(0,r.wk)()],el.prototype,"preferUniversalLinks",void 0),es([(0,r.wk)()],el.prototype,"isLoading",void 0),el=es([(0,c.EM)("w3m-connecting-wc-mobile")],el),i(43718);var ec=i(28181);function ed(e,t,i){return e!==t&&(e-t<0?t-e:e-t)<=i+.1}let eh={generate({uri:e,size:t,logoSize:i,padding:r=8,dotColor:n="var(--apkt-colors-black)"}){let a=[],s=function(e,t){let i=Array.prototype.slice.call(ec.create(e,{errorCorrectionLevel:"Q"}).modules.data,0),o=Math.sqrt(i.length);return i.reduce((e,t,i)=>(i%o==0?e.push([t]):e[e.length-1].push(t))&&e,[])}(e,0),l=(t-2*r)/s.length,c=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];c.forEach(({x:e,y:t})=>{let i=(s.length-7)*l*e+r,d=(s.length-7)*l*t+r;for(let e=0;e<c.length;e+=1){let t=l*(7-2*e);a.push((0,o.JW)`
            <rect
              fill=${2===e?"var(--apkt-colors-black)":"var(--apkt-colors-white)"}
              width=${0===e?t-10:t}
              rx= ${0===e?(t-10)*.45:.45*t}
              ry= ${0===e?(t-10)*.45:.45*t}
              stroke=${n}
              stroke-width=${10*(0===e)}
              height=${0===e?t-10:t}
              x= ${0===e?d+l*e+5:d+l*e}
              y= ${0===e?i+l*e+5:i+l*e}
            />
          `)}});let d=Math.floor((i+25)/l),h=s.length/2-d/2,p=s.length/2+d/2-1,u=[];s.forEach((e,t)=>{e.forEach((e,i)=>{!s[t][i]||t<7&&i<7||t>s.length-8&&i<7||t<7&&i>s.length-8||t>h&&t<p&&i>h&&i<p||u.push([t*l+l/2+r,i*l+l/2+r])})});let w={};return u.forEach(([e,t])=>{w[e]?w[e]?.push(t):w[e]=[t]}),Object.entries(w).map(([e,t])=>{let i=t.filter(e=>t.every(t=>!ed(e,t,l)));return[Number(e),i]}).forEach(([e,t])=>{t.forEach(t=>{a.push((0,o.JW)`<circle cx=${e} cy=${t} fill=${n} r=${l/2.5} />`)})}),Object.entries(w).filter(([e,t])=>t.length>1).map(([e,t])=>{let i=t.filter(e=>t.some(t=>ed(e,t,l)));return[Number(e),i]}).map(([e,t])=>{t.sort((e,t)=>e<t?-1:1);let i=[];for(let e of t){let t=i.find(t=>t.some(t=>ed(e,t,l)));t?t.push(e):i.push([e])}return[e,i.map(e=>[e[0],e[e.length-1]])]}).forEach(([e,t])=>{t.forEach(([t,i])=>{a.push((0,o.JW)`
              <line
                x1=${e}
                x2=${e}
                y1=${t}
                y2=${i}
                stroke=${n}
                stroke-width=${l/1.25}
                stroke-linecap="round"
              />
            `)})}),a}},ep=(0,j.AH)`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({colors:e})=>e.white};
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  :host {
    border-radius: ${({borderRadius:e})=>e[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`;var eu=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ew=class extends o.WF{constructor(){super(...arguments),this.uri="",this.size=500,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),(0,o.qy)`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return(0,o.JW)`
      <svg viewBox="0 0 ${this.size} ${this.size}" width="100%" height="100%">
        ${eh.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?(0,o.qy)`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?(0,o.qy)`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:(0,o.qy)`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};ew.styles=[O.W5,ep],eu([(0,r.MZ)()],ew.prototype,"uri",void 0),eu([(0,r.MZ)({type:Number})],ew.prototype,"size",void 0),eu([(0,r.MZ)()],ew.prototype,"theme",void 0),eu([(0,r.MZ)()],ew.prototype,"imageSrc",void 0),eu([(0,r.MZ)()],ew.prototype,"alt",void 0),eu([(0,r.MZ)({type:Boolean})],ew.prototype,"arenaClear",void 0),eu([(0,r.MZ)({type:Boolean})],ew.prototype,"farcaster",void 0),ew=eu([(0,P.E)("wui-qr-code")],ew),i(1983),i(53981);let eg=(0,c.AH)`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var em=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eb=class extends ei{constructor(){super(),this.basic=!1}firstUpdated(){this.basic||w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:g.I.state.view}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e())}render(){return this.onRenderProxy(),(0,o.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0)}qrCodeTemplate(){if(!this.uri||!this.ready)return null;let e=this.wallet?this.wallet.name:void 0;u.x.setWcLinking(void 0),u.x.setRecentWallet(this.wallet);let t=F.W.state.themeVariables["--apkt-qr-color"]??F.W.state.themeVariables["--w3m-qr-color"];return(0,o.qy)` <wui-qr-code
      theme=${F.W.state.themeMode}
      uri=${this.uri}
      imageSrc=${(0,d.J)(v.$.getWalletImage(this.wallet))}
      color=${(0,d.J)(t)}
      alt=${(0,d.J)(e)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){let e=!this.uri||!this.ready;return(0,o.qy)`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};eb.styles=eg,em([(0,r.MZ)({type:Boolean})],eb.prototype,"basic",void 0),eb=em([(0,c.EM)("w3m-connecting-wc-qrcode")],eb);let ef=class extends o.WF{constructor(){if(super(),this.wallet=g.I.state.data?.wallet,!this.wallet)throw Error("w3m-connecting-wc-unsupported: No wallet provided");w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:g.I.state.view}})}render(){return(0,o.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${(0,d.J)(v.$.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};ef=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-unsupported")],ef);var ey=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ev=class extends ei{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=ea.oU.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(u.x.subscribeKey("wcUri",()=>{this.updateLoadingState()})),w.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:g.I.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;let{webapp_link:e,name:t}=this.wallet,{redirect:i,href:o}=n.w.formatUniversalUrl(e,this.uri);u.x.setWcLinking({name:t,href:o}),u.x.setRecentWallet(this.wallet),n.w.openHref(i,"_blank")}catch{this.error=!0}}};ey([(0,r.wk)()],ev.prototype,"isLoading",void 0),ev=ey([(0,c.EM)("w3m-connecting-wc-web")],ev);let e$=(0,c.AH)`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`;var ex=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ek=class extends o.WF{constructor(){super(),this.wallet=g.I.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!a.H.state.siwx,this.remoteFeatures=a.H.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(a.H.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return a.H.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,o.qy)`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding&&this.displayBranding?(0,o.qy)`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){if("browser"!==this.platform&&(!a.H.state.manualWCControl||e))try{let{wcPairingExpiry:t,status:i}=u.x.state,{redirectView:o}=g.I.state.data??{};if(e||a.H.state.enableEmbedded||n.w.isPairingExpired(t)||"connecting"===i){let e=u.x.getConnections($.W.state.activeChain),t=this.remoteFeatures?.multiWallet,i=e.length>0;await u.x.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(i&&t?(g.I.replace("ProfileWallets"),W.P.showSuccess("New Wallet Added")):o?g.I.replace(o):I.W.close())}}catch(e){if(e instanceof Error&&e.message.includes("An error occurred when attempting to switch chain")&&!a.H.state.enableNetworkSwitch&&$.W.state.activeChain){$.W.setActiveCaipNetwork(T.R.getUnsupportedNetwork(`${$.W.state.activeChain}:${$.W.state.activeCaipNetwork?.id}`)),$.W.showUnsupportedChainUI();return}e instanceof S.A&&e.originalName===R.RQ.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?w.E.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):w.E.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),u.x.setWcError(!0),W.P.showError(e.message??"Connection error"),u.x.resetWcConnection(),g.I.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;let{mobile_link:e,desktop_link:t,webapp_link:i,injected:o,rdns:r}=this.wallet,s=o?.map(({injected_id:e})=>e).filter(Boolean),l=[...r?[r]:s??[]],c=!a.H.state.isUniversalProvider&&l.length,d=u.x.checkInstalled(l),h=c&&d,p=t&&!n.w.isMobile();h&&!$.W.state.noAdapters&&this.platforms.push("browser"),e&&this.platforms.push(n.w.isMobile()?"mobile":"qrcode"),i&&this.platforms.push("web"),p&&this.platforms.push("desktop"),h||!c||$.W.state.noAdapters||this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return(0,o.qy)`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return(0,o.qy)`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return(0,o.qy)`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return(0,o.qy)`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return(0,o.qy)`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return(0,o.qy)`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?(0,o.qy)`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){let t=this.shadowRoot?.querySelector("div");t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};ek.styles=e$,ex([(0,r.wk)()],ek.prototype,"platform",void 0),ex([(0,r.wk)()],ek.prototype,"platforms",void 0),ex([(0,r.wk)()],ek.prototype,"isSiwxEnabled",void 0),ex([(0,r.wk)()],ek.prototype,"remoteFeatures",void 0),ex([(0,r.MZ)({type:Boolean})],ek.prototype,"displayBranding",void 0),ex([(0,r.MZ)({type:Boolean})],ek.prototype,"basic",void 0),ek=ex([(0,c.EM)("w3m-connecting-wc-view")],ek);var eC=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eE=class extends o.WF{constructor(){super(),this.unsubscribe=[],this.isMobile=n.w.isMobile(),this.remoteFeatures=a.H.state.remoteFeatures,this.unsubscribe.push(a.H.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(this.isMobile){let{featured:e,recommended:t}=s.N.state,{customWallets:i}=a.H.state,r=l.i.getRecentWallets(),n=e.length||t.length||i?.length||r.length;return(0,o.qy)`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?(0,o.qy)`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return(0,o.qy)`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?(0,o.qy)` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};eC([(0,r.wk)()],eE.prototype,"isMobile",void 0),eC([(0,r.wk)()],eE.prototype,"remoteFeatures",void 0),eE=eC([(0,c.EM)("w3m-connecting-wc-basic-view")],eE);var eR=i(54573);let{I:eW}=eR.ge;var eI=i(29801);let eS=(e,t)=>{let i=e._$AN;if(void 0===i)return!1;for(let e of i)e._$AO?.(t,!1),eS(e,t);return!0},eT=e=>{let t,i;do{if(void 0===(t=e._$AM))break;(i=t._$AN).delete(e),e=t}while(0===i?.size)},eO=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(void 0===i)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),eA(t)}};function eP(e){void 0!==this._$AN?(eT(this),this._$AM=e,eO(this)):this._$AM=e}function ej(e,t=!1,i=0){let o=this._$AH,r=this._$AN;if(void 0!==r&&0!==r.size)if(t)if(Array.isArray(o))for(let e=i;e<o.length;e++)eS(o[e],!1),eT(o[e]);else null!=o&&(eS(o,!1),eT(o));else eS(this,e)}let eA=e=>{e.type==eI.OA.CHILD&&(e._$AP??=ej,e._$AQ??=eP)};class eM extends eI.WL{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),eO(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(eS(this,e),eT(this))}setValue(e){if(void 0===this._$Ct.strings)this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}let eq=()=>new eL;class eL{}let e_=new WeakMap,ez=(0,eI.u$)(class extends eM{render(e){return eR.s6}update(e,[t]){let i=t!==this.G;return i&&void 0!==this.G&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),eR.s6}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){let t=this.ht??globalThis,i=e_.get(t);void 0===i&&(i=new WeakMap,e_.set(t,i)),void 0!==i.get(this.G)&&this.G.call(this.ht,void 0),i.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?e_.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),eN=(0,j.AH)`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:e})=>e.neutrals300};
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:e})=>e.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    background-color: ${({tokens:e})=>e.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:e})=>e.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:e})=>e.theme.textTertiary};
  }
`;var eD=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eZ=class extends o.WF{constructor(){super(...arguments),this.inputElementRef=eq(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return(0,o.qy)`
      <label data-size=${this.size}>
        <input
          ${ez(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};eZ.styles=[O.W5,O.fD,eN],eD([(0,r.MZ)({type:Boolean})],eZ.prototype,"checked",void 0),eD([(0,r.MZ)({type:Boolean})],eZ.prototype,"disabled",void 0),eD([(0,r.MZ)()],eZ.prototype,"size",void 0),eZ=eD([(0,P.E)("wui-toggle")],eZ);let eB=(0,j.AH)`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["2"]} ${({spacing:e})=>e["3"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e["4"]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var eF=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eH=class extends o.WF{constructor(){super(...arguments),this.checked=!1}render(){return(0,o.qy)`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(e){e.stopPropagation(),this.checked=e.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};eH.styles=[O.W5,O.fD,eB],eF([(0,r.MZ)({type:Boolean})],eH.prototype,"checked",void 0),eH=eF([(0,P.E)("wui-certified-switch")],eH);let eU=(0,j.AH)`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.textPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[3]} ${({spacing:e})=>e[10]};
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[4]} ${({spacing:e})=>e[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:e})=>e[2]};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:e})=>e[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;var eJ=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eV=class extends o.WF{constructor(){super(...arguments),this.inputElementRef=eq(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return(0,o.qy)` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${ez(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${(0,d.J)(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?(0,o.qy)`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){return this.onSubmit?(0,o.qy)`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${this.onSubmit?.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?(0,o.qy)`<wui-icon name="spinner" size="md"></wui-icon>`:(0,o.qy)`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?(0,o.qy)`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?(0,o.qy)`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};eV.styles=[O.W5,O.fD,eU],eJ([(0,r.MZ)()],eV.prototype,"icon",void 0),eJ([(0,r.MZ)({type:Boolean})],eV.prototype,"disabled",void 0),eJ([(0,r.MZ)({type:Boolean})],eV.prototype,"loading",void 0),eJ([(0,r.MZ)()],eV.prototype,"placeholder",void 0),eJ([(0,r.MZ)()],eV.prototype,"type",void 0),eJ([(0,r.MZ)()],eV.prototype,"value",void 0),eJ([(0,r.MZ)()],eV.prototype,"errorText",void 0),eJ([(0,r.MZ)()],eV.prototype,"warningText",void 0),eJ([(0,r.MZ)()],eV.prototype,"onSubmit",void 0),eJ([(0,r.MZ)()],eV.prototype,"size",void 0),eJ([(0,r.MZ)({attribute:!1})],eV.prototype,"onKeyDown",void 0),eV=eJ([(0,P.E)("wui-input-text")],eV);let eG=(0,j.AH)`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:e})=>e[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }
`;var eK=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eQ=class extends o.WF{constructor(){super(...arguments),this.inputComponentRef=eq(),this.inputValue=""}render(){return(0,o.qy)`
      <wui-input-text
        ${ez(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?(0,o.qy)`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(e){this.inputValue=e.detail||""}clearValue(){let e=this.inputComponentRef.value,t=e?.inputElementRef.value;t&&(t.value="",this.inputValue="",t.focus(),t.dispatchEvent(new Event("input")))}};eQ.styles=[O.W5,eG],eK([(0,r.MZ)()],eQ.prototype,"inputValue",void 0),eQ=eK([(0,P.E)("wui-search-bar")],eQ);var eX=i(10579),eY=i(73205);i(88740);let e0=(0,j.AH)`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:e})=>e.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var e3=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e1=class extends o.WF{constructor(){super(...arguments),this.type="wallet"}render(){return(0,o.qy)`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return"network"===this.type?(0,o.qy)` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${eY.a}`:(0,o.qy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};e1.styles=[O.W5,O.fD,e0],e3([(0,r.MZ)()],e1.prototype,"type",void 0),e1=e3([(0,P.E)("wui-card-select-loader")],e1);var e2=i(44985);let e5=(0,o.AH)`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var e4=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e6=class extends o.WF{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&e2.Z.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&e2.Z.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&e2.Z.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&e2.Z.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&e2.Z.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&e2.Z.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&e2.Z.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&e2.Z.getSpacingStyles(this.margin,3)};
    `,(0,o.qy)`<slot></slot>`}};e6.styles=[O.W5,e5],e4([(0,r.MZ)()],e6.prototype,"gridTemplateRows",void 0),e4([(0,r.MZ)()],e6.prototype,"gridTemplateColumns",void 0),e4([(0,r.MZ)()],e6.prototype,"justifyItems",void 0),e4([(0,r.MZ)()],e6.prototype,"alignItems",void 0),e4([(0,r.MZ)()],e6.prototype,"justifyContent",void 0),e4([(0,r.MZ)()],e6.prototype,"alignContent",void 0),e4([(0,r.MZ)()],e6.prototype,"columnGap",void 0),e4([(0,r.MZ)()],e6.prototype,"rowGap",void 0),e4([(0,r.MZ)()],e6.prototype,"gap",void 0),e4([(0,r.MZ)()],e6.prototype,"padding",void 0),e4([(0,r.MZ)()],e6.prototype,"margin",void 0),e6=e4([(0,P.E)("wui-grid")],e6);let e7=(0,c.AH)`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["3"]} ${({spacing:e})=>e["0"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:e})=>e["4"]}, 20px);
    transition:
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:e})=>e.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:e})=>e.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:e})=>e.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:e})=>e.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var e8=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e9=class extends o.WF{constructor(){super(),this.observer=new IntersectionObserver(()=>void 0),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.displayIndex=0,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){let e=this.wallet?.badge_type==="certified";return(0,o.qy)`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${(0,d.J)(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?(0,o.qy)`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return(this.visible||this.imageSrc)&&!this.imageLoading?(0,o.qy)`
      <wui-wallet-image
        size="lg"
        imageSrc=${(0,d.J)(this.imageSrc)}
        name=${(0,d.J)(this.wallet?.name)}
        .installed=${this.wallet?.installed??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `:this.shimmerTemplate()}shimmerTemplate(){return(0,o.qy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=v.$.getWalletImage(this.wallet),this.imageSrc||(this.imageLoading=!0,this.imageSrc=await v.$.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){this.wallet&&!this.isImpressed&&(this.isImpressed=!0,w.E.sendWalletImpressionEvent({name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:g.I.state.view,query:this.walletQuery,certified:this.certified,displayIndex:this.displayIndex}))}};e9.styles=e7,e8([(0,r.wk)()],e9.prototype,"visible",void 0),e8([(0,r.wk)()],e9.prototype,"imageSrc",void 0),e8([(0,r.wk)()],e9.prototype,"imageLoading",void 0),e8([(0,r.wk)()],e9.prototype,"isImpressed",void 0),e8([(0,r.MZ)()],e9.prototype,"explorerId",void 0),e8([(0,r.MZ)()],e9.prototype,"walletQuery",void 0),e8([(0,r.MZ)()],e9.prototype,"certified",void 0),e8([(0,r.MZ)()],e9.prototype,"displayIndex",void 0),e8([(0,r.MZ)({type:Object})],e9.prototype,"wallet",void 0),e9=e8([(0,c.EM)("w3m-all-wallets-list-item")],e9);let te=(0,c.AH)`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:e})=>e["4"]};
    padding-bottom: ${({spacing:e})=>e["4"]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var tt=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ti="local-paginator",to=class extends o.WF{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!s.N.state.wallets.length,this.wallets=s.N.state.wallets,this.mobileFullScreen=a.H.state.enableMobileFullScreen,this.unsubscribe.push(s.N.subscribeKey("wallets",e=>this.wallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,o.qy)`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;let e=this.shadowRoot?.querySelector("wui-grid");e&&(await s.N.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,t){return[...Array(e)].map(()=>(0,o.qy)`
        <wui-card-select-loader type="wallet" id=${(0,d.J)(t)}></wui-card-select-loader>
      `)}walletsTemplate(){return eX.A.getWalletConnectWallets(this.wallets).map((e,t)=>(0,o.qy)`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${e.id}"
          @click=${()=>this.onConnectWallet(e)}
          .wallet=${e}
          explorerId=${e.id}
          certified=${"certified"===this.badge}
          displayIndex=${t}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){let{wallets:e,recommended:t,featured:i,count:o,mobileFilteredOutWalletsLength:r}=s.N.state,n=window.innerWidth<352?3:4,a=e.length+t.length,l=Math.ceil(a/n)*n-a+n;return(l-=e.length?i.length%n:0,0===o&&i.length>0)?null:0===o||[...i,...e,...t].length<o-(r??0)?this.shimmerTemplate(l,ti):null}createPaginationObserver(){let e=this.shadowRoot?.querySelector(`#${ti}`);e&&(this.paginationObserver=new IntersectionObserver(([e])=>{if(e?.isIntersecting&&!this.loading){let{page:e,count:t,wallets:i}=s.N.state;i.length<t&&s.N.fetchWalletsByPage({page:e+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){p.a.selectWalletConnector(e)}};to.styles=te,tt([(0,r.wk)()],to.prototype,"loading",void 0),tt([(0,r.wk)()],to.prototype,"wallets",void 0),tt([(0,r.wk)()],to.prototype,"badge",void 0),tt([(0,r.wk)()],to.prototype,"mobileFullScreen",void 0),to=tt([(0,c.EM)("w3m-all-wallets-list")],to),i(57320);let tr=(0,o.AH)`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var tn=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ta=class extends o.WF{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=a.H.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?(0,o.qy)`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await s.N.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){let{search:e}=s.N.state,t=eX.A.markWalletsAsInstalled(e),i=eX.A.filterWalletsByWcSupport(t);return i.length?(0,o.qy)`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${i.map((e,t)=>(0,o.qy)`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(e)}
              .wallet=${e}
              data-testid="wallet-search-item-${e.id}"
              explorerId=${e.id}
              certified=${"certified"===this.badge}
              walletQuery=${this.query}
              displayIndex=${t}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:(0,o.qy)`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){p.a.selectWalletConnector(e)}};ta.styles=tr,tn([(0,r.wk)()],ta.prototype,"loading",void 0),tn([(0,r.wk)()],ta.prototype,"mobileFullScreen",void 0),tn([(0,r.MZ)()],ta.prototype,"query",void 0),tn([(0,r.MZ)()],ta.prototype,"badge",void 0),ta=tn([(0,c.EM)("w3m-all-wallets-search")],ta);var ts=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let tl=class extends o.WF{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=n.w.debounce(e=>{this.search=e})}render(){let e=this.search.length>=2;return(0,o.qy)`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${"certified"===this.badge}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?(0,o.qy)`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:(0,o.qy)`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onCertifiedSwitchChange(e){e.detail?(this.badge="certified",W.P.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return n.w.isMobile()?(0,o.qy)`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){g.I.push("ConnectingWalletConnect")}};ts([(0,r.wk)()],tl.prototype,"search",void 0),ts([(0,r.wk)()],tl.prototype,"badge",void 0),tl=ts([(0,c.EM)("w3m-all-wallets-view")],tl),i(32207);let tc=class extends o.WF{constructor(){super(...arguments),this.wallet=g.I.state.data?.wallet}render(){if(!this.wallet)throw Error("w3m-downloads-view");return(0,o.qy)`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?(0,o.qy)`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?(0,o.qy)`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?(0,o.qy)`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?(0,o.qy)`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(e){e.href&&this.wallet&&(w.E.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:e.type}}),n.w.openHref(e.href,"_blank"))}onChromeStore(){this.wallet?.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){this.wallet?.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){this.wallet?.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){this.wallet?.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};tc=function(e,t,i,o){var r,n=arguments.length,a=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var s=e.length-1;s>=0;s--)(r=e[s])&&(a=(n<3?r(a):n>3?r(t,i,a):r(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-downloads-view")],tc)}}]);