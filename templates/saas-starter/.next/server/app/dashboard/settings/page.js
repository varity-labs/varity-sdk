(()=>{var a={};a.id=34631,a.ids=[34631],a.modules={260:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>E.a,__next_app__:()=>K,handler:()=>M,pages:()=>J,routeModule:()=>L,tree:()=>I});var d=c(55173),e=c(22434),f=c(82802),g=c(78883),h=c(55569),i=c(67057),j=c(22072),k=c(96521),l=c(53913),m=c(56411),n=c(61039),o=c(11112),p=c(53886),q=c(86179),r=c(261),s=c(55690),t=c(35095),u=c(26713),v=c(28923),w=c(94840),y=c(5548),z=c(31237),A=c(42387),B=c(29313),C=c(86439),D=c(9247),E=c.n(D),F=c(89947),G=c(58714),H={};for(let a in F)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(H[a]=()=>F[a]);c.d(b,H);let I={children:["",{children:["dashboard",{children:["settings",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,7886)),"/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/dashboard/settings/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,73895)),"/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/dashboard/layout.tsx"]}]},{layout:[()=>Promise.resolve().then(c.bind(c,2920)),"/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,9247,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,49327,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,1674,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,56341,23)),"next/dist/client/components/builtin/unauthorized.js"]}]}.children,J=["/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/dashboard/settings/page.tsx"],K={require:c,loadChunk:()=>Promise.resolve()},L=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/dashboard/settings/page",pathname:"/dashboard/settings",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:I},distDir:".next",relativeProjectDir:""});async function M(a,b,d){var D;let H="/dashboard/settings/page";"/index"===H&&(H="/");let N=(0,h.getRequestMeta)(a,"postponed"),O=(0,h.getRequestMeta)(a,"minimalMode"),P=await L.prepare(a,b,{srcPage:H,multiZoneDraftMode:!1});if(!P)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:Q,query:R,params:S,parsedUrl:T,pageIsDynamic:U,buildManifest:V,nextFontManifest:W,reactLoadableManifest:X,serverActionsManifest:Y,clientReferenceManifest:Z,subresourceIntegrityManifest:$,prerenderManifest:_,isDraftMode:aa,resolvedPathname:ab,revalidateOnlyGenerated:ac,routerServerContext:ad,nextConfig:ae,interceptionRoutePatterns:af}=P,ag=T.pathname||"/",ah=(0,r.normalizeAppPath)(H),{isOnDemandRevalidate:ai}=P,aj=L.match(ag,_),ak=!!_.routes[ab],al=!!(aj||ak||_.routes[ah]),am=a.headers["user-agent"]||"",an=(0,u.getBotType)(am),ao=(0,p.isHtmlBotRequest)(a),ap=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],aq=(0,h.getRequestMeta)(a,"isRSCRequest")??!!a.headers[t.RSC_HEADER],ar=(0,s.getIsPossibleServerAction)(a),as=(0,m.checkIsAppPPREnabled)(ae.experimental.ppr)&&(null==(D=_.routes[ah]??_.dynamicRoutes[ah])?void 0:D.renderingMode)==="PARTIALLY_STATIC",at=!1,au=!1,av=as?N:void 0,aw=as&&aq&&!ap,ax=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ay=!am||(0,p.shouldServeStreamingMetadata)(am,ae.htmlLimitedBots);ao&&as&&(al=!1,ay=!1);let az=!0===L.isDev||!al||"string"==typeof N||aw,aA=ao&&as,aB=null;aa||!al||az||ar||av||aw||(aB=ab);let aC=aB;!aC&&L.isDev&&(aC=ab),L.isDev||aa||!al||!aq||aw||(0,k.d)(a.headers);let aD={...F,tree:I,pages:J,GlobalError:E(),handler:M,routeModule:L,__next_app__:K};Y&&Z&&(0,o.setReferenceManifestsSingleton)({page:H,clientReferenceManifest:Z,serverActionsManifest:Y,serverModuleMap:(0,q.createServerModuleMap)({serverActionsManifest:Y})});let aE=a.method||"GET",aF=(0,g.getTracer)(),aG=aF.getActiveScopeSpan();try{let f=L.getVaryHeader(ab,af);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return L.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aF.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aE} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aE} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:R,params:S,page:ah,sharedContext:{buildId:Q},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aD,Component:(0,j.T)(aD),params:S,routeModule:L,page:H,postponed:f,shouldWaitOnAllReady:aA,serveStreamingMetadata:ay,supportsDynamicResponse:"string"==typeof f||az,buildManifest:V,nextFontManifest:W,reactLoadableManifest:X,subresourceIntegrityManifest:$,serverActionsManifest:Y,clientReferenceManifest:Z,setIsrStatus:null==ad?void 0:ad.setIsrStatus,dir:c(33873).join(process.cwd(),L.relativeProjectDir),isDraftMode:aa,isRevalidate:al&&!f&&!aw,botType:an,isOnDemandRevalidate:ai,isPossibleServerAction:ar,assetPrefix:ae.assetPrefix,nextConfigOutput:ae.output,crossOrigin:ae.crossOrigin,trailingSlash:ae.trailingSlash,previewProps:_.preview,deploymentId:ae.deploymentId,enableTainting:ae.experimental.taint,htmlLimitedBots:ae.htmlLimitedBots,devtoolSegmentExplorer:ae.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ae.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ae.experimental.cacheLife,basePath:ae.basePath,serverActions:ae.experimental.serverActions,...at?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:at}:{},experimental:{isRoutePPREnabled:as,expireTime:ae.expireTime,staleTimes:ae.experimental.staleTimes,cacheComponents:!!ae.experimental.cacheComponents,clientSegmentCache:!!ae.experimental.clientSegmentCache,clientParamParsing:!!ae.experimental.clientParamParsing,dynamicOnHover:!!ae.experimental.dynamicOnHover,inlineCss:!!ae.experimental.inlineCss,authInterrupts:!!ae.experimental.authInterrupts,clientTraceMetadata:ae.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>L.onRequestError(a,b,d,ad),err:(0,h.getRequestMeta)(a,"invokeError"),dev:L.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[z.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,al&&(null==n?void 0:n.revalidate)===0&&!L.isDev&&!as){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${ab}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:v.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},o=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===L.isDev,l=c||b.writableEnded;if(ai&&ac&&!f&&!O)return(null==ad?void 0:ad.render404)?await ad.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(aj&&(j=(0,w.parseFallbackField)(aj.fallback)),j===w.FallbackMode.PRERENDER&&(0,u.isBot)(am)&&(!as||ao)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ai=!0),ai&&(j!==w.FallbackMode.NOT_FOUND||f)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),!O&&j!==w.FallbackMode.BLOCKING_STATIC_RENDER&&aC&&!l&&!aa&&U&&(k||!ak)){let b;if((k||aj)&&j===w.FallbackMode.NOT_FOUND)throw new C.NoFallbackError;if(as&&!aq){let c="string"==typeof(null==aj?void 0:aj.fallback)?aj.fallback:k?ah:null;if(b=await L.handleResponse({cacheKey:c,req:a,nextConfig:ae,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:_,isRoutePPREnabled:as,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||au?(0,n.u)(ah):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let o=ai||g||!av?void 0:av;if(at&&void 0!==o)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:v.CachedRouteKind.PAGES,html:y.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=U&&as&&((0,h.getRequestMeta)(a,"renderFallbackShell")||au)?(0,n.u)(ag):null;return m({span:i,postponed:o,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,n=await L.handleResponse({cacheKey:aB,responseGenerator:a=>o({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ai,isRoutePPREnabled:as,req:a,nextConfig:ae,prerenderManifest:_,waitUntil:d.waitUntil});if(aa&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),L.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!n){if(aB)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=n.value)?void 0:f.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=n.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof n.value.postponed;al&&!aw&&(!p||ap)&&(O||b.setHeader("x-nextjs-cache",ai?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),b.setHeader(t.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=n;if(av)l={revalidate:0,expire:void 0};else if(O&&aq&&!ap&&as)l={revalidate:0,expire:void 0};else if(!L.isDev)if(aa)l={revalidate:0,expire:void 0};else if(al){if(n.cacheControl)if("number"==typeof n.cacheControl.revalidate){if(n.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:n.cacheControl.revalidate,expire:(null==(j=n.cacheControl)?void 0:j.expire)??ae.expireTime}}else l={revalidate:z.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(n.cacheControl=l,"string"==typeof ax&&(null==q?void 0:q.kind)===v.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[z.NEXT_CACHE_TAGS_HEADER];O&&al&&c&&"string"==typeof c&&b.setHeader(z.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(ax);return void 0!==d?(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.fromStatic(d,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl}):(b.statusCode=204,(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.EMPTY,cacheControl:n.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...n,value:{...n.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&av)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(O&&al||delete a[z.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[z.NEXT_CACHE_TAGS_HEADER];if(O&&al&&s&&"string"==typeof s&&b.setHeader(z.NEXT_CACHE_TAGS_HEADER,s),!q.status||aq&&as||(b.statusCode=q.status),!O&&q.status&&G.RedirectStatusCode[q.status]&&aq&&(b.statusCode=200),p&&b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"1"),aq&&!aa){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:q.html,cacheControl:aw?{revalidate:0,expire:void 0}:n.cacheControl})}return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.fromStatic(q.rscData,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl})}let u=q.html;if(!p||O||aq)return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:u,cacheControl:n.cacheControl});if(at)return u.push(new ReadableStream({start(a){a.enqueue(A.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}});let w=new TransformStream;return u.push(w.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(w.writable)}).catch(a=>{w.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}})};if(!aG)return await aF.withPropagatedContext(a.headers,()=>aF.trace(i.BaseServerSpan.handleRequest,{spanName:`${aE} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aE,"http.target":a.url}},p));await p(aG)}catch(b){throw b instanceof C.NoFallbackError||await L.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:al,isOnDemandRevalidate:ai})},ad),b}}},261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4573:a=>{"use strict";a.exports=require("node:buffer")},7886:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(62979).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/dashboard/settings/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/macoding/varity-workspace/varity-sdk/templates/saas-starter/src/app/dashboard/settings/page.tsx","default")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:a=>{"use strict";a.exports=require("punycode")},12412:a=>{"use strict";a.exports=require("assert")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21820:a=>{"use strict";a.exports=require("os")},23109:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>n});var d=c(68529),e=c(39123),f=c(81348),g=c(8192),h=c(27602),i=c(30952);function j({showLogoutButton:a=!0,onLogout:b,className:c="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg"}){let{ready:d,authenticated:j,user:k,logout:l}=(0,e.m)(),{wallets:m}=(0,g.S)(),n=async()=>{try{await l(),h.Ay.success("Successfully logged out"),b?.()}catch(a){console.error("Logout error:",(0,i.u1)(a)),h.Ay.error("Logout failed")}};if(!d||!j||!k)return null;let o=k.email?.address,p=k.google?.email,q=k.twitter?.username,r=k.discord?.username,s=k.github?.username,t=m[0],u=t?.address,v="Wallet",w=u;return o?(v="Email",w=o):p?(v="Google",w=p):q?(v="Twitter",w=`@${q}`):r?(v="Discord",w=r):s&&(v="GitHub",w=s),f.createElement("div",{className:c},f.createElement("h2",{className:"text-2xl font-bold mb-4"},"Profile"),f.createElement("div",{className:"space-y-3 bg-gray-50 p-4 rounded-lg"},f.createElement("div",{className:"flex justify-between items-center"},f.createElement("span",{className:"text-gray-600 font-medium"},"Account Type:"),f.createElement("span",{className:"px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"},v)),w&&f.createElement("div",{className:"flex justify-between items-start"},f.createElement("span",{className:"text-gray-600 font-medium"},"Account:"),f.createElement("span",{className:"text-right font-medium text-gray-900 break-all max-w-xs"},w)),u&&f.createElement("div",{className:"flex justify-between items-start"},f.createElement("span",{className:"text-gray-600 font-medium"},"Wallet:"),f.createElement("code",{className:"text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200"},u.slice(0,6),"...",u.slice(-4))),f.createElement("div",{className:"flex justify-between items-center"},f.createElement("span",{className:"text-gray-600 font-medium"},"User ID:"),f.createElement("code",{className:"text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200"},k.id.slice(0,8),"...")),k.createdAt&&f.createElement("div",{className:"flex justify-between items-center"},f.createElement("span",{className:"text-gray-600 font-medium"},"Joined:"),f.createElement("span",{className:"text-sm text-gray-700"},new Date(k.createdAt).toLocaleDateString()))),a&&f.createElement("button",{onClick:n,className:"w-full mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"},"Logout"))}var k=c(85136),l=c(79276),m=c(30491);function n(){let{email:a,name:b}=(0,k.iZ)(),{logout:c}=(0,e.m)();return(0,d.jsxs)("div",{className:"space-y-6",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("h1",{className:"text-2xl font-bold text-gray-900",children:"Settings"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-600",children:"Manage your account and preferences."})]}),(0,d.jsxs)("div",{className:"rounded-xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,d.jsx)("h2",{className:"mb-4 text-lg font-semibold text-gray-900",children:"Profile"}),(0,d.jsxs)("div",{className:"space-y-3",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-500",children:"Name"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-900",children:b})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-500",children:"Email"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-gray-900",children:a||"Not set"})]})]})]}),(0,d.jsxs)("div",{className:"rounded-xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,d.jsx)("h2",{className:"mb-4 text-lg font-semibold text-gray-900",children:"Account Settings"}),(0,d.jsx)(j,{showLogoutButton:!1})]}),(0,d.jsxs)("div",{className:"rounded-xl border border-red-200 bg-red-50 p-6",children:[(0,d.jsx)("h2",{className:"mb-2 text-lg font-semibold text-red-900",children:"Danger Zone"}),(0,d.jsxs)("p",{className:"mb-4 text-sm text-red-700",children:["Once you sign out, you will need to sign in again to access ",m.C3,"."]}),(0,d.jsx)(l.$,{variant:"danger",onClick:()=>c(),children:"Sign Out"})]})]})}},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},27602:(a,b,c)=>{"use strict";c.d(b,{Ay:()=>N});var d,e=c(81348);let f={data:""},g=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,h=/\/\*[^]*?\*\/|  +/g,i=/\n+/g,j=(a,b)=>{let c="",d="",e="";for(let f in a){let g=a[f];"@"==f[0]?"i"==f[1]?c=f+" "+g+";":d+="f"==f[1]?j(g,f):f+"{"+j(g,"k"==f[1]?"":b)+"}":"object"==typeof g?d+=j(g,b?b.replace(/([^,])+/g,a=>f.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,b=>/&/.test(b)?b.replace(/&/g,a):a?a+" "+b:b)):f):null!=g&&(f=/^--/.test(f)?f:f.replace(/[A-Z]/g,"-$&").toLowerCase(),e+=j.p?j.p(f,g):f+":"+g+";")}return c+(b&&e?b+"{"+e+"}":e)+d},k={},l=a=>{if("object"==typeof a){let b="";for(let c in a)b+=c+l(a[c]);return b}return a};function m(a){let b,c,d=this||{},e=a.call?a(d.p):a;return((a,b,c,d,e)=>{var f,m,n,o;let p=l(a),q=k[p]||(k[p]=(a=>{let b=0,c=11;for(;b<a.length;)c=101*c+a.charCodeAt(b++)>>>0;return"go"+c})(p));if(!k[q]){let b=p!==a?a:(a=>{let b,c,d=[{}];for(;b=g.exec(a.replace(h,""));)b[4]?d.shift():b[3]?(c=b[3].replace(i," ").trim(),d.unshift(d[0][c]=d[0][c]||{})):d[0][b[1]]=b[2].replace(i," ").trim();return d[0]})(a);k[q]=j(e?{["@keyframes "+q]:b}:b,c?"":"."+q)}let r=c&&k.g?k.g:null;return c&&(k.g=k[q]),f=k[q],m=b,n=d,(o=r)?m.data=m.data.replace(o,f):-1===m.data.indexOf(f)&&(m.data=n?f+m.data:m.data+f),q})(e.unshift?e.raw?(b=[].slice.call(arguments,1),c=d.p,e.reduce((a,d,e)=>{let f=b[e];if(f&&f.call){let a=f(c),b=a&&a.props&&a.props.className||/^go/.test(a)&&a;f=b?"."+b:a&&"object"==typeof a?a.props?"":j(a,""):!1===a?"":a}return a+d+(null==f?"":f)},"")):e.reduce((a,b)=>Object.assign(a,b&&b.call?b(d.p):b),{}):e,(a=>{if("object"==typeof window){let b=(a?a.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return b.nonce=window.__nonce__,b.parentNode||(a||document.head).appendChild(b),b.firstChild}return a||f})(d.target),d.g,d.o,d.k)}m.bind({g:1});let n,o,p,q=m.bind({k:1});function r(a,b){let c=this||{};return function(){let d=arguments;function e(f,g){let h=Object.assign({},f),i=h.className||e.className;c.p=Object.assign({theme:o&&o()},h),c.o=/ *go\d+/.test(i),h.className=m.apply(c,d)+(i?" "+i:""),b&&(h.ref=g);let j=a;return a[0]&&(j=h.as||a,delete h.as),p&&j[0]&&p(h),n(j,h)}return b?b(e):e}}var s=(a,b)=>"function"==typeof a?a(b):a,t=(()=>{let a=0;return()=>(++a).toString()})(),u=(()=>{let a;return()=>a})(),v="default",w=(a,b)=>{let{toastLimit:c}=a.settings;switch(b.type){case 0:return{...a,toasts:[b.toast,...a.toasts].slice(0,c)};case 1:return{...a,toasts:a.toasts.map(a=>a.id===b.toast.id?{...a,...b.toast}:a)};case 2:let{toast:d}=b;return w(a,{type:+!!a.toasts.find(a=>a.id===d.id),toast:d});case 3:let{toastId:e}=b;return{...a,toasts:a.toasts.map(a=>a.id===e||void 0===e?{...a,dismissed:!0,visible:!1}:a)};case 4:return void 0===b.toastId?{...a,toasts:[]}:{...a,toasts:a.toasts.filter(a=>a.id!==b.toastId)};case 5:return{...a,pausedAt:b.time};case 6:let f=b.time-(a.pausedAt||0);return{...a,pausedAt:void 0,toasts:a.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+f}))}}},y=[],z={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},A={},B=(a,b=v)=>{A[b]=w(A[b]||z,a),y.forEach(([a,c])=>{a===b&&c(A[b])})},C=a=>Object.keys(A).forEach(b=>B(a,b)),D=(a=v)=>b=>{B(b,a)},E=a=>(b,c)=>{let d,e=((a,b="blank",c)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:b,ariaProps:{role:"status","aria-live":"polite"},message:a,pauseDuration:0,...c,id:(null==c?void 0:c.id)||t()}))(b,a,c);return D(e.toasterId||(d=e.id,Object.keys(A).find(a=>A[a].toasts.some(a=>a.id===d))))({type:2,toast:e}),e.id},F=(a,b)=>E("blank")(a,b);F.error=E("error"),F.success=E("success"),F.loading=E("loading"),F.custom=E("custom"),F.dismiss=(a,b)=>{let c={type:3,toastId:a};b?D(b)(c):C(c)},F.dismissAll=a=>F.dismiss(void 0,a),F.remove=(a,b)=>{let c={type:4,toastId:a};b?D(b)(c):C(c)},F.removeAll=a=>F.remove(void 0,a),F.promise=(a,b,c)=>{let d=F.loading(b.loading,{...c,...null==c?void 0:c.loading});return"function"==typeof a&&(a=a()),a.then(a=>{let e=b.success?s(b.success,a):void 0;return e?F.success(e,{id:d,...c,...null==c?void 0:c.success}):F.dismiss(d),a}).catch(a=>{let e=b.error?s(b.error,a):void 0;e?F.error(e,{id:d,...c,...null==c?void 0:c.error}):F.dismiss(d)}),a};var G=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,H=q`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,I=q`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`;r("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${G} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${H} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${a=>a.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`;var J=q`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;r("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${a=>a.secondary||"#e0e0e0"};
  border-right-color: ${a=>a.primary||"#616161"};
  animation: ${J} 1s linear infinite;
`;var K=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,L=q`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`;r("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${K} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${L} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${a=>a.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,r("div")`
  position: absolute;
`,r("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`;var M=q`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`;r("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${M} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,r("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,r("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,d=e.createElement,j.p=void 0,n=d,o=void 0,p=void 0,m`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var N=F},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30952:(a,b,c)=>{"use strict";function d(a){if(a instanceof Error||"object"==typeof a&&null!==a&&"message"in a&&"string"==typeof a.message)return a.message;try{return JSON.stringify(a)}catch{return String(a)}}c.d(b,{u1:()=>d})},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},37067:a=>{"use strict";a.exports=require("node:http")},38522:a=>{"use strict";a.exports=require("node:zlib")},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},44708:a=>{"use strict";a.exports=require("node:https")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57075:a=>{"use strict";a.exports=require("node:stream")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63383:(a,b,c)=>{Promise.resolve().then(c.bind(c,7886))},73024:a=>{"use strict";a.exports=require("node:fs")},73136:a=>{"use strict";a.exports=require("node:url")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77030:a=>{"use strict";a.exports=require("node:net")},77598:a=>{"use strict";a.exports=require("node:crypto")},79276:(a,b,c)=>{"use strict";c.d(b,{$:()=>h});var d=c(68529);let e=(0,c(4424).A)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]),f={primary:"bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",secondary:"border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400",ghost:"text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400",danger:"border border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-500"},g={sm:"px-3 py-1.5 text-sm gap-1.5",md:"px-4 py-2 text-sm gap-2",lg:"px-5 py-2.5 text-base gap-2"};function h({variant:a="primary",size:b="md",loading:c=!1,icon:h,children:i,disabled:j,className:k="",...l}){return(0,d.jsxs)("button",{disabled:j||c,className:`inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${f[a]} ${g[b]} ${k}`,...l,children:[c?(0,d.jsx)(e,{className:"h-4 w-4 animate-spin"}):h?(0,d.jsx)("span",{className:"shrink-0",children:h}):null,i]})}},79428:a=>{"use strict";a.exports=require("buffer")},79551:a=>{"use strict";a.exports=require("url")},81630:a=>{"use strict";a.exports=require("http")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91407:(a,b,c)=>{Promise.resolve().then(c.bind(c,23109))},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[20199,96468,5693],()=>b(b.s=260));module.exports=c})();