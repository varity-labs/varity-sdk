"use strict";exports.id=96431,exports.ids=[96431],exports.modules={96431:(a,b,c)=>{c.r(b),c.d(b,{PhDotsThree:()=>l}),c(84236);var d=c(9593),e=c(74830),f=c(53357),g=c(28872),h=c(84032),i=Object.defineProperty,j=Object.getOwnPropertyDescriptor,k=(a,b,c,d)=>{for(var e,f=d>1?void 0:d?j(b,c):b,g=a.length-1;g>=0;g--)(e=a[g])&&(f=(d?e(b,c,f):e(f))||f);return d&&f&&i(b,c,f),f};let l=class extends e.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var a;return(0,d.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(a=this.weight)?a:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,d.JW)`<path d="M136,128a8,8,0,1,1-8-8A8,8,0,0,1,136,128Zm-76-8a8,8,0,1,0,8,8A8,8,0,0,0,60,120Zm136,0a8,8,0,1,0,8,8A8,8,0,0,0,196,120Z"/>`],["light",(0,d.JW)`<path d="M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z"/>`],["regular",(0,d.JW)`<path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"/>`],["bold",(0,d.JW)`<path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z"/>`],["fill",(0,d.JW)`<path d="M224,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V96A16,16,0,0,0,224,80ZM60,140a12,12,0,1,1,12-12A12,12,0,0,1,60,140Zm68,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm68,0a12,12,0,1,1,12-12A12,12,0,0,1,196,140Z"/>`],["duotone",(0,d.JW)`<path d="M240,96v64a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H224A16,16,0,0,1,240,96Z" opacity="0.2"/><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"/>`]]),l.styles=(0,h.AH)`
    :host {
      display: contents;
    }
  `,k([(0,g.M)({type:String,reflect:!0})],l.prototype,"size",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"weight",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"color",2),k([(0,g.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=k([(0,f.E)("ph-dots-three")],l)}};