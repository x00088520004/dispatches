import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const n2m = new NotionToMarkdown({ notionClient: notion })

const DATABASE_ID = process.env.NOTION_DATABASE_ID

export async function getArticles() {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: 'Published', checkbox: { equals: true } },
    sorts: [{ property: 'Date', direction: 'descending' }],
  })
  return res.results.map(page => ({
    id: page.id,
    slug: page.properties.Slug?.rich_text?.[0]?.plain_text || page.id,
    date: page.properties.Date?.rich_text?.[0]?.plain_text || '',
    title: {
      zh: page.properties.Title_ZH?.title?.[0]?.plain_text || '',
      en: page.properties.Title_EN?.rich_text?.[0]?.plain_text || '',
    },
    category: {
      zh: page.properties.Category_ZH?.rich_text?.[0]?.plain_text || '',
      en: page.properties.Category_EN?.rich_text?.[0]?.plain_text || '',
    },
    lede: {
      zh: page.properties.Lede_ZH?.rich_text?.[0]?.plain_text || '',
      en: page.properties.Lede_EN?.rich_text?.[0]?.plain_text || '',
    },
    locked: Boolean(page.properties.Password?.rich_text?.[0]?.plain_text?.trim()),
  }))
}

export async function getArticleBySlug(slug) {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        { property: 'Slug', rich_text: { equals: slug } },
        { property: 'Published', checkbox: { equals: true } },
      ],
    },
  })
  if (!res.results.length) return null
  const page = res.results[0]

  const mdBlocks = await n2m.pageToMarkdown(page.id)
  const contentZH = n2m.toMarkdownString(mdBlocks).parent
  const contentEN = page.properties.Content_EN?.rich_text?.map(t => t.plain_text).join('') || ''

  return {
    id: page.id,
    slug,
    date: page.properties.Date?.rich_text?.[0]?.plain_text || '',
    title: {
      zh: page.properties.Title_ZH?.title?.[0]?.plain_text || '',
      en: page.properties.Title_EN?.rich_text?.[0]?.plain_text || '',
    },
    category: {
      zh: page.properties.Category_ZH?.rich_text?.[0]?.plain_text || '',
      en: page.properties.Category_EN?.rich_text?.[0]?.plain_text || '',
    },
    lede: {
      zh: page.properties.Lede_ZH?.rich_text?.[0]?.plain_text || '',
      en: page.properties.Lede_EN?.rich_text?.[0]?.plain_text || '',
    },
    content: { zh: contentZH, en: contentEN },
    // 選填的閱讀密碼；有值的文章在 getStaticProps 會拿掉內文，只能經 /api/unlock 取得
    password: page.properties.Password?.rich_text?.map(t => t.plain_text).join('').trim() || '',
  }
}

export async function getAllSlugs() {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: 'Published', checkbox: { equals: true } },
  })
  return res.results.map(page => ({
    params: { slug: page.properties.Slug?.rich_text?.[0]?.plain_text || page.id },
  }))
}
