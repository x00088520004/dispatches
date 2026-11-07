import { Html, Head, Main, NextScript } from 'next/document'

// 畫面出來之前先套用讀者上次選的深淺色、字級、語言，避免先閃一下預設樣式
const PREF_SCRIPT = `(function(){try{var d=document.documentElement,s=window.localStorage;var t=s.getItem('site_theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t);var z=s.getItem('site_size');if(z==='s'||z==='m'||z==='l')d.setAttribute('data-size',z);var m=location.search.match(/[?&]lang=(en|zh)\\b/);var l=m?m[1]:s.getItem('site_lang');if(l==='en'){d.setAttribute('lang','en');d.setAttribute('data-lang','en');}}catch(e){}})();`

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@400;600&family=Share+Tech+Mono&display=swap'

export default function Document() {
  return (
    <Html lang="zh-Hant" data-theme="dark" data-size="m" data-lang="zh">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <meta name="theme-color" content="#0f0d13" />
        <script dangerouslySetInnerHTML={{ __html: PREF_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
