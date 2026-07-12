import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  Crosshair,
  Database,
  FileText,
  ListTree,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Timer,
  TriangleAlert,
  Video,
  X,
} from 'lucide-react'

const DEFAULT_WORK_TITLE = 'Shipping reliable memory for our production research agent'
const DEFAULT_OUTCOME = 'Choose an evaluation plan before Friday’s architecture review'
const DEFAULT_QUESTION =
  'How are teams using long-term agent memory in production, and what evaluation patterns are actually holding up?'

const DEFAULT_FOCUS_CONTEXT = {
  threadTitle: DEFAULT_WORK_TITLE,
  outcome: DEFAULT_OUTCOME,
  question: DEFAULT_QUESTION,
  known: 'I know the basic episodic / semantic split and common vector-store patterns. Skip primers; focus on architecture, failure modes, and benchmarks.',
  goals: ['Patterns I can implement', 'Exact video moments'],
  sourceScope: 'Live web + papers + video + archive',
  specificSources: '',
  freshness: 'Last 12 months',
  size: '4 findings · 12 min',
  serendipity: 15,
  contextNotes: [],
}

const NAV_ITEMS = [
  { id: 'desk', label: 'Briefing desk', icon: BookOpen },
  { id: 'focus', label: 'Focus threads', icon: Crosshair },
  { id: 'taste', label: 'TasteDoc', icon: FileText },
  { id: 'run', label: 'Research runs', icon: ListTree },
]

const SCREEN_META = {
  desk: { eyebrow: 'BRIEFING DESK', title: 'Finite outputs across your Focus Threads' },
  focus: { eyebrow: 'FOCUS THREADS', title: 'Define what deserves attention now' },
  run: { eyebrow: 'RESEARCH OPERATIONS', title: 'Run 0142 · Long-term memory for production agents' },
  briefing: { eyebrow: 'PUBLISHED BRIEFING', title: 'Long-term memory for production agents' },
  taste: { eyebrow: 'TASTE & JUDGMENT', title: 'TasteDoc · Proposal 019' },
}

const FOCUS_ONLY_REASON = 'Relevant, but not right now'

const FEEDBACK_REASONS = [
  'Right author, wrong topic',
  FOCUS_ONLY_REASON,
  'Too introductory for me',
  'I already know this argument',
  'Strong idea, weak evidence',
  'This changed how I think about the problem',
]

const FEEDBACK_TARGETS = {
  primary: { id: 'ITEM 08', title: 'Memory evaluation is moving to task-level durability', verdict: 'selected it as Must know now' },
  video: { id: 'MOMENT 4C1', title: 'The four-minute operational-state distinction', verdict: 'selected this exact moment' },
  archive: { id: 'ARCHIVE 034', title: 'A 2024 memory-failure taxonomy', verdict: 'resurfaced it from your archive' },
  rejected: { id: 'CANDIDATE 09', title: 'A complete guide to agent memory', verdict: 'kept it out as redundant' },
}

const TASTE_PROPOSALS = {
  'Right author, wrong topic': {
    section: 'Relevance / Topic fit',
    removed: 'Treat trusted authors as broadly relevant.',
    added: 'Use source trust only after the item itself matches the active topic; a trusted author is not a relevance shortcut.',
    why: 'It preserves source trust while preventing author reputation from overriding topic fit.',
  },
  'Too introductory for me': {
    section: 'Quality bar / Technical depth',
    removed: 'Prefer technically substantive content over general explainers.',
    added: 'For agent infrastructure, prefer implementation details, benchmarks, and failure analysis over conceptual primers.',
    why: 'It captures the requested depth without inferring a dislike of the author, format, or topic.',
  },
  'I already know this argument': {
    section: 'Novelty / Prior knowledge',
    removed: 'Penalize content that resembles saved material.',
    added: 'Reject arguments already represented in the personal index unless the new item adds evidence, a counterexample, or an implementation change.',
    why: 'It turns prior knowledge into an explicit novelty test rather than a generic similarity penalty.',
  },
  'Strong idea, weak evidence': {
    section: 'Evidence bar / Claim support',
    removed: 'Prefer well-supported technical claims.',
    added: 'Do not promote a strong technical idea without a primary source, exact locator, and enough evidence to support the scope of the claim.',
    why: 'It separates idea quality from evidence quality and makes the publication threshold inspectable.',
  },
  'This changed how I think about the problem': {
    section: 'Signal / Perspective shifts',
    removed: 'Prefer useful and novel technical material.',
    added: 'Give extra weight to well-evidenced ideas that change the decision frame, even when they come from outside trusted sources.',
    why: 'It records why the item was unusually valuable without turning one positive event into blanket source trust.',
  },
}

const BRIEFING_RECORDS = [
  {
    id: '0047',
    title: 'What changed in durable agent memory',
    threadId: '07',
    thread: 'Long-term memory for production agents',
    run: '0142',
    published: '12 Jul 2026 · 07:42',
    status: 'ready',
    statusLabel: 'Ready',
    findings: 3,
    sources: 4,
    candidates: 9,
    attention: '11 min',
    titleOrigin: 'Director-written after accepted fixture claims passed locator checks',
    sourceSummary: '3 web/paper reports · 1 long-form video · personal archive comparison',
    detailed: true,
  },
  {
    id: '0031',
    title: 'Temporal consistency is replacing single-frame video benchmarks',
    threadId: '06',
    thread: 'Video reasoning systems that survive production',
    run: '0118',
    published: '9 Jul 2026 · 16:10',
    status: 'reviewed',
    statusLabel: 'Reviewed',
    findings: 4,
    sources: 6,
    candidates: 13,
    attention: '14 min',
    titleOrigin: 'Director-written from the accepted evaluation cluster',
    sourceSummary: '4 papers · 2 long-form videos',
    detailed: false,
  },
  {
    id: '0022',
    title: 'Three founder-led distribution systems that compound',
    threadId: '04',
    thread: 'Founder-led distribution without content churn',
    run: '0094',
    published: '1 Jul 2026 · 09:25',
    status: 'reviewed',
    statusLabel: 'Reviewed',
    findings: 3,
    sources: 5,
    candidates: 11,
    attention: '9 min',
    titleOrigin: 'Director-written from three non-redundant patterns',
    sourceSummary: '3 founder essays · 1 interview · 1 archive item',
    detailed: false,
  },
]

const FOCUS_THREADS = [
  {
    id: '07',
    title: 'Long-term memory for production agents',
    shortTitle: 'Agent memory',
    status: 'active',
    stateLabel: 'Briefing ready',
    updated: '2 min ago',
    question: 'How are teams using long-term agent memory in production, and what evaluation patterns are actually holding up?',
    context: 'Skip primers. Prioritize architecture, failure modes, benchmarks, and exact video moments.',
    briefings: 4,
    sources: 9,
    claims: 12,
    icon: Database,
  },
  {
    id: '06',
    title: 'Video reasoning systems that survive production',
    shortTitle: 'Video reasoning',
    status: 'paused',
    stateLabel: 'Paused after 2 briefings',
    updated: '3 days ago',
    question: 'Which video reasoning architectures are proving reliable outside benchmark demos?',
    context: 'Prefer temporal retrieval evaluations and real operational constraints over model announcements.',
    briefings: 2,
    sources: 14,
    claims: 18,
    icon: Video,
  },
  {
    id: '04',
    title: 'Founder-led distribution without content churn',
    shortTitle: 'Founder distribution',
    status: 'paused',
    stateLabel: 'Paused after 1 briefing',
    updated: '11 days ago',
    question: 'What distribution systems compound founder insight without creating a daily posting treadmill?',
    context: 'Look for repeatable systems, attributed outcomes, and useful counterexamples.',
    briefings: 1,
    sources: 7,
    claims: 9,
    icon: Archive,
  },
]

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <strong>CERNO</strong>
    </div>
  )
}

function StatusDot({ tone = 'green', pulse = false }) {
  return <span className={`status-dot ${tone} ${pulse ? 'pulse' : ''}`} aria-hidden="true" />
}

