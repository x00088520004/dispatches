import { getArticleBySlug } from '../../lib/notion'

// POST { slug, password } → { content: { zh, en } }
// 文章在 Notion 的 Password 欄有值時，靜態頁不帶內文，只能從這裡用密碼換。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method' })
  }
  const slug = String(req.body?.slug || '').trim()
  const given = String(req.body?.password || '').trim()
  if (!slug) return res.status(400).json({ error: 'slug' })

  const article = await getArticleBySlug(slug)
  if (!article) return res.status(404).json({ error: 'notfound' })
  if (!article.password) return res.status(200).json({ content: article.content })
  if (!given || given !== article.password) return res.status(401).json({ error: 'password' })

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ content: article.content })
}
