// 讀者偏好：語言（中/EN）、深淺色、字級（小/中/大）。
// 存在 localStorage，並寫到 <html> 的 data-* 屬性上讓 CSS 接手。
// _document.js 裡有一段同樣邏輯的小 script 在畫面出來前先套用，避免閃爍。
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

const SIZES = ['s', 'm', 'l']

function read(key) {
  try { return window.localStorage.getItem(key) } catch (e) { return null }
}
function write(key, value) {
  try { window.localStorage.setItem(key, value) } catch (e) { /* 無痕模式等情況，忽略 */ }
}

export function usePrefs() {
  const router = useRouter()
  const [lang, setLangState] = useState('zh')
  const [theme, setThemeState] = useState('dark')
  const [size, setSizeState] = useState('m')

  useEffect(() => {
    const m = window.location.search.match(/[?&]lang=(en|zh)\b/)
    const l = m ? m[1] : read('site_lang')
    if (l === 'en' || l === 'zh') setLangState(l)
    // 從分享連結（?lang=）進來的讀者，回到首頁也維持同一種語言
    if (m) write('site_lang', m[1])
    const t = read('site_theme')
    if (t === 'light' || t === 'dark') setThemeState(t)
    const s = read('site_size')
    if (SIZES.includes(s)) setSizeState(s)
  }, [])

  useEffect(() => {
    const d = document.documentElement
    d.setAttribute('lang', lang === 'en' ? 'en' : 'zh-Hant')
    d.dataset.lang = lang
  }, [lang])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f2e9' : '#0f0d13')
  }, [theme])
  useEffect(() => { document.documentElement.dataset.size = size }, [size])

  const setLang = useCallback(next => {
    setLangState(next)
    write('site_lang', next)
    // 網址帶上 ?lang=en，分享英文版時對方打開就是英文
    const query = { ...router.query }
    if (next === 'en') query.lang = 'en'
    else delete query.lang
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
  }, [router])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      write('site_theme', next)
      return next
    })
  }, [])

  const cycleSize = useCallback(() => {
    setSizeState(prev => {
      const next = SIZES[(SIZES.indexOf(prev) + 1) % SIZES.length]
      write('site_size', next)
      return next
    })
  }, [])

  return { lang, setLang, theme, toggleTheme, size, cycleSize }
}