function Sidebar({ screen, focusContext, runStep, running, approved, hasProposal, navigate }) {
  const contextual = {
    desk: (
      <>
        <p className="side-section-label">FINITE OUTPUTS</p>
        <button className="side-record selected" onClick={() => navigate('briefing')}>
          <span><StatusDot />Briefing 0047</span>
          <small className="thread-summary">What changed in durable agent memory</small>
          <code>DETAILED FIXTURE</code>
        </button>
        <button className="side-record compact"><span><StatusDot tone="muted" />Briefing 0031</span><small>Video reasoning · reviewed</small></button>
        <button className="side-record compact"><span><StatusDot tone="muted" />Briefing 0022</span><small>Distribution · reviewed</small></button>
      </>
    ),
    focus: (
      <>
        <p className="side-section-label">YOUR THREADS</p>
        <button className="side-record selected" onClick={() => navigate('briefing')}>
          <span title={focusContext.threadTitle}><StatusDot />Current work</span>
          <small className="thread-summary">{focusContext.threadTitle}</small>
          <code>THREAD 07</code>
        </button>
        <button className="side-record compact"><span><StatusDot tone="muted" />Video reasoning</span><small>Paused</small></button>
        <button className="side-record compact"><span><StatusDot tone="muted" />Founder distribution</span><small>Paused</small></button>
      </>
    ),
    run: (
      <>
        <p className="side-section-label">FIXTURE HISTORY</p>
        <button className="side-record selected">
          <span><StatusDot pulse={running} />Run 0142</span>
          <small>{focusContext.threadTitle} <code>{runStep >= 8 ? 'DONE' : running ? 'SIM' : 'PAUSED'}</code></small>
        </button>
        <button className="side-record compact"><span><StatusDot tone="amber" />Scenario 0141</span><small>Video reasoning <code>FIXTURE</code></small></button>
        <button className="side-record compact"><span><StatusDot />Scenario 0140</span><small>Agent distribution</small></button>
      </>
    ),
    briefing: (
      <>
        <p className="side-section-label">ACTIVE FOCUS</p>
        <button className="focus-mini-card" onClick={() => navigate('focus')}>
          <span className="mini-id"><StatusDot /> THREAD 07</span>
          <strong>{focusContext.threadTitle}</strong>
          <span>Exploration budget</span>
          <div className="tiny-meter"><i style={{ width: `${Math.min(100, focusContext.serendipity * 2.5)}%` }} /></div>
          <code>{focusContext.serendipity}%</code>
        </button>
      </>
    ),
    taste: (
      <>
        <p className="side-section-label">VERSIONS</p>
        {hasProposal && !approved && (
          <button className="side-record selected">
            <span><StatusDot tone="amber" />v4 · proposed</span>
            <small>Awaiting your review</small>
          </button>
        )}
        <button className={`side-record ${approved ? 'selected' : 'compact'}`}>
          <span><StatusDot />v{approved ? '4' : '3'} · current</span>
          <small>{approved ? 'Approved just now' : '12 Jul · 09:14'}</small>
        </button>
        {approved && <button className="side-record compact"><span><StatusDot tone="muted" />v3</span><small>Previous quality bar</small></button>}
        <button className="side-record compact"><span><StatusDot tone="muted" />v2</span><small>Evidence bar revised</small></button>
        <button className="side-record compact"><span><StatusDot tone="muted" />v1</span><small>Initial calibration</small></button>
      </>
    ),
  }

  const status = {
    desk: ['Finite briefing library', '3 fixture documents', 'no daily digest · no feed'],
    focus: ['TasteDoc v3 active', 'fixture profile', `${focusContext.contextNotes.length} focus-only corrections`],
    run: [running ? 'Simulation playing' : runStep >= 8 ? 'Simulation complete' : 'Simulation paused', runStep < 8 ? `step ${runStep + 1} of 9` : 'fixture profile cerno-director', 'local fixture events only'],
    briefing: ['Fixture briefing', '3 findings · 9 candidates', approved ? 'TasteDoc v4 preview applied' : 'TasteDoc v3 preview'],
    taste: ['Taste is user-owned', '0 automatic changes', `${approved ? 4 : 3} approved versions`],
  }[screen]

  return (
    <aside className="sidebar">
      <div>
        <Logo />
        <p className="brand-subtitle">PERSONAL INTELLIGENCE</p>
      </div>

      <nav className="nav-list" aria-label="Product navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={(id === 'desk' ? screen === 'desk' || screen === 'briefing' : screen === id) ? 'active' : ''}
            onClick={() => navigate(id)}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-context">{contextual[screen]}</div>

      <div className="side-status">
        <span><StatusDot tone="sea" pulse={screen === 'run' && running} />{status[0]}</span>
        <code>{status[1]}</code>
        <code>{status[2]}</code>
      </div>
    </aside>
  )
}

function Topbar({ screen, focusView, focusContext, runStep, tasteMode, onFreshRun, onNewFocus, onToggleFocusView, onOpenTasteDoc, navigate, notify }) {
  const meta = SCREEN_META[screen]
  let title = screen === 'focus' && focusView === 'threads' ? 'Three finite research missions' : meta.title
  if (screen === 'run') title = `Run 0142 · ${focusContext.threadTitle}`
  if (screen === 'briefing') title = focusContext.threadTitle
  if (screen === 'taste' && tasteMode === 'document') title = `TasteDoc · v${focusContext.tasteVersion ?? 3}`

  function share() {
    const url = `${window.location.origin}${window.location.pathname}#briefing`
    navigator.clipboard?.writeText(url).catch(() => {})
    notify('Fixture briefing URL copied')
  }

  return (
    <header className="topbar">
      <div>
        <span>{meta.eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div className="prototype-badge"><Sparkles size={12} /> fixture prototype</div>
      <div className="top-actions">
        {screen === 'desk' && <><button className="button secondary" onClick={() => navigate('focus')}>Focus threads</button><button className="button dark" onClick={onNewFocus}><Plus size={14} />New focus</button></>}
        {screen === 'focus' && <button className="button secondary" onClick={onToggleFocusView}>{focusView === 'threads' ? <><Plus size={14} />New focus thread</> : 'View all threads'}</button>}
        {screen === 'run' && <button className="button dark" disabled={runStep < 8} onClick={() => navigate('briefing')}>Briefing</button>}
        {screen === 'briefing' && (
          <>
            <button className="button secondary" onClick={() => navigate('desk')}><BookOpen size={15} />Briefing desk</button>
            <button className="button secondary" onClick={onFreshRun}><RefreshCw size={15} />Run fresh brief</button>
            <button className="button dark" onClick={share}><Share2 size={14} />Copy fixture link</button>
          </>
        )}
        {screen === 'taste' && tasteMode === 'proposal' && <button className="button dark" onClick={onOpenTasteDoc}>View current TasteDoc</button>}
      </div>
    </header>
  )
}

function FocusScreen({ onStart }) {
  const [threadTitle, setThreadTitle] = useState(DEFAULT_WORK_TITLE)
  const [outcome, setOutcome] = useState(DEFAULT_OUTCOME)
  const [question, setQuestion] = useState(DEFAULT_QUESTION)
  const [known, setKnown] = useState('I know the basic episodic / semantic split and common vector-store patterns.\nSkip primers; focus on architecture, failure modes, and benchmarks.')
  const [goals, setGoals] = useState(['Patterns I can implement', 'Exact video moments'])
  const [sourceScope, setSourceScope] = useState('Live web + papers + video + archive')
  const [specificSources, setSpecificSources] = useState('')
  const [freshness, setFreshness] = useState('Last 12 months')
  const [size, setSize] = useState('4 findings · 12 min')
  const [serendipity, setSerendipity] = useState(15)

  function toggleGoal(goal) {
    setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])
  }

  return (
    <div className="screen-grid focus-grid">
      <main className="paper focus-paper">
        <div className="screen-heading">
          <code>NEW FOCUS THREAD</code>
          <h1>Tell Cerno what you are working on now</h1>
          <p>Your work supplies the context. The research question becomes the Director’s assignment.</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); onStart({ threadTitle, outcome, question, known, goals, sourceScope, specificSources, freshness, size, serendipity }) }}>
          <div className="work-grid">
            <label className="work-field" htmlFor="thread-title"><span>CURRENT WORK / PROJECT</span><input id="thread-title" value={threadTitle} onChange={(event) => setThreadTitle(event.target.value)} /></label>
            <label className="work-field" htmlFor="thread-outcome"><span>DECISION OR OUTCOME</span><input id="thread-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} /></label>
          </div>

          <label className="field-label assignment-label" htmlFor="focus-question">WHAT SHOULD CERNO FIND OUT FOR THIS WORK?</label>
          <div className="question-field">
            <textarea id="focus-question" value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} />
            <div><code>{question.length} / 500</code></div>
          </div>

          <div className="label-row">
            <label className="field-label" htmlFor="known-context">WHAT DO YOU ALREADY KNOW OR WANT IT TO SKIP?</label>
            <span>Optional, but improves novelty</span>
          </div>
          <textarea id="known-context" className="known-field" value={known} onChange={(event) => setKnown(event.target.value)} />

          <span className="field-label block">WHAT WOULD MAKE THIS BRIEFING USEFUL?</span>
          <div className="goal-grid">
            {['Patterns I can implement', 'Contradictory evidence', 'Exact video moments'].map((goal) => {
              const selected = goals.includes(goal)
              return (
                <button type="button" key={goal} className={`choice ${selected ? 'selected' : ''}`} onClick={() => toggleGoal(goal)}>
                  <span className="choice-check">{selected && <Check size={12} strokeWidth={3} />}</span>{goal}
                </button>
              )
            })}
          </div>

          <span className="field-label block boundaries-label">SOURCE &amp; OUTPUT BOUNDARIES</span>
          <div className="boundary-grid expanded">
            <label className="select-field source-field"><code>CONTENT SOURCES</code><span><select value={sourceScope} onChange={(event) => setSourceScope(event.target.value)}><option>Live web + papers + video + archive</option><option>Live web and papers only</option><option>Connected sources + personal archive</option><option>Specific sources only</option></select><ChevronDown size={15} /></span></label>
            <label className="select-field"><code>FRESHNESS</code><span><select value={freshness} onChange={(event) => setFreshness(event.target.value)}><option>Last 3 months</option><option>Last 12 months</option><option>Any time</option></select><ChevronDown size={15} /></span></label>
            <label className="select-field"><code>BRIEFING SIZE</code><span><select value={size} onChange={(event) => setSize(event.target.value)}><option>3 findings · 8 min</option><option>4 findings · 12 min</option><option>6 findings · 18 min</option></select><ChevronDown size={15} /></span></label>
            <label className="select-field slider-field"><code>SERENDIPITY</code><strong>{serendipity}% exploration</strong><input type="range" min="0" max="40" value={serendipity} onChange={(event) => setSerendipity(Number(event.target.value))} /></label>
          </div>
          {sourceScope === 'Specific sources only' && <label className="specific-sources"><span>SPECIFIC SOURCES</span><input value={specificSources} required placeholder="Paste source names or URLs, separated by commas" onChange={(event) => setSpecificSources(event.target.value)} /></label>}

          <div className="form-footer">
            <div><p>The Director writes the briefing title only after reviewing accepted evidence.</p><code>Focus Thread title stays stable · briefing titles change by run</code></div>
            <button className="button primary large" disabled={!threadTitle.trim() || !question.trim()} type="submit">Create focus and plan research <ArrowRight size={16} /></button>
          </div>
        </form>
      </main>

      <ResearchContract threadTitle={threadTitle} sourceScope={sourceScope} specificSources={specificSources} />
    </div>
  )
}

