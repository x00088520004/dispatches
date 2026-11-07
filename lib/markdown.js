// 文章 Markdown 轉 React。
// 支援：## / ### 小標（自動加錨點 s1, s2…）、> 引言、--- 分隔線、
// 編號清單（1. 2. …，含 Notion 匯出時每項之間有空行的情況）、無序清單、
// 行內 **粗體**、[連結](https://…)、`程式碼`。
import React from 'react'

const INLINE = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(`([^`]+)`)/

function inline(text, keyBase) {
  const out = []
  let rest = text
  let k = 0
  while (rest) {
    const m = rest.match(INLINE)
    if (!m) { out.push(rest); break }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const key = `${keyBase}-${k++}`
    if (m[1]) out.push(<strong key={key}>{m[2]}</strong>)
    else if (m[3]) out.push(<a key={key} href={m[5]} target="_blank" rel="noopener noreferrer">{m[4]}</a>)
    else if (m[6]) out.push(<code key={key}>{m[7]}</code>)
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

// 編號清單的每一項若都以一個短句開頭（中文 ≤22 字以「。」收、英文以「. 」收的短語），
// 就把這個短句當成該項的名字加粗，例如「當下性。」「Immediacy.」。
// 只有整份清單每一項都符合才套用，避免同一份清單有的粗有的不粗。
function splitLead(text) {
  if (/^\*\*/.test(text)) return null
  const zh = text.match(/^([^。*]{1,22}。)(.+)$/)
  if (zh) return { lead: zh[1], rest: zh[2], gap: '' }
  const en = text.match(/^([A-Z][^.*]{0,70}\.)\s+(.+)$/)
  if (en) return { lead: en[1], rest: en[2], gap: ' ' }
  return null
}

function olItems(items, keyBase) {
  const leads = items.map(splitLead)
  const useLead = leads.every(Boolean)
  return items.map((t, j) => {
    const key = `${keyBase}-${j}`
    if (!useLead) return <li key={j}>{inline(t, key)}</li>
    const { lead, rest, gap } = leads[j]
    return <li key={j}><strong className="li-lead">{lead}</strong>{gap}{inline(rest, key)}</li>
  })
}

export function plain(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`([^`]+)`/g, '$1')
}

const OL = /^\s*\d+[.)]\s+/
const UL = /^\s*[-*]\s+/

// 把整篇切成區塊：{ type: 'h2'|'h3'|'p'|'quote'|'hr'|'ol'|'ul', text?, items? }
export function parseBlocks(md) {
  if (!md) return []
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ').trim() })
    para = []
  }
  const nextNonBlank = i => {
    for (let j = i; j < lines.length; j++) if (lines[j].trim()) return lines[j]
    return ''
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) { flushPara(); continue }

    if (line.startsWith('### ')) { flushPara(); blocks.push({ type: 'h3', text: line.slice(4) }); continue }
    if (line.startsWith('## ')) { flushPara(); blocks.push({ type: 'h2', text: line.slice(3) }); continue }
    if (line.startsWith('# ')) { flushPara(); blocks.push({ type: 'h2', text: line.slice(2) }); continue }
    if (/^(-{3,}|\*{3,})$/.test(line)) { flushPara(); blocks.push({ type: 'hr' }); continue }

    if (line.startsWith('>')) {
      flushPara()
      const q = [line.replace(/^>\s?/, '')]
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++
        q.push(lines[i].trim().replace(/^>\s?/, ''))
      }
      blocks.push({ type: 'quote', text: q.join(' ').trim() })
      continue
    }

    const listType = OL.test(line) ? 'ol' : UL.test(line) ? 'ul' : null
    if (listType) {
      flushPara()
      const re = listType === 'ol' ? OL : UL
      const items = [line.replace(re, '')]
      // 同一份清單：下一個非空行仍是同類項目就繼續（容許項目之間有空行）
      while (i + 1 < lines.length) {
        const nxt = lines[i + 1]
        if (!nxt.trim()) {
          if (re.test(nextNonBlank(i + 1).trim())) { i++; continue }
          break
        }
        if (re.test(nxt.trim())) { i++; items.push(nxt.trim().replace(re, '')); continue }
        // 縮排的續行併入上一項
        if (/^\s{2,}/.test(nxt)) { i++; items[items.length - 1] += ' ' + nxt.trim(); continue }
        break
      }
      blocks.push({ type: listType, items })
      continue
    }

    para.push(line)
  }
  flushPara()
  return blocks
}

export function extractHeadings(md) {
  let n = 0
  return parseBlocks(md)
    .filter(b => b.type === 'h2')
    .map(b => ({ id: `s${++n}`, text: b.text }))
}

export function renderMarkdown(md) {
  let h2 = 0
  return parseBlocks(md).map((b, i) => {
    switch (b.type) {
      case 'h2': {
        const id = `s${++h2}`
        return (
          <h2 key={i} id={id}>
            <a className="anchor" href={`#${id}`} aria-hidden="true">#</a>
            {inline(b.text, `h${i}`)}
          </h2>
        )
      }
      case 'h3': return <h3 key={i}>{inline(b.text, `h${i}`)}</h3>
      case 'quote': return <blockquote key={i}><p>{inline(b.text, `q${i}`)}</p></blockquote>
      case 'hr': return <hr key={i} />
      case 'ol': return <ol key={i}>{olItems(b.items, `o${i}`)}</ol>
      case 'ul': return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `u${i}-${j}`)}</li>)}</ul>
      default: return <p key={i}>{inline(b.text, `p${i}`)}</p>
    }
  })
}

// 閱讀時間：中文約每分鐘 400 字，英文約每分鐘 230 字
export function readingMinutes(md, lang) {
  if (!md) return 0
  const text = md.replace(/[#>*`\-\[\]()]/g, '')
  if (lang === 'en') return Math.max(1, Math.round((text.match(/[A-Za-z']+/g) || []).length / 230))
  return Math.max(1, Math.round(text.replace(/\s/g, '').length / 400))
}
