(()=>{var e={};e.id=726,e.ids=[726],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},35279:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>x,pages:()=>d,routeModule:()=>m,tree:()=>c}),s(42283),s(58693),s(91723),s(87824);var a=s(93282),r=s(5736),l=s(93906),i=s.n(l),n=s(36880),o={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);s.d(t,o);let c=["",{children:["docs",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,42283)),"/workspace/packages/web/src/app/docs/page.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,58693)),"/workspace/packages/web/src/app/docs/layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,91723)),"/workspace/packages/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,87824,23)),"next/dist/client/components/not-found-error"]}],d=["/workspace/packages/web/src/app/docs/page.tsx"],x="/docs/page",u={require:s,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/docs/page",pathname:"/docs",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},66970:(e,t,s)=>{Promise.resolve().then(s.bind(s,72620))},73245:()=>{},72620:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>h});var a=s(73227),r=s(23677),l=s(79580),i=s(24988),n=s(62277),o=s(66144),c=s(34996),d=s(1101),x=s(80188),u=s(45316);function m({items:e,activeId:t,onItemClick:s,title:i="Contents"}){let[n,o]=(0,r.useState)(!1),c=(0,r.useRef)(null);return a.jsx("div",{ref:c,className:"lg:col-span-1",children:(0,a.jsxs)(l.Zb,{className:`
          bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sticky top-24
          transition-all duration-700
          ${n?"opacity-100 translate-x-0":"opacity-0 -translate-x-4"}
        `,style:{transitionDelay:"200ms"},role:"navigation","aria-label":"Documentation navigation",children:[a.jsx(l.Ol,{children:a.jsx(l.ll,{className:"text-slate-900 dark:text-white",children:i})}),a.jsx(l.aY,{children:a.jsx("nav",{className:"space-y-2",role:"list",children:e.map(e=>a.jsx("button",{onClick:()=>s(e.id),className:`
                  w-full text-left px-4 py-2 rounded-md transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                  ${t===e.id?"bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
                `,role:"listitem","aria-current":t===e.id?"page":void 0,"aria-label":`Navigate to ${e.title} section`,children:e.title},e.id))})})]})})}var p=s(20649);function h(){let[e,t]=(0,r.useState)("getting-started"),s=[{id:"getting-started",title:"Getting Started",content:(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"Introduction"}),a.jsx("p",{className:"text-slate-600 dark:text-slate-300 mb-4",children:"Settler is a Reconciliation-as-a-Service API that automates financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems. With Settler, you can reconcile transactions, orders, and events between any two platforms in real-time."}),a.jsx("p",{className:"text-slate-600 dark:text-slate-300 mb-4",children:"Our API-first approach means you can integrate reconciliation into your existing workflows without building custom infrastructure or maintaining complex matching logic."}),a.jsx("div",{className:"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4",children:(0,a.jsxs)("p",{className:"text-sm text-blue-800 dark:text-blue-200",children:[a.jsx("strong",{children:"\uD83D\uDCA1 Pro Tip:"})," Try our ",a.jsx(p.default,{href:"/playground",className:"underline hover:text-blue-600 dark:hover:text-blue-300",children:"interactive playground"})," to test the API without signing up, or explore our ",a.jsx(p.default,{href:"/cookbooks",className:"underline hover:text-blue-600 dark:hover:text-blue-300",children:"cookbooks"})," for ready-to-use examples."]})})]}),(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"Quick Start"}),a.jsx("p",{className:"text-slate-600 dark:text-slate-300 mb-4",children:"Get started in 5 minutes:"}),a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`# Install the SDK
npm install @settler/sdk

# Or with yarn
yarn add @settler/sdk

# Or with pnpm
pnpm add @settler/sdk`})})}),(0,a.jsxs)("p",{className:"text-slate-600 dark:text-slate-300 text-sm",children:["Need help? Check out our ",a.jsx(p.default,{href:"/support",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"support page"})," or ",a.jsx(p.default,{href:"/community",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"join our community"}),"."]})]})]})},{id:"installation",title:"Installation",content:(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"Node.js / TypeScript"}),a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`import { Settler } from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});`})})})]}),(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"React"}),a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`import { useSettler } from '@settler/react-settler';

function MyComponent() {
  const { createJob, runJob } = useSettler({
    apiKey: 'sk_...',
  });
  
  // Use the hooks...
}`})})})]})]})},{id:"api-reference",title:"API Reference",content:a.jsx("div",{className:"space-y-6",children:(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"Jobs API"}),(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",children:[(0,a.jsxs)(l.Ol,{children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx(i.C,{className:"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",children:"POST"}),a.jsx(l.ll,{className:"text-lg",children:"/api/v1/jobs"})]}),a.jsx(l.SZ,{children:"Create a new reconciliation job"})]}),a.jsx(l.aY,{children:a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: "..." }
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." }
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});`})})})})]}),(0,a.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",children:[(0,a.jsxs)(l.Ol,{children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx(i.C,{className:"bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",children:"GET"}),a.jsx(l.ll,{className:"text-lg",children:"/api/v1/jobs/:id"})]}),a.jsx(l.SZ,{children:"Get reconciliation job details"})]}),a.jsx(l.aY,{children:a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`const job = await client.jobs.get(jobId);
console.log(job.status); // 'pending' | 'running' | 'completed' | 'failed'`})})})})]}),(0,a.jsxs)(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",children:[(0,a.jsxs)(l.Ol,{children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx(i.C,{className:"bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",children:"GET"}),a.jsx(l.ll,{className:"text-lg",children:"/api/v1/reports/:jobId"})]}),a.jsx(l.SZ,{children:"Get reconciliation report"})]}),a.jsx(l.aY,{children:a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`const report = await client.reports.get(jobId);
console.log(report.summary);
// {
//   total: 150,
//   matched: 145,
//   unmatched: 3,
//   conflicts: 2,
//   accuracy: 0.987
// }`})})})})]})]})]})})},{id:"examples",title:"Examples",content:a.jsx("div",{className:"space-y-6",children:(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-2xl font-bold mb-4 text-slate-900 dark:text-white",children:"E-commerce Reconciliation"}),a.jsx("div",{className:"bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto",children:a.jsx("pre",{className:"text-green-400 text-sm",children:a.jsx("code",{children:`// Reconcile Shopify orders with Stripe payments
const job = await client.jobs.create({
  name: "Monthly Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      shop: "your-shop.myshopify.com",
      accessToken: process.env.SHOPIFY_TOKEN
    }
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY
    }
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "currency", type: "exact" }
    ],
    conflictResolution: "last-wins"
  }
});