function ResearchContract({ threadTitle, sourceScope, specificSources }) {
  const steps = [
    ['Plan the questions', 'Director turns your assignment into research lanes.'],
    ['Search the agreed sources', 'Discover candidates without consuming everything.'],
    ['Consume only promising items', 'At most four sources at full depth.'],
    ['Verify every claim', 'Exact passage or timestamp required.'],
    ['Write and title the briefing', 'Title reflects accepted findings, not a template.'],
  ]
  const criteria = [
    ['At least two independent sources', true],
    ['One novelty comparison per finding', true],
    ['No unsupported citations', true],
    ['Escalate conflicts instead of guessing', false],
  ]

  return (
    <aside className="paper side-panel contract-panel">
      <span className="panel-kicker">RESEARCH CONTRACT</span>
      <h2>What this run will produce</h2>
      <p className="serif-intro">You define the work. The Director plans the research and names the result.</p>
      <div className="contract-output">
        <div><span>FOCUS THREAD</span><strong>{threadTitle || 'Untitled current work'}</strong></div>
        <div><span>BRIEFING TITLE</span><strong><Sparkles size={12} />Generated after evidence review</strong></div>
        <div><span>CONTENT WILL COME FROM</span><strong>{sourceScope === 'Specific sources only' ? specificSources || 'Add at least one source' : sourceScope}</strong></div>
      </div>
      <div className="contract-spine">
        {steps.map(([title, detail], index) => (
          <div className="contract-step" key={title}>
            <span className={index === 0 ? 'filled' : ''} />
            <div><strong>{title}</strong><p>{detail}</p></div>
          </div>
        ))}
      </div>
      <div className="panel-rule" />
      <span className="panel-kicker muted">COMPLETION CRITERIA</span>
      <div className="criteria-list">
        {criteria.map(([text, check]) => (
          <div key={text} className={!check ? 'warning' : ''}>{check ? <Check size={13} /> : <TriangleAlert size={13} />}<strong>{text}</strong></div>
        ))}
      </div>
      <div className="estimate"><StatusDot /><strong>Estimated run: 1–2 min · under $0.15</strong></div>
    </aside>
  )
}

