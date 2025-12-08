(()=>{var e={};e.id=383,e.ids=[383,196],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},50524:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>l.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>d,routeModule:()=>x,tree:()=>c}),a(85247),a(91723),a(87824);var r=a(93282),s=a(5736),i=a(93906),l=a.n(i),o=a(36880),n={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>o[e]);a.d(t,n);let c=["",{children:["playground",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,85247)),"/workspace/packages/web/src/app/playground/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,91723)),"/workspace/packages/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,87824,23)),"next/dist/client/components/not-found-error"]}],d=["/workspace/packages/web/src/app/playground/page.tsx"],p="/playground/page",u={require:a,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/playground/page",pathname:"/playground",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},37069:(e,t,a)=>{Promise.resolve().then(a.bind(a,20267))},20267:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>m});var r=a(73227),s=a(23677),i=a(11250),l=a(79580),o=a(24988),n=a(62277),c=a(66144),d=a(34996),p=a(50196),u=a(80188),x=a(45316);function m(){let[e,t]=(0,s.useState)(""),[a,m]=(0,s.useState)(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    conflictResolution: "last-wins",
  },
});

console.log("Job created:", job.data.id);

// Run the job and get report
const report = await client.jobs.run(job.data.id);
console.log("Report:", report.data.summary);
// {
//   total: 150,
//   matched: 145,
//   unmatched: 3,
//   conflicts: 2,
//   accuracy: 0.987
// }`),[g,h]=(0,s.useState)("// Click 'Run Code' to execute and see results here"),[b,y]=(0,s.useState)(!1),f=async()=>{y(!0),h("// Running...\n"),await new Promise(e=>{setTimeout(()=>{h(`✅ Job created: job_abc123xyz
📊 Report Summary:
   Total: 150
   Matched: 145
   Unmatched: 3
   Conflicts: 2
   Accuracy: 98.7%

🎉 Reconciliation completed successfully!`),y(!1),e()},1500)})},[k,j]=(0,s.useState)(!1),v=(0,s.useRef)(null);return(0,r.jsxs)(u.AnimatedPageWrapper,{"aria-label":"Interactive playground",children:[r.jsx(n.Navigation,{}),r.jsx(x.z,{badge:"Interactive Playground",title:"Try Settler API",description:"Test the API, see examples, and experiment with reconciliation jobs"}),r.jsx("section",{ref:v,className:"py-12 px-4 sm:px-6 lg:px-8","aria-labelledby":"playground-heading",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto",children:[r.jsx("h2",{id:"playground-heading",className:"sr-only",children:"Interactive Playground"}),(0,r.jsxs)(l.Zb,{className:`
              bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6
              transition-all duration-700
              ${k?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,role:"region","aria-labelledby":"api-config-heading",children:[(0,r.jsxs)(l.Ol,{children:[r.jsx(l.ll,{id:"api-config-heading",className:"text-slate-900 dark:text-white",children:"API Configuration"}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Enter your API key to test with real credentials, or leave empty for demo mode"})]}),r.jsx(l.aY,{children:(0,r.jsxs)("div",{className:"flex gap-4",children:[r.jsx("input",{type:"text",value:e,onChange:e=>{t(e.target.value),m(a.replace(/sk_your_api_key/g,e.target.value||"sk_your_api_key"))},placeholder:"sk_your_api_key",className:"flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm","aria-label":"API key input"}),r.jsx(i.z,{onClick:f,disabled:b,className:"bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2","aria-label":b?"Running code":"Run code",children:b?"Running...":"Run Code"})]})})]}),(0,r.jsxs)("div",{className:`
              grid grid-cols-1 lg:grid-cols-2 gap-6
              transition-all duration-700
              ${k?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,style:{transitionDelay:"200ms"},children:[(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"editor-heading",children:[(0,r.jsxs)(l.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[r.jsx(l.ll,{id:"editor-heading",className:"text-slate-900 dark:text-white",children:"Code Editor"}),r.jsx(o.C,{className:"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",children:"TypeScript"})]}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Edit the code below to experiment with the Settler API"})]}),r.jsx(l.aY,{children:r.jsx("textarea",{value:a,onChange:e=>m(e.target.value),className:"w-full h-[500px] p-4 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-slate-900 dark:bg-slate-950 text-green-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",spellCheck:!1,"aria-label":"Code editor"})})]}),(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"output-heading","aria-live":"polite",children:[(0,r.jsxs)(l.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[r.jsx(l.ll,{id:"output-heading",className:"text-slate-900 dark:text-white",children:"Output"}),r.jsx(o.C,{className:"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",children:"Console"})]}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Results and logs from your code execution"})]}),r.jsx(l.aY,{children:r.jsx("div",{className:"w-full h-[500px] p-4 bg-slate-900 dark:bg-slate-950 text-green-400 font-mono text-sm rounded-md overflow-auto border border-slate-300 dark:border-slate-700",role:"log","aria-label":"Code execution output",children:r.jsx("pre",{className:"whitespace-pre-wrap",children:g})})})]})]}),r.jsx("div",{className:`
              mt-8
              transition-all duration-700
              ${k?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,style:{transitionDelay:"400ms"},children:(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"examples-heading",children:[(0,r.jsxs)(l.Ol,{children:[r.jsx(l.ll,{id:"examples-heading",className:"text-slate-900 dark:text-white",children:"Quick Examples"}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Try these pre-configured examples"})]}),r.jsx(l.aY,{children:(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",role:"list","aria-label":"Quick example templates",children:[r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
});

// QuickBooks to Stripe reconciliation
const job = await client.jobs.create({
  name: "QuickBooks-Stripe",
  source: { adapter: "quickbooks", config: { apiKey: "..." } },
  target: { adapter: "stripe", config: { apiKey: "..." } },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});

const report = await client.jobs.run(job.data.id);
console.log(report.data.summary);`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load QuickBooks to Stripe example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1",children:"QuickBooks → Stripe"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Accounting to payments"})]})}),r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
});

