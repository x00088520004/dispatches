import { useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getArticles } from '../lib/notion'
import { usePrefs } from '../lib/prefs'
import Controls from '../components/Controls'

const SITE = {
  logo: 'Chien-Po · Dispatches',
  eyebrow: { zh: 'FREQUENCY · 2026 · 持續傳輸中', en: 'FREQUENCY · 2026 · ONGOING' },
  title: { zh: '人、科技，\n與我們之間的一切', en: 'People, Technology,\nand Everything Between' },
  sub: { zh: '關於存在、選擇，\n與我們如何在科技時代\n仍試圖成為人。', en: 'On existence, choice,\nand the act of becoming.' },
  aboutHead: { zh: '一些閱讀與心得。', en: 'Notes from reading and thinking.' },
  about: {
    zh: '關於科技、行銷與人性交會的地方，\n讀到的、想到的，整理在這裡。',
    en: 'On technology, marketing, and human nature, and where they meet.\nThings read and thought through, gathered here.',
  },
  subscribe: { zh: '我想知道更多，請寄給我 →', en: 'I want more — send them to me →' },
  footer: 'Chien-Po',
}

function t(obj, lang) {
  if (typeof obj === 'string') return obj
  return obj?.[lang] || obj?.zh || ''
}

function Lines({ text }) {
  const lines = text.split('\n')
  return lines.map((l, i) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>)
}

export default function Home({ articles }) {
  const prefs = usePrefs()
  const { lang } = prefs
  const aboutRef = useRef(null)

  const title = t(SITE.title, lang)
  const subLines = t(SITE.sub, lang).split('\n')
  const eyeParts = t(SITE.eyebrow, lang).split('·').map(s => s.trim())

  return (
    <>
      <Head>
        <title>{SITE.logo}</title>
        <meta name="description" content={t(SITE.sub, lang).replace(/\n/g, '')} />
        <meta property="og:title" content={SITE.logo} />
        <meta property="og:description" content={t(SITE.sub, lang).replace(/\n/g, '')} />
      </Head>

      <div className="home">
        <div className="grid-bg" />
        <div className="scanlines" />

        <nav className="nav">
          <span className="logo">{SITE.logo}</span>
          <div className="nav-r">
            <button type="button" className="nav-about" onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              {lang === 'zh' ? '關於' : 'About'}
            </button>
            <Controls prefs={prefs} />
          </div>
        </nav>

        <main className="wrap">
          <div className="eyebrow">
            {eyeParts.map((p, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {i === eyeParts.length - 1 ? <span className="eyebrow-live">{p}</span> : p}
              </span>
            ))}
          </div>

          <div className="glitch-wrap">
            <div className="g-r" aria-hidden="true"><Lines text={title} /></div>
            <div className="g-b" aria-hidden="true"><Lines text={title} /></div>
            <h1 className="g-title"><Lines text={title} /></h1>
          </div>

          <p className="sub">
            {subLines.map((l, i) => (
              <span key={i}>
                {i === subLines.length - 1 ? <b>{l}</b> : l}
                {i < subLines.length - 1 && <br />}
              </span>
            ))}
          </p>

          <div className="idx-label">
            <span>{lang === 'zh' ? '// 文章索引' : '// Articles'}</span>
            <span>{String(articles.length).padStart(3, '0')}</span>
          </div>

          <div className="entries">
            {articles.map((a, i) => (
              <Link key={a.slug} href={`/${a.slug}`} className="entry">
                <div className="en">{String(articles.length - i).padStart(3, '0')}</div>
                <div>
                  <div className="em">
                    <span>{a.date}</span>
                    {t(a.category, lang) && <span>{t(a.category, lang)}</span>}
                  </div>
                  <div className="et">{t(a.title, lang)}</div>
                  {t(a.lede, lang) && <div className="ex">{t(a.lede, lang)}</div>}
                </div>
              </Link>
            ))}
          </div>

          <div className="home-subscribe">
            <a className="art-subscribe-link" href="https://liaochienpo.substack.com/subscribe" target="_blank" rel="noopener noreferrer">
              {t(SITE.subscribe, lang)}
            </a>
          </div>

          <section className="about-section" ref={aboutRef}>
            <div className="about-kicker">// {lang === 'zh' ? '關於' : 'About'}</div>
            <p className="about-line1">{t(SITE.aboutHead, lang)}</p>
            <p className="about-line2"><Lines text={t(SITE.about, lang)} /></p>
          </section>

          <footer className="footer-bar">
            <span>{SITE.footer}</span>
            <span>TRANSMISSION · ONGOING</span>
          </footer>
        </main>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const articles = await getArticles()
  return {
    props: { articles },
    revalidate: 60,
  }
}