function ThreadsScreen({ focusContext, statusOverrides, setStatusOverrides, onNew, onFreshRun, navigate, notify }) {
  const [selectedId, setSelectedId] = useState('07')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const threads = FOCUS_THREADS.map((thread) => {
    const current = thread.id === '07' ? {
      ...thread,
      title: focusContext.threadTitle,
      question: focusContext.question,
      shortTitle: focusContext.threadTitle,
      context: [focusContext.known, ...focusContext.contextNotes].filter(Boolean).join(' · '),
    } : thread
    const status = statusOverrides[thread.id] ?? current.status
    return { ...current, status, stateLabel: status === 'active' ? 'Ready for a finite briefing' : 'Paused intentionally', updated: statusOverrides[thread.id] ? 'now' : current.updated }
  })
  const filteredThreads = threads.filter((thread) => {
    const matchesFilter = filter === 'all' || thread.status === filter
    const haystack = `${thread.title} ${thread.question}`.toLowerCase()
    return matchesFilter && haystack.includes(query.trim().toLowerCase())
  })
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0]
  const SelectedIcon = selected.icon

  function setThreadStatus(status) {
    setStatusOverrides((current) => ({ ...current, [selected.id]: status }))
    notify(`${selected.shortTitle} ${status === 'active' ? 'resumed' : 'paused'}`)
  }

  return (
    <div className="screen-grid threads-grid">
      <main className="paper threads-paper">
        <div className="screen-heading threads-heading">
          <div><code>FOCUS INDEX · 3 THREADS</code><h1>Your active questions, kept finite</h1><p>Each thread holds temporary context, completed briefings, and a clear stopping state.</p></div>
          <button className="button primary" onClick={onNew}><Plus size={15} />New focus thread</button>
        </div>

        <div className="thread-toolbar">
          <div className="thread-filters" aria-label="Filter Focus Threads">
            {['all', 'active', 'paused'].map((option) => <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>{option}<span>{option === 'all' ? threads.length : threads.filter((thread) => thread.status === option).length}</span></button>)}
          </div>
          <label className="thread-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search threads" /></label>
        </div>

        <div className="thread-list">
          {filteredThreads.map((thread) => {
            const Icon = thread.icon
            const isSelected = selected.id === thread.id
            return (
              <button key={thread.id} className={`thread-row ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedId(thread.id)}>
                <span className="thread-icon"><Icon size={18} /></span>
                <span className="thread-copy"><span><code>THREAD {thread.id}</code><em className={thread.status}><StatusDot tone={thread.status === 'active' ? 'green' : 'muted'} />{thread.status}</em></span><strong>{thread.title}</strong><p>{thread.question}</p><small>{thread.stateLabel} · updated {thread.updated}</small></span>
                <span className="thread-counts"><span><strong>{thread.briefings}</strong><small>briefings</small></span><span><strong>{thread.sources}</strong><small>sources</small></span><ArrowRight size={16} /></span>
              </button>
            )
          })}
          {filteredThreads.length === 0 && <div className="thread-empty"><Search size={22} /><strong>No matching threads</strong><p>Try a different status or search phrase.</p></div>}
        </div>

        <div className="thread-index-footer"><span><StatusDot />{threads.filter((thread) => thread.status === 'active').length} active</span><span><StatusDot tone="muted" />{threads.filter((thread) => thread.status === 'paused').length} paused</span><code>7 total briefings · 30 sources consumed</code></div>
      </main>

      <aside className="paper side-panel thread-detail">
        <span className="panel-kicker">SELECTED THREAD</span>
        <div className="thread-detail-title"><span className="thread-detail-icon"><SelectedIcon size={19} /></span><div><code>THREAD {selected.id}</code><h2>{selected.title}</h2></div></div>
        <div className={`thread-state ${selected.status}`}><StatusDot tone={selected.status === 'active' ? 'green' : 'muted'} /><strong>{selected.status === 'active' ? 'Active research context' : 'Paused intentionally'}</strong><span>{selected.stateLabel}</span></div>

        <span className="panel-kicker muted detail-label">CURRENT MISSION</span>
        <blockquote className="thread-mission">{selected.question}</blockquote>
        <span className="panel-kicker muted detail-label">THREAD CONTEXT</span>
        <p className="thread-context">{selected.context}</p>

        <div className="thread-metrics">
          <div><BookOpen size={14} /><code>BRIEFINGS</code><strong>{selected.briefings}</strong></div>
          <div><Database size={14} /><code>CLAIMS</code><strong>{selected.claims}</strong></div>
          <div><Timer size={14} /><code>UPDATED</code><strong>{selected.updated}</strong></div>
        </div>

        <div className="panel-rule" />
        <span className="panel-kicker muted">RECENT ACTIVITY</span>
        <div className="thread-activity">
          <div><span className="filled" /><strong>{selected.id === '07' ? 'Briefing 0047 published' : 'Last briefing completed'}</strong><code>{selected.updated}</code></div>
          <div><span /><strong>{selected.sources} sources evaluated</strong><code>{selected.claims} claims retained</code></div>
          <div><span className={selected.status === 'active' ? 'filled' : ''} /><strong>{selected.status === 'active' ? 'Ready for the next mission' : 'Monitoring stopped'}</strong><code>{selected.status === 'active' ? 'context remains current' : 'no background work running'}</code></div>
        </div>

        <div className="thread-detail-actions">
          {selected.status === 'paused' ? <button className="button primary" onClick={() => setThreadStatus('active')}>Resume thread</button> : selected.id === '07' ? <button className="button primary" onClick={() => navigate('briefing')}>Open latest briefing <ArrowRight size={14} /></button> : <button className="button primary" onClick={onFreshRun}>Plan fresh briefing <ArrowRight size={14} /></button>}
          {selected.status === 'active' ? <button className="button secondary" onClick={() => setThreadStatus('paused')}>Pause thread</button> : <button className="button secondary" onClick={() => notify(`Opened the last ${selected.shortTitle} briefing fixture`)}>Open last briefing</button>}
          <button className="text-action" onClick={onNew}><Plus size={13} />Start a new Focus Thread</button>
        </div>
      </aside>
    </div>
  )
}

function agentState(runStep, start, complete, revision = false) {
  if (runStep < start) return { status: 'waiting', label: 'WAITING' }
  if (runStep < complete) return { status: revision ? 'review' : 'active', label: revision ? 'REVISING' : 'WORKING' }
  return { status: 'complete', label: 'DONE' }
}

function AgentCard({ role, detail, meta, state, dark = false }) {
  const tone = state.status === 'review' || state.status === 'handled' ? 'oxide' : state.status === 'waiting' ? 'muted' : 'green'
  return (
    <div className={`agent-card ${state.status} ${dark ? 'dark' : ''}`}>
      <div className="agent-title"><StatusDot tone={tone} pulse={state.status === 'active' || state.status === 'review'} /><strong>{role}</strong><code>{state.label}</code></div>
      <p>{detail}</p>
      <small>FIXTURE · {meta}</small>
    </div>
  )
}

function ResearchRunScreen({ focusContext, approved, runStep, setRunStep, running, setRunning, navigate }) {
  const complete = runStep >= 8
  const requestedSources = `${focusContext.sourceScope} ${focusContext.specificSources}`.toLowerCase()
  const usesArchive = requestedSources.includes('archive') || requestedSources.includes('connected')
  const usesVideo = requestedSources.includes('video') || requestedSources.includes('youtube')
  const outOfScope = { status: 'waiting', label: 'OUT OF SCOPE' }
  const webScout = agentState(runStep, 2, 3)
  const archiveScout = usesArchive ? agentState(runStep, 2, 3) : outOfScope
  const videoScout = !usesVideo ? outOfScope : runStep < 2 ? { status: 'waiting', label: 'WAITING' } : runStep < 3 ? { status: 'active', label: 'WORKING' } : runStep < 6 ? { status: 'review', label: 'EXCEPTION' } : { status: 'handled', label: 'HANDLED' }
  const webAnalyst = agentState(runStep, 3, 5)
  const archiveAnalyst = usesArchive ? agentState(runStep, 3, 5) : outOfScope
  const videoAnalyst = usesVideo ? agentState(runStep, 3, 6, runStep >= 5) : outOfScope
  const editor = agentState(runStep, 6, 7)
  const review = agentState(runStep, 7, 8)
  const publish = agentState(runStep, 7, 8)
  const progress = Math.min(100, Math.round((runStep / 8) * 100))
  const latency = complete ? '01:18' : `00:${String(Math.max(4, runStep * 9)).padStart(2, '0')}`
  const cost = complete ? '$0.084' : `$${(0.006 + runStep * 0.0097).toFixed(3)}`

  function replay() {
    setRunStep(0)
    setRunning(true)
  }

  return (
    <div className="screen-grid run-grid">
      <main className="paper run-paper">
        <div className="run-header">
          <div><code>RUN 0142 · LOCAL FIXTURE SESSION SIM_01J8F</code><h1>A simulated research desk, one inspectable flow</h1><p>This local playback illustrates the planned Hermes handoffs; it is not a live agent trace.</p></div>
          <div className="run-controls">
            <button className="icon-button" onClick={replay} title="Replay simulation"><RotateCcw size={15} /></button>
            {!complete && <button className="button secondary small" onClick={() => { setRunStep(8); setRunning(false) }}>Finish simulation</button>}
          </div>
        </div>
        <div className="run-progress"><span style={{ width: `${progress}%` }} /></div>

        <section className="run-tree" aria-label="Agent delegation tree">
          <div className={`director-plan ${runStep === 0 ? 'active' : 'complete'}`}>
            <div className="director-icon"><Plus size={14} /></div>
            <div><span>RESEARCH DIRECTOR · FIXTURE PLAN</span><strong>{focusContext.question}</strong><p>Outcome: {focusContext.outcome} · sources: {focusContext.sourceScope} · {focusContext.size} · {focusContext.serendipity}% exploration</p></div>
            <div className="node-metric"><code>{runStep === 0 ? 'PLANNING' : 'COMPLETE · 2.8S'}</code><small>4,211 tok · $0.012</small></div>
          </div>

          <div className="tree-branch three" />
          <div className="agent-row three">
            <AgentCard role="Live web Scout" detail="LinkUp · 9 candidates" meta="6.3s · 2,840 tok · $0.006" state={webScout} />
            <AgentCard role="Archive Scout" detail={usesArchive ? '8 related claims · 4 resources' : 'Excluded by source boundary'} meta={usesArchive ? 'fixture 1.2s · 1,104 tok · $0.002' : 'not requested'} state={archiveScout} />
            <AgentCard role="Video Scout" detail={usesVideo ? '3 moments · 1 source unavailable' : 'Excluded by source boundary'} meta={usesVideo ? 'fixture 8.9s · 3,022 tok · $0.007' : 'not requested'} state={videoScout} />
          </div>

          <div className="tree-stems three" />
          <div className="agent-row three analysts">
            <AgentCard role="WEB ANALYST" detail="5 claims · 7 evidence chunks" meta="2 sources · 14.6s · $0.014" state={webAnalyst} />
            <AgentCard role="ARCHIVE CURATOR" detail={usesArchive ? '1 resurfaced · 2 redundant' : 'No archive analysis requested'} meta={usesArchive ? '8 comparisons · fixture 7.4s · $0.008' : 'out of scope'} state={archiveAnalyst} />
            <AgentCard role="VIDEO ANALYST · REV 2" detail={usesVideo ? '2 moments · timestamp fixed' : 'No video analysis requested'} meta={usesVideo ? 'fixture revision +4.1s · $0.006' : 'out of scope'} state={videoAnalyst} />
          </div>

          <div className="tree-converge" />
          <div className="editor-row"><AgentCard role="PERSONAL EDITOR · FIXTURE" detail="3 selected · 3 redundant · 2 introductory · 1 unavailable" meta="simulated 13.2s · $0.013" state={editor} /></div>
          <div className="tree-split two" />
          <div className="agent-row two final-row">
            <AgentCard role="DIRECTOR REVIEW" detail="Fixture criteria passed" meta="7/7 fixture locators present" state={review} />
            <AgentCard role="PUBLISHER" detail={complete ? 'Fixture briefing 0047 ready' : 'Waiting for fixture review'} meta="local surface · simulated 0.4s" state={publish} dark={complete} />
          </div>
          <div className={`run-completion ${complete ? 'show' : ''}`}><StatusDot />SIMULATION COMPLETE · 01:18.4 FIXTURE TIME</div>
        </section>
      </main>

      <aside className="paper side-panel run-proof">
        <span className="panel-kicker">SIMULATION TRACE</span>
        <h2>{complete ? 'Fixture completed by exception' : 'Local playback in motion'}</h2>
        <div className={`proof-status ${complete ? '' : 'working'}`}>
          <StatusDot tone="sea" pulse={!complete} />
          <div><strong>{complete ? 'Fixture briefing ready' : 'Simulating Hermes coordination'}</strong><code>{complete ? 'scripted scenario · local state only' : `event ${runStep + 1} of 9 · local timer playback`}</code></div>
        </div>
        <div className="metric-grid">
          <div><code>FIXTURE LATENCY</code><strong>{latency}</strong></div>
          <div><code>FIXTURE COST</code><strong>{cost}</strong></div>
          <div><code>SIMULATED STEPS</code><strong>{Math.min(8, Math.max(1, runStep + 1))}</strong></div>
          <div><code>FIXTURE TOKENS</code><strong>{complete ? '32.4k' : `${(4.2 + runStep * 3.5).toFixed(1)}k`}</strong></div>
        </div>
        <div className="panel-rule" />
        <span className={`panel-kicker ${usesVideo ? 'oxide-text' : 'muted'}`}>{usesVideo ? 'SCRIPTED EXCEPTION HANDLED' : 'NO VIDEO EXCEPTION IN SCOPE'}</span>
        <div className={`exception-card ${usesVideo ? '' : 'quiet'}`}><StatusDot tone={usesVideo ? 'oxide' : 'muted'} /><div><strong>{usesVideo ? 'One fixture video source unavailable' : 'Video lane excluded by the research boundary'}</strong><p>{usesVideo ? 'The scripted Director continues with two independent sources and records the missing coverage.' : 'The simulation does not claim to inspect or fail a source the user did not request.'}</p><code>{usesVideo ? 'FIXTURE POLICY: PROCEED IF 2+ SOURCES REMAIN' : 'BOUNDARY RESPECTED'}</code></div></div>
        <div className="panel-rule" />
        <span className="panel-kicker muted">CONTEXT CARRIED THROUGH</span>
        <div className="context-list">
          {[[focusContext.threadTitle, 'CURRENT MISSION'], [`TasteDoc v${approved ? 4 : 3}`, 'QUALITY RULES'], [focusContext.sourceScope, 'SOURCE BOUNDARY'], [`${focusContext.contextNotes.length} focus corrections`, 'TEMPORARY CONTEXT']].map(([title, tag], index) => <div key={tag}><StatusDot tone={index === 3 ? 'amber' : 'green'} /><strong>{title}</strong><code>{tag}</code></div>)}
        </div>
        <div className="proof-actions">
          <button className="button primary" disabled={!complete} onClick={() => navigate('briefing')}>Open fixture briefing</button>
          <button className="button secondary" onClick={() => running ? setRunning(false) : complete ? replay() : setRunning(true)}>{running ? 'Pause event playback' : complete ? 'Replay from start' : 'Resume event playback'}</button>
        </div>
      </aside>
    </div>
  )
}

function BriefingDesk({ focusContext, onNewFocus, navigate }) {
  const [selectedId, setSelectedId] = useState('0047')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const records = BRIEFING_RECORDS.map((record) => record.id === '0047' ? { ...record, thread: focusContext.threadTitle } : record)
  const filteredRecords = records.filter((record) => {
    const matchesFilter = filter === 'all' || record.status === filter
    const haystack = `${record.title} ${record.thread} ${record.id}`.toLowerCase()
    return matchesFilter && haystack.includes(query.trim().toLowerCase())
  })
  const selected = records.find((record) => record.id === selectedId) ?? records[0]

  return (
    <div className="screen-grid desk-grid">
      <main className="paper desk-paper">
        <div className="screen-heading desk-heading">
          <div><code>BRIEFING DESK · FIXTURE LIBRARY</code><h1>Finite documents, not another feed</h1><p>Each briefing is the canonical output of one bounded run. Nothing is published merely because a day passed.</p></div>
          <button className="button primary" onClick={onNewFocus}><Plus size={15} />New Focus Thread</button>
        </div>

        <div className="desk-principle">
          <div><BookOpen size={18} /><span><strong>One run → one briefing</strong><p>Focus Thread pages and the Desk link to the same document; they never create separate copies.</p></span></div>
          <dl><div><dt>DOCUMENTS</dt><dd>3</dd></div><div><dt>DAILY DIGESTS</dt><dd>0</dd></div><div><dt>DETAILED FIXTURES</dt><dd>1</dd></div></dl>
        </div>

        <div className="desk-toolbar">
          <div className="thread-filters" aria-label="Filter briefing documents">
            {[['all', 'All'], ['ready', 'Ready'], ['reviewed', 'Reviewed']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? records.length : records.filter((record) => record.status === value).length}</span></button>)}
          </div>
          <label className="thread-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search finite briefings" /></label>
        </div>

        <div className="desk-list">
          {filteredRecords.map((record) => (
            <button key={record.id} className={`desk-record ${selected.id === record.id ? 'selected' : ''}`} onClick={() => setSelectedId(record.id)}>
              <span className="desk-record-index"><BookOpen size={17} /><code>{record.id}</code></span>
              <span className="desk-record-copy"><span><code>BRIEFING {record.id} · RUN {record.run}</code><em className={record.status}><StatusDot tone={record.status === 'ready' ? 'green' : 'muted'} />{record.statusLabel}</em></span><strong>{record.title}</strong><p>Focus Thread {record.threadId} · {record.thread}</p><small><Sparkles size={10} />{record.titleOrigin}</small></span>
              <span className="desk-record-meta"><span><strong>{record.findings}</strong><small>findings</small></span><span><strong>{record.sources}</strong><small>sources</small></span><code>{record.attention}</code><ArrowRight size={15} /></span>
            </button>
          ))}
          {filteredRecords.length === 0 && <div className="thread-empty"><Search size={22} /><strong>No matching briefings</strong><p>Try a different state or Focus Thread.</p></div>}
        </div>

        <div className="desk-footer"><span><StatusDot />Published only after completion criteria pass</span><code>Sorted by research run · not by engagement</code></div>
      </main>

      <aside className="paper side-panel desk-detail">
        <span className="panel-kicker">CANONICAL OUTPUT</span>
        <div className="desk-detail-heading"><code>BRIEFING {selected.id}</code><h2>{selected.title}</h2><span className={`desk-status ${selected.status}`}><StatusDot tone={selected.status === 'ready' ? 'green' : 'muted'} />{selected.statusLabel}</span></div>
        <p className="serif-intro">Published {selected.published}. This document belongs to a run; the Focus Thread supplies context but does not own a separate feed.</p>

        <div className="desk-metrics"><div><code>FINDINGS</code><strong>{selected.findings}</strong></div><div><code>SOURCES</code><strong>{selected.sources}</strong></div><div><code>ATTENTION</code><strong>{selected.attention}</strong></div></div>
        <div className="panel-rule" />
        <span className="panel-kicker muted">DOCUMENT PROVENANCE</span>
        <div className="desk-provenance">
          <div><span className="filled" /><strong>Focus Thread {selected.threadId}</strong><p>{selected.thread}</p></div>
          <div><span /><strong>Research Run {selected.run}</strong><p>{selected.candidates} candidates evaluated</p></div>
          <div><span /><strong>Director-written title</strong><p>{selected.titleOrigin}</p></div>
          <div><span className="filled" /><strong>Published briefing</strong><p>One canonical document in this Desk</p></div>
        </div>
        <div className="panel-rule" />
        <span className="panel-kicker muted">CONTENT SOURCES</span>
        <div className="desk-source-card"><Database size={15} /><p>{selected.sourceSummary}</p></div>
        <div className="scope-card desk-boundary"><strong>No Daily Brief was generated</strong><p>A date is publication metadata—not a reason to manufacture another summary.</p></div>

        <div className="desk-detail-actions">
          {selected.detailed ? <button className="button primary" onClick={() => navigate('briefing')}>Open detailed fixture <ArrowRight size={14} /></button> : <button className="button secondary" disabled>Metadata-only fixture</button>}
          <button className="button secondary" onClick={() => navigate('focus')}>View originating Focus Thread</button>
        </div>
      </aside>
    </div>
  )
}

const INSPECTORS = {
  primary: {
    kicker: "CERNO'S JUDGMENT",
    title: 'Why this made the cut',
    intro: 'It answers the active thread at your level and adds an evaluation frame absent from your index.',
    scores: [['FOCUS RELEVANCE', 92], ['TASTE FIT', 84], ['NOVELTY', 88], ['EVIDENCE QUALITY', 79]],
    claim: 'claim_8F2 · confidence 0.86',
    evidenceTitle: 'Corroborating fixture passages',
    quote: ['“The relevant unit is whether a decision remains available after the surrounding context changes.”', '“Evaluation should measure whether prior decisions survive workflow interruption.”', '“Retrieval success alone does not establish durable task state.”'],
    source: ['Letta · Memory benchmark report · §4.2', 'LangChain · Long-running agent evaluation · p.12', 'Factory · Production memory study · §3'],
    comparison: 'Nearest claim covers retrieval, not durability.',
    rules: ['Prefer implementation detail', 'Demand primary evidence'],
  },
  video: {
    kicker: 'EXACT MOMENT',
    title: 'Why these four minutes matter',
    intro: 'The full episode is 78 minutes. Cerno isolated the operational distinction that changes your storage boundary.',
    scores: [['FOCUS RELEVANCE', 88], ['TASTE FIT', 90], ['NOVELTY', 73], ['EVIDENCE QUALITY', 82]],
    claim: 'moment_4C1 · 38:12–42:06',
    evidenceTitle: 'Transcript passage',
    quote: '“Episodic memory is a story about what happened. Operational state is a promise about what must remain true.”',
    source: 'Latent Space · Episode 118 · VideoDB transcript',
    comparison: 'Your archive names the split but has no production boundary.',
    rules: ['Prefer exact moments', 'Avoid full-episode burden'],
  },
  archive: {
    kicker: 'PERSONAL ARCHIVE',
    title: 'Why an old save is useful now',
    intro: 'Two new reports reuse the failure classes in this item, turning a dormant save into an evaluation template.',
    scores: [['FOCUS RELEVANCE', 81], ['TASTE FIT', 87], ['NOVELTY', 62], ['TIMELINESS', 91]],
    claim: 'archive_034 · saved 19 months ago',
    evidenceTitle: 'Recovered passage',
    quote: '“Separate failures of recall, interpretation, precedence, and state reconciliation before measuring task success.”',
    source: 'Personal archive · Memory failure taxonomy · 2024',
    comparison: 'Matched by two new benchmark reports in this run.',
    rules: ['Resurface when newly useful', 'Penalize redundancy'],
  },
  rejected: {
    kicker: 'REJECTION RECORD',
    title: 'Why this was kept out',
    intro: 'The source is credible, but its core claims substantially overlap two items already in your index.',
    scores: [['FOCUS RELEVANCE', 78], ['TASTE FIT', 41], ['NOVELTY', 8], ['EVIDENCE QUALITY', 76]],
    claim: 'candidate_09 · rejected',
    evidenceTitle: 'Overlap finding',
    quote: '92% claim overlap across the introduction, memory taxonomy, and retrieval architecture sections.',
    source: 'A complete guide to agent memory · fetched 12 Jul',
    comparison: 'Two stronger primary sources already cover these claims.',
    rules: ['Skip introductory content', 'Reject redundant claims'],
  },
}

function ScoreBars({ scores }) {
  return <div className="score-bars">{scores.map(([label, value]) => <div key={label}><div><code>{label}</code><code>{String(value).padStart(2, '0')}</code></div><span><i style={{ width: `${value}%` }} className={value < 50 ? 'low' : value < 80 ? 'medium' : ''} /></span></div>)}</div>
}

function EvidenceInspector({ selection, approvedRule, onEvidenceHover, onCorrect }) {
  const data = INSPECTORS[selection]
  const ruleAffectsSelection = approvedRule?.selection === selection
  const scores = ruleAffectsSelection ? data.scores.map(([label, value]) => [label, label === 'TASTE FIT' || label === 'EVIDENCE QUALITY' ? Math.min(100, value + 10) : value]) : data.scores
  return (
    <aside className={`paper side-panel evidence-inspector selection-${selection}`}>
      <span className="panel-kicker">{data.kicker}</span>
      <h2>{data.title}</h2>
      <p className="serif-intro">{data.intro}</p>
      <ScoreBars scores={scores} />
      <div className="panel-rule" />
      <span className="panel-kicker muted">EVIDENCE SPINE</span>
      <div className="evidence-spine" onMouseEnter={() => onEvidenceHover(true)} onMouseLeave={() => onEvidenceHover(false)}>
        <div><span className="filled" /><strong>{selection === 'rejected' ? 'Candidate reviewed' : 'Claim selected'}</strong><code>{data.claim}</code></div>
        <div><span /><strong>{data.evidenceTitle}</strong>{Array.isArray(data.quote) ? data.quote.map((quote) => <blockquote key={quote}>{quote}</blockquote>) : <blockquote>{data.quote}</blockquote>}</div>
        <div><span /><strong>{selection === 'archive' ? 'Archive source' : Array.isArray(data.source) ? 'Independent primary sources' : 'Primary source'}</strong>{Array.isArray(data.source) ? <ul className="source-locators">{data.source.map((source) => <li key={source}>{source}</li>)}</ul> : <p>{data.source}</p>}</div>
        <div><span className={selection === 'rejected' ? 'oxide' : 'amber'} /><strong>Compared with your index</strong><p>{data.comparison}</p></div>
      </div>
      <div className="panel-rule" />
      <span className="panel-kicker muted">TASTEDOC RULES USED</span>
      <div className="rule-chips">{data.rules.map((rule) => <span key={rule}>{rule}</span>)}</div>
      <button className="button secondary correct-button" onClick={onCorrect}><Pencil size={14} />Correct Cerno's reasoning</button>
    </aside>
  )
}

function BriefingScreen({ focusContext, approvedRule, onCorrect, notify }) {
  const [selection, setSelection] = useState('primary')
  const [playing, setPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(56)
  const [evidenceHover, setEvidenceHover] = useState(false)

  useEffect(() => {
    if (!playing) return undefined
    const interval = window.setInterval(() => {
      setVideoProgress((current) => {
        if (current >= 100) {
          setPlaying(false)
          return 56
        }
        return current + 1
      })
    }, 150)
    return () => window.clearInterval(interval)
  }, [playing])

  return (
    <div className="screen-grid briefing-grid">
      <main className="paper briefing-paper">
        <div className="briefing-heading">
          <div><div className="briefing-origin"><code>FIXTURE BRIEFING · 12 JUL 2026</code><span><Sparkles size={11} />Illustrative evidence only</span></div><h1>What changed in durable agent memory</h1><p>Three findings from four deeply consumed fixture sources; nine candidates evaluated.</p></div>
          <button className="run-summary" onClick={() => notify('Local simulation completed with one scripted exception')}><code>SIMULATED RUN</code><strong>Fixture time 01:18</strong><StatusDot /></button>
        </div>

        <div className="fixture-callout"><strong>Focus Thread:</strong> {focusContext.threadTitle}<span>Requested {focusContext.size} · {focusContext.sourceScope}. The evidence below remains the disclosed agent-memory fixture.</span></div>

        <button className={`finding-primary ${selection === 'primary' ? 'selected' : ''} ${evidenceHover && selection === 'primary' ? 'evidence-linked' : ''}`} onClick={() => setSelection('primary')}>
          <span className="finding-kicker">MUST KNOW NOW</span>
          <h2>Memory evaluation is moving from retrieval<br />accuracy to task-level durability.</h2>
          <p>Three production reports now measure whether an agent preserves decisions across multi-day work, not merely whether it can retrieve a stored fact.</p>
          <div className="finding-footer"><span className="tag green">{approvedRule?.selection === 'primary' ? 'UPDATED BY v4' : 'NEW TO YOU'}</span><span className="tag">3 SOURCE LOCATORS</span><span className="tag mono">3 MIN</span><span className="open-evidence">Open evidence <ArrowRight size={14} /></span></div>
        </button>

        <div className={`video-finding ${selection === 'video' ? 'selected' : ''} ${evidenceHover && selection === 'video' ? 'evidence-linked' : ''}`} role="button" tabIndex="0" onClick={() => setSelection('video')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelection('video') }}>
          <button type="button" className="video-still" aria-label={playing ? 'Pause fixture exact moment' : 'Play fixture exact moment'} onClick={(event) => { event.stopPropagation(); setPlaying(!playing); setSelection('video') }}>
            <span className="play-button">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span>
            <span className="video-meter"><i style={{ width: `${videoProgress}%` }} /></span>
            <code>{playing ? '39:04' : '38:12'} — 42:06</code>
          </button>
          <div><span className="finding-kicker">EXACT MOMENT</span><code>LATENT SPACE · EP. 118</code><h3>The four-minute distinction between episodic memory and operational state</h3><p>Worth watching because it changes the storage boundary in your current design.</p></div>
        </div>

        <button className={`archive-finding ${selection === 'archive' ? 'selected' : ''} ${evidenceHover && selection === 'archive' ? 'evidence-linked' : ''}`} onClick={() => setSelection('archive')}>
          <div><span className="finding-kicker">FROM YOUR ARCHIVE</span><h3>A 2024 failure taxonomy is newly useful for your evaluation plan.</h3><p>Saved 19 months ago · resurfaced because two new reports use the same failure classes.</p></div><code>ARCHIVE / 034</code>
        </button>

        <button className={`rejected-finding ${selection === 'rejected' ? 'selected' : ''} ${evidenceHover && selection === 'rejected' ? 'evidence-linked' : ''}`} onClick={() => setSelection('rejected')}>
          <div><span className="finding-kicker oxide-text">REJECTED AS NOISE</span><p><X size={16} /><strong>“A complete guide to agent memory”</strong><span>92% claim overlap with two items already in your index.</span></p><small>2 more candidates rejected: introductory (1), source unavailable (1)</small></div><code>REDUNDANT</code>
        </button>
      </main>

      <EvidenceInspector selection={selection} approvedRule={approvedRule} onEvidenceHover={setEvidenceHover} onCorrect={() => onCorrect(selection)} />
    </div>
  )
}

function FeedbackModal({ selection, onClose, onContinue }) {
  const target = FEEDBACK_TARGETS[selection]
  const [reason, setReason] = useState(selection === 'rejected' ? 'Too introductory for me' : FEEDBACK_REASONS[0])
  const [note, setNote] = useState(selection === 'rejected' ? 'I need implementation details and failure analysis, not another primer.' : 'The explanation overweights one part of the judgment.')
  const focusOnly = reason === FOCUS_ONLY_REASON

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="panel-kicker">CORRECT CERNO'S REASONING · {target.id}</span>
        <h2 id="feedback-title">What should Cerno learn?</h2>
        <p>You are correcting “{target.title}.” Durable changes are proposed—not silently applied.</p>
        <div className="feedback-options">
          {FEEDBACK_REASONS.map((item) => <button className={reason === item ? 'selected' : ''} key={item} onClick={() => setReason(item)}><span>{reason === item && <Check size={12} />}</span>{item}</button>)}
        </div>
        <label>ADD CONTEXT<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <div className="modal-scope"><ShieldCheck size={16} /><span><strong>{focusOnly ? 'Focus-only correction' : 'Potential durable taste'}</strong>{focusOnly ? 'This will be retained in the current Focus Thread only.' : 'You will review reason-specific TasteDoc wording next.'}</span></div>
        <div className="modal-actions"><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" onClick={() => onContinue({ selection, reason, note })}>{focusOnly ? 'Save to Focus Thread' : 'Review proposed change'} <ArrowRight size={15} /></button></div>
      </section>
    </div>
  )
}

function TasteDocument({ approved, approvedRule, savedDraft, onSave, notify }) {
  const currentRule = approvedRule?.added ?? 'Prefer technically substantive content over general explainers.'
  const initialMarkdown = `# Identity\nFounder and technical operator working on production AI systems.\n\n## Durable interests\n- Agent infrastructure and evaluation\n- Video reasoning in production\n- Compounding distribution systems\n\n## Quality bar\n- ${currentRule}\n- Demand primary evidence and exact locators\n- Penalize redundancy against the personal index\n\n## Anti-interests\n- Conceptual primers without implementation detail\n- Repeated arguments without new evidence`
  const [editing, setEditing] = useState(false)
  const [markdown, setMarkdown] = useState(savedDraft ?? initialMarkdown)

  return (
    <div className="screen-grid taste-grid">
      <main className="paper tastedoc-paper">
        <div className="screen-heading"><code>TASTEDOC v{approved ? 4 : 3} · CURRENT</code><h1>Your durable taste, in plain language</h1><p>This fixture document is separate from temporary Focus Thread context.</p></div>
        {editing ? <textarea className="tastedoc-editor" value={markdown} onChange={(event) => setMarkdown(event.target.value)} /> : <pre className="tastedoc-markdown">{markdown}</pre>}
        <div className="taste-actions"><span /><button className="button primary" onClick={() => { if (editing) { onSave(markdown); notify('TasteDoc fixture draft saved for this session') } setEditing(!editing) }}>{editing ? 'Save local draft' : 'Edit TasteDoc'}</button></div>
      </main>
      <aside className="paper side-panel impact-panel"><span className="panel-kicker">DOCUMENT BOUNDARY</span><h2>User-owned and versioned</h2><div className="preview-notice applied"><StatusDot /><div><strong>Current approved version: v{approved ? 4 : 3}</strong><p>Edits in this prototype stay in local component state.</p></div></div><div className="panel-rule" /><span className="panel-kicker muted">TEMPORARY CONTEXT</span><div className="scope-card"><strong>Focus corrections do not enter this document</strong><p>“Relevant, but not right now” remains scoped to the active Focus Thread.</p></div></aside>
    </div>
  )
}

function TasteScreen({ mode, feedback, approved, approvedRule, tasteDocDraft, onSaveTasteDoc, onApprove, onReject, notify, navigate }) {
  const proposal = TASTE_PROPOSALS[feedback.reason] ?? TASTE_PROPOSALS['Too introductory for me']
  const target = FEEDBACK_TARGETS[feedback.selection] ?? FEEDBACK_TARGETS.rejected
  const [editing, setEditing] = useState(false)
  const [wording, setWording] = useState(proposal.added)

  useEffect(() => setWording(proposal.added), [proposal.added])

  if (mode === 'document') return <TasteDocument approved={approved} approvedRule={approvedRule} savedDraft={tasteDocDraft} onSave={onSaveTasteDoc} notify={notify} />

  function approve() {
    onApprove({ ...proposal, added: wording, selection: feedback.selection, reason: feedback.reason })
    setEditing(false)
    notify('TasteDoc v4 approved · local ranking preview updated')
  }

  if (approved) {
    return (
      <div className="screen-grid taste-grid">
        <main className="paper approved-paper">
          <div className="approved-mark"><CircleCheck size={32} /></div>
          <code>TASTEDOC V4 · CURRENT</code>
          <h1>Your quality bar is now explicit</h1>
          <p>The reviewed rule has been versioned. No hidden model was retrained.</p>
          <div className="approved-rule"><span>{approvedRule?.section ?? proposal.section}</span><strong>{approvedRule?.added ?? wording}</strong></div>
          <div className="approved-stats"><div><code>VERSION</code><strong>v4</strong></div><div><code>RULES</code><strong>13</strong></div><div><code>AFFECTED POOL</code><strong>3 items</strong></div></div>
          <div className="approved-actions"><button className="button secondary" onClick={() => navigate('taste')}>Open TasteDoc</button><button className="button primary" onClick={() => navigate('briefing')}>Return to briefing <ArrowRight size={15} /></button></div>
        </main>
        <ImpactPanel approved feedback={feedback} proposal={approvedRule ?? proposal} target={target} />
      </div>
    )
  }

  return (
    <div className="screen-grid taste-grid">
      <main className="paper taste-paper">
        <div className="screen-heading">
          <code>CHANGE PROPOSAL 019 · FEEDBACK EVENT 041</code>
          <h1>A correction becomes a rule only after review</h1>
          <p>Cerno proposes a narrow, readable change. Nothing has been applied yet.</p>
        </div>
        <span className="field-label block">YOUR CORRECTION</span>
        <div className="correction-card"><code>BRIEFING 0047 · {target.id}</code><h3>“{target.title}”</h3><p>Cerno {target.verdict} in the fixture briefing.</p><div><span><StatusDot tone="oxide" />{feedback.reason}</span><q>{feedback.note}</q></div></div>
        <div className="proposal-connector"><StatusDot /></div>
        <section className="diff-card">
          <header><span><StatusDot /><strong>Taste Editor proposal</strong></span><code>v3 → v4</code><em>DRAFT</em></header>
          <div className="diff-body"><code>@@ {proposal.section} @@</code><div className="removed"><code>− {proposal.removed}</code><small>Previous wording was too broad for this correction.</small></div>{editing ? <textarea value={wording} onChange={(event) => setWording(event.target.value)} autoFocus /> : <div className="added"><code>+ {wording}</code><small>Scope: durable taste · applies across Focus Threads · confidence: medium</small></div>}<div className="wording-reason"><span>WHY THIS WORDING</span><p>{proposal.why}</p></div></div>
        </section>
        <div className="taste-actions"><div><button className="button secondary" onClick={onReject}>Reject</button><button className="button secondary green-border" onClick={() => setEditing(!editing)}><Pencil size={14} />{editing ? 'Finish editing' : 'Edit wording'}</button></div><button className="button primary" onClick={approve}>Approve and create v4</button></div>
        <p className="taste-footnote">Approval versions the fixture document and updates the local component-score preview. It does not claim a model retrain or live backend change.</p>
      </main>
      <ImpactPanel feedback={feedback} proposal={proposal} target={target} />
    </div>
  )
}

function ImpactPanel({ approved = false, feedback, proposal, target }) {
  const activeFeedback = feedback ?? { reason: approved ? 'Approved durable correction' : 'Pending correction' }
  const activeProposal = proposal ?? { section: 'Approved rule' }
  const activeTarget = target ?? { title: 'Affected fixture candidate' }
  return (
    <aside className="paper side-panel impact-panel">
      <span className="panel-kicker">IMPACT PREVIEW</span>
      <h2>{approved ? 'Local judgment updated' : 'What would change'}</h2>
      <div className={`preview-notice ${approved ? 'applied' : ''}`}><StatusDot tone={approved ? 'green' : 'amber'} /><div><strong>{approved ? 'Applied to fixture scoring' : 'Preview only'}</strong><p>{approved ? 'The rule is active in TasteDoc v4 and the affected inspector shows its score change.' : 'No TasteDoc version or score changes until approval.'}</p></div></div>
      <span className="panel-kicker muted pool-label">AFFECTED JUDGMENT</span>
      <div className="rank-list">
        <div className="rank-up"><div><strong>{activeTarget.title}</strong><p>{activeProposal.section}</p></div><code>{approved ? 'UPDATED' : 'CURRENT'} <ArrowRight size={14} /> {approved ? 'ACTIVE' : 'PREVIEW'}</code></div>
        <div><div><strong>Unrelated fixture findings</strong><p>No blanket topic, author, or format inference</p></div><code>UNCHANGED</code></div>
      </div>
      <div className="panel-rule" />
      <span className="panel-kicker muted">CHANGE PROVENANCE</span>
      <div className="provenance-spine">
        <div><span className="filled" /><strong>Feedback event 041</strong><code>{activeFeedback.reason}</code></div>
        <div><span /><strong>Taste Editor proposal</strong><code>{activeProposal.section}</code></div>
        <div><span className={approved ? 'filled' : 'amber'} /><strong>{approved ? 'Approved as TasteDoc v4' : 'Awaiting your approval'}</strong></div>
      </div>
      <div className="panel-rule" />
      <span className="panel-kicker muted">SCOPE GUARD</span>
      <div className="scope-card"><strong>Durable taste, not current focus</strong><p>“Relevant, but not right now” updates Focus Thread context and never enters the TasteDoc.</p></div>
    </aside>
  )
}

function App() {
  const hashScreen = window.location.hash.replace('#', '')
  const [screen, setScreen] = useState(['desk', 'focus', 'run', 'briefing', 'taste'].includes(hashScreen) ? hashScreen : 'focus')
  const [focusView, setFocusView] = useState('new')
  const [focusContext, setFocusContext] = useState(DEFAULT_FOCUS_CONTEXT)
  const [threadStatusOverrides, setThreadStatusOverrides] = useState({})
  const [runStep, setRunStep] = useState(hashScreen === 'run' || hashScreen === 'briefing' ? 8 : 0)
  const [running, setRunning] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackSelection, setFeedbackSelection] = useState('rejected')
  const [feedback, setFeedback] = useState({ selection: 'rejected', reason: 'Too introductory for me', note: 'I need implementation details and failure analysis, not another primer.' })
  const [tasteMode, setTasteMode] = useState('document')
  const [hasProposal, setHasProposal] = useState(false)
  const [approved, setApproved] = useState(false)
  const [approvedRule, setApprovedRule] = useState(null)
  const [tasteDocDraft, setTasteDocDraft] = useState(null)
  const [toast, setToast] = useState('')

  const runDelays = useMemo(() => [900, 850, 1200, 1300, 1250, 1100, 950, 800], [])

  useEffect(() => {
    if (screen !== 'run' || !running || runStep >= 8) return undefined
    const timeout = window.setTimeout(() => setRunStep((step) => Math.min(8, step + 1)), runDelays[runStep])
    return () => window.clearTimeout(timeout)
  }, [screen, running, runStep, runDelays])

  useEffect(() => {
    if (runStep >= 8) setRunning(false)
  }, [runStep])

  useEffect(() => {
    window.history.replaceState(null, '', `#${screen}`)
  }, [screen])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function notify(message) {
    setToast(message)
  }

  function navigate(target) {
    if (target === 'focus') setFocusView('threads')
    if (target === 'taste') setTasteMode('document')
    setScreen(target)
  }

  function startRun(context) {
    setFocusContext({ ...DEFAULT_FOCUS_CONTEXT, ...context })
    setRunStep(0)
    setRunning(true)
    setScreen('run')
  }

  function freshRun() {
    setRunStep(0)
    setRunning(true)
    setScreen('run')
  }

  function openFeedback(selection) {
    setFeedbackSelection(selection)
    setFeedbackOpen(true)
  }

  function continueFeedback(nextFeedback) {
    setFeedback(nextFeedback)
    setFeedbackOpen(false)
    if (nextFeedback.reason === FOCUS_ONLY_REASON) {
      const target = FEEDBACK_TARGETS[nextFeedback.selection]
      setFocusContext((current) => ({ ...current, contextNotes: [...current.contextNotes, `${target.title}: ${nextFeedback.note}`] }))
      notify('Saved to Focus Thread context; durable taste unchanged')
      return
    }
    setApproved(false)
    setHasProposal(true)
    setTasteMode('proposal')
    setScreen('taste')
  }

  function approveRule(rule) {
    setApprovedRule(rule)
    setTasteDocDraft(null)
    setApproved(true)
    setHasProposal(false)
    setFocusContext((current) => ({ ...current, tasteVersion: 4 }))
  }

  function rejectProposal() {
    setHasProposal(false)
    setTasteMode('document')
    notify(`Proposal rejected; TasteDoc remains v${approved ? 4 : 3}`)
    setScreen('briefing')
  }

  return (
    <div className="app-shell">
      <Sidebar screen={screen} focusContext={focusContext} runStep={runStep} running={running} approved={approved} hasProposal={hasProposal} navigate={navigate} />
      <div className="app-body">
        <Topbar screen={screen} focusView={focusView} focusContext={focusContext} runStep={runStep} tasteMode={tasteMode} onFreshRun={freshRun} onNewFocus={() => { setFocusView('new'); setScreen('focus') }} onToggleFocusView={() => setFocusView((view) => view === 'new' ? 'threads' : 'new')} onOpenTasteDoc={() => setTasteMode('document')} navigate={navigate} notify={notify} />
        <div className="screen-wrap">
          {screen === 'desk' && <BriefingDesk focusContext={focusContext} onNewFocus={() => { setFocusView('new'); setScreen('focus') }} navigate={navigate} />}
          {screen === 'focus' && focusView === 'new' && <FocusScreen onStart={startRun} />}
          {screen === 'focus' && focusView === 'threads' && <ThreadsScreen focusContext={focusContext} statusOverrides={threadStatusOverrides} setStatusOverrides={setThreadStatusOverrides} onNew={() => setFocusView('new')} onFreshRun={freshRun} navigate={navigate} notify={notify} />}
          {screen === 'run' && <ResearchRunScreen focusContext={focusContext} approved={approved} runStep={runStep} setRunStep={setRunStep} running={running} setRunning={setRunning} navigate={navigate} />}
          {screen === 'briefing' && <BriefingScreen focusContext={focusContext} approvedRule={approvedRule} onCorrect={openFeedback} notify={notify} />}
          {screen === 'taste' && <TasteScreen mode={tasteMode} feedback={feedback} approved={approved} approvedRule={approvedRule} tasteDocDraft={tasteDocDraft} onSaveTasteDoc={setTasteDocDraft} onApprove={approveRule} onReject={rejectProposal} notify={notify} navigate={navigate} />}
        </div>
      </div>
      {feedbackOpen && <FeedbackModal selection={feedbackSelection} onClose={() => setFeedbackOpen(false)} onContinue={continueFeedback} />}
      {toast && <div className="toast"><CircleCheck size={16} />{toast}</div>}
      <div className="prototype-note"><span>STATIC FIXTURE · NO LIVE APIS OR VERIFIED METRICS</span><button onClick={() => { setScreen('focus'); setFocusView('new'); setFocusContext(DEFAULT_FOCUS_CONTEXT); setThreadStatusOverrides({}); setRunStep(0); setRunning(false); setTasteMode('document'); setHasProposal(false); setApproved(false); setApprovedRule(null); setTasteDocDraft(null) }}><RotateCcw size={12} />Reset</button></div>
    </div>
  )
}

export default App
