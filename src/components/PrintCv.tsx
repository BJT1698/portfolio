import { cv } from '../config/cv'
import { profile } from '../config/profile'
import { cvLinks } from '../config/links'

// Versione stampabile del CV, impaginazione formale stile Europass (stili in index.css, .europass).

/** 'YYYY-MM' → 'MM/YYYY', 'YYYY' invariato, null → 'ATTUALE'. */
function date(ym: string | null) {
  if (!ym) return 'ATTUALE'
  const [y, m] = ym.split('-')
  return m ? `${m}/${y}` : y
}

const Row = ({ label, children }: { label?: React.ReactNode; children: React.ReactNode }) => (
  <div className="ep-row">
    <div className="ep-label">{label}</div>
    <div className="ep-body">{children}</div>
  </div>
)

const Section = ({ title }: { title: string }) => (
  <Row label={<h2 className="ep-section">{title}</h2>}>
    <hr className="ep-rule" />
  </Row>
)

export function PrintCv() {
  const mother = profile.languages.filter((l) => /madrelingua/i.test(l.level))
  const others = profile.languages.filter((l) => !/madrelingua/i.test(l.level))
  const web = cvLinks.filter((l) => l.icon !== 'email')

  return (
    <div className="print-root europass hidden">
      <Row label={<span className="ep-cv">Curriculum Vitae</span>}>
        <h1 className="ep-name">{profile.name}</h1>
      </Row>

      <Section title="Informazioni personali" />
      <Row label={<img src={profile.avatar} alt="" className="ep-photo" />}>
        <dl className="ep-info">
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </dd>
          <dt>Residenza</dt>
          <dd>{profile.location}</dd>
          {web.map((l) => (
            <div key={l.id} className="contents">
              <dt>{l.label}</dt>
              <dd>
                <a href={l.url}>{l.url.replace(/^https?:\/\/(www\.)?/, '')}</a>
              </dd>
            </div>
          ))}
        </dl>
      </Row>

      <Row label="Posizione">
        <p className="ep-strong">{profile.role}</p>
      </Row>
      <Row label="Profilo">
        <p>{cv.summary}</p>
      </Row>

      <Section title="Esperienza professionale" />
      {cv.experience.map((e) => (
        <div key={e.company + e.start} className="ep-entry">
          <Row label={`${date(e.start)} – ${date(e.end)}`}>
            <p className="ep-strong">{e.role}</p>
            <p>
              {e.company}
              {e.location && `, ${e.location}`}
            </p>
            {e.highlights.length > 0 ? (
              <ul>
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : (
              <p>{e.summary}</p>
            )}
          </Row>
        </div>
      ))}

      <Section title="Istruzione e formazione" />
      {cv.education.map((ed) => (
        <div key={ed.title} className="ep-entry">
          <Row label={`${date(ed.start)} – ${date(ed.end)}`}>
            <p className="ep-strong">{ed.title}</p>
            <p>{ed.institution}</p>
            {ed.notes && <p>{ed.notes}</p>}
          </Row>
        </div>
      ))}
      {cv.certifications.map((c) => (
        <div key={c.name} className="ep-entry">
          <Row label={c.year}>
            <p className="ep-strong">{c.name}</p>
            <p>
              {c.issuer}
              {c.status === 'in-progress' && ' (in corso)'}
            </p>
          </Row>
        </div>
      ))}

      <Section title="Competenze personali" />
      {mother.length > 0 && (
        <Row label="Lingua madre">
          <p>{mother.map((l) => l.name).join(', ')}</p>
        </Row>
      )}
      {others.length > 0 && (
        <Row label="Altre lingue">
          <table className="ep-lang">
            <tbody>
              {others.map((l) => (
                <tr key={l.name}>
                  <td className="ep-strong">{l.name}</td>
                  <td>{l.level} (QCER)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Row>
      )}
      {cv.skills.map((c) => (
        <Row key={c.id} label={c.label}>
          <p>{c.skills.map((s) => s.name).join(', ')}</p>
        </Row>
      ))}

      <p className="ep-gdpr">
        Autorizzo il trattamento dei dati personali contenuti nel presente curriculum ai sensi del D.Lgs. 196/2003 e del Regolamento UE 2016/679 (GDPR).
      </p>
    </div>
  )
}
