import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getArticles } from '../lib/notion'

const SITE = {
  logo: 'Chien-Po · Dispatches',
  eyebrow: { zh: 'FREQUENCY · 2026 · 持續傳輸中', en: 'FREQUENCY · 2026 · ONGOING' },
  title: { zh: '人、科技，\n與我們之間的一切', en: 'People, Technology,\nand Everything Between' },
  sub: { zh: '關於存在、選擇，\n與我們如何在科技時代\n仍試圖成為人。', en: 'On existence, choice,\nand the act of becoming.' },
  about: {
    zh: '這裡有科技、行銷、人性，以及它們交叉的地方。\n沒有標準答案，只有持續的提問。',
    en: 'Technology, marketing, human nature, and where they intersect.\nNo definitive answers. Only better questions.'
  },
  footer: 'Chien-Po',
}

function t(obj, lang) {
  if (typeof obj === 'string') return obj
  return obj?.[lang] || obj?.zh || ''
}

export default function Home({ articles }) {
  const [lang, setLang] = useState('zh')
  const aboutRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('site_lang')
    if (saved) setLang(saved)
  }, [])

  function toggleLang() {
    const next = lang === 'zh' ? 'en' : 'zh'
    setLang(next)
    localStorage.setItem('site_lang', next)
  }

  const titleLines = t(SITE.title, lang).split('\n')
  const subLines = t(SITE.sub, lang).split('\n')
  const eyeParts = t(SITE.eyebrow, lang).split('·').map(s => s.trim())

  return (
    <>
      <Head>
        <title>{SITE.logo}</title>
        <meta name="description" content={t(SITE.sub, lang).replace(/\n/g, ' ')} />
      </Head>

      <div className="grid-bg" />
      <div className="scanlines" />

      <nav className="nav">
        <span className="logo">{SITE.logo}</span>
        <div className="nav-r">
          <span>// </span>
          <button className="nav-about" onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            {lang === 'zh' ? '關於' : 'About'}
          </button>
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </nav>

      <div className="wrap">
        <div className="eyebrow">
          {eyeParts.map((p, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {i === eyeParts.length - 1 ? <span>{p}</span> : p}
            </span>
          ))}
        </div>

        <div className="glitch-wrap">
          <div className="g-r" aria-hidden="true">
            {titleLines.map((l, i) => <span key={i}>{l}{i < titleLines.length - 1 && <br />}</span>)}
          </div>
          <div className="g-b" aria-hidden="true">
            {titleLines.map((l, i) => <span key={i}>{l}{i < titleLines.length - 1 && <br />}</span>)}
          </div>
          <h1 className="g-title">
            {titleLines.map((l, i) => <span key={i}>{l}{i < titleLines.length - 1 && <br />}</span>)}
          </h1>
        </div>

        <p className="sub">
          {subLines.map((l, i) => (
            <span key={i}>
              {i === subLines.length - 1 ? <b>{l}</b> : l}
              {i < subLines.length - 1 && <br />}
            </span>
          ))}
        </p>

        <hr className="rule" />
        <div className="idx-label">{lang === 'zh' ? '// 文章索引' : '// Articles'}</div>

        {articles.map((a, i) => (
          <Link key={a.slug} href={`/${a.slug}`} className="entry">
            <div className="en">{String(i + 1).padStart(3, '0')}</div>
            <div>
              <div className="em">{a.date} · {t(a.category, lang)}</div>
              <div className="et">{t(a.title, lang)}</div>
              <div className="ex">{t(a.lede, lang)}</div>
            </div>
          </Link>
        ))}

        <div className="footer-bar">
          <span>{SITE.footer}</span>
          <span>TRANSMISSION · ONGOING</span>
        </div>

        <div className="about-section" ref={aboutRef}>
          <div className="about-kicker">// {lang === 'zh' ? '關於' : 'About'}</div>
          <p className="about-line1">I write to think, not to conclude.</p>
          <p className="about-line2">
            {t(SITE.about, lang).split('\n').map((l, i, arr) => (
              <span key={i}>{l}{i < arr.length - 1 && <br />}</span>
            ))}
          </p>
        </div>
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