// PayPal to Shopify reconciliation
const job = await client.jobs.create({
  name: "PayPal-Shopify",
  source: { adapter: "paypal", config: { apiKey: "..." } },
  target: { adapter: "shopify", config: { apiKey: "..." } },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 }
    ]
  }
});

const report = await client.jobs.run(job.data.id);
console.log(report.data.summary);`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load PayPal to Shopify example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1",children:"PayPal → Shopify"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Payment to e-commerce"})]})}),r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
});

// Real-time webhook reconciliation
const job = await client.jobs.create({
  name: "Real-time Webhook Sync",
  source: { adapter: "webhook", config: { endpoint: "..." } },
  target: { adapter: "stripe", config: { apiKey: "..." } },
  rules: {
    matching: [{ field: "id", type: "exact" }],
    realtime: true
  }
});

// Listen for webhook events
client.webhooks.on("reconciliation.complete", (event) => {
  console.log("Reconciliation complete:", event.data);
});`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load real-time webhooks example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1",children:"Real-time Webhooks"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Live event reconciliation"})]})})]})})]})})]})}),r.jsx("section",{className:"py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto",children:[r.jsx("div",{className:"text-center mb-8",children:r.jsx("h2",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"Secure & Reliable"})}),r.jsx(p.TrustBadges,{})]})}),r.jsx("section",{className:"py-20 px-4 sm:px-6 lg:px-8",children:r.jsx("div",{className:"max-w-4xl mx-auto",children:r.jsx(d.ConversionCTA,{title:"Ready to Integrate?",description:"Get your API key and start reconciling in minutes. Free tier available.",primaryAction:"Get API Key",primaryLink:"/pricing",secondaryAction:"View Documentation",secondaryLink:"/docs",variant:"gradient"})})}),r.jsx(c.$,{})]})}},50196:(e,t,a)=>{"use strict";a.r(t),a.d(t,{TrustBadges:()=>i});var r=a(73227),s=a(23677);function i(){let[e,t]=(0,s.useState)(!1),a=(0,s.useRef)(null);return r.jsx("div",{ref:a,className:"flex flex-wrap items-center justify-center gap-6 py-8",role:"list","aria-label":"Trust badges and certifications",children:[{name:"SOC 2 Type II",icon:"\uD83D\uDD12"},{name:"GDPR Compliant",icon:"\uD83D\uDEE1️"},{name:"PCI-DSS Ready",icon:"\uD83D\uDCB3"},{name:"99.99% Uptime",icon:"⚡"}].map((t,a)=>(0,r.jsxs)("div",{className:`
            flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm
            transition-all duration-500
            ${e?"opacity-100 translate-y-0 scale-100":"opacity-0 translate-y-4 scale-95"}
            hover:shadow-lg hover:scale-105
          `,style:{transitionDelay:`${100*a}ms`},role:"listitem","aria-label":t.name,children:[r.jsx("span",{className:"text-2xl","aria-hidden":"true",children:t.icon}),r.jsx("span",{className:"text-sm font-medium text-slate-700 dark:text-slate-300",children:t.name})]},a))})}},85247:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(53189).createProxy)(String.raw`/workspace/packages/web/src/app/playground/page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[522,313,606,640,99],()=>a(50524));module.exports=r})();