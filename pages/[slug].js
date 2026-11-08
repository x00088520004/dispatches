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
    lockTitle: '這篇需要密碼',
    lockHint: '輸入密碼後即可閱讀全文。',
    lockPlaceholder: '密碼',
    lockBtn: '解鎖',
    lockWrong: '密碼不對，再試一次。',
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
    lockTitle: 'This piece is password-protected.',
    lockHint: 'Enter the password to read the full text.',
    lockPlaceholder: 'Password',
    lockBtn: 'Unlock',
    lockWrong: 'That password did not work. Try again.',
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

  // 密碼文章：靜態頁不帶內文，解鎖後才從 /api/unlock 取回
  const [unlocked, setUnlocked] = useState(null)
  const [pw, setPw] = useState('')
  const [pwState, setPwState] = useState('idle') // idle | busy | wrong
  const locked = Boolean(article.locked) && !unlocked
  const contentObj = unlocked || article.content

  useEffect(() => {
    if (!article.locked) return
    try {
      const saved = sessionStorage.getItem(`unlock:${article.slug}`)
      if (saved) setUnlocked(JSON.parse(saved))
    } catch {}
  }, [article.slug, article.locked])

  async function submitPw(e) {
    e.preventDefault()
    if (!pw.trim()) return
    setPwState('busy')
    try {
      const r = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: article.slug, password: pw }),
      })
      if (!r.ok) { setPwState('wrong'); return }
      const data = await r.json()
      setUnlocked(data.content)
      setPwState('idle')
      try { sessionStorage.setItem(`unlock:${article.slug}`, JSON.stringify(data.content)) } catch {}
    } catch {
      setPwState('wrong')
    }
  }

  const hasEN = Boolean(contentObj.en && contentObj.en.trim())
  const bodyLang = lang === 'en' && hasEN ? 'en' : 'zh'
  const content = bodyLang === 'en' ? contentObj.en : contentObj.zh

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
              {!locked && <span>{ui.minutes(minutes)}</span>}
            </div>
            <h1 className="art-title">{title}</h1>
            {lede && <p className="art-lede">{lede}</p>}

            {locked ? (
              <form className="art-lock" onSubmit={submitPw}>
                <p className="art-lock-title">{ui.lockTitle}</p>
                <p className="art-lock-hint">{ui.lockHint}</p>
                <div className="art-lock-row">
                  <input
                    type="password"
                    value={pw}
                    onChange={e => { setPw(e.target.value); if (pwState === 'wrong') setPwState('idle') }}
                    placeholder={ui.lockPlaceholder}
                    aria-label={ui.lockPlaceholder}
                    autoComplete="off"
                  />
                  <button type="submit" disabled={pwState === 'busy'}>{ui.lockBtn}</button>
                </div>
                {pwState === 'wrong' && <p className="art-lock-wrong">{ui.lockWrong}</p>}
              </form>
            ) : (
              <>
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
              </>
            )}

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

  // 密碼永遠不進 props；有密碼的文章連內文都不進靜態頁
  const { password, ...rest } = article
  const safe = password
    ? { ...rest, locked: true, content: { zh: '', en: '' } }
    : { ...rest, locked: false }

  const i = list.findIndex(a => a.slug === params.slug)
  const pick = a => (a ? { slug: a.slug, title: a.title } : null)
  return {
    props: {
      article: safe,
      newer: i > 0 ? pick(list[i - 1]) : null,
      older: i >= 0 && i < list.length - 1 ? pick(list[i + 1]) : null,
    },
    revalidate: 60,
  }
}
