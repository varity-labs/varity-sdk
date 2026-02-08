"use strict";exports.id=17,exports.ids=[17],exports.modules={17:(a,b,c)=>{c.r(b),c.d(b,{PhPlus:()=>l}),c(84236);var d=c(9593),e=c(74830),f=c(53357),g=c(28872),h=c(84032),i=Object.defineProperty,j=Object.getOwnPropertyDescriptor,k=(a,b,c,d)=>{for(var e,f=d>1?void 0:d?j(b,c):b,g=a.length-1;g>=0;g--)(e=a[g])&&(f=(d?e(b,c,f):e(f))||f);return d&&f&&i(b,c,f),f};let l=class extends e.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var a;return(0,d.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(a=this.weight)?a:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,d.JW)`<path d="M220,128a4,4,0,0,1-4,4H132v84a4,4,0,0,1-8,0V132H40a4,4,0,0,1,0-8h84V40a4,4,0,0,1,8,0v84h84A4,4,0,0,1,220,128Z"/>`],["light",(0,d.JW)`<path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"/>`],["regular",(0,d.JW)`<path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>`],["bold",(0,d.JW)`<path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>`],["fill",(0,d.JW)`<path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM184,136H136v48a8,8,0,0,1-16,0V136H72a8,8,0,0,1,0-16h48V72a8,8,0,0,1,16,0v48h48a8,8,0,0,1,0,16Z"/>`],["duotone",(0,d.JW)`<path d="M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z" opacity="0.2"/><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>`]]),l.styles=(0,h.AH)`
    :host {
      display: contents;
    }
  `,k([(0,g.M)({type:String,reflect:!0})],l.prototype,"size",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"weight",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"color",2),k([(0,g.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=k([(0,f.E)("ph-plus")],l)}};