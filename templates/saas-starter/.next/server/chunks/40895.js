"use strict";exports.id=40895,exports.ids=[40895],exports.modules={40895:(a,b,c)=>{c.r(b),c.d(b,{PhCheck:()=>l}),c(84236);var d=c(9593),e=c(74830),f=c(53357),g=c(28872),h=c(84032),i=Object.defineProperty,j=Object.getOwnPropertyDescriptor,k=(a,b,c,d)=>{for(var e,f=d>1?void 0:d?j(b,c):b,g=a.length-1;g>=0;g--)(e=a[g])&&(f=(d?e(b,c,f):e(f))||f);return d&&f&&i(b,c,f),f};let l=class extends e.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var a;return(0,d.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(a=this.weight)?a:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,d.JW)`<path d="M226.83,74.83l-128,128a4,4,0,0,1-5.66,0l-56-56a4,4,0,0,1,5.66-5.66L96,194.34,221.17,69.17a4,4,0,1,1,5.66,5.66Z"/>`],["light",(0,d.JW)`<path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"/>`],["regular",(0,d.JW)`<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>`],["bold",(0,d.JW)`<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/>`],["fill",(0,d.JW)`<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`],["duotone",(0,d.JW)`<path d="M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z" opacity="0.2"/><path d="M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`]]),l.styles=(0,h.AH)`
    :host {
      display: contents;
    }
  `,k([(0,g.M)({type:String,reflect:!0})],l.prototype,"size",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"weight",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"color",2),k([(0,g.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=k([(0,f.E)("ph-check")],l)}};