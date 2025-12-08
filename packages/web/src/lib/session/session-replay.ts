/**
 * Session Replay Abstraction Layer
 * 
 * Provides unified interface for session replay and heatmap tools.
 */

import { logger } from '../logging/logger';

export type SessionReplayProvider = 'hotjar' | 'fullstory' | 'clarity' | 'none';

interface SessionReplayConfig {
  provider: SessionReplayProvider;
  enabled: boolean;
  siteId?: string;
  apiKey?: string;
}

class SessionReplay {
  private config: SessionReplayConfig;
  private initialized = false;

  constructor() {
    const provider = (process.env.NEXT_PUBLIC_SESSION_REPLAY_PROVIDER || 'none') as SessionReplayProvider;
    const enabled = process.env.NEXT_PUBLIC_ENABLE_SESSION_REPLAY === 'true';

    this.config = {
      provider,
      enabled,
      siteId: process.env.NEXT_PUBLIC_SESSION_REPLAY_SITE_ID,
      apiKey: process.env.NEXT_PUBLIC_SESSION_REPLAY_API_KEY,
    };
  }

  /**
   * Initialize session replay provider
   */
  init() {
    if (!this.config.enabled || this.config.provider === 'none' || typeof window === 'undefined') {
      return;
    }

    if (this.initialized) {
      return;
    }

    try {
      switch (this.config.provider) {
        case 'hotjar':
          this.initHotjar();
          break;
        case 'fullstory':
          this.initFullStory();
          break;
        case 'clarity':
          this.initClarity();
          break;
      }

      this.initialized = true;
      logger.info(`Session replay initialized: ${this.config.provider}`);
    } catch (error) {
      logger.error('Failed to initialize session replay', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Initialize Hotjar
   */
  private initHotjar() {
    if (!this.config.siteId) {
      logger.warn('Hotjar site ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${this.config.siteId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }

  /**
   * Initialize FullStory
   */
  private initFullStory() {
    if (!this.config.siteId) {
      logger.warn('FullStory org ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.innerHTML = `
      window['_fs_debug'] = false;
      window['_fs_host'] = 'fullstory.com';
      window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
      window['_fs_org'] = '${this.config.siteId}';
      window['_fs_namespace'] = 'FS';
      (function(m,n,e,t,l,o,g,y){
        if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].'); } return;}
        g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
        o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
        g.anonymize=function(){g.identify(!!0)};
        g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
        g.log = function(a,b){g("log",[a,b])};
        g.consent=function(a){g("consent",!arguments.length||a)};
        g.identifyAccount=function(i,v){o='account';g(i,v)};
        g.clearUserCookie=function(){};
        g.setVars=function(n, p){g('setVars',[n,p]);};
        g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
        if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
        g._v="1.3.0";
      })(window,document,window['_fs_namespace'],'script','user');
    `;
    document.head.appendChild(script);
  }

  /**
   * Initialize Microsoft Clarity
   */
  private initClarity() {
    if (!this.config.siteId) {
      logger.warn('Clarity project ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${this.config.siteId}");
    `;
    document.head.appendChild(script);
  }

  /**
   * Identify user (where supported)
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.initialized || this.config.provider === 'none') return;

    try {
      switch (this.config.provider) {
        case 'hotjar':
          if (typeof window !== 'undefined' && 'hj' in window) {
            // @ts-ignore
            window.hj('identify', userId, traits);
          }
          break;
        case 'fullstory':
          if (typeof window !== 'undefined' && '_fs_namespace' in window) {
            // @ts-ignore
            window[window._fs_namespace]?.identify(userId, traits);
          }
          break;
        case 'clarity':
          // Clarity doesn't support user identification
          break;
      }
    } catch (error) {
      logger.warn('Failed to identify user in session replay', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const sessionReplay = new SessionReplay();

// Initialize on client-side if enabled
if (typeof window !== 'undefined') {
  sessionReplay.init();
}
