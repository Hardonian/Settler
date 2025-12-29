(()=>{var e={};e.id=649,e.ids=[649],e.modules={53524:e=>{"use strict";e.exports=require("@prisma/client")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},61212:e=>{"use strict";e.exports=require("async_hooks")},61282:e=>{"use strict";e.exports=require("child_process")},27920:e=>{"use strict";e.exports=require("diagnostics_channel")},82266:e=>{"use strict";e.exports=require("domain")},92048:e=>{"use strict";e.exports=require("fs")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},66302:e=>{"use strict";e.exports=require("inspector")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},67737:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>s.Z,__next_app__:()=>p,originalPathname:()=>d,pages:()=>c,routeModule:()=>m,tree:()=>l}),a(75016),a(56776),a(8352),a(19718),a(31306),a(10285),a(58909);var r=a(93282),i=a(5736),s=a(61249),o=a(36880),n={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>o[e]);a.d(t,n);let l=["",{children:["cookbook",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,75016)),"/workspace/packages/web/src/app/cookbook/page.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,56776)),"/workspace/packages/web/src/app/cookbook/layout.tsx"],metadata:{icon:[],apple:[],openGraph:[async e=>(await Promise.resolve().then(a.bind(a,50942))).default(e)],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,8352)),"/workspace/packages/web/src/app/layout.tsx"],template:[()=>Promise.resolve().then(a.bind(a,19718)),"/workspace/packages/web/src/app/template.tsx"],error:[()=>Promise.resolve().then(a.bind(a,31306)),"/workspace/packages/web/src/app/error.tsx"],loading:[()=>Promise.resolve().then(a.bind(a,10285)),"/workspace/packages/web/src/app/loading.tsx"],"not-found":[()=>Promise.resolve().then(a.bind(a,58909)),"/workspace/packages/web/src/app/not-found.tsx"],metadata:{icon:[],apple:[],openGraph:[async e=>(await Promise.resolve().then(a.bind(a,50942))).default(e)],twitter:[],manifest:void 0}}],c=["/workspace/packages/web/src/app/cookbook/page.tsx"],d="/cookbook/page",p={require:a,loadChunk:()=>Promise.resolve()},m=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/cookbook/page",pathname:"/cookbook",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},49018:(e,t,a)=>{Promise.resolve().then(a.bind(a,41960))},41960:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>E});var r=a(73227),i=a(23677),s=a(79580),o=a(24988),n=a(11250),l=a(45094),c=a(66144),d=a(80188),p=a(21061),m=a(35334),u=a(45316),x=a(20649),h=a(77016),g=a(36910),y=a(24751),b=a(81372),f=a(93126),k=a(97464),w=a(9136),v=a(37001),j=a(22057),S=a(72578);function E(){let[e,t]=(0,i.useState)(null),a=[{id:"ecommerce-shopify-stripe",title:"E-commerce Order Reconciliation",description:"Reconcile Shopify orders with Stripe payments for accurate order-to-payment matching.",category:"E-commerce",icon:h.Z,difficulty:"Beginner",timeToImplement:"5 min",useCase:"Match Shopify orders with Stripe payment transactions to ensure all orders are paid.",adapters:["Shopify","Stripe"],features:["Order matching","Amount validation","Date range matching","Scheduled runs"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Daily Order Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
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
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});

const report = await settler.jobs.run(job.data.id);
console.log(\`Matched: \${report.data.summary.matched}\`);`,gradient:"from-blue-600 to-indigo-600"},{id:"saas-stripe-quickbooks",title:"SaaS Subscription Reconciliation",description:"Reconcile Stripe subscription revenue with QuickBooks accounting records.",category:"SaaS",icon:g.Z,difficulty:"Intermediate",timeToImplement:"10 min",useCase:"Match monthly subscription payments from Stripe with revenue recognition in QuickBooks.",adapters:["Stripe","QuickBooks"],features:["Subscription matching","Revenue recognition","Monthly reconciliation","Customer matching"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Monthly Subscription Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: process.env.QB_REALM_ID,
    },
  },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
    ],
  },
  schedule: "0 0 1 * *", // First day of month at midnight
});`,gradient:"from-indigo-600 to-purple-600"},{id:"multi-provider",title:"Multi-Payment Provider Reconciliation",description:"Reconcile payments from multiple providers (Stripe, PayPal, Square) with your accounting system.",category:"Multi-Provider",icon:y.Z,difficulty:"Intermediate",timeToImplement:"15 min",useCase:"Consolidate payments from multiple gateways into a single reconciliation workflow.",adapters:["Stripe","PayPal","Square","QuickBooks"],features:["Multi-source matching","Provider consolidation","Parallel reconciliation","Unified reporting"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create jobs for each provider
const stripeJob = await settler.jobs.create({
  name: "Stripe Reconciliation",
  source: { adapter: "stripe", config: { apiKey: process.env.STRIPE_SECRET_KEY } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

const paypalJob = await settler.jobs.create({
  name: "PayPal Reconciliation",
  source: { adapter: "paypal", config: { clientId: process.env.PAYPAL_CLIENT_ID } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

// Run all reconciliations in parallel
await Promise.all([
  settler.jobs.run(stripeJob.data.id),
  settler.jobs.run(paypalJob.data.id),
]);`,gradient:"from-emerald-600 to-teal-600"},{id:"realtime-webhooks",title:"Real-Time Webhook Reconciliation",description:"Reconcile transactions in real-time as events happen via webhooks.",category:"Real-Time",icon:b.Z,difficulty:"Advanced",timeToImplement:"20 min",useCase:"Get instant reconciliation results as orders and payments occur, enabling real-time financial visibility.",adapters:["Shopify","Stripe"],features:["Webhook-based matching","Webhook integration","Near-real-time alerts","Event-driven"],code:`import Settler from "@settler/sdk";
import express from "express";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const app = express();
app.use(express.json());

// Create job
const job = await settler.jobs.create({
  name: "Webhook-Based Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
});

// Set up webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: [
    "reconciliation.matched",
    "reconciliation.mismatch",
    "reconciliation.error",
  ],
});

// Handle webhook events
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;
  
  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam(data);
  }
  
  res.json({ received: true });
});`,gradient:"from-orange-600 to-red-600"},{id:"exception-handling",title:"Exception Handling & Resolution",description:"Review and resolve unmatched transactions with bulk actions and automated workflows.",category:"Operations",icon:f.Z,difficulty:"Intermediate",timeToImplement:"10 min",useCase:"Manage unmatched transactions, resolve exceptions, and maintain reconciliation accuracy.",adapters:["Any"],features:["Automated exception handling","Bulk resolution","System-level review","Complete audit trail"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get exceptions (unmatched transactions)
const exceptions = await settler.exceptions.list({
  jobId: "job_abc123",
  resolution_status: "open",
  limit: 50,
});

// Resolve exception
await settler.exceptions.resolve(exceptions.data[0].id, {
  resolution: "matched",
  notes: "Manually verified - amounts match",
});

// Bulk resolve
await settler.exceptions.bulkResolve({
  exceptionIds: exceptions.data.map(e => e.id),
  resolution: "ignored",
  notes: "Low-value transactions, acceptable variance",
});`,gradient:"from-amber-600 to-orange-600"},{id:"scheduled-reconciliations",title:"Scheduled Reconciliations",description:"Set up automated daily, weekly, or monthly reconciliation jobs with cron scheduling.",category:"Automation",icon:k.Z,difficulty:"Beginner",timeToImplement:"5 min",useCase:"Automate reconciliation runs on a schedule to ensure regular financial reconciliation.",adapters:["Any"],features:["Cron scheduling","Automated runs","Flexible timing","Reliable execution"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Daily reconciliation at 2 AM
const dailyJob = await settler.jobs.create({
  name: "Daily Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
  schedule: "0 2 * * *", // Cron: Daily at 2 AM
});

// Weekly reconciliation on Monday at 9 AM
const weeklyJob = await settler.jobs.create({
  name: "Weekly Reconciliation",
  source: { adapter: "stripe", config: { /* ... */ } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
  schedule: "0 9 * * 1", // Cron: Monday at 9 AM
});`,gradient:"from-indigo-600 to-purple-600"},{id:"multi-currency",title:"Multi-Currency Reconciliation",description:"Reconcile transactions in different currencies with automatic FX conversion.",category:"International",icon:w.Z,difficulty:"Advanced",timeToImplement:"15 min",useCase:"Handle international transactions with automatic currency conversion and FX rate handling.",adapters:["Stripe","QuickBooks"],features:["FX conversion","Multi-currency support","Rate handling","Currency matching"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "quickbooks",
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    // Enable FX conversion
    fxConversion: {
      enabled: true,
      baseCurrency: "USD",
    },
  },
});`,gradient:"from-cyan-600 to-blue-600"},{id:"api-key-management",title:"API Key Management",description:"Manage API keys programmatically with scopes, rate limits, and rotation.",category:"Security",icon:v.Z,difficulty:"Intermediate",timeToImplement:"10 min",useCase:"Create, rotate, and manage API keys with proper scoping and security practices.",adapters:["N/A"],features:["Key creation","Scope management","Rate limiting","Key rotation"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// List API keys
const keys = await settler.apiKeys.list();
console.log("API Keys:", keys.data);

// Create new API key
const newKey = await settler.apiKeys.create({
  name: "Production API Key",
  scopes: ["jobs:read", "jobs:write", "reports:read"],
  rateLimit: 2000,
});
console.log("New key:", newKey.data.key); // Only shown once!

// Regenerate API key
const regenerated = await settler.apiKeys.regenerate(keys.data[0].id);
console.log("Regenerated key:", regenerated.data.key);

// Revoke API key
await settler.apiKeys.delete(keys.data[0].id);`,gradient:"from-slate-700 to-slate-900"},{id:"dashboard-metrics",title:"Dashboard Metrics & Analytics",description:"Track activation, usage metrics, and reconciliation performance over time.",category:"Analytics",icon:j.Z,difficulty:"Intermediate",timeToImplement:"10 min",useCase:"Monitor reconciliation performance, track accuracy trends, and measure business metrics.",adapters:["N/A"],features:["Activation tracking","Usage metrics","Accuracy trends","Performance monitoring"],code:`import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get activation dashboard
const activation = await settler.dashboards.activation({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Signup funnel:", activation.data.signupFunnel);
console.log("Time to first value:", activation.data.timeToFirstValue);

// Get usage dashboard
const usage = await settler.dashboards.usage({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Reconciliation volume:", usage.data.reconciliationVolume);
console.log("Accuracy trends:", usage.data.accuracyTrends);`,gradient:"from-green-600 to-emerald-600"},{id:"error-handling",title:"Error Handling & Retries",description:"Implement robust error handling with retry logic for transient failures.",category:"Reliability",icon:S.Z,difficulty:"Intermediate",timeToImplement:"10 min",useCase:"Handle API errors gracefully with automatic retries and proper error recovery.",adapters:["Any"],features:["Error handling","Retry logic","Rate limit handling","Error recovery"],code:`import Settler, { SettlerError } from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function createJobWithRetry(config: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await settler.jobs.create(config);
    } catch (error) {
      if (error instanceof SettlerError) {
        if (error.type === "RateLimitError" && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error("Settler error:", {
          type: error.type,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}`,gradient:"from-red-600 to-rose-600"}],[E,P]=(0,i.useState)("All"),R="All"===E?a:a.filter(e=>e.category===E),_=a.find(t=>t.id===e);return(0,r.jsxs)(d.AnimatedPageWrapper,{"aria-label":"Cookbooks and workflow examples",children:[r.jsx(l.Navigation,{}),r.jsx("section",{className:"px-4 sm:px-6 lg:px-8 pt-24",children:r.jsx("div",{className:"max-w-7xl mx-auto",children:r.jsx(m.Breadcrumbs,{items:[{label:"Cookbooks"}]})})}),r.jsx(u.AnimatedHero,{badge:"Ready-to-Use Workflows",title:"Cookbooks & Examples",description:"Pre-built reconciliation workflows and code examples for common use cases. Copy, customize, and deploy in minutes."}),r.jsx("section",{className:"py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800",children:r.jsx("div",{className:"max-w-7xl mx-auto",children:r.jsx("div",{className:"flex flex-wrap gap-2 justify-center",children:["All","E-commerce","SaaS","Multi-Provider","Real-Time","Operations","Automation","International","Security","Analytics","Reliability"].map(e=>r.jsx(n.z,{variant:E===e?"default":"outline",onClick:()=>P(e),className:`transition-all duration-200 ${E===e?"bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100":"border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`,children:e},e))})})}),r.jsx("section",{className:"py-16 px-4 sm:px-6 lg:px-8","aria-labelledby":"cookbooks-heading",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto",children:[r.jsx("h2",{id:"cookbooks-heading",className:"sr-only",children:"Available Cookbooks"}),r.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:R.map(e=>{let a=e.icon;return r.jsx(s.Zb,{className:"h-full cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700",onClick:()=>t(e.id),children:(0,r.jsxs)("div",{className:"flex flex-col h-full",children:[r.jsx("div",{className:`w-10 h-10 rounded-lg bg-gradient-to-br ${e.gradient} p-2.5 mb-4 flex items-center justify-center`,children:r.jsx(a,{className:"w-5 h-5 text-white"})}),(0,r.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[r.jsx(o.C,{variant:"outline",className:"text-xs",children:e.category}),r.jsx(o.C,{variant:"outline",className:"text-xs",children:e.difficulty})]}),r.jsx("h3",{className:"text-lg font-semibold mb-2 text-slate-900 dark:text-white",children:e.title}),r.jsx("p",{className:"text-slate-600 dark:text-slate-400 mb-4 flex-grow text-sm leading-relaxed",children:e.description}),(0,r.jsxs)("div",{className:"flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2",children:[(0,r.jsxs)("span",{children:["⏱️ ",e.timeToImplement]}),r.jsx("span",{children:e.adapters.join(" → ")})]}),r.jsx(n.z,{variant:"ghost",className:"w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",onClick:a=>{a.stopPropagation(),t(e.id)},children:"View Recipe →"})]})},e.id)})})]})}),_&&r.jsx("div",{className:"fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",onClick:()=>t(null),children:(0,r.jsxs)(s.Zb,{className:"max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl",onClick:e=>e.stopPropagation(),children:[r.jsx(s.Ol,{children:(0,r.jsxs)("div",{className:"flex items-start justify-between",children:[(0,r.jsxs)("div",{className:"flex-1",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2 mb-2",children:[r.jsx(o.C,{variant:"outline",children:_.category}),r.jsx(o.C,{variant:"outline",children:_.difficulty}),(0,r.jsxs)(o.C,{variant:"outline",children:["⏱️ ",_.timeToImplement]})]}),r.jsx(s.ll,{className:"text-2xl text-slate-900 dark:text-white mb-2",children:_.title}),r.jsx(s.SZ,{className:"text-slate-600 dark:text-slate-300",children:_.description})]}),r.jsx(n.z,{variant:"ghost",size:"sm",onClick:()=>t(null),className:"ml-4",children:"✕"})]})}),(0,r.jsxs)(s.aY,{className:"space-y-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold text-slate-900 dark:text-white mb-2 text-sm",children:"Use Case"}),r.jsx("p",{className:"text-slate-600 dark:text-slate-400 text-sm",children:_.useCase})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold text-slate-900 dark:text-white mb-2 text-sm",children:"Adapters"}),r.jsx("div",{className:"flex flex-wrap gap-2",children:_.adapters.map(e=>r.jsx(o.C,{variant:"outline",className:"text-xs",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold text-slate-900 dark:text-white mb-2 text-sm",children:"Features"}),r.jsx("ul",{className:"list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm",children:_.features.map((e,t)=>r.jsx("li",{children:e},t))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold text-slate-900 dark:text-white mb-4",children:"Code Example"}),r.jsx(p.u,{code:_.code,title:_.title,description:"Copy this code to get started",language:"typescript"})]}),(0,r.jsxs)("div",{className:"flex gap-3",children:[r.jsx(n.z,{asChild:!0,className:"bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",children:r.jsx(x.default,{href:"/playground",children:"Try in Playground"})}),r.jsx(n.z,{variant:"outline",className:"border-slate-300 dark:border-slate-700",asChild:!0,children:r.jsx(x.default,{href:"/docs",children:"View Docs"})})]})]})]})}),r.jsx("section",{className:"py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800",children:(0,r.jsxs)("div",{className:"max-w-4xl mx-auto text-center",children:[r.jsx("h2",{className:"text-2xl font-semibold mb-3 text-slate-900 dark:text-white",children:"Ready to build your workflow?"}),r.jsx("p",{className:"text-slate-600 dark:text-slate-400 mb-6",children:"Start with a cookbook recipe or build your own custom reconciliation workflow in minutes."}),(0,r.jsxs)("div",{className:"flex gap-3 justify-center",children:[r.jsx(n.z,{asChild:!0,size:"lg",className:"bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",children:r.jsx(x.default,{href:"/playground",children:"Try Playground"})}),r.jsx(n.z,{variant:"outline",size:"lg",className:"border-slate-300 dark:border-slate-700",asChild:!0,children:r.jsx(x.default,{href:"/playground",children:"Try Playground"})})]})]})}),r.jsx(c.$,{})]})}},56776:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>s,metadata:()=>i});var r=a(99013);let i=(0,a(40156).NX)({title:"Cookbooks - Pre-Built Reconciliation Workflows",description:"Ready-to-use reconciliation workflows and code examples for common use cases. Copy, customize, and deploy in minutes. E-commerce, SaaS, multi-currency, and more.",keywords:["reconciliation examples","reconciliation workflows","code examples","reconciliation cookbooks","integration examples"],canonical:"https://settler.dev/cookbooks"});function s({children:e}){return r.jsx(r.Fragment,{children:e})}},75016:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(53189).createProxy)(String.raw`/workspace/packages/web/src/app/cookbook/page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[4522,8988,6603,2783,3076,4912,6155,6144,1787],()=>a(67737));module.exports=r})();