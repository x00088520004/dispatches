import { useState, useEffect, useRef, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getArticleBySlug, getAllSlugs, getArticles } from '../lib/notion'
import { renderMarkdown, extractHeadings, readingMinutes, plain } from '../lib/markdown'
import { usePrefs } from '../lib/prefs'
import Controls from '../components/Controls'

const LOGO = 'Chien-Po · Dispatches'
const SUBSCRIBE = 'https://liaochienpo.substack.com/subscribe'

const UI = {
  zh: {
    back: '← 全部文章',
    toc: '目錄',
    minutes: n => `約 ${n} 分鐘`,
    newer: '較新一篇',
    older: '較早一篇',
    subscribe: '我想知道更多，請寄給我 →',
    top: '回到頂端',
    zhOnly: null,
  },
  en: {
    back: '← All writing',
    toc: 'Contents',
    minutes: n => `${n} min read`,
    newer: 'Newer',
    older: 'Earlier',
    subscribe: 'I want more — send them to me →',
    top: 'Back to top',
    zhOnly: 'The English version of this piece is on its way. The original Chinese text is shown below.',
  },
}

function t(obj, lang) {
  if (typeof obj === 'string') return obj
  return obj?.[lang] || obj?.zh || ''
}

export default function Article({ article, newer, older }) {
  const prefs = usePrefs()
  const { lang } = prefs
  const ui = UI[lang]

  const hasEN = Boolean(article.content.en && article.content.en.trim())
  const bodyLang = lang === 'en' && hasEN ? 'en' : 'zh'
  const content = bodyLang === 'en' ? article.content.en : article.content.zh

  const headings = useMemo(() => extractHeadings(content), [content])
  const body = useMemo(() => renderMarkdown(content), [content])
  const minutes = readingMinutes(content, bodyLang)

  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(null)
  const artRef = useRef(null)

  // 閱讀進度條＋目錄目前所在段落
  useEffect(() => {
    let raf = 0
    const update = () => {
      const el = artRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1)
      let current = null
      for (const h of headings) {
        const node = document.getElementById(h.id)
        if (node && node.getBoundingClientRect().top < window.innerHeight * 0.3) current = h.id
      }
      setActive(current)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [headings])

  const title = t(article.title, lang)
  const lede = t(article.lede, lang)
  const category = t(article.category, lang)

  const toc = headings.length > 1 && (
    <ol className="toc-list">
      {headings.map(h => (
        <li key={h.id} className={active === h.id ? 'on' : ''}>
          <a href={`#${h.id}`}>{plain(h.text)}</a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <Head>
        <title>{`${title} · ${LOGO}`}</title>
        <meta name="description" content={lede} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={lede} />
        <meta property="og:site_name" content={LOGO} />
        <meta name="twitter:card" content="summary" />
      </Head>

      <div className="art-page">
        <div className="progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <header className="art-nav">
          <Link href="/" className="art-back">{ui.back}</Link>
          <Link href="/" className="art-logo">{LOGO}</Link>
          <Controls prefs={prefs} showSize />
        </header>

        <div className="art-layout">
          <article className="art-body" ref={artRef}>
            <div className="art-meta">
              <span>{article.date}</span>
              {category && <span>{category}</span>}
              <span>{ui.minutes(minutes)}</span>
            </div>
            <h1 className="art-title">{title}</h1>
            {lede && <p className="art-lede">{lede}</p>}

            {lang === 'en' && !hasEN && <p className="art-note">{ui.zhOnly}</p>}

            {toc && (
              <details className="toc-inline">
                <summary>{ui.toc}</summary>
                {toc}
              </details>
            )}

            <div className="art-content" lang={bodyLang === 'en' ? 'en' : 'zh-Hant'}>
              {body}
            </div>

            <div className="art-end">
              <span>Chien-Po</span>
              <span>{article.date}</span>
            </div>

            <div className="art-subscribe">
              <a className="art-subscribe-link" href={SUBSCRIBE} target="_blank" rel="noopener noreferrer">
                {ui.subscribe}
              </a>
            </div>

            {(newer || older) && (
              <nav className="art-pager" aria-label={lang === 'zh' ? '其他文章' : 'More writing'}>
                {newer ? (
                  <Link href={`/${newer.slug}`} className="pager-card">
                    <span className="pager-k">← {ui.newer}</span>
                    <span className="pager-t">{t(newer.title, lang)}</span>
                  </Link>
                ) : <span />}
                {older ? (
                  <Link href={`/${older.slug}`} className="pager-card pager-older">
                    <span className="pager-k">{ui.older} →</span>
                    <span className="pager-t">{t(older.title, lang)}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </article>

          {toc && (
            <aside className="toc-side" aria-label={ui.toc}>
              <div className="toc-label">{ui.toc}</div>
              {toc}
              <a className="toc-top" href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                ↑ {ui.top}
              </a>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const paths = await getAllSlugs()
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const [article, list] = await Promise.all([getArticleBySlug(params.slug), getArticles()])
  if (!article) return { notFound: true, revalidate: 60 }

  const i = list.findIndex(a => a.slug === params.slug)
  const pick = a => (a ? { slug: a.slug, title: a.title } : null)
  return {
    props: {
      article,
      newer: i > 0 ? pick(list[i - 1]) : null,
      older: i >= 0 && i < list.length - 1 ? pick(list[i + 1]) : null,
    },
    revalidate: 60,
  }
}
