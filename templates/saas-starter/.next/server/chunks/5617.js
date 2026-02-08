"use strict";exports.id=5617,exports.ids=[5617],exports.modules={5617:(a,b,c)=>{c.r(b),c.d(b,{PhCaretUp:()=>l}),c(84236);var d=c(9593),e=c(74830),f=c(53357),g=c(28872),h=c(84032),i=Object.defineProperty,j=Object.getOwnPropertyDescriptor,k=(a,b,c,d)=>{for(var e,f=d>1?void 0:d?j(b,c):b,g=a.length-1;g>=0;g--)(e=a[g])&&(f=(d?e(b,c,f):e(f))||f);return d&&f&&i(b,c,f),f};let l=class extends e.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var a;return(0,d.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(a=this.weight)?a:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,d.JW)`<path d="M210.83,162.83a4,4,0,0,1-5.66,0L128,85.66,50.83,162.83a4,4,0,0,1-5.66-5.66l80-80a4,4,0,0,1,5.66,0l80,80A4,4,0,0,1,210.83,162.83Z"/>`],["light",(0,d.JW)`<path d="M212.24,164.24a6,6,0,0,1-8.48,0L128,88.49,52.24,164.24a6,6,0,0,1-8.48-8.48l80-80a6,6,0,0,1,8.48,0l80,80A6,6,0,0,1,212.24,164.24Z"/>`],["regular",(0,d.JW)`<path d="M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"/>`],["bold",(0,d.JW)`<path d="M216.49,168.49a12,12,0,0,1-17,0L128,97,56.49,168.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0l80,80A12,12,0,0,1,216.49,168.49Z"/>`],["fill",(0,d.JW)`<path d="M215.39,163.06A8,8,0,0,1,208,168H48a8,8,0,0,1-5.66-13.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,215.39,163.06Z"/>`],["duotone",(0,d.JW)`<path d="M208,160H48l80-80Z" opacity="0.2"/><path d="M213.66,154.34l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,48,168H208a8,8,0,0,0,5.66-13.66ZM67.31,152,128,91.31,188.69,152Z"/>`]]),l.styles=(0,h.AH)`
    :host {
      display: contents;
    }
  `,k([(0,g.M)({type:String,reflect:!0})],l.prototype,"size",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"weight",2),k([(0,g.M)({type:String,reflect:!0})],l.prototype,"color",2),k([(0,g.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=k([(0,f.E)("ph-caret-up")],l)}};