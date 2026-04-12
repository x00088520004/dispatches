import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getArticleBySlug, getAllSlugs } from '../lib/notion'

const LOGO = 'Chien-Po · Dispatches'

function t(obj, lang) {
  if (typeof obj === 'string') return obj
  return obj?.[lang] || obj?.zh || ''
}

function renderMarkdown(md) {
  if (!md) return null
  const blocks = md.split(/\n\n+/)
  return blocks.map((block, i) => {
    block = block.trim()
    if (!block) return null
    if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>
    if (block.startsWith('### ')) return <h3 key={i}>{block.slice(4)}</h3>
    if (block.startsWith('> ')) return (
      <blockquote key={i}><p>{block.slice(2)}</p></blockquote>
    )
    if (block === '---') return <hr key={i} />
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').filter(l => l.match(/^[-*] /))
      return <ul key={i}>{items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}</ul>
    }
    return <p key={i}>{block.replace(/\n/g, ' ')}</p>
  })
}

export default function Article({ article }) {
  const [lang, setLang] = useState('zh')

  useEffect(() => {
    const saved = localStorage.getItem('site_lang')
    if (saved) setLang(saved)
  }, [])

  if (!article) return <div className="art-page"><div className="loading">// 404</div></div>

  return (
    <>
      <Head>
        <title>{t(article.title, lang)} · {LOGO}</title>
        <meta name="description" content={t(article.lede, lang)} />
      </Head>

      <div className="art-page">
        <div className="art-nav">
          <Link href="/" className="art-back">
            {lang === 'zh' ? '← 返回' : '← Back'}
          </Link>
          <span className="art-logo">{LOGO}</span>
        </div>

        <div className="art-body">
          <div className="art-meta">{article.date} · {t(article.category, lang)}</div>
          <h1 className="art-title">{t(article.title, lang)}</h1>
          <p className="art-lede">{t(article.lede, lang)}</p>
          <div className="art-content">
            {renderMarkdown(article.content)}
          </div>
          <div className="art-end">
            <span>Chien-Po</span>
            <span>{article.date}</span>
          </div>
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
  const article = await getArticleBySlug(params.slug)
  return {
    props: { article: article || null },
    revalidate: 60,
  }
}
