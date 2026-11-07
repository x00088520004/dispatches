// 導覽列右側的三個控制：中/EN、字級、深淺色
const SIZE_LABEL = {
  zh: { s: '字級：小', m: '字級：中', l: '字級：大' },
  en: { s: 'Text size: small', m: 'Text size: medium', l: 'Text size: large' },
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </g>
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export default function Controls({ prefs, showSize = false }) {
  const { lang, setLang, theme, toggleTheme, size, cycleSize } = prefs
  const themeLabel = lang === 'zh'
    ? (theme === 'dark' ? '切換成淺色' : '切換成深色')
    : (theme === 'dark' ? 'Switch to light' : 'Switch to dark')

  return (
    <div className="controls">
      <div className="seg" role="group" aria-label={lang === 'zh' ? '語言' : 'Language'}>
        <button type="button" aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>中</button>
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      </div>
      {showSize && (
        <button type="button" className="ctl ctl-size" onClick={cycleSize} aria-label={SIZE_LABEL[lang][size]} title={SIZE_LABEL[lang][size]}>
          <span className="aa"><small>A</small>A</span>
          <span className="size-dots" aria-hidden="true">
            {['s', 'm', 'l'].map(s => <i key={s} className={s === size ? 'on' : ''} />)}
          </span>
        </button>
      )}
      <button type="button" className="ctl" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>
    </div>
  )
}