// Run the job
const report = await client.jobs.run(job.id);
console.log(\`Matched: \${report.summary.matched}/\${report.summary.total}\`);`})})})]})})}],h=s.find(t=>t.id===e)?.content;return(0,a.jsxs)(x.AnimatedPageWrapper,{"aria-label":"Documentation page",children:[a.jsx(n.Navigation,{}),a.jsx(u.z,{badge:"Developer Documentation",title:"Documentation",description:"Everything you need to integrate Settler into your application"}),a.jsx("section",{className:"py-12 px-4 sm:px-6 lg:px-8","aria-labelledby":"docs-content-heading",children:(0,a.jsxs)("div",{className:"max-w-7xl mx-auto",children:[a.jsx("h2",{id:"docs-content-heading",className:"sr-only",children:"Documentation Content"}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-8",children:[a.jsx(m,{items:s.map(e=>({id:e.id,title:e.title})),activeId:e,onItemClick:t}),a.jsx("div",{className:"lg:col-span-3",children:a.jsx(l.Zb,{className:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-lg",role:"article","aria-labelledby":`section-${e}`,children:a.jsx(l.aY,{className:"p-8",children:h})})})]})]})}),a.jsx("section",{className:"py-12 px-4 sm:px-6 lg:px-8",children:a.jsx("div",{className:"max-w-4xl mx-auto",children:a.jsx(d.o,{})})}),a.jsx("section",{className:"py-20 px-4 sm:px-6 lg:px-8",children:a.jsx("div",{className:"max-w-4xl mx-auto",children:a.jsx(c.ConversionCTA,{title:"Ready to Get Started?",description:"Try Settler in our interactive playground. No signup required.",primaryAction:"Try Playground",primaryLink:"/playground",secondaryAction:"View Pricing",secondaryLink:"/pricing",variant:"gradient"})})}),a.jsx(o.$,{})]})}},1101:(e,t,s)=>{"use strict";s.d(t,{o:()=>n});var a=s(73227),r=s(23677),l=s(11250),i=s(79580);function n(){let[e,t]=(0,r.useState)(""),[s,n]=(0,r.useState)("idle"),o=async e=>{e.preventDefault(),n("loading"),await new Promise(e=>{setTimeout(()=>{n("success"),t(""),setTimeout(()=>n("idle"),3e3),e()},1e3)})};return(0,a.jsxs)(i.Zb,{className:"bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-xl",children:[(0,a.jsxs)(i.Ol,{className:"text-center",children:[a.jsx(i.ll,{className:"text-2xl md:text-3xl text-white mb-2",children:"Stay Updated"}),a.jsx(i.SZ,{className:"text-blue-100",children:"Get product updates, API changes, and reconciliation tips delivered to your inbox"})]}),(0,a.jsxs)(i.aY,{children:[(0,a.jsxs)("form",{onSubmit:o,className:"flex flex-col sm:flex-row gap-3 max-w-md mx-auto",children:[a.jsx("input",{type:"email",value:e,onChange:e=>t(e.target.value),placeholder:"Enter your email",required:!0,className:"flex-1 px-4 py-3 rounded-md bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"}),a.jsx(l.z,{type:"submit",disabled:"loading"===s||"success"===s,className:"bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-semibold whitespace-nowrap",children:"loading"===s?"Subscribing...":"success"===s?"✓ Subscribed!":"Subscribe"})]}),a.jsx("p",{className:"text-xs text-blue-100 text-center mt-4",children:"No spam. Unsubscribe anytime. We respect your privacy."})]})]})}},58693:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>r});var a=s(99013);let r={title:"Documentation",description:"Comprehensive documentation for Settler - Reconciliation as a Service API. Learn how to integrate Settler into your application with guides, API reference, and examples.",keywords:["Settler documentation","API documentation","reconciliation API docs","integration guide","developer documentation"]};function l({children:e}){return a.jsx(a.Fragment,{children:e})}},42283:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});let a=(0,s(53189).createProxy)(String.raw`/workspace/packages/web/src/app/docs/page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[522,313,606,640,99],()=>s(35279));module.exports=a})();