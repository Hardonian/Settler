(()=>{var e={};e.id=2383,e.ids=[2383],e.modules={53524:e=>{"use strict";e.exports=require("@prisma/client")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},61212:e=>{"use strict";e.exports=require("async_hooks")},61282:e=>{"use strict";e.exports=require("child_process")},27920:e=>{"use strict";e.exports=require("diagnostics_channel")},82266:e=>{"use strict";e.exports=require("domain")},92048:e=>{"use strict";e.exports=require("fs")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},66302:e=>{"use strict";e.exports=require("inspector")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},33292:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.Z,__next_app__:()=>p,originalPathname:()=>d,pages:()=>c,routeModule:()=>u,tree:()=>n}),a(85247),a(7266),a(72608),a(8352),a(19718),a(31306),a(10285),a(58909);var r=a(93282),s=a(5736),i=a(61249),l=a(36880),o={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);a.d(t,o);let n=["",{children:["playground",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,85247)),"/workspace/packages/web/src/app/playground/page.tsx"]}]},{error:[()=>Promise.resolve().then(a.bind(a,7266)),"/workspace/packages/web/src/app/playground/error.tsx"],"not-found":[()=>Promise.resolve().then(a.bind(a,72608)),"/workspace/packages/web/src/app/playground/not-found.tsx"],metadata:{icon:[],apple:[],openGraph:[async e=>(await Promise.resolve().then(a.bind(a,50942))).default(e)],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,8352)),"/workspace/packages/web/src/app/layout.tsx"],template:[()=>Promise.resolve().then(a.bind(a,19718)),"/workspace/packages/web/src/app/template.tsx"],error:[()=>Promise.resolve().then(a.bind(a,31306)),"/workspace/packages/web/src/app/error.tsx"],loading:[()=>Promise.resolve().then(a.bind(a,10285)),"/workspace/packages/web/src/app/loading.tsx"],"not-found":[()=>Promise.resolve().then(a.bind(a,58909)),"/workspace/packages/web/src/app/not-found.tsx"],metadata:{icon:[],apple:[],openGraph:[async e=>(await Promise.resolve().then(a.bind(a,50942))).default(e)],twitter:[],manifest:void 0}}],c=["/workspace/packages/web/src/app/playground/page.tsx"],d="/playground/page",p={require:a,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/playground/page",pathname:"/playground",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:n}})},22617:(e,t,a)=>{Promise.resolve().then(a.bind(a,26250))},37069:(e,t,a)=>{Promise.resolve().then(a.bind(a,81575))},26250:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});var r=a(73227);a(23677);var s=a(79580),i=a(11250),l=a(93126),o=a(20649);function n({error:e,reset:t}){return r.jsx("div",{className:"flex items-center justify-center min-h-[60vh] p-6",children:(0,r.jsxs)(s.Zb,{className:"max-w-md",children:[(0,r.jsxs)(s.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(l.Z,{className:"h-5 w-5 text-red-600"}),r.jsx(s.ll,{children:"Failed to load playground"})]}),r.jsx(s.SZ,{children:"We encountered an error loading the playground."})]}),(0,r.jsxs)(s.aY,{className:"space-y-4",children:[r.jsx("p",{className:"text-sm text-slate-600 dark:text-slate-400",children:e.message||"An unexpected error occurred. Please try again."}),e.digest&&(0,r.jsxs)("p",{className:"text-xs text-slate-500 dark:text-slate-500 font-mono",children:["Error ID: ",e.digest]}),(0,r.jsxs)("div",{className:"flex gap-2",children:[r.jsx(i.z,{onClick:t,variant:"default",children:"Try Again"}),r.jsx(i.z,{asChild:!0,variant:"outline",children:r.jsx(o.default,{href:"/",children:"Go Home"})})]})]})]})})}},81575:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>m});var r=a(73227),s=a(23677);a(55243);var i=a(11250),l=a(79580),o=a(24988),n=a(45094),c=a(66144),d=a(34996),p=a(50196),u=a(80188),x=a(45316);function m(){let[e,t]=(0,s.useState)(""),[a,m]=(0,s.useState)(`import { Settler } from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      // SECURITY: Never expose secret keys client-side!
      // Use server-side API routes to handle Stripe operations
      apiKey: "sk_test_...", // Placeholder - use server-side API in production
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

🎉 Reconciliation completed successfully!`),y(!1),e()},1500)})},[j,k]=(0,s.useState)(!1),v=(0,s.useRef)(null);return(0,r.jsxs)(u.AnimatedPageWrapper,{"aria-label":"Interactive playground",children:[r.jsx(n.Navigation,{}),r.jsx(x.AnimatedHero,{badge:"Interactive Playground",title:"Try Settler API",description:"Test our APIs, explore examples, and experiment with reconciliation jobs—all without writing code or signing up"}),r.jsx("section",{ref:v,className:"py-12 px-4 sm:px-6 lg:px-8","aria-labelledby":"playground-heading",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto",children:[r.jsx("h2",{id:"playground-heading",className:"sr-only",children:"Interactive Playground"}),(0,r.jsxs)(l.Zb,{className:`
              bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6
              transition-all duration-700
              ${j?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,role:"region","aria-labelledby":"api-config-heading",children:[(0,r.jsxs)(l.Ol,{children:[r.jsx(l.ll,{id:"api-config-heading",className:"text-slate-900 dark:text-slate-100",children:"API Configuration"}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Enter your API key to test with real credentials, or leave empty to explore demo mode with sample data"})]}),r.jsx(l.aY,{children:(0,r.jsxs)("div",{className:"flex gap-4",children:[r.jsx("input",{type:"text",value:e,onChange:e=>{t(e.target.value),m(a.replace(/sk_your_api_key/g,e.target.value||"sk_your_api_key"))},placeholder:"sk_your_api_key",className:"flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent font-mono text-sm leading-[1.5]","aria-label":"API key input"}),r.jsx(i.z,{onClick:f,disabled:b,className:"bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2","aria-label":b?"Running code":"Run code",children:b?"Running...":"Run Code"})]})})]}),(0,r.jsxs)("div",{className:`
              grid grid-cols-1 lg:grid-cols-2 gap-6
              transition-all duration-700
              ${j?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,style:{transitionDelay:"200ms"},children:[(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"editor-heading",children:[(0,r.jsxs)(l.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[r.jsx(l.ll,{id:"editor-heading",className:"text-slate-900 dark:text-slate-100",children:"Code Editor"}),r.jsx(o.C,{className:"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",children:"TypeScript"})]}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Edit the code below to experiment with the Settler API"})]}),r.jsx(l.aY,{children:r.jsx("textarea",{value:a,onChange:e=>m(e.target.value),className:"w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] p-4 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-slate-900 dark:bg-slate-950 text-green-300 dark:text-green-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-y leading-[1.5]",style:{lineHeight:"1.5"},spellCheck:!1,"aria-label":"Code editor"})})]}),(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"output-heading","aria-live":"polite",children:[(0,r.jsxs)(l.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[r.jsx(l.ll,{id:"output-heading",className:"text-slate-900 dark:text-slate-100",children:"Output"}),r.jsx(o.C,{className:"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",children:"Console"})]}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Results and logs from your code execution"})]}),r.jsx(l.aY,{children:r.jsx("div",{className:"w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] p-4 bg-slate-900 dark:bg-slate-950 text-green-300 dark:text-green-400 font-mono text-sm rounded-md overflow-auto border border-slate-300 dark:border-slate-700",role:"log","aria-label":"Code execution output",children:r.jsx("pre",{className:"whitespace-pre-wrap leading-[1.5]",style:{lineHeight:"1.5"},children:g})})})]})]}),r.jsx("div",{className:`
              mt-8
              transition-all duration-700
              ${j?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}
            `,style:{transitionDelay:"400ms"},children:(0,r.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg",role:"region","aria-labelledby":"examples-heading",children:[(0,r.jsxs)(l.Ol,{children:[r.jsx(l.ll,{id:"examples-heading",className:"text-slate-900 dark:text-slate-100",children:"Quick Examples"}),r.jsx(l.SZ,{className:"text-slate-600 dark:text-slate-300",children:"Try these pre-configured examples"})]}),r.jsx(l.aY,{children:(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",role:"list","aria-label":"Quick example templates",children:[r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

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
console.log(report.data.summary);`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load QuickBooks to Stripe example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1 leading-[1.4]",children:"QuickBooks → Stripe"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400 leading-[1.5]",children:"Accounting to payments"})]})}),r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

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
console.log(report.data.summary);`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load PayPal to Shopify example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1 leading-[1.4]",children:"PayPal → Shopify"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400 leading-[1.5]",children:"Payment to e-commerce"})]})}),r.jsx(i.z,{variant:"outline",onClick:()=>{m(`import { Settler } from "@settler/sdk";

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
});`)},className:"h-auto py-4 text-left transition-all transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",role:"listitem","aria-label":"Load real-time webhooks example",children:(0,r.jsxs)("div",{children:[r.jsx("div",{className:"font-semibold mb-1 leading-[1.4]",children:"Real-time Webhooks"}),r.jsx("div",{className:"text-xs text-slate-500 dark:text-slate-400 leading-[1.5]",children:"Live event reconciliation"})]})})]})})]})})]})}),r.jsx("section",{className:"py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto",children:[r.jsx("div",{className:"text-center mb-8",children:r.jsx("h2",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100 leading-[1.4]",children:"Secure & Reliable"})}),r.jsx(p.j,{})]})}),r.jsx("section",{className:"py-20 px-4 sm:px-6 lg:px-8",children:r.jsx("div",{className:"max-w-4xl mx-auto",children:r.jsx(d.J,{title:"Ready to Integrate?",description:"Get your API key and start reconciling in minutes. 14-day free trial—no credit card required.",primaryAction:"Start Free Trial",primaryLink:"/signup",secondaryAction:"View Pricing",secondaryLink:"/pricing",variant:"gradient"})})}),r.jsx(c.$,{})]})}},7266:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(53189).createProxy)(String.raw`/workspace/packages/web/src/app/playground/error.tsx#default`)},72608:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});var r=a(99013),s=a(55193),i=a(20313),l=a(6787),o=a(23802);function n(){return r.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:(0,r.jsxs)(s.Zb,{className:"max-w-md",children:[(0,r.jsxs)(s.Ol,{children:[(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(o.Z,{className:"h-5 w-5 text-slate-600"}),r.jsx(s.ll,{children:"Page Not Found"})]}),r.jsx(s.SZ,{children:"The playground page you're looking for doesn't exist."})]}),(0,r.jsxs)(s.aY,{className:"space-y-4",children:[r.jsx("p",{className:"text-sm text-slate-600 dark:text-slate-400",children:"The page you requested could not be found in the Playground."}),(0,r.jsxs)("div",{className:"flex gap-2",children:[r.jsx(i.z,{asChild:!0,variant:"default",children:r.jsx(l.default,{href:"/playground",children:"Go to Playground"})}),r.jsx(i.z,{asChild:!0,variant:"outline",children:r.jsx(l.default,{href:"/console",children:"Go to Console"})}),r.jsx(i.z,{asChild:!0,variant:"outline",children:r.jsx(l.default,{href:"/",children:"Go Home"})})]})]})]})})}},85247:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(53189).createProxy)(String.raw`/workspace/packages/web/src/app/playground/page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[4522,8988,6603,2783,3076,9101,4912,6155,6144,487],()=>a(33292));module.exports=r})();