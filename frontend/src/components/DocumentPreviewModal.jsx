import { useApp } from '../context/AppContext'
import { Spinner } from './ui'

export default function DocumentPreviewModal({ title, preview, loading, onClose, company }) {
  const { t } = useApp()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,.55)' }} onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4 sticky top-0 pb-2 -mt-1"
             style={{ background: 'var(--bg-surface)' }}>
          <h3 className="font-semibold text-sm flex-1">{title}</h3>
          <button className="btn-ghost btn-sm" onClick={onClose}>{t('docValide.close')}</button>
        </div>

        {company && (
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
            {company.logo ? (
              <img src={company.logo} alt="" className="rounded object-contain shrink-0"
                   style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px solid var(--line)' }} />
            ) : (
              <div className="rounded shrink-0" style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px dashed var(--line)' }} />
            )}
            <span className="font-semibold text-sm">{company.name}</span>
          </div>
        )}

        {loading || !preview ? <Spinner /> : preview.type === 'pdf' ? (
          <iframe src={preview.url} title={title} style={{ width: '100%', height: '70vh', border: 0 }} />
        ) : (
          <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', textAlign: 'right' }}>
            {preview.blocks.map((b, i) => b.type === 'table' ? (
              <table key={i} className="w-full my-3 text-sm" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-line px-2 py-1 align-top">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : b.type === 'field' ? (
              <p key={i} className="mb-2 text-sm"><b>{b.label} :</b> {b.text}</p>
            ) : (
              <p key={i} className={b.type === 'heading' ? 'font-bold mt-4 mb-1' : 'mb-2 text-sm'}>
                {b.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
